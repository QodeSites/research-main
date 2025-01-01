import React from 'react';
import { Card, Table } from 'react-bootstrap';

const AnnualMetricsTable = ({ portfolios }) => {
  const extractAnnualMetrics = (portfolio) => {
    const metrics = portfolio.result?.additional_risk_return_metrics?.annual_metrics;
    if (!metrics) return [];

    return Object.keys(metrics).map((year) => ({
      year: parseInt(year, 10),
      return: metrics[year].return_percentage || 0,
      balance: metrics[year].end_balance || 0,
    }));
  };

  // Collect annual metrics for all portfolios
  const allMetrics = portfolios.map((portfolio) => extractAnnualMetrics(portfolio));

  // Extract all years to ensure all portfolios are aligned
  const allYears = Array.from(
    new Set(
      allMetrics.flatMap((metrics) => metrics.map((metric) => metric.year))
    )
  ).sort((a, b) => a - b); // Sort years in ascending order

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Body>
        <h3 className="text-lg font-semibold mb-4">Annual Metrics Analysis</h3>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th rowSpan={2}>Year</th>
              {portfolios.map((portfolio, index) => (
                <th key={index} colSpan={2} className="text-center">
                  {portfolio.portfolio_name}
                </th>
              ))}
            </tr>
            <tr>
              {portfolios.map((_, index) => (
                <React.Fragment key={index}>
                  <th className="text-end">Return (%)</th>
                  <th className="text-end">Balance</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {allYears.map((year) => (
              <tr key={year}>
                <td>{year}</td>
                {allMetrics.map((metrics, index) => {
                  const yearMetric = metrics.find((metric) => metric.year === year);
                  return yearMetric ? (
                    <React.Fragment key={index}>
                      <td className="text-end">{yearMetric.return.toFixed(2)}</td>
                      <td className="text-end">{yearMetric.balance.toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                      })}</td>
                    </React.Fragment>
                  ) : (
                    <React.Fragment key={index}>
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

export default AnnualMetricsTable;
