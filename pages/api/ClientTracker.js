import db from "../../lib/db";
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

    let portfolio_details_query = `
    select * from pms_clients_tracker.portfolio_details order by cash_percentage desc
    `
    let trailing_returns_query = `
    select * from pms_clients_tracker.trailing_returns 
    `
    let portfolio_tracker = await db.query(portfolio_details_query);
    let trailing_returns = await db.query(trailing_returns_query);
    res.status(200).json({ portfolio_tracker: portfolio_tracker.rows, trailing_returns: trailing_returns.rows });

}