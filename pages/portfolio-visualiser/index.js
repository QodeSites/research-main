import React, { useState } from 'react';
import PortfolioManager from 'components/PortfolioManager';
import { Container, Spinner, Alert, Tab, Tabs } from 'react-bootstrap';
import CombinedPortfolioResults from 'components/PortfolioResult';

// API endpoint configuration based on environment
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://calculator.qodeinvest.com'
  : 'http://192.168.0.107:5080';

const PortfolioIndex = () => {
  const [loading, setLoading] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submissionError, setSubmissionError] = useState('');
  const [resultData, setResultData] = useState([]);
  const [activeTab, setActiveTab] = useState('input');

  const handleFormSubmit = async (data) => {
    try {
      setLoading(true);
      setSubmissionResult(null);
      setSubmissionError('');

      const response = await fetch(`${API_BASE_URL}/api/portfolio/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: process.env.NODE_ENV === 'production' ? 'include' : 'same-origin',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit portfolios');
      }

      const results = await response.json();
      setResultData(results.results);
      setSubmissionResult('Portfolios calculated successfully!');
      setActiveTab('results');
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

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        id="portfolio-main-tabs"
        className="mb-4"
      >
        <Tab eventKey="input" title="Portfolio Input">
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
        </Tab>

        <Tab
          eventKey="results"
          title="Results"
          disabled={!resultData || resultData.length === 0}
        >
          {resultData && resultData.length > 0 && (
            <CombinedPortfolioResults 
              portfolios={resultData}
              apiBaseUrl={API_BASE_URL}  // Pass API base URL to child component
            />
          )}
        </Tab>
      </Tabs>
    </Container>
  );
};

export default PortfolioIndex;