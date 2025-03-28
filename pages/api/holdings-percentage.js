import db from "lib/db"; // assuming this exports a configured pg or mysql client

export default async function handler(req, res) {
  // Method validation
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Fetch all stock-wise holdings with a single query
    const query = `
      SELECT 
        symbolname,
        clientcode,
        percentassets,
        strategy,
        total
      FROM pms_clients_tracker.pms_holdings_percentage
      ORDER BY symbolname, clientcode
    `;

    const result = await db.query(query);

    // Group data by stock name
    const grouped = result.rows.reduce((acc, row) => {
      if (!acc[row.symbolname]) {
        acc[row.symbolname] = {
          symbolname: row.symbolname,
          total: row.total,
          strategy: row.strategy,
          clients: []
        };
      }

      acc[row.symbolname].clients.push({
        clientcode: row.clientcode,
        percentassets: row.percentassets
      });

      return acc;
    }, {});

    // Convert to array and return
    const response = Object.values(grouped);

    res.status(200).json(response);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: process.env.NODE_ENV === 'development' ? error.message : null 
    });
  }
}