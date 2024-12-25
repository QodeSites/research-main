import React, { useState } from 'react';
import PortfolioManager from './PortfolioManager';
import { Container, Spinner, Alert } from 'react-bootstrap';
import PortfolioResult from './PortfolioResult';

// API endpoint configuration based on environment
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://calculator.qodeinvest.com'
  : 'http://192.168.0.107:5080';

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

      const response = await fetch(`${API_BASE_URL}/api/portfolio/compare`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: process.env.NODE_ENV === 'production' ? 'include' : 'same-origin',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit portfolios');
      }

      const responseData = await response.json();
      // Ensure we're accessing the results correctly from the response
      const results = responseData.results || responseData;
      
      console.log('API Response:', results);
      setResultData(results);
      setSubmissionResult('Portfolios calculated successfully!');
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
      
      {process.env.NODE_ENV !== 'production' && (
        <Alert variant="info" className="mb-3">
          Running in development mode - Using API: {API_BASE_URL}
        </Alert>
      )}

      {submissionResult && (
        <Alert variant="success" dismissible onClose={() => setSubmissionResult(null)}>
          {submissionResult}
        </Alert>
      )}
      
      {submissionError && (
        <Alert variant="danger" dismissible onClose={() => setSubmissionError(null)}>
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
        <div className="mt-4">
          {resultData.map((portfolio, index) => (
            <PortfolioResult
              key={portfolio.portfolio_index || index}
              portfolio={portfolio}
              index={index}
              apiBaseUrl={API_BASE_URL}
            />
          ))}
        </div>
      )}
    </Container>
  );
};

export default ParentComponent;