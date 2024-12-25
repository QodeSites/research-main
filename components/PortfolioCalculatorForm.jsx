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
];

const PortfolioCalculatorForm = ({ 
  index,
  portfolioData = {}, // Provide a default empty object
  onChange, 
  onRemove, 
  columns = [],
  isRemoveDisabled = false
}) => {
  
  // Handle form data changes
  const handleInputChange = (field, value) => {
    onChange(index, { ...portfolioData, [field]: value });
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

  const combinedDebtFunds = [...DEBTFUNDS].map(fund => ({
    ...fund,
    name: fund.label
  }));

  const calculateEqualWeightage = (count) => {
    return count === 0 ? '' : (100 / count).toFixed(1);
  };

  const handleStrategySelect = (selectedList) => {
    const equalWeightage = calculateEqualWeightage(selectedList.length);
    const updatedSystems = selectedList.map(item => ({
      system: item.value,
      weightage: equalWeightage,
      leverage: '1',
      column: ''
    }));
    onChange(index, { ...portfolioData, selected_systems: updatedSystems });
  };

  const handleDebtFundSelect = (selectedList) => {
    const equalWeightage = calculateEqualWeightage(selectedList.length);
    const updatedDebtFunds = selectedList.map(item => ({
      debtfund: item.value,
      weightage: equalWeightage,
      leverage: '1'
    }));
    onChange(index, { ...portfolioData, selected_debtfunds: updatedDebtFunds });
  };

  const handleSystemInputChange = (systemIndex, field, value) => {
    const updatedSystems = [...(portfolioData.selected_systems || [])];
    updatedSystems[systemIndex] = {
      ...updatedSystems[systemIndex],
      [field]: value
    };
    onChange(index, { ...portfolioData, selected_systems: updatedSystems });
  };

  const handleDebtFundInputChange = (debtFundIndex, field, value) => {
    const updatedDebtFunds = [...(portfolioData.selected_debtfunds || [])];
    updatedDebtFunds[debtFundIndex] = {
      ...updatedDebtFunds[debtFundIndex],
      [field]: value
    };
    onChange(index, { ...portfolioData, selected_debtfunds: updatedDebtFunds });
  };

  const frequencies = [
    { name: 'No Rebalance', value: 'no' },
    { name: 'Daily', value: 'daily' },
    { name: 'Weekly', value: 'weekly' },
    { name: 'Monthly', value: 'monthly' },
    { name: 'Yearly', value: 'yearly' }
  ];

  return (
    <div className='border p-4 mb-4'>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Portfolio {index + 1}</h5>
        <Button 
          variant="danger" 
          onClick={() => onRemove(index)}
          disabled={isRemoveDisabled} // Use the prop here
        >
          {isRemoveDisabled ? 'Cannot Remove' : 'Remove'}
        </Button>
      </div>
      {portfolioData.error && <Alert variant="danger">{portfolioData.error}</Alert>}

      {/* Choose Strategies */}
      <Form.Group className="mb-4">
        <Form.Label>Choose strategies *</Form.Label>
        <Multiselect
          options={combinedStrategies}
          displayValue="name"
          onSelect={handleStrategySelect}
          onRemove={handleStrategySelect}
          groupBy="group"
          showCheckbox={true}
          placeholder="Select strategies"
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
                step="0.1"
                placeholder="Leverage"
                value={system.leverage}
                onChange={(e) => handleSystemInputChange(sIndex, 'leverage', e.target.value)}
              />
            </Col>
          </Row>
        ))}
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
                step="0.1"
                placeholder="Leverage"
                value={debtfund.leverage}
                onChange={(e) => handleDebtFundInputChange(dIndex, 'leverage', e.target.value)}
              />
            </Col>
          </Row>
        ))}
      </Form.Group>

      {/* Investment Period */}
      <Form.Group className="mb-4">
        <Form.Label>Investment Period *</Form.Label>
        <Row>
          <Col xs={12} md={6}>
            <DatePicker
              selected={portfolioData.start_date}
              onChange={date => handleInputChange('start_date', date)}
              selectsStart
              startDate={portfolioData.start_date}
              endDate={portfolioData.end_date}
              minDate={new Date('2005-04-01')}
              maxDate={new Date('2024-10-01')}
              dateFormat="dd-MM-yyyy"
              className="form-control"
              placeholderText="Start Date"
            />
          </Col>
          <Col xs={12} md={6}>
            <DatePicker
              selected={portfolioData.end_date}
              onChange={date => handleInputChange('end_date', date)}
              selectsEnd
              startDate={portfolioData.start_date}
              endDate={portfolioData.end_date}
              minDate={portfolioData.start_date}
              maxDate={new Date('2024-10-01')}
              dateFormat="dd-MM-yyyy"
              className="form-control"
              placeholderText="End Date"
            />
          </Col>
        </Row>
      </Form.Group>

      {/* Investment Amount & Cash Percentage */}
      <Form.Group className="mb-4">
        <Form.Label>Investment Details</Form.Label>
        <Row>
          <Col xs={12} md={6}>
            <InputGroup>
              <InputGroup.Text>₹</InputGroup.Text>
              <Form.Control
                type="number"
                min="0"
                value={portfolioData.invest_amount}
                onChange={e => handleInputChange('invest_amount', e.target.value)}
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
                step="0.1"
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
  portfolioData: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  columns: PropTypes.array.isRequired,
  isRemoveDisabled: PropTypes.bool
};

export default PortfolioCalculatorForm;
