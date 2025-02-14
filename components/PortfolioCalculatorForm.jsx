// PortfolioCalculatorForm.js
import React from 'react';
import {
  Form,
  Button,
  Row,
  Col,
  InputGroup,
  ButtonGroup,
  ToggleButton,
  Alert
} from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import Multiselect from 'multiselect-react-dropdown';
import "react-datepicker/dist/react-datepicker.css";
import moment from 'moment';
import PropTypes from 'prop-types';

const STRATEGIES = [
  { label: "Qode All Weather", value: "QAW", group: "Qode Strategies" },
  { label: "Qode Growth Fund", value: "QGF", group: "Qode Strategies" },
  { label: "Qode All Weather - 1", value: "QAW1", group: "Qode Strategies" },
  { label: "Qode Tactical Fund", value: "QVF", group: "Qode Strategies" },
  { label: "NSE Momentum Index", value: "NSE Momentum Index", group: "Index" },
  { label: "Gold Bees", value: "Gold Bees", group: "Index" },
  { label: "NIFTY METAL", value: "NIFTY METAL", group: "Index" },
  { label: "NIFTY INFRA", value: "NIFTY INFRA", group: "Index" },
  { label: "NIFTY MNC", value: "NIFTY MNC", group: "Index" },
  { label: "NIFTY ENERGY", value: "NIFTY ENERGY", group: "Index" },
  { label: "NIFTY CONSR DURBL", value: "NIFTY CONSR DURBL", group: "Index" },
  { label: "NIFTY CONSUMPTION", value: "NIFTY CONSUMPTION", group: "Index" },
  { label: "NIFTY 50", value: "NIFTY 50", group: "Index" },
  { label: "NIFTY IT", value: "NIFTY IT", group: "Index" },
  { label: "NIFTY COMMODITIES", value: "NIFTY COMMODITIES", group: "Index" },
  { label: "NIFTY AUTO", value: "NIFTY AUTO", group: "Index" },
  { label: "NIFTY PVT BANK", value: "NIFTY PVT BANK", group: "Index" },
  { label: "NIFTY MICROCAP250", value: "NIFTY MICROCAP250", group: "Index" },
  { label: "BSE500", value: "BSE500", group: "Index" },
  { label: "NIFTY MEDIA", value: "NIFTY MEDIA", group: "Index" },
  { label: "NIFTY CPSE", value: "NIFTY CPSE", group: "Index" },
  { label: "NIFTY PSU BANK", value: "NIFTY PSU BANK", group: "Index" },
  { label: "NIFTY PHARMA", value: "NIFTY PHARMA", group: "Index" },
  { label: "NIFTY BANK", value: "NIFTY BANK", group: "Index" },
  { label: "NIFTY FMCG", value: "NIFTY FMCG", group: "Index" },
  { label: "NIFTY HEALTHCARE", value: "NIFTY HEALTHCARE", group: "Index" },
  { label: "NIFTY SMLCAP 250", value: "NIFTY SMLCAP 250", group: "Index" },
  { label: "NIFTY MIDCAP 100", value: "NIFTY MIDCAP 100", group: "Index" },
  { label: "NIFTY REALTY", value: "NIFTY REALTY", group: "Index" },
  {
    label: "NSE Momentum + Qode (Puts)",
    value: "Equity + Puts",
    group: "Qode Derivatives Portfolio",
  },
  {
    label: "NSE Momentum + Qode (Puts + Calls)",
    value: "Equity + Puts + Calls",
    group: "Qode Derivatives Portfolio",
  },
];

