import { calculateDrawdown, calculateReturns } from "utils/calculateReturns";
import db from "lib/db";
export default async function handler(req, res) {
    const { startDate, endDate } = req.body;
    
    try {
        // Main data query for all returns
        const query = `
            SELECT indices, nav, date
            FROM tblresearch_new
            ORDER BY indices, date ASC;
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
            );
        ` : null;

        // Get latest date
        const dataAsOfQuery = `
            SELECT MAX(date) as latest_date
            FROM tblresearch_new;
        `;

        // Execute queries
        const { rows } = await db.query(query);
        const { rows: dataAsOfRow } = await db.query(dataAsOfQuery);
        const dataAsOf = dataAsOfRow[0]?.latest_date;

        // Handle custom date range if provided
        let customDateResults = {};
        if (customDateQuery) {
            const { rows: customDateRows } = await db.query(customDateQuery, [startDate, endDate]);
            customDateResults = customDateRows.reduce((acc, row) => {
                const timeDiff = new Date(row.end_date) - new Date(row.start_date);
                const yearDiff = timeDiff / (1000 * 60 * 60 * 24 * 365.25);
                
                let returnValue;
                if (yearDiff <= 1) {
                    // Absolute return for periods <= 1 year
                    returnValue = ((row.end_nav - row.start_nav) / row.start_nav * 100).toFixed(2);
                } else {
                    // CAGR for periods > 1 year
                    returnValue = ((Math.pow(row.end_nav / row.start_nav, 1/yearDiff) - 1) * 100).toFixed(2);
                }
                
                acc[row.indices] = returnValue;
                return acc;
            }, {});
        }

        // Group data by indices
        const groupedData = rows.reduce((acc, row) => {
            if (!acc[row.indices]) {
                acc[row.indices] = [];
            }
            acc[row.indices].push(row);
            return acc;
        }, {});

        const results = {};

        // Calculate returns for each index
        for (const [index, data] of Object.entries(groupedData)) {
            results[index] = {
                '1D': calculateReturns(data, '1D'),
                '2D': calculateReturns(data, '2D'),
                '3D': calculateReturns(data, '3D'),
                '1W': calculateReturns(data, '1W'),
                '1M': calculateReturns(data, '1M'),
                '3M': calculateReturns(data, '3M'),
                '6M': calculateReturns(data, '6M'),
                '9M': calculateReturns(data, '9M'),
                '1Y': calculateReturns(data, '1Y'),
                '2Y': calculateReturns(data, '2Y'),
                '3Y': calculateReturns(data, '3Y'),
                '4Y': calculateReturns(data, '4Y'),
                '5Y': calculateReturns(data, '5Y'),
                'Drawdown': calculateDrawdown(data)
            };

            // Add custom date range returns if available
            if (customDateResults[index]) {
                results[index]['CDR'] = customDateResults[index];
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