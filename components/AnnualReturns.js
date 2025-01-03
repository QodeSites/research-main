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
    <Card className="shadow-sm">
      <Card.Header>
        <h5 className="mb-0">Annual Metrics Analysis</h5>
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
              <th rowSpan={2} className="text-center align-middle">Year</th>
              {portfolios.map((portfolio, index) => (
                <th key={index} colSpan={2} className="text-center">
                  {portfolio.portfolio_name || `Portfolio ${index + 1}`}
                </th>
              ))}
            </tr>
            <tr>
              {portfolios.map((_, index) => (
                <React.Fragment key={index}>
                  <th className="text-center">Return (%)</th>
                  <th className="text-center">Balance</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {allYears.map((year) => (
              <tr key={year}>
                <td className="text-center">{year}</td>
                {allMetrics.map((metrics, index) => {
                  const yearMetric = metrics.find((metric) => metric.year === year);
                  return yearMetric ? (
                    <React.Fragment key={index}>
                      <td 
                        className="text-center" 
                        style={{
                          color: yearMetric.return > 0 ? '#198754' : 
                                 yearMetric.return < 0 ? '#dc3545' : 
                                 'inherit',
                        }}
                      >
                        {yearMetric.return.toFixed(2)}
                      </td>
                      <td className="text-center">
                        {yearMetric.balance.toLocaleString('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                        })}
                      </td>
                    </React.Fragment>
                  ) : (
                    <React.Fragment key={index}>
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

export default AnnualMetricsTable;
