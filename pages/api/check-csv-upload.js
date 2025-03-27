// pages/api/check-csv-upload.js

import db from 'lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  const { year, month } = req.body;
  if (!year || !month) {
    return res.status(400).json({ message: 'Year and Month are required.' });
  }

  try {
    const queryText = 'SELECT COUNT(*) FROM pms_monthly_reports WHERE "year" = $1 AND "month" = $2';
    const values = [year, month];
    const result = await db.query(queryText, values);
    const count = parseInt(result.rows[0].count, 10);
    return res.status(200).json({ exists: count > 0 });
  } catch (error) {
    console.error('Error checking CSV upload: ', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
