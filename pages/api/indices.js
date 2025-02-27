import { calculateDrawdown, calculateMDD, calculateReturns } from "utils/calculateReturns";
import db from "lib/db";

export default async function handler(req, res) {
    const { startDate, endDate } = req.body;
    const qodeStrategyIndices = ['QAW', 'QTF', 'QGF', 'QFH'];

    try {
        // First, get NIFTY 50 trading days to use as reference
        const niftyDaysQuery = `
            SELECT DISTINCT date 
            FROM tblresearch_new 
            WHERE indices = 'NIFTY 50' 
            ORDER BY date ASC
        `;

        // Main data query for all returns
        const query = `
            SELECT indices, nav, date
            FROM tblresearch_new
            ORDER BY indices, date ASC
        `;

        // Separate query for custom date range
        const customDateQuery = startDate && endDate ? `
    SELECT t1.indices, t1.nav as start_nav, t1.date as start_date, 
           t2.nav as end_nav, t2.date as end_date
    FROM tblresearch_new t1
    JOIN (
        SELECT indices, nav, date,
               ROW_NUMBER() OVER (PARTITION BY indices ORDER BY date DESC) as rn
        FROM tblresearch_new
        WHERE date <= $2
    ) t2 ON t1.indices = t2.indices AND t2.rn = 1
    WHERE t1.date = (
        SELECT MIN(date)
        FROM tblresearch_new
        WHERE date >= $1
    )
` : null;

        // Execute queries
        const { rows: niftyDays } = await db.query(niftyDaysQuery);
        const { rows } = await db.query(query);
        const { rows: dataAsOfRow } = await db.query(`SELECT MAX(date) as latest_date FROM tblresearch_new`);
        const dataAsOf = dataAsOfRow[0]?.latest_date;

        // Create a Set of valid trading days from NIFTY 50 data
        const validTradingDays = new Set(niftyDays.map(row => row.date.toISOString().split('T')[0]));

        // Handle custom date range if provided
        let customDateResults = {};
        if (customDateQuery) {
            const { rows: customDateRows } = await db.query(customDateQuery, [startDate, endDate]);
            customDateResults = customDateRows.reduce((acc, row) => {
                const startDateStr = new Date(row.start_date).toISOString().split('T')[0];
                const endDateStr = new Date(row.end_date).toISOString().split('T')[0];

                // Only calculate if both dates are valid trading days for Qode strategies
                if (qodeStrategyIndices.includes(row.indices) &&
                    (!validTradingDays.has(startDateStr) || !validTradingDays.has(endDateStr))) {
                    acc[row.indices] = '-';
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

                acc[row.indices] = returnValue;
                return acc;
            }, {});
        }

        // Filter and group data by indices
        const groupedData = rows.reduce((acc, row) => {
            const index = row.indices;
            if (!acc[index]) {
                acc[index] = [];
            }

            // For Qode strategies, only include data points that match with NIFTY 50 trading days
            if (qodeStrategyIndices.includes(index)) {
                const dateStr = new Date(row.date).toISOString().split('T')[0];
                if (validTradingDays.has(dateStr)) {
                    acc[index].push(row);
                }
            } else {
                // For other indices, include all data points
                acc[index].push(row);
            }
            return acc;
        }, {});

        const results = {};
        for (const [index, data] of Object.entries(groupedData)) {
            results[index] = {
                '1D': calculateReturns(data, '1D', validTradingDays),
                '2D': calculateReturns(data, '2D', validTradingDays),
                '3D': calculateReturns(data, '3D', validTradingDays),
                '10D': calculateReturns(data, '10D', validTradingDays),
                '1W': calculateReturns(data, '1W', validTradingDays),
                '1M': calculateReturns(data, '1M', validTradingDays),
                '3M': calculateReturns(data, '3M', validTradingDays),
                '6M': calculateReturns(data, '6M', validTradingDays),
                '9M': calculateReturns(data, '9M', validTradingDays),
                '1Y': calculateReturns(data, '1Y', validTradingDays),
                '2Y': calculateReturns(data, '2Y', validTradingDays),
                '3Y': calculateReturns(data, '3Y', validTradingDays),
                '4Y': calculateReturns(data, '4Y', validTradingDays),
                '5Y': calculateReturns(data, '5Y', validTradingDays),
                'Since Inception': calculateReturns(data, 'Since Inception', validTradingDays),
                'Drawdown': calculateDrawdown(data, validTradingDays),
                'MDD': calculateMDD(data, validTradingDays)
            };

            // Add custom date range returns if available
            if (customDateResults[index]) {
                results[index]['CDR'] = customDateResults[index];
            } else if (customDateQuery) {
                results[index]['CDR'] = '-';
            }
        }

        // Add validation for custom date range data points
        if (startDate && endDate) {
            for (const [index, data] of Object.entries(groupedData)) {
                // Filter data to only include points within date range and valid trading days
                const customDateData = data.filter(row => {
                    const rowDate = new Date(row.date);
                    const dateStr = rowDate.toISOString().split('T')[0];

                    const isWithinRange = rowDate >= new Date(startDate) && rowDate <= new Date(endDate);
                    const isValidTradingDay = !qodeStrategyIndices.includes(index) || validTradingDays.has(dateStr);

                    return isWithinRange && isValidTradingDay;
                });

                // Calculate required number of data points
                const timeDiff = new Date(endDate) - new Date(startDate);
                const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

                // For Qode indices, check against valid trading days in the period
                if (qodeStrategyIndices.includes(index)) {
                    // Count valid trading days in the date range
                    let validDaysInRange = 0;
                    for (const dateStr of validTradingDays) {
                        const date = new Date(dateStr);
                        if (date >= new Date(startDate) && date <= new Date(endDate)) {
                            validDaysInRange++;
                        }
                    }

                    // Set minimum required points to 80% of valid trading days
                    const requiredPoints = Math.floor(validDaysInRange * 0.8);

                    // Mark as invalid if insufficient data points
                    if (customDateData.length < requiredPoints) {
                        results[index]['CDR'] = '-';
                    }
                } else {
                    // For non-Qode indices, use the original calculation
                    const requiredPoints = Math.floor(daysDiff * 0.8);
                    const minimumPoints = Math.floor(requiredPoints * 0.8);

                    if (customDateData.length < minimumPoints) {
                        results[index]['CDR'] = '-';
                    }
                }
            }
        }

        res.status(200).json({
            dataAsOf,
            data: results
        });
    } catch (error) {
        console.error('Error fetching index returns:', error);
        res.status(500).json({ message: 'Error fetching index returns', error: error.message });
    }
}