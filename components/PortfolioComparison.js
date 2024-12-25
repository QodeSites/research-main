import React from 'react';
import { Card, Table } from 'react-bootstrap';

const PortfolioMetrics = ({ portfolios }) => {
  const performanceMetrics = [
    { label: 'Annualized Return (CAGR)', key: 'Annualized Return (CAGR)' },
    { label: 'Standard Deviation (annualized)', key: 'Standard Deviation (annualized)' },
    { label: 'Best Year', key: 'Best Year' },
    { label: 'Best Year Return', key: 'Best Year Return' },
    { label: 'Worst Year', key: 'Worst Year' },
    { label: 'Worst Year Return', key: 'Worst Year Return' },
    { label: 'Maximum Drawdown', key: 'Maximum Drawdown' }
  ];

  const riskReturnMetrics = [
    { label: 'Standard Deviation (annualized)', key: 'Standard Deviation (annualized)' },
    { label: 'Maximum Drawdown', key: 'Maximum Drawdown' },
    { label: 'Beta', key: 'Beta' },
    { label: 'Alpha (annualized)', key: 'Alpha (annualized)' },
    { label: 'Sharpe Ratio', key: 'Sharpe Ratio' },
    { label: 'Sortino Ratio', key: 'Sortino Ratio' },
    { label: 'Treynor Ratio (%)', key: 'Treynor Ratio (%)' },
    { label: 'Calmar Ratio', key: 'Calmar Ratio' }
  ];

  const getMetricValue = (portfolio, key) => {
    return portfolio?.result?.additional_risk_return_metrics?.[key];
  };

  const formatValue = (value, key) => {
    if (value == null || isNaN(value)) return 'N/A';

    // Year metrics (integer years)
    if (key === 'Best Year' || key === 'Worst Year') {
      return Math.round(value).toString();
    }

    // Percentage metrics
    const percentageMetrics = [
      'Annualized Return (CAGR)',
      'Best Year Return',
      'Worst Year Return',
      'Standard Deviation (annualized)',
      'Maximum Drawdown',
      'Treynor Ratio (%)'
    ];

    // If it's a percentage metric, multiply by 100 and format
    if (percentageMetrics.includes(key)) {
      return `${(value * 100).toFixed(2)}%`;
    }

    // For all other metrics (ratios), show 2 decimal places
    return value.toFixed(2);
  };

  const MetricsTable = ({ title, metrics }) => (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">{title}</h5>
      </Card.Header>
      <Card.Body>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Metric</th>
              {portfolios.map((_, index) => (
                <th key={index} className="text-center">
                  Portfolio {index + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map(({ label, key }) => (
              <tr key={key}>
                <td>{label}</td>
                {portfolios.map((portfolio, idx) => {
                  const value = getMetricValue(portfolio, key);
                  return (
                    <td key={idx} className="text-center">
                      {formatValue(value, key)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  return (
    <div className="mt-4">
      <MetricsTable 
        title="1 Performance Summary" 
        metrics={performanceMetrics} 
      />
      <MetricsTable 
        title="4 Risk and Return Metrics" 
        metrics={riskReturnMetrics} 
      />
    </div>
  );
};

export default PortfolioMetrics;