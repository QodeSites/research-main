import React from 'react';
import PropTypes from 'prop-types';
import { Card, Table } from 'react-bootstrap';

const TrailingReturnsTable = ({ portfolios }) => {
  const periods = ['10d', '1w', '1m', '3m', '6m', '1y', '3y', '5y'];

  return (
    <Card className="shadow-sm">
      <Card.Header>
        <h5 className="mb-0">Portfolio Trailing Returns Comparison</h5>
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
              <th>Portfolio</th>
              {periods.map(period => (
                <th key={period} className="text-center">
                  {period.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {portfolios.map((portfolio, idx) => (
              <tr key={idx}>
                <td className="font-weight-medium">
                  {portfolio.portfolio_name || `Portfolio ${portfolio.portfolio_index}`}
                </td>
                {periods.map(period => {
                  const value = portfolio.result?.trailing_returns?.[period];
                  const formattedValue = value != null ? `${value.toFixed(2)}%` : 'N/A';

                  return (
                    <td 
                      key={period} 
                      className="text-center"
                      style={{
                        color: value > 0 ? '#198754' : 
                               value < 0 ? '#dc3545' : 
                               'inherit'
                      }}
                    >
                      {formattedValue}
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
};

TrailingReturnsTable.propTypes = {
  portfolios: PropTypes.arrayOf(
    PropTypes.shape({
      portfolio_name: PropTypes.string,
      portfolio_index: PropTypes.number,
      result: PropTypes.shape({
        trailing_returns: PropTypes.object
      }),
    })
  ).isRequired
};

export default TrailingReturnsTable;