const DEBTFUNDS = [
  { label: "QGFLong", value: "QGFLong" },
  { label: "Shortflat", value: "Shortflat" },
  { label: "LongOpt", value: "LongOpt" },
  { label: "QGF+Derivatives", value: "QGF+Derivatives" },
  { label: "QGF", value: "QGF" },
  { label: "QAW", value: "QAW" },
  { label: "QVF", value: "QVF" },
  { label: "Qode All Weather", value: "QAW", group: "Qode Strategies" },
  { label: "Qode Growth Fund", value: "QGF", group: "Qode Strategies" },
  { label: "Qode All Weather - 1", value: "QAW1", group: "Qode Strategies" },
  { label: "Qode Tactical Fund", value: "QVF", group: "Qode Strategies" },
  { label: "NSE Momentum Index", value: "NSE Momentum Index", group: "Index" },
  { label: "Gold Bees", value: "Gold Bees", group: "Index" },
  { label: "NIFTY METAL", value: "NIFTY METAL", group: "Index" },
  { label: "NIFTY INFRA", value: "NIFTY INFRA", group: "Index" },
  { label: "NIFTY MNC", value: "NIFTY MNC", group: "Index" },
  { label: "NIFTY ENERGY", value: "NIFTY ENERGY", group: "Index" },
  { label: "NIFTY CONSR DURBL", value: "NIFTY CONSR DURBL", group: "Index" },
  { label: "NIFTY CONSUMPTION", value: "NIFTY CONSUMPTION", group: "Index" },
  { label: "NIFTY 50", value: "NIFTY 50", group: "Index" },
  { label: "NIFTY IT", value: "NIFTY IT", group: "Index" },
  { label: "NIFTY COMMODITIES", value: "NIFTY COMMODITIES", group: "Index" },
  { label: "NIFTY AUTO", value: "NIFTY AUTO", group: "Index" },
  { label: "NIFTY PVT BANK", value: "NIFTY PVT BANK", group: "Index" },
  { label: "NIFTY MICROCAP250", value: "NIFTY MICROCAP250", group: "Index" },
  { label: "BSE500", value: "BSE500", group: "Index" },
  { label: "NIFTY MEDIA", value: "NIFTY MEDIA", group: "Index" },
  { label: "NIFTY CPSE", value: "NIFTY CPSE", group: "Index" },
  { label: "NIFTY PSU BANK", value: "NIFTY PSU BANK", group: "Index" },
  { label: "NIFTY PHARMA", value: "NIFTY PHARMA", group: "Index" },
  { label: "NIFTY BANK", value: "NIFTY BANK", group: "Index" },
  { label: "NIFTY FMCG", value: "NIFTY FMCG", group: "Index" },
  { label: "NIFTY HEALTHCARE", value: "NIFTY HEALTHCARE", group: "Index" },
  { label: "NIFTY SMLCAP 250", value: "NIFTY SMLCAP 250", group: "Index" },
  { label: "NIFTY MIDCAP 100", value: "NIFTY MIDCAP 100", group: "Index" },
  { label: "NIFTY REALTY", value: "NIFTY REALTY", group: "Index" },
  {
    label: "NSE Momentum + Qode (Puts)",
    value: "Equity + Puts",
    group: "Qode Derivatives Portfolio",
  },
  {
    label: "NSE Momentum + Qode (Puts + Calls)",
    value: "Equity + Puts + Calls",
    group: "Qode Derivatives Portfolio",
  },
];

