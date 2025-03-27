// pages/api/monthly-report.js
import { calculateDrawdown, calculateMDD, calculateReturns } from "utils/calculateReturnsMonthlyReport";
import db from "lib/db";

export default async function handler(req, res) {
  // Destructure startDate, endDate, year and month from the request body
  let { startDate, endDate, year, month } = req.body;
  const qodeStrategyIndices = ['QAW', 'QTF', 'QGF', 'QFH'];

  // Calculate date boundaries if year and month are provided
  let upperLimit = null;
  let currentDate = new Date(); // Get current date
  const isCurrentMonth = year == currentDate.getFullYear() && month == (currentDate.getMonth() + 1);

  if (year && month) {
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    let lastDay;
    switch (monthNum) {
      case 1:
      case 3:
      case 5:
      case 7:
      case 8:
      case 10:
      case 12:
        lastDay = 31;
        break;
      case 4:
      case 6:
      case 9:
      case 11:
        lastDay = 30;
        break;
      case 2:
        lastDay = (yearNum % 4 === 0 && (yearNum % 100 !== 0 || yearNum % 400 === 0)) ? 29 : 28;
        break;
      default:
        lastDay = 31;
    }
    if (isCurrentMonth) {
      upperLimit = currentDate;
      lastDay = currentDate.getDate();
    } else {
      // Set upperLimit to the last day of the month at 23:59:59
      upperLimit = new Date(yearNum, monthNum - 1, lastDay, 23, 59, 59);
    }
    const limitStr = upperLimit.toISOString().split('T')[0];
    if (endDate) {
      if (new Date(endDate) > upperLimit) {
        endDate = limitStr;
      }
    } else {
      endDate = limitStr;
    }
    // For a current-month calculation, set startDate to the first day
    if (isCurrentMonth) {
      startDate = new Date(yearNum, monthNum - 1, 1).toISOString().split('T')[0];
    }
    console.debug("Debug: Calculated date boundaries", {
      startDate,
      endDate,
      upperLimit: upperLimit.toISOString().split('T')[0]
    });
  }

  try {
    // -----------------------------------------------
    // 1. Query CSV Data from pms_monthly_reports
    // -----------------------------------------------
    let csvDataResults = {};
    if (year && month) {
      const csvDataQuery = `
        SELECT *
        FROM public.pms_monthly_reports
        WHERE year = $1 AND month = $2
      `;
      const csvResult = await db.query(csvDataQuery, [year, month]);
      if (csvResult.rows.length > 0) {
        csvResult.rows.forEach(row => {
          // Use pms_name (or "group") as the index name; fallback to "Unknown"
          const indexName = row.pms_name || row["group"] || "Unknown";
          csvDataResults[indexName] = {
            group: row["group"] || row["Group"] || "Unknown",
            "1M": { value: row["1M"] != null ? row["1M"].toString() : '-', date: '' },
            "3M": { value: row["3M"] != null ? row["3M"].toString() : '-', date: '' },
            "6M": { value: row["6M"] != null ? row["6M"].toString() : '-', date: '' },
            "1Y": { value: row["1Y"] != null ? row["1Y"].toString() : '-', date: '' },
            "2Y": { value: row["2Y"] != null ? row["2Y"].toString() : '-', date: '' },
            "3Y": { value: row["3Y"] != null ? row["3Y"].toString() : '-', date: '' },
            "4Y": { value: row["4Y"] != null ? row["4Y"].toString() : '-', date: '' },
            "5Y": { value: row["5Y"] != null ? row["5Y"].toString() : '-', date: '' },
            "Since Inception": { value: row["Since Inception"] != null ? row["Since Inception"].toString() : '-', date: '' },
            "Drawdown": '-', // Optionally compute these
            "MDD": '-'
          };
        });
      }
    }

    // -----------------------------------------------
    // 2. Query tblresearch_new Data & Compute Returns
    // -----------------------------------------------
    const niftyDaysQuery = `
      SELECT DISTINCT date 
      FROM tblresearch_new 
      WHERE indices = 'NIFTY 50'
      ${upperLimit ? `AND date <= '${upperLimit.toISOString().split('T')[0]}'` : ''}
      ORDER BY date ASC
    `;
    const query = `
      SELECT indices, nav, date
      FROM tblresearch_new
      ${upperLimit ? `WHERE date <= '${upperLimit.toISOString().split('T')[0]}'` : ''}
      ORDER BY indices, date ASC
    `;
    const customDateQuery = startDate && endDate ? `
      SELECT t1.indices, t1.nav as start_nav, t1.date as start_date, 
             t2.nav as end_nav, t2.date as end_date
      FROM tblresearch_new t1
      JOIN (
          SELECT indices, nav, date,
                 ROW_NUMBER() OVER (PARTITION BY indices ORDER BY date DESC) as rn
          FROM tblresearch_new
          WHERE date <= $2
          ${upperLimit ? `AND date <= '${upperLimit.toISOString().split('T')[0]}'` : ''}
      ) t2 ON t1.indices = t2.indices AND t2.rn = 1
      WHERE t1.date = (
          SELECT MIN(date)
          FROM tblresearch_new
          WHERE date >= $1
          ${upperLimit ? `AND date <= '${upperLimit.toISOString().split('T')[0]}'` : ''}
      )
    ` : null;

    const { rows: niftyDays } = await db.query(niftyDaysQuery);
    console.debug("Debug: Nifty trading days", niftyDays.map(row => new Date(row.date).toISOString().split('T')[0]));

    const { rows } = await db.query(query);
    const { rows: dataAsOfRow } = await db.query(`SELECT MAX(date) as latest_date FROM tblresearch_new`);
    const dataAsOf = dataAsOfRow[0]?.latest_date;
    console.debug("Debug: Data as of", dataAsOf);

    const validTradingDays = new Set(niftyDays.map(row => new Date(row.date).toISOString().split('T')[0]));

    let customDateResults = {};
    if (customDateQuery) {
      const { rows: customDateRows } = await db.query(customDateQuery, [startDate, endDate]);
      console.debug("Debug: Custom date rows", customDateRows);
      customDateResults = customDateRows.reduce((acc, row) => {
        const startDateStr = new Date(row.start_date).toISOString().split('T')[0];
        const endDateStr = new Date(row.end_date).toISOString().split('T')[0];
        if (qodeStrategyIndices.includes(row.indices) &&
            (!validTradingDays.has(startDateStr) || !validTradingDays.has(endDateStr))) {
          acc[row.indices] = { value: '-', date: null };
          return acc;
        }
        const timeDiff = new Date(row.end_date) - new Date(row.start_date);
        const yearDiff = timeDiff / (1000 * 60 * 60 * 24 * 365.25);
        let returnValue;
        if (yearDiff <= 1) {
          returnValue = ((row.end_nav - row.start_nav) / row.start_nav * 100).toFixed(2);
        } else {
          returnValue = ((Math.pow(row.end_nav / row.start_nav, 1 / yearDiff) - 1) * 100).toFixed(2);
        }
        acc[row.indices] = { value: returnValue, date: startDateStr };
        return acc;
      }, {});
      console.debug("Debug: Custom date results", customDateResults);
    }

    const groupedData = rows.reduce((acc, row) => {
      const index = row.indices;
      if (!acc[index]) {
        acc[index] = [];
      }
      if (qodeStrategyIndices.includes(index)) {
        const dateStr = new Date(row.date).toISOString().split('T')[0];
        if (validTradingDays.has(dateStr)) {
          acc[index].push(row);
        }
      } else {
        acc[index].push(row);
      }
      return acc;
    }, {});

    Object.keys(groupedData).forEach(index => {
      const sampleDates = groupedData[index].slice(0, 3).map(row => new Date(row.date).toISOString().split('T')[0]);
      console.debug(`Debug: Grouped data for ${index}`, sampleDates);
    });

    const tblResults = {};
    for (const [index, data] of Object.entries(groupedData)) {
      tblResults[index] = {
        '1D': calculateReturns(data, '1D', validTradingDays, upperLimit, index),
        '2D': calculateReturns(data, '2D', validTradingDays, upperLimit, index),
        '3D': calculateReturns(data, '3D', validTradingDays, upperLimit, index),
        '10D': calculateReturns(data, '10D', validTradingDays, upperLimit, index),
        '1W': calculateReturns(data, '1W', validTradingDays, upperLimit, index),
        '1M': calculateReturns(data, '1M', validTradingDays, upperLimit, index),
        '3M': calculateReturns(data, '3M', validTradingDays, upperLimit, index),
        '6M': calculateReturns(data, '6M', validTradingDays, upperLimit, index),
        '9M': calculateReturns(data, '9M', validTradingDays, upperLimit, index),
        '1Y': calculateReturns(data, '1Y', validTradingDays, upperLimit, index),
        '2Y': calculateReturns(data, '2Y', validTradingDays, upperLimit, index),
        '3Y': calculateReturns(data, '3Y', validTradingDays, upperLimit, index),
        '4Y': calculateReturns(data, '4Y', validTradingDays, upperLimit, index),
        '5Y': calculateReturns(data, '5Y', validTradingDays, upperLimit, index),
        'Since Inception': calculateReturns(data, 'Since Inception', validTradingDays, upperLimit),
        'Drawdown': calculateDrawdown(data),
        'MDD': calculateMDD(data)
      };

      if (customDateResults[index]) {
        tblResults[index]['CDR'] = customDateResults[index];
      } else if (customDateQuery) {
        tblResults[index]['CDR'] = { value: '-', date: null };
      }
    }

    if (startDate && endDate) {
      for (const [index, data] of Object.entries(groupedData)) {
        const customDateData = data.filter(row => {
          const rowDate = new Date(row.date);
          const dateStr = rowDate.toISOString().split('T')[0];
          const isWithinRange = rowDate >= new Date(startDate) && rowDate <= new Date(endDate);
          const isValidTradingDay = !qodeStrategyIndices.includes(index) || validTradingDays.has(dateStr);
          return isWithinRange && isValidTradingDay;
        });

        const timeDiff = new Date(endDate) - new Date(startDate);
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

        if (qodeStrategyIndices.includes(index)) {
          let validDaysInRange = 0;
          for (const dateStr of validTradingDays) {
            const date = new Date(dateStr);
            if (date >= new Date(startDate) && date <= new Date(endDate)) {
              validDaysInRange++;
            }
          }
          const requiredPoints = Math.floor(validDaysInRange * 0.8);
          if (customDateData.length < requiredPoints) {
            tblResults[index]['CDR'] = { value: '-', date: null };
          }
        } else {
          const requiredPoints = Math.floor(daysDiff * 0.8);
          const minimumPoints = Math.floor(requiredPoints * 0.8);
          if (customDateData.length < minimumPoints) {
            tblResults[index]['CDR'] = { value: '-', date: null };
          }
        }
      }
    }

    let calculationDates = null;
    if (year && month) {
      const calcStart = niftyDays.length > 0 ? new Date(niftyDays[0].date).toISOString().split('T')[0] : null;
      calculationDates = {
        start: startDate || calcStart,
        end: upperLimit.toISOString().split('T')[0]
      };
      console.debug("Debug: Final calculation dates", calculationDates);
    }

    res.status(200).json({
      upperLimit,
      tblresearchData: tblResults,
      csvData: csvDataResults,
      calculationDates
    });
  } catch (error) {
    console.error('Error fetching index returns:', error);
    res.status(500).json({ message: 'Error fetching index returns', error: error.message });
  }
}
