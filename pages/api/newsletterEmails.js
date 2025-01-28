import db from "../../lib/db";

export default async function handler(req, res) {
    try {
        // SQL Query to fetch newsletter emails
        const query = `SELECT id, email, "createdAt" FROM emails ORDER BY id DESC;`;

        // Execute the query
        const results = await db.query(query);

        // Respond with the results
        res.status(200).json({
            success: true,
            data: results.rows, // Assuming the database client returns results in `rows`
        });
    } catch (error) {
        console.error("Error fetching newsletter emails:", error);

        res.status(500).json({
            success: false,
            message: "An error occurred while fetching newsletter emails.",
        });
    }
}