const PortfolioCalculatorForm = ({
  index,
  portfolioData = {},
  onChange,
  onRemove,
  columns = [],
  isRemoveDisabled = false,
  isFirstPortfolio = false,
  masterStartDate = null,
  masterEndDate = null,
  isBenchmarkDisabled = false,
}) => {
  // Handle form data changes
  const handleInputChange = (field, value) => {
    if (field === "invest_amount") {
      // Remove commas for processing
      const rawValue = value.replace(/,/g, '');
      if (!isNaN(rawValue)) {
        onChange(index, { ...portfolioData, [field]: rawValue });
      }
    } else {
      onChange(index, { ...portfolioData, [field]: value });
    }
  };

  // Combine predefined strategies with custom columns
  const customColumnList = columns.map(column => ({
    label: column.trim(),
    value: column.trim(),
    group: "Custom Columns",
    isJsonColumn: true
  }));

  const combinedStrategies = [...STRATEGIES, ...customColumnList].map(strategy => ({
    ...strategy,
    name: strategy.isJsonColumn ? `📊 ${strategy.label}` : strategy.label
  }));

  const combinedDebtFunds = [...DEBTFUNDS, ...customColumnList].map(fund => ({
    ...fund,
    name: fund.isJsonColumn ? `📊 ${fund.label}` : fund.label
  }));

  // Updated to use decimal weights with 6 decimal places
  const handleStrategySelect = (selectedList) => {
    if (selectedList.length === 0) {
      onChange(index, { ...portfolioData, selected_systems: [] });
      return;
    }
    const weight = 100 / selectedList.length;
    const updatedSystems = selectedList.map((item) => ({
      system: item.value,
      weightage: parseFloat(weight.toFixed(6)),
      leverage: '1',
      column: '',
    }));
    onChange(index, { ...portfolioData, selected_systems: updatedSystems });
  };

  // Updated to use decimal weights for debt funds with 6 decimals as well
  const handleDebtFundSelect = (selectedList) => {
    if (selectedList.length === 0) {
      onChange(index, { ...portfolioData, selected_debtfunds: [] });
      return;
    }
    const weight = 100 / selectedList.length;
    const updatedDebtFunds = selectedList.map((item) => ({
      debtfund: item.value,
      weightage: parseFloat(weight.toFixed(6)),
      leverage: '1'
    }));
    onChange(index, { ...portfolioData, selected_debtfunds: updatedDebtFunds });
  };

  // New: Button handler to add all custom strategies to the current selection
  const handleSelectAllCustomStrategies = () => {
    const currentSelected = portfolioData.selected_systems || [];
    const currentSelectedValues = currentSelected.map(s => s.system);
    // Get all custom strategies from the combined list
    const customStrategies = combinedStrategies.filter(item => item.group === "Custom Columns");
    // Filter out custom ones that are not already selected
    const newCustomStrategies = customStrategies.filter(item => !currentSelectedValues.includes(item.value));
    // Convert new custom strategies into the selection format
    const newCustomSelections = newCustomStrategies.map(item => ({
      system: item.value,
      weightage: 0, // will be recalculated below
      leverage: '1',
      column: ''
    }));
    // Merge current selection with the new custom selections
    const unionSelection = [...currentSelected, ...newCustomSelections];
    const weight = 100 / unionSelection.length;
    const updatedSystems = unionSelection.map(s => ({
      system: s.system,
      weightage: parseFloat(weight.toFixed(6)),
      leverage: '1',
      column: ''
    }));
    onChange(index, { ...portfolioData, selected_systems: updatedSystems });
  };

  const handleSystemInputChange = (systemIndex, field, value) => {
    const updatedSystems = [...(portfolioData.selected_systems || [])];
    if (field === 'weightage') {
      let newWeight = parseFloat(value);
      if (isNaN(newWeight)) newWeight = 0;
      newWeight = Math.min(Math.max(newWeight, 0), 100);
      updatedSystems[systemIndex] = {
        ...updatedSystems[systemIndex],
        weightage: newWeight,
      };
    } else {
      updatedSystems[systemIndex] = {
        ...updatedSystems[systemIndex],
        [field]: value,
      };
    }
    onChange(index, { ...portfolioData, selected_systems: updatedSystems });
  };

  const handleDebtFundInputChange = (debtFundIndex, field, value) => {
    const updatedDebtFunds = [...(portfolioData.selected_debtfunds || [])];
    if (field === 'weightage') {
      let newWeight = parseFloat(value);
      if (isNaN(newWeight)) newWeight = 0;
      newWeight = Math.min(Math.max(newWeight, 0), 100);
      updatedDebtFunds[debtFundIndex] = {
        ...updatedDebtFunds[debtFundIndex],
        weightage: newWeight,
      };
    } else {
      updatedDebtFunds[debtFundIndex] = {
        ...updatedDebtFunds[debtFundIndex],
        [field]: value,
      };
    }
    onChange(index, { ...portfolioData, selected_debtfunds: updatedDebtFunds });
  };

  const frequencies = [
    { name: 'No Rebalance', value: 'no' },
    { name: 'Daily', value: 'daily' },
    { name: 'Weekly', value: 'weekly' },
    { name: 'Monthly', value: 'monthly' },
    { name: 'Yearly', value: 'yearly' }
  ];

  // Extract benchmark options (indices)
  const benchmarkOptions = STRATEGIES.filter(
    (strategy) => strategy.group === "Index"
  );

  // Compute total weightages for display (using 6 decimals)
  const totalStrategiesWeight = (portfolioData.selected_systems || [])
    .reduce((sum, system) => sum + (parseFloat(system.weightage) || 0), 0)
    .toFixed(6);

  const totalDebtFundsWeight = (portfolioData.selected_debtfunds || [])
    .reduce((sum, fund) => sum + (parseFloat(fund.weightage) || 0), 0)
    .toFixed(6);

  return (
    <div className='border p-4 mb-4'>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>{portfolioData.name || `Portfolio ${index + 1}`}</h5>
        <Button
          variant="danger"
          onClick={() => onRemove(index)}
          disabled={isRemoveDisabled}
        >
          {isRemoveDisabled ? 'Cannot Remove' : 'Remove'}
        </Button>
      </div>
      {portfolioData.error && <Alert variant="danger">{portfolioData.error}</Alert>}

      {/* Portfolio Name */}
      <Form.Group className="mb-4">
        <Form.Label>Name *</Form.Label>
        <Form.Control
          type="text"
          value={portfolioData.name || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter portfolio name"
          required
        />
      </Form.Group>

      {/* Choose Strategies */}
      <Form.Group className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <Form.Label>Choose strategies *</Form.Label>
          <Button variant="secondary" size="sm" onClick={handleSelectAllCustomStrategies}>
            Select All Custom Strategies
          </Button>
        </div>
        <Multiselect
          options={combinedStrategies}
          displayValue="name"
          onSelect={handleStrategySelect}
          onRemove={handleStrategySelect}
          groupBy="group"
          showCheckbox={true}
          placeholder="Select strategies"
          // Pass selectedValues to keep the multiselect in sync with portfolioData
          selectedValues={combinedStrategies.filter(item =>
            (portfolioData.selected_systems || []).some(selected => selected.system === item.value)
          )}
          style={{
            chips: { background: 'var(--bs-primary)' },
            searchBox: { borderRadius: '0.375rem' }
          }}
        />

        {portfolioData.selected_systems && portfolioData.selected_systems.map((system, sIndex) => (
          <Row key={sIndex} className="my-3 align-items-center">
            <Col xs={12} md={4}>
              <Form.Label>{system.system}</Form.Label>
            </Col>
            <Col xs={12} md={4}>
              <InputGroup>
                <Form.Control
                  type="number"
                  min="0"
                  max="100"
                  step="0.000001"
                  placeholder="Weightage"
                  value={system.weightage}
                  onChange={(e) => handleSystemInputChange(sIndex, 'weightage', e.target.value)}
                />
                <InputGroup.Text>%</InputGroup.Text>
              </InputGroup>
            </Col>
            <Col xs={12} md={4}>
              <Form.Control
                type="number"
                min="0"
                step="1"
                placeholder="Leverage"
                value={system.leverage}
                onChange={(e) => handleSystemInputChange(sIndex, 'leverage', e.target.value)}
              />
            </Col>
          </Row>
        ))}
        {portfolioData.selected_systems && portfolioData.selected_systems.length > 0 && (
          <Alert variant="info">
            Total strategies weightage: {totalStrategiesWeight}%
          </Alert>
        )}
      </Form.Group>

      {/* Choose Debt Funds */}
      <Form.Group className="mb-4">
        <Form.Label>Choose Debt Funds</Form.Label>
        <Multiselect
          options={combinedDebtFunds}
          displayValue="name"
          onSelect={handleDebtFundSelect}
          onRemove={handleDebtFundSelect}
          showCheckbox={true}
          placeholder="Select debt funds"
          style={{
            chips: { background: 'var(--bs-primary)' },
            searchBox: { borderRadius: '0.375rem' }
          }}
        />

        {portfolioData.selected_debtfunds && portfolioData.selected_debtfunds.map((debtfund, dIndex) => (
          <Row key={dIndex} className="my-3 align-items-center">
            <Col xs={12} md={4}>
              <Form.Label>{debtfund.debtfund}</Form.Label>
            </Col>
            <Col xs={12} md={4}>
              <InputGroup>
                <Form.Control
                  type="number"
                  min="0"
                  max="100"
                  step="0.000001" 
                  placeholder="Weightage"
                  value={debtfund.weightage}
                  onChange={(e) => handleDebtFundInputChange(dIndex, 'weightage', e.target.value)}
                />
                <InputGroup.Text>%</InputGroup.Text>
              </InputGroup>
            </Col>
            <Col xs={12} md={4}>
              <Form.Control
                type="number"
                min="0"
                step="1"
                placeholder="Leverage"
                value={debtfund.leverage}
                onChange={(e) => handleDebtFundInputChange(dIndex, 'leverage', e.target.value)}
              />
            </Col>
          </Row>
        ))}
        {portfolioData.selected_debtfunds && portfolioData.selected_debtfunds.length > 0 && (
          <Alert variant="info">
            Total debt funds weightage: {totalDebtFundsWeight}%
          </Alert>
        )}
      </Form.Group>

      {/* Benchmark Selection */}
      <Form.Group className="mb-4">
        <Form.Label>Benchmark</Form.Label>
        <Form.Control
          as="select"
          value={portfolioData.benchmark || ""}
          onChange={(e) => handleInputChange("benchmark", e.target.value)}
          disabled={isBenchmarkDisabled}
        >
          <option value="" disabled>
            Select a benchmark
          </option>
          {benchmarkOptions.map((benchmark) => (
            <option key={benchmark.value} value={benchmark.value}>
              {benchmark.label}
            </option>
          ))}
        </Form.Control>
      </Form.Group>

      {/* Investment Period */}
      <Form.Group className="mb-4">
        <Form.Label>Investment Period *</Form.Label>
        <Row>
          <Col xs={12} md={6}>
            <DatePicker
              selected={isFirstPortfolio ? portfolioData.start_date : masterStartDate}
              onChange={date => isFirstPortfolio && handleInputChange('start_date', date)}
              selectsStart
              startDate={isFirstPortfolio ? portfolioData.start_date : masterStartDate}
              endDate={isFirstPortfolio ? portfolioData.end_date : masterEndDate}
              minDate={new Date('2005-04-01')}
              maxDate={new Date('2024-10-01')}
              dateFormat="dd-MM-yyyy"
              className="form-control"
              placeholderText="Start Date"
              disabled={!isFirstPortfolio}
            />
          </Col>
          <Col xs={12} md={6}>
            <DatePicker
              selected={isFirstPortfolio ? portfolioData.end_date : masterEndDate}
              onChange={date => isFirstPortfolio && handleInputChange('end_date', date)}
              selectsEnd
              startDate={isFirstPortfolio ? portfolioData.start_date : masterStartDate}
              endDate={isFirstPortfolio ? portfolioData.end_date : masterEndDate}
              minDate={isFirstPortfolio ? portfolioData.start_date : masterStartDate}
              dateFormat="dd-MM-yyyy"
              className="form-control"
              placeholderText="End Date"
              disabled={!isFirstPortfolio}
            />
          </Col>
        </Row>
      </Form.Group>

      {/* Investment Amount & Cash Percentage */}
      <Form.Group className="mb-4">
        <Form.Label>Investment Amount</Form.Label>
        <Row>
          <Col xs={12} md={6}>
            <InputGroup>
              <InputGroup.Text>₹</InputGroup.Text>
              <Form.Control
                type="text"
                value={new Intl.NumberFormat('en-IN').format(portfolioData.invest_amount || '')}
                onChange={(e) => handleInputChange('invest_amount', e.target.value)}
                placeholder="Investment Amount"
              />
            </InputGroup>
          </Col>
          <Col xs={12} md={6}>
            <InputGroup>
              <Form.Control
                type="number"
                min="0"
                max="100"
                step="1"
                value={portfolioData.cash_percent}
                onChange={e => handleInputChange('cash_percent', e.target.value)}
                placeholder="Cash Percentage"
              />
              <InputGroup.Text>%</InputGroup.Text>
            </InputGroup>
          </Col>
        </Row>
      </Form.Group>

      {/* Rebalance Frequency */}
      <Form.Group className="mb-4">
        <Form.Label>Rebalance Frequency *</Form.Label>
        <Row>
          <Col>
            <ButtonGroup className="w-100">
              {frequencies.map((freq) => (
                <ToggleButton
                  key={freq.value}
                  id={`freq-${freq.value}-${index}`}
                  type="radio"
                  variant={portfolioData.frequency === freq.value ? 'primary' : 'outline-primary'}
                  name={`frequency-${index}`}
                  value={freq.value}
                  checked={portfolioData.frequency === freq.value}
                  onChange={e => handleInputChange('frequency', e.target.value)}
                >
                  {freq.name}
                </ToggleButton>
              ))}
            </ButtonGroup>
          </Col>
        </Row>
      </Form.Group>
    </div>
  );
};

PortfolioCalculatorForm.propTypes = {
  index: PropTypes.number.isRequired,
  portfolioData: PropTypes.shape({
    name: PropTypes.string,
    selected_systems: PropTypes.arrayOf(PropTypes.shape({
      system: PropTypes.string,
      weightage: PropTypes.number,
      leverage: PropTypes.string,
      column: PropTypes.string
    })),
    selected_debtfunds: PropTypes.arrayOf(PropTypes.shape({
      debtfund: PropTypes.string,
      weightage: PropTypes.number,
      leverage: PropTypes.string
    })),
    benchmark: PropTypes.string,
    start_date: PropTypes.instanceOf(Date),
    end_date: PropTypes.instanceOf(Date),
    invest_amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    cash_percent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    frequency: PropTypes.string,
    error: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  columns: PropTypes.array.isRequired,
  isRemoveDisabled: PropTypes.bool,
  isFirstPortfolio: PropTypes.bool,
  masterStartDate: PropTypes.instanceOf(Date),
  masterEndDate: PropTypes.instanceOf(Date),
  isBenchmarkDisabled: PropTypes.bool
};

export default PortfolioCalculatorForm;
