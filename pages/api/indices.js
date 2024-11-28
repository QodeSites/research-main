// pages/api/indices.js
import db from "../../lib/db";
import { calculateReturns } from "../../utils/calculateReturns";

export default async function handler(req, res) {
    try {
        const query = `
            SELECT indices, nav, date
            FROM tblresearch
            ORDER BY indices, date ASC;
        `;

        // Fetch data for all indices
        const { rows } = await db.query(query);

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
                '10D': calculateReturns(data, '10D'),
                '1W': calculateReturns(data, '1W'),
                '1M': calculateReturns(data, '1M'),
                '3M': calculateReturns(data, '3M'),
                '6M': calculateReturns(data, '6M'),
                '9M': calculateReturns(data, '9M'),
                '1Y': calculateReturns(data, '1Y'),
            };
        }

        // Return the calculated results
        res.status(200).json({ data: results });
    } catch (error) {
        console.error('Error fetching index returns:', error);
        res.status(500).json({ message: 'Error fetching index returns', error: error.message });
    }
}
