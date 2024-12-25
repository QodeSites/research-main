import React, { useState } from 'react';
import PortfolioManager from 'components/PortfolioManager';
import { Container, Spinner, Alert, Tab, Tabs } from 'react-bootstrap';
import PortfolioResult from 'components/PortfolioResult';
import PortfolioComparison from 'components/PortfolioComparison';

const index = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submissionError, setSubmissionError] = useState('');
  const [resultData, setResultData] = useState([]);
  const [activeTab, setActiveTab] = useState('input'); // 'input' or 'results'
  const [selectedPortfolioIndex, setSelectedPortfolioIndex] = useState(0);

  // Handler for form submission
  const handleFormSubmit = async (data) => {
    try {
      setLoading(true);
      setSubmissionResult(null);
      setSubmissionError('');

      const response = await fetch('http://192.168.0.106:5080/api/portfolio/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit portfolios');
      }

      const results = await response.json();
      console.log('API Response:', results);

      setResultData(results.results);
      setSubmissionResult('Portfolios calculated successfully!');
      setActiveTab('results'); // Switch to results tab after successful calculation
      setSelectedPortfolioIndex(0); // Show first portfolio result by default
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionError(error.message || 'An error occurred while submitting portfolios');
    } finally {
      setLoading(false);
    }
  };

  // Handler for portfolio tab selection
  const handlePortfolioSelect = (portfolioIndex) => {
    setSelectedPortfolioIndex(portfolioIndex);
  };

  // Handler for main tab selection
  const handleTabSelect = (tab) => {
    setActiveTab(tab);
  };

  return (
    <Container className="my-5">
      <h1 className="text-center mb-4">Portfolio Calculator</h1>

      {/* Alerts */}
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

      {/* Main Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={handleTabSelect}
        id="portfolio-main-tabs"
        className="mb-4"
      >
        {/* Input Tab */}
        <Tab eventKey="input" title="Portfolio Input">
          <PortfolioManager
            onSubmit={handleFormSubmit}
            loading={loading}
            columns={['Custom1', 'Custom2']}
          />

          {/* Loading Spinner */}
          {loading && (
            <div className="text-center mt-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Calculating portfolios...</p>
            </div>
          )}
        </Tab>

        {/* Results Tab */}

        <Tab
          eventKey="results"
          title="Results"
          disabled={!resultData || resultData.length === 0}
        >
          {resultData && resultData.length > 0 && (
            <div>
              {/* Portfolio Results Navigation */}
              <Tabs
                activeKey={selectedPortfolioIndex}
                onSelect={handlePortfolioSelect}
                id="portfolio-results-tabs"
                className="mb-4"
              >
                <Tab
                  eventKey="summary"
                  title="Summary"
                  disabled={!resultData || resultData.length === 0}
                >
                  {resultData && resultData.length > 0 && (
                    <PortfolioComparison portfolios={resultData} />
                  )}
                </Tab>
                {resultData.map((_, index) => (
                  <Tab
                    key={index}
                    eventKey={index}
                    title={`Portfolio ${index + 1}`}
                  >
                    <PortfolioResult
                      portfolio={resultData[index]}
                      index={index}
                    />
                  </Tab>
                ))}
              </Tabs>
            </div>
          )}
        </Tab>
      </Tabs>
    </Container>
  );
};

export default index;