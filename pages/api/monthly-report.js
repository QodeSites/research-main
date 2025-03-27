//pages/api/monthly-report.js

import { calculateDrawdown, calculateMDD, calculateReturns } from "utils/calculateReturnsMonthlyReport";
import db from "lib/db";

export default async function handler(req, res) {
    // Destructure startDate, endDate, year and month from the request body
    let { startDate, endDate, year, month } = req.body;
    const qodeStrategyIndices = ['QAW', 'QTF', 'QGF', 'QFH'];

    // If year and month are provided, compute the last day of that month as the upper limit
    let upperLimit = null;
    if (year && month) {
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        // Hardcode last day for each month
        let lastDay;
        switch (monthNum) {
            case 1:  // January
            case 3:  // March
            case 5:  // May
            case 7:  // July
            case 8:  // August
            case 10: // October
            case 12: // December
                lastDay = 31;
                break;
            case 4:  // April
            case 6:  // June
            case 9:  // September
            case 11: // November
                lastDay = 30;
                break;
            case 2:  // February
                // Simple leap year check
                lastDay = (yearNum % 4 === 0 && (yearNum % 100 !== 0 || yearNum % 400 === 0)) ? 29 : 28;
                break;
            default:
                lastDay = 31; // Default to 31 for safety
        }

        // Set upperLimit to the last day of the month at 23:59:59
        upperLimit = new Date(yearNum, monthNum - 1, lastDay, 23, 59, 59);
        console.log('upperLimit:', upperLimit);
        const limitStr = upperLimit.toISOString().split('T')[0];

        if (endDate) {
            if (new Date(endDate) > upperLimit) {
                endDate = limitStr;
            }
        } else {
            endDate = limitStr;
        }
    }

    try {
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
        const { rows } = await db.query(query);
        const { rows: dataAsOfRow } = await db.query(`SELECT MAX(date) as latest_date FROM tblresearch_new`);
        const dataAsOf = dataAsOfRow[0]?.latest_date;

        const validTradingDays = new Set(niftyDays.map(row => row.date.toISOString().split('T')[0]));

        let customDateResults = {};
        if (customDateQuery) {
            const { rows: customDateRows } = await db.query(customDateQuery, [startDate, endDate]);
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
                acc[row.indices] = { value: returnValue, date: new Date(row.start_date).toISOString().split('T')[0] };
                return acc;
            }, {});
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

        const results = {};
        for (const [index, data] of Object.entries(groupedData)) {
            results[index] = {
                '1D': calculateReturns(data, '1D', validTradingDays, upperLimit),
                '2D': calculateReturns(data, '2D', validTradingDays, upperLimit),
                '3D': calculateReturns(data, '3D', validTradingDays, upperLimit),
                '10D': calculateReturns(data, '10D', validTradingDays, upperLimit),
                '1W': calculateReturns(data, '1W', validTradingDays, upperLimit),
                '1M': calculateReturns(data, '1M', validTradingDays, upperLimit),
                '3M': calculateReturns(data, '3M', validTradingDays, upperLimit),
                '6M': calculateReturns(data, '6M', validTradingDays, upperLimit),
                '9M': calculateReturns(data, '9M', validTradingDays, upperLimit),
                '1Y': calculateReturns(data, '1Y', validTradingDays, upperLimit),
                '2Y': calculateReturns(data, '2Y', validTradingDays, upperLimit),
                '3Y': calculateReturns(data, '3Y', validTradingDays, upperLimit),
                '4Y': calculateReturns(data, '4Y', validTradingDays, upperLimit),
                '5Y': calculateReturns(data, '5Y', validTradingDays, upperLimit),
                'Since Inception': calculateReturns(data, 'Since Inception', validTradingDays, upperLimit),
                'Drawdown': calculateDrawdown(data),
                'MDD': calculateMDD(data)
            };

            if (customDateResults[index]) {
                results[index]['CDR'] = customDateResults[index];
            } else if (customDateQuery) {
                results[index]['CDR'] = { value: '-', date: null };
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
                        results[index]['CDR'] = { value: '-', date: null };
                    }
                } else {
                    const requiredPoints = Math.floor(daysDiff * 0.8);
                    const minimumPoints = Math.floor(requiredPoints * 0.8);
                    if (customDateData.length < minimumPoints) {
                        results[index]['CDR'] = { value: '-', date: null };
                    }
                }
            }
        }

        let calculationDates = null;
        if (year && month) {
            const calcStart = niftyDays.length > 0
                ? new Date(niftyDays[0].date).toISOString().split('T')[0]
                : null;
            calculationDates = {
                start: calcStart,
                end: upperLimit.toISOString().split('T')[0]
            };
        }

        res.status(200).json({
            upperLimit,
            data: results,
            calculationDates
        });
    } catch (error) {
        console.error('Error fetching index returns:', error);
        res.status(500).json({ message: 'Error fetching index returns', error: error.message });
    }
}