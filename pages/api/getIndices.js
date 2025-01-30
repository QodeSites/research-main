// pages/api/getIndices.js

import db from "lib/db"; // Ensure this path is correct based on your project structure

export default async function handler(req, res) {
    const { method } = req;

    // Allow only GET requests
    if (method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }

    // Extract query parameters
    const { indices, startDate, endDate } = req.query;

    try {
        // Base SQL query
        let query = `
            SELECT indices, nav, date
            FROM tblresearch_new
        `;
        let values = [];
        let conditions = [];

        // Handle 'indices' parameter
        if (indices) {
            // Support multiple indices separated by commas, e.g., ?indices=Index1,Index2
            const indicesList = indices.split(',').map(item => item.trim());

            // Generate parameter placeholders for SQL IN clause
            const placeholders = indicesList.map((_, idx) => `$${idx + 1}`).join(',');

            conditions.push(`indices IN (${placeholders})`);
            values = values.concat(indicesList);
        }

        // Handle 'startDate' parameter
        if (startDate) {
            conditions.push(`date >= $${values.length + 1}`);
            values.push(startDate);
        }

        // Handle 'endDate' parameter
        if (endDate) {
            conditions.push(`date <= $${values.length + 1}`);
            values.push(endDate);
        }

        // Append WHERE clause if there are any conditions
        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        // Append ORDER BY clause
        query += ` ORDER BY indices, date ASC;`;

        // Execute the query
        const { rows } = await db.query(query, values);

        // Respond with the fetched data
        res.status(200).json({ data: rows });
    } catch (error) {
        console.error('Error fetching indices:', error);
        res.status(500).json({ message: 'Error fetching indices data', error: error.message });
    }
}
