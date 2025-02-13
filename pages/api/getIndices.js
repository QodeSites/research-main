import db from "lib/db";

export default async function handler(req, res) {
  const { method } = req;

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (method === "OPTIONS") {
    return res.status(200).end();
  }

  if (method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  const { indices, startDate, endDate } = req.query;

  try {
    if (!indices) {
      return res.status(400).json({ message: "indices parameter is required" });
    }

    // Convert the indices from URL to uppercase so they match the DB.
    const indicesList = indices
      .split(",")
      .map((item) => item.trim().toUpperCase());

    // Parse dates if provided; accepts any format that Date() can handle.
    let parsedStartDate = null;
    let parsedEndDate = null;
    if (startDate) {
      parsedStartDate = parseToISODate(startDate);
      if (!parsedStartDate) {
        return res
          .status(400)
          .json({ message: "Invalid startDate. Provide a valid date." });
      }
    }
    if (endDate) {
      parsedEndDate = parseToISODate(endDate);
      if (!parsedEndDate) {
        return res
          .status(400)
          .json({ message: "Invalid endDate. Provide a valid date." });
      }
    }

    let dataRows = [];

    if (parsedStartDate) {
      // Get the last available record for each index before the startDate using DISTINCT ON.
      const lastAvailableNavQuery = `
        SELECT DISTINCT ON (indices) indices, nav, date
        FROM tblresearch_new
        WHERE indices = ANY($1)
          AND date < $2::date
        ORDER BY indices, date DESC;
      `;
      const lastNavResult = await db.query(lastAvailableNavQuery, [
        indicesList,
        parsedStartDate,
      ]);

      // Create an interpolation row for each index that has a previous record.
      const interpolatedRows = lastNavResult.rows.map((row) => ({
        indices: row.indices,
        nav: row.nav,
        date: parsedStartDate, // Already in YYYY-MM-DD format.
      }));

      // Get all actual data from startDate onward (with an optional endDate filter)
      let mainQuery = `
        SELECT indices, nav, date
        FROM tblresearch_new
        WHERE indices = ANY($1)
          AND date >= $2::date
      `;
      const queryParams = [indicesList, parsedStartDate];

      if (parsedEndDate) {
        mainQuery += " AND date <= $3::date";
        queryParams.push(parsedEndDate);
      }
      mainQuery += " ORDER BY indices, date ASC;";

      const actualDataResult = await db.query(mainQuery, queryParams);

      // Combine the interpolation rows with the actual data.
      dataRows = [...interpolatedRows, ...actualDataResult.rows];
    } else {
      // If no startDate is provided, fetch all available data for the given indices.
      let mainQuery = `
        SELECT indices, nav, date
        FROM tblresearch_new
        WHERE indices = ANY($1)
      `;
      const queryParams = [indicesList];

      if (parsedEndDate) {
        mainQuery += " AND date <= $2::date";
        queryParams.push(parsedEndDate);
      }
      mainQuery += " ORDER BY indices, date ASC;";

      const result = await db.query(mainQuery, queryParams);
      dataRows = result.rows;
    }

    // Reformat the date for each row to remove the timestamp.
    dataRows = dataRows.map((row) => ({
      ...row,
      date: new Date(row.date).toISOString().split("T")[0],
    }));

    res.status(200).json({ data: dataRows });
  } catch (error) {
    console.error("Error fetching indices:", error);
    res
      .status(500)
      .json({ message: "Error fetching indices data", error: error.message });
  }
}

// Helper function to parse any date format into YYYY-MM-DD format.
// Returns null if the date cannot be parsed.
function parseToISODate(dateString) {
  const parsed = new Date(dateString);
  if (isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString().split("T")[0];
}
