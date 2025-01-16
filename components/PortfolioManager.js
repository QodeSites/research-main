// PortfolioManager.js 
import React, { useState, useCallback } from 'react';
import {
  Form,
  Button,
  Alert,
  Tab,
  Tabs
} from 'react-bootstrap';
import PortfolioCalculatorForm from './PortfolioCalculatorForm';
import moment from 'moment';
import PropTypes from 'prop-types';
import { FileUpload } from './FileUpload';
// import { FileUpload } from './FileUpload'; // Uncomment if using FileUpload

const PortfolioManager = ({
  onSubmit,
  loading = false,
  columns = []
}) => {
  const [portfolios, setPortfolios] = useState([{
    id: Date.now(),
    name: 'Portfolio 1',
    start_date: null,
    end_date: null,
    invest_amount: '',
    cash_percent: '',
    frequency: 'yearly',
    selected_systems: [],
    selected_debtfunds: [],
    benchmark: '',
    error: ''
  }]);

  const [activeKey, setActiveKey] = useState('Portfolio-1');
  const [globalError, setGlobalError] = useState('');
  const [customColumns, setCustomColumns] = useState([]); // Initialize as empty array

  // Handle updating columns when a new CSV is uploaded
  const handleColumnsUpdate = useCallback((newColumns) => {
    setCustomColumns(prevColumns => {
      // Merge new columns with existing ones, removing duplicates
      const combinedColumns = [...new Set([...prevColumns, ...newColumns])];
      return combinedColumns;
    });
  }, []);

  // Combine initial columns with custom columns
  const getAllColumns = useCallback(() => {
    return [...new Set([...columns, ...customColumns])];
  }, [columns, customColumns]);

  const handleSelect = (k) => {
    if (k === 'add-portfolio') {
      handleAddPortfolio();
    } else {
      setActiveKey(k);
    }
  };

  const handlePortfolioChange = useCallback((index, updatedPortfolio) => {
    setPortfolios(prevPortfolios => {
      const newPortfolios = [...prevPortfolios];
      newPortfolios[index] = {
        ...newPortfolios[index],
        ...updatedPortfolio
      };

      // If the first portfolio's dates are updated, sync them to others
      if (index === 0) {
        const { start_date, end_date } = updatedPortfolio;
        newPortfolios.forEach((portfolio, pIndex) => {
          if (pIndex !== 0) {
            newPortfolios[pIndex].start_date = start_date;
            newPortfolios[pIndex].end_date = end_date;
          }
        });
      }

      return newPortfolios;
    });
  }, []);

  const handleAddPortfolio = useCallback(() => {
    const newIndex = portfolios.length + 1;
    const newPortfolio = {
      id: Date.now(),
      name: `Portfolio ${newIndex}`,
      start_date: portfolios[0].start_date,
      end_date: portfolios[0].end_date,
      invest_amount: '',
      cash_percent: '',
      frequency: 'yearly',
      selected_systems: [],
      selected_debtfunds: [],
      benchmark: '',
      error: ''
    };
    setPortfolios(prevPortfolios => [
      ...prevPortfolios,
      newPortfolio
    ]);
    // Automatically switch to the new portfolio's tab
    setActiveKey(`Portfolio-${newIndex}`);
  }, [portfolios]);

  const handleRemovePortfolio = useCallback((indexToRemove) => {
    setPortfolios(prevPortfolios => {
      if (prevPortfolios.length === 1) {
        return prevPortfolios;
      }
      // After removing, switch to the previous tab if we're removing the active one
      const currentTabNumber = parseInt(activeKey.split('-')[1]);
      if (indexToRemove === currentTabNumber - 1) {
        setActiveKey(`Portfolio-${currentTabNumber - 1}`);
      }
      return prevPortfolios.filter((_, index) => index !== indexToRemove);
    });
  }, [activeKey]);

  // Validation Function
  const validatePortfolios = useCallback(() => {
    let isValid = true;

    setPortfolios(prevPortfolios =>
      prevPortfolios.map((portfolio, pIndex) => {
        let error = '';

        const totalWeightage = [...portfolio.selected_systems]
          .reduce((sum, item) => sum + (parseFloat(item.weightage) || 0), 0);

        if (Math.abs(totalWeightage - 100) > 0.1) {
          error = error ? `${error} Weightages must sum to 100%.` : 'Weightages must sum to 100%.';
          isValid = false;
        }

        return { ...portfolio, error };
      })
    );

    return isValid;
  }, []);


  // Handle Form Submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setGlobalError('');

    if (!validatePortfolios()) {
      setGlobalError('Please fix the errors in the portfolios before submitting.');
      return;
    }

    try {
      const submittedData = portfolios.map(portfolio => ({
        name: portfolio.name,
        start_date: portfolio.start_date ? moment(portfolio.start_date).format('DD-MM-YYYY') : null,
        end_date: portfolio.end_date ? moment(portfolio.end_date).format('DD-MM-YYYY') : null,
        invest_amount: parseFloat(portfolio.invest_amount),
        cash_percent: portfolio.cash_percent ? parseFloat(portfolio.cash_percent) : 0,
        frequency: portfolio.frequency,
        benchmark: portfolio.benchmark,
        selected_systems: portfolio.selected_systems.map(system => ({
          system: system.system,
          weightage: parseFloat(system.weightage) || 0,
          leverage: parseFloat(system.leverage) || 1
        })),
        selected_debtfunds: portfolio.selected_debtfunds.map(debtfund => ({
          debtfund: debtfund.debtfund,
          weightage: parseFloat(debtfund.weightage) || 0,
          leverage: parseFloat(debtfund.leverage) || 1
        }))
      }));

      await onSubmit({ portfolios: submittedData });
    } catch (error) {
      console.error('Error submitting portfolios:', error);
      setGlobalError('Failed to submit portfolios. Please try again.');
    }
  }, [portfolios, onSubmit, validatePortfolios]);

  return (
    <div className="px-6">
      <Form onSubmit={handleSubmit} className="my-4">
        {globalError && (
          <Alert variant="danger" className="mb-4">
            {globalError}
          </Alert>
        )}

        <Tabs activeKey={activeKey} onSelect={handleSelect} id="controlled-tab-example">
          {portfolios.map((portfolio, index) => (
            <Tab
              eventKey={`Portfolio-${index + 1}`}
              title={portfolio.name || `Portfolio ${index + 1}`}
              key={portfolio.id}
            >
              <FileUpload
                onColumnsUpdate={handleColumnsUpdate}
                onUploadSuccess={(data) => handleFileUploadSuccess(data, index)}
                onUploadError={(error) => handleFileUploadError(error, index)}
              />
              <PortfolioCalculatorForm
                key={portfolio.id}
                index={index}
                portfolioData={{
                  ...portfolio,
                  benchmark: index === 0 ? portfolio.benchmark : portfolios[0].benchmark, // Sync benchmark from the first portfolio
                }}
                onChange={handlePortfolioChange}
                onRemove={handleRemovePortfolio}
                columns={getAllColumns()}
                isRemoveDisabled={portfolios.length === 1}
                isFirstPortfolio={index === 0}
                isBenchmarkDisabled={index !== 0} // Disable for all portfolios except the first
                masterStartDate={portfolios[0].start_date}
                masterEndDate={portfolios[0].end_date}
              />
            </Tab>
          ))}
          <Tab eventKey="add-portfolio" title={<span>+ Add Portfolio</span>} />
        </Tabs>



        <div className="d-flex justify-content-end align-items-center mb-4">
          <Button
            type="submit"
            variant="success"
            disabled={loading}
            className="px-4"
          >
            {loading ? 'Calculating...' : 'Calculate All Portfolios'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

PortfolioManager.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  columns: PropTypes.array
};

export default PortfolioManager;
