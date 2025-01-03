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
  const periods = [1, 3, 5, 7]; // Rolling periods in years

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
    <Card className="shadow-sm">
      <Card.Header>
        <h5 className="mb-0">Rolling Returns Analysis</h5>
      </Card.Header>
      <Card.Body>
        <Table
          striped
          bordered
          hover
          responsive
          className="align-middle text-start mb-0"
        >
          <thead>
            <tr>
              <th rowSpan={2} className="text-center align-middle">Period (Years)</th>
              {portfolios.map((portfolio, index) => (
                <th key={index} colSpan={3} className="text-center">
                  {portfolio.portfolio_name || `Portfolio ${index + 1}`}
                </th>
              ))}
            </tr>
            <tr>
              {portfolios.map((_, index) => (
                <React.Fragment key={index}>
                  <th className="text-center">Average (%)</th>
                  <th className="text-center">High (%)</th>
                  <th className="text-center">Low (%)</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period}>
                <td className="text-center">{period}</td>
                {allStats.map((stats, index) => {
                  const periodStats = stats[period];
                  return periodStats ? (
                    <React.Fragment key={index}>
                      <td className="text-center" style={{ color: periodStats.average > 0 ? '#198754' : '#dc3545' }}>
                        {periodStats.average.toFixed(2)}
                      </td>
                      <td className="text-center" style={{ color: periodStats.high > 0 ? '#198754' : '#dc3545' }}>
                        {periodStats.high.toFixed(2)}
                      </td>
                      <td className="text-center" style={{ color: periodStats.low > 0 ? '#198754' : '#dc3545' }}>
                        {periodStats.low.toFixed(2)}
                      </td>
                    </React.Fragment>
                  ) : (
                    <React.Fragment key={index}>
                      <td className="text-center">N/A</td>
                      <td className="text-center">N/A</td>
                      <td className="text-center">N/A</td>
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
