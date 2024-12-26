import db from "../../lib/db";
export default async function handler(req, res) {
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