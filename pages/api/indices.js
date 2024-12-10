import db from "../../lib/db";
import { calculateReturns } from "../../utils/calculateReturns";

// Function to calculate custom date returns
const calculateCustomDateReturns = (data, startDate, endDate) => {
    if (!data || data.length === 0) return null;
    console.log(data);
    
    // Sort data by date to ensure chronological order
    const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get start and end prices
    const startPrice = sortedData[0].nav;
    const endPrice = sortedData[sortedData.length - 1].nav;

    // Calculate duration in years
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationInYears = (end - start) / (1000 * 60 * 60 * 24 * 365);

    // Calculate returns
    const absoluteReturn = ((endPrice - startPrice) / startPrice) * 100;

    // If duration is less than 1 year, return absolute return
    if (durationInYears <= 1) {
        return Number(absoluteReturn.toFixed(2));
    }

    // If duration is more than 1 year, calculate CAGR
    const cagr = (Math.pow(1 + absoluteReturn / 100, 1 / durationInYears) - 1) * 100;
    return Number(cagr.toFixed(2));
};

export default async function handler(req, res) {
    const { startDate, endDate } = req.body;
    let customDateQuery;
    
    if (startDate && endDate) {
        customDateQuery = `
            SELECT indices, nav, date
            FROM tblresearch 
            WHERE indices IN (
                SELECT DISTINCT indices 
                FROM tblresearch 
                WHERE date >= '${startDate}' AND date <= '${endDate}'
            ) 
            AND date IN (
                '${startDate}', 
                '${endDate}'
            )
            ORDER BY indices, date ASC;
        `;
    }

    try {
        const query = `
            SELECT indices, nav, date
            FROM tblresearch
            ORDER BY indices, date ASC;
        `;

        const dataAsOfQuery = `
            SELECT MAX(date) as latest_date
            FROM tblresearch;
        `;

        // Fetch data for all indices
        const { rows } = await db.query(query);
        
        // Fetch the latest date
        const { rows: dataAsOfRow } = await db.query(dataAsOfQuery);
        const dataAsOf = dataAsOfRow[0]?.latest_date;

        // Group data by indices
        const groupedData = rows.reduce((acc, row) => {
            if (!acc[row.indices]) {
                acc[row.indices] = [];
            }
            acc[row.indices].push(row);
            return acc;
        }, {});

        const results = {};
        const customResults = {};

        // Calculate returns for each index
        for (const [index, data] of Object.entries(groupedData)) {
            results[index] = {
                '10D': calculateReturns(data, '10D'),
                '1W': calculateReturns(data, '1W'),
                '1M': calculateReturns(data, '1M'),
                '3M': calculateReturns(data, '3M'),
                '6M': calculateReturns(data, '6M'),
                '9M': calculateReturns(data, '9M'),
                '1Y': calculateReturns(data, '1Y'),
            };
        }

        // Handle custom date returns if dates are provided
        if (startDate && endDate) {
            const { rows: customRows } = await db.query(customDateQuery);

            // Group custom data by indices
            const groupedCustomData = customRows.reduce((acc, row) => {
                if (!acc[row.indices]) {
                    acc[row.indices] = [];
                }
                acc[row.indices].push(row);
                return acc;
            }, {});

            // Calculate custom date returns for each index
            for (const [index, data] of Object.entries(groupedCustomData)) {
                const customReturn = calculateCustomDateReturns(data, startDate, endDate);
                
                // Add custom return to the existing results
                if (results[index]) {
                    results[index]['Custom'] = customReturn;
                }
            }
        }
        
        // Return the calculated results
        res.status(200).json({ 
            dataAsOf, 
            data: results 
        });
    } catch (error) {
        console.error('Error fetching index returns:', error);
        res.status(500).json({ message: 'Error fetching index returns', error: error.message });
    }
}