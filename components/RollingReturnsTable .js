import React from 'react';
import { Card, Table } from 'react-bootstrap';

const calculateRollingStatistics = (equityData, windowYears) => {
  if (!equityData || equityData.length < windowYears * 252) return null;

  const windowDays = Math.floor(windowYears * 252); // Using 252 trading days per year
  const rollingReturns = [];

  for (let i = windowDays; i < equityData.length; i++) {
    const currentNAV = equityData[i].NAV;
    const pastNAV = equityData[i - windowDays].NAV;
    // Annualized return calculation
    const return_ = ((currentNAV / pastNAV) ** (1 / windowYears) - 1) * 100;
    rollingReturns.push(return_);
  }

  if (rollingReturns.length === 0) return null;

  return {
    average: rollingReturns.reduce((a, b) => a + b, 0) / rollingReturns.length,
    high: Math.max(...rollingReturns),
    low: Math.min(...rollingReturns),
  };
};

const RollingReturnsTable = ({ portfolios }) => {
  const periods = [1, 3, 5, 7, 10, 15]; // Rolling periods in years

  const calculatePortfolioStats = (portfolio) => {
    const stats = {};
    periods.forEach((period) => {
      stats[period] = calculateRollingStatistics(portfolio.result?.equity_curve_data, period);
    });
    return stats;
  };

  // Collect stats for all portfolios
  const allStats = portfolios.map((portfolio) => calculatePortfolioStats(portfolio));

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Body>
        <h3 className="text-lg font-semibold mb-4">Rolling Returns Analysis</h3>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th rowSpan={2}>Period (Years)</th>
              {portfolios.map((portfolio, index) => (
                <th key={index} colSpan={3} className="text-center">
                  {portfolio.portfolio_name}
                </th>
              ))}
            </tr>
            <tr>
              {portfolios.map((_, index) => (
                <React.Fragment key={index}>
                  <th className="text-end">Average (%)</th>
                  <th className="text-end">High (%)</th>
                  <th className="text-end">Low (%)</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period}>
                <td>{period}</td>
                {allStats.map((stats, index) => {
                  const periodStats = stats[period];
                  return periodStats ? (
                    <React.Fragment key={index}>
                      <td className="text-end">{periodStats.average.toFixed(2)}</td>
                      <td className="text-end">{periodStats.high.toFixed(2)}</td>
                      <td className="text-end">{periodStats.low.toFixed(2)}</td>
                    </React.Fragment>
                  ) : (
                    <React.Fragment key={index}>
                      <td className="text-end">-</td>
                      <td className="text-end">-</td>
                      <td className="text-end">-</td>
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default RollingReturnsTable;
