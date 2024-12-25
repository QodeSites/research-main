import React, { useState } from 'react';
import PortfolioManager from './PortfolioManager';
import { Container, Spinner, Alert } from 'react-bootstrap';
import PortfolioResult from './PortfolioResult';

const ParentComponent = () => {
  const [loading, setLoading] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submissionError, setSubmissionError] = useState('');
  const [resultData, setResultData] = useState([]);
  const handleFormSubmit = async (data) => {
    try {
      setLoading(true);
      setSubmissionResult(null);
      setSubmissionError('');

      // Replace with your actual API endpoint
      const response = await fetch('http://192.168.0.106:5080/api/portfolio/compare', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      console.log(response);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit portfolios');
      }

      const results = response.data.results;
      console.log(results);
      setResultData(results);
      setSubmissionResult(results.message || 'Portfolios calculated successfully!');
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionError(error.message || 'An error occurred while submitting portfolios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-5">
      <h1 className="text-center mb-4">Portfolio Calculator</h1>
      
      {submissionResult && (
        <Alert variant="success" dismissible>
          {submissionResult}
        </Alert>
      )}
      
      {submissionError && (
        <Alert variant="danger" dismissible>
          {submissionError}
        </Alert>
      )}

      <PortfolioManager 
        onSubmit={handleFormSubmit}
        loading={loading}
        columns={['Custom1', 'Custom2']}
      />

      {loading && (
        <div className="text-center mt-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Calculating portfolios...</p>
        </div>
      )}

      {!loading && resultData && resultData.length > 0 && (
        <div className="grid grid-cols-1 gap-12">
          {resultData.map((portfolio, index) => (
            <PortfolioResult
              key={portfolio.portfolio_index}
              portfolio={portfolio}
              index={index}
            />
          ))}
        </div>
      )}
    </Container>
  );
};

export default ParentComponent;
