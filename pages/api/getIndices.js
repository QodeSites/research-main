import db from "lib/db";

export default async function handler(req, res) {
    const { method } = req;

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }

    const { indices, startDate, endDate } = req.query;

    try {
        if (!indices) {
            return res.status(400).json({ message: 'indices parameter is required' });
        }

        const indicesList = indices.split(',').map(item => item.trim());

        // Validate dates
        if (startDate && !isValidDate(startDate)) {
            return res.status(400).json({ message: 'Invalid startDate format. Use YYYY-MM-DD.' });
        }
        if (endDate && !isValidDate(endDate)) {
            return res.status(400).json({ message: 'Invalid endDate format. Use YYYY-MM-DD.' });
        }

        const startDateOnly = startDate ? startDate.split(' ')[0] : null;
        const endDateOnly = endDate ? endDate.split(' ')[0] : null;

        // First, get the latest NAV before the start date
        const lastAvailableNavQuery = `
            SELECT indices, nav, date
            FROM tblresearch_new
            WHERE indices = ANY($1)
            AND date < $2::date
            ORDER BY date DESC
            LIMIT 1;
        `;
        
        const lastNavResult = await db.query(lastAvailableNavQuery, [indicesList, startDateOnly]);
        
        if (!lastNavResult.rows.length) {
            return res.status(404).json({ message: 'No previous data available for interpolation.' });
        }

        // Then get all the actual data points from start date onwards
        const mainQuery = `
            SELECT indices, nav, date
            FROM tblresearch_new
            WHERE indices = ANY($1)
            AND date > $2::date
            ${endDateOnly ? 'AND date <= $3::date' : ''}
            ORDER BY indices, date ASC;
        `;

        const mainQueryValues = endDateOnly 
            ? [indicesList, startDateOnly, endDateOnly]
            : [indicesList, startDateOnly];

        const actualDataResult = await db.query(mainQuery, mainQueryValues);

        // Combine interpolated and actual data
        const interpolatedStartPoint = {
            indices: lastNavResult.rows[0].indices,
            nav: lastNavResult.rows[0].nav,
            date: new Date(startDateOnly + 'T18:30:00.000Z').toISOString()
        };

        const combinedData = [
            interpolatedStartPoint,
            ...actualDataResult.rows
        ];

        res.status(200).json({ data: combinedData });

    } catch (error) {
        console.error('Error fetching indices:', error);
        res.status(500).json({ message: 'Error fetching indices data', error: error.message });
    }
}

function isValidDate(dateString) {
    const dateOnly = dateString.split(' ')[0];
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateOnly) && !isNaN(Date.parse(dateOnly));
}