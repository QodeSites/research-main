import db from "../../lib/db";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use POST.",
    });
  }

  // Destructure the expected fields from the request body
  const { id, status, additionalComments } = req.body;

  // Basic validation: ensure id is provided
  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Missing inquiry id.",
    });
  }

  try {
    // Parameterized SQL query to update the inquiry
    const query = `
      UPDATE public.client_enquiry
      SET status = $1,
          "additionalComments" = $2,
          "updatedAt" = NOW()
      WHERE id = $3;
    `;

    // Execute the query with provided values
    await db.query(query, [status, additionalComments, id]);

    // Respond with a success message
    return res.status(200).json({
      success: true,
      message: "Inquiry updated successfully.",
    });
  } catch (error) {
    console.error("Error updating inquiry:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the inquiry.",
    });
  }
}
