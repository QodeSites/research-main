// pages/api/upload-csv.js

import db from 'lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  const { year, month, data } = req.body;
  console.log("Received data for upload:", { year, month, rowCount: data.length });
  
  if (!year || !month || !data || !Array.isArray(data)) {
    console.error("Invalid input:", req.body);
    return res.status(400).json({ message: 'Year, Month and CSV data are required.' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Check if data for this month and year already exists
    const checkQuery = 'SELECT COUNT(*) FROM public.pms_monthly_reports WHERE year = $1 AND month = $2';
    const checkResult = await client.query(checkQuery, [year, month]);
    const count = parseInt(checkResult.rows[0].count, 10);
    console.log("Existing record count:", count);
    if (count > 0) {
      await client.query('ROLLBACK');
      console.log("Duplicate data found. Aborting upload.");
      return res.status(400).json({ message: 'Data for this month and year already exists.' });
    }

    // Updated insert query without the id column.
    const insertQuery = `
      INSERT INTO public.pms_monthly_reports
      ("group", pms_name, "1M", "3M", "6M", "1Y", "2Y", "3Y", "5Y", since_inception, month, year, "4Y")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `;

    for (let row of data) {
      const groupValue = row["Group"] || row["Category"] || null;
      const pmsName = row["PMS Investment Approach(s)"] || row["Category"] || null;
      // Convert numeric fields; if a value is '-' set as null.
      const value1M = row["1M"] && row["1M"] !== '-' ? parseFloat(row["1M"]) : null;
      const value3M = row["3M"] && row["3M"] !== '-' ? parseFloat(row["3M"]) : null;
      const value6M = row["6M"] && row["6M"] !== '-' ? parseFloat(row["6M"]) : null;
      const value1Y = row["1Y"] && row["1Y"] !== '-' ? parseFloat(row["1Y"]) : null;
      const value2Y = row["2Y"] && row["2Y"] !== '-' ? parseFloat(row["2Y"]) : null;
      const value3Y = row["3Y"] && row["3Y"] !== '-' ? parseFloat(row["3Y"]) : null;
      const value5Y = row["5Y"] && row["5Y"] !== '-' ? parseFloat(row["5Y"]) : null;
      const valueSinceInception = row["Since Inception"] && row["Since Inception"] !== '-' ? parseFloat(row["Since Inception"]) : null;
      const value4Y = row["4Y"] && row["4Y"] !== '-' ? parseFloat(row["4Y"]) : null;

      console.log("Inserting row:", {
        groupValue,
        pmsName,
        value1M,
        value3M,
        value6M,
        value1Y,
        value2Y,
        value3Y,
        value5Y,
        valueSinceInception,
        month,
        year,
        value4Y
      });

      await client.query(insertQuery, [
        groupValue,        // "group"
        pmsName,           // pms_name
        value1M,           // "1M"
        value3M,           // "3M"
        value6M,           // "6M"
        value1Y,           // "1Y"
        value2Y,           // "2Y"
        value3Y,           // "3Y"
        value5Y,           // "5Y"
        valueSinceInception, // since_inception
        month,             // month
        year,              // year
        value4Y            // "4Y"
      ]);
    }

    await client.query('COMMIT');
    console.log("CSV data inserted successfully.");
    res.status(200).json({ message: 'CSV data inserted successfully.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error inserting CSV data: ', error);
    res.status(500).json({ message: 'Internal server error while inserting CSV data.' });
  } finally {
    client.release();
  }
}
