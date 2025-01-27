import db from "../../lib/db";

export default async function handler(req, res) {
    try {
        // SQL Query to fetch client enquiries ordered by createdDate in descending order
        const query = `
    SELECT *
    FROM client_enquiry
    ORDER BY "createdAt" DESC;
`;


        // Execute the query
        const results = await db.query(query);

        // Respond with the results
        res.status(200).json({
            success: true,
            data: results.rows, // Assuming the database client uses `rows` for fetched records
        });
    } catch (error) {
        // Handle errors
        console.error("Error fetching client enquiries:", error);

        res.status(500).json({
            success: false,
            message: "An error occurred while fetching client enquiries.",
        });
    }
}
