import db from "../../lib/db";

export default async function handler(req, res) {
    try {
        // SQL Query as updated above
        const query = `
            SELECT DISTINCT ON (indices)
                indices,
                nav,
                date AT TIME ZONE 'Asia/Kolkata' AS date,
                direction,
                net_change,
                MAX(nav) OVER (PARTITION BY indices) AS peak,
                ROUND(((nav - MAX(nav) OVER (PARTITION BY indices)) / MAX(nav) OVER (PARTITION BY indices)) * 100, 2) AS currentDD,
                ROUND(MAX(nav) OVER (PARTITION BY indices) * 0.9, 2) AS dd10_value,
                ROUND(MAX(nav) OVER (PARTITION BY indices) * 0.85, 2) AS dd15_value,
                ROUND(MAX(nav) OVER (PARTITION BY indices) * 0.8, 2) AS dd20_value,
                CASE WHEN nav <= ROUND(MAX(nav) OVER (PARTITION BY indices) * 0.9, 2) THEN true ELSE false END AS dd10,
                CASE WHEN nav <= ROUND(MAX(nav) OVER (PARTITION BY indices) * 0.85, 2) THEN true ELSE false END AS dd15,
                CASE WHEN nav <= ROUND(MAX(nav) OVER (PARTITION BY indices) * 0.8, 2) THEN true ELSE false END AS dd20
            FROM tblresearch_new
            ORDER BY indices, date DESC;
        `;

        const { rows } = await db.query(query);
        console.log(rows);
        

        // Validate and map data
        const validatedRows = rows.map(row => {
            // Access 'currentdd' instead of 'currentDD'
            const parsedDD = parseFloat(row.currentdd); // Parsing currentdd directly
            return {
                ...row,
                currentDD: isNaN(parsedDD) ? 0 : parsedDD, // Ensure currentDD is a valid number
                nav: parseFloat(row.nav),
                peak: parseFloat(row.peak),
                dd10: Boolean(row.dd10),
                dd15: Boolean(row.dd15),
                dd20: Boolean(row.dd20),
                dd10_value: parseFloat(row.dd10_value),
                dd15_value: parseFloat(row.dd15_value),
                dd20_value: parseFloat(row.dd20_value),
                // Optionally remove 'currentdd' if not needed
                // currentdd: undefined,
            };
        });


        res.status(200).json({ data: validatedRows });
    } catch (error) {
        console.error('Error fetching indices:', error);
        res.status(500).json({ message: 'Error fetching indices', error: error.message });
    }
}
