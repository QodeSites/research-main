import db from "../../lib/db";
import { calculateReturns } from "../../utils/calculateReturns";
import { calculateDrawdown } from "utils/calculateDrawdowns";

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

        const drawdownQuery = `
        SELECT DISTINCT ON (indices)
            indices,
            nav,
            date AT TIME ZONE 'UTC' AS date,
            MAX(nav) OVER (PARTITION BY indices) AS peak,
            ROUND(((nav - MAX(nav) OVER (PARTITION BY indices)) / MAX(nav) OVER (PARTITION BY indices)) * 100, 2) AS currentDD,
            ROUND(MAX(nav) OVER (PARTITION BY indices) * 0.9, 2) AS dd10_value
            FROM tblresearch
        `

        // Fetch data for all indices
        const { rows } = await db.query(query);
        const { rows:drawdown } = await db.query(drawdownQuery)
        // Fetch the latest date
        const { rows: dataAsOfRow } = await db.query(dataAsOfQuery);
        const dataAsOf = dataAsOfRow[0]?.latest_date;
        console.log(drawdown);
        
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
                '10D': calculateReturns(data, '10D'),
                '1W': calculateReturns(data, '1W'),
                '1M': calculateReturns(data, '1M'),
                '3M': calculateReturns(data, '3M'),
                '6M': calculateReturns(data, '6M'),
                '9M': calculateReturns(data, '9M'),
                '1Y': calculateReturns(data, '1Y'),
                'Drawdown': calculateDrawdown(data)

            };
        }

        // Handle custom date returns if dates are provided
        // if (startDate && endDate) {
        //     const { rows: customRows } = await db.query(customDateQuery);


            
            // Calculate custom date returns for each index
            // for (const [index, data] of Object.entries(groupedCustomData)) {
            //     const customReturn = calculateCustomDateReturns(data, startDate, endDate);
                
            //     // Add custom return to the existing results
            //     if (results[index]) {
            //         results[index]['Custom'] = customReturn;
            //     }
            // }
        // }
                    // Group custom data by indices
        // const groupedCustomData = drawdown.reduce((acc, row) => {
        //     if (!acc[row.indices]) {
        //         acc[row.indices] = [];
        //     }
        //     acc[row.indices].push(row);
        //     return acc;
        // }, {});

        
        // for (const [index, data] of Object.entries(groupedCustomData)) {
        //     const currentDD = data[0]['currentdd']
        //     if(results[index]){
        //         results[index]['Drawdown'] = currentDD
        //     }
        // }
        
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