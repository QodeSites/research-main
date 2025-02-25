// pages/ClientTracker.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Table, Button, Spinner, Alert, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { parse } from 'cookie';

const ClientTracker = () => {
    const [data, setData] = useState({
        portfolio_tracker: [],
        trailing_returns: []
    });
    const [benchmarkData, setBenchmarkData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeView, setActiveView] = useState('portfolio'); // "portfolio" or "returns"
    const [viewMode, setViewMode] = useState('table'); // "table" or "card"

    // Sorting configurations for both sections
    const [portfolioSortConfig, setPortfolioSortConfig] = useState({ key: null, direction: 'ascending' });
    const [returnsSortConfig, setReturnsSortConfig] = useState({ key: null, direction: 'ascending' });

    // Search queries and debounce states
    const [portfolioSearchQuery, setPortfolioSearchQuery] = useState("");
    const [returnsSearchQuery, setReturnsSearchQuery] = useState("");
    const portfolioSearchTimeout = useRef(null);
    const returnsSearchTimeout = useRef(null);
    const [debouncedPortfolioSearch, setDebouncedPortfolioSearch] = useState("");
    const [debouncedReturnsSearch, setDebouncedReturnsSearch] = useState("");

    // Utility to convert values to numbers
    const convertToNumber = (value) => {
        if (value === null || value === undefined || value === "NaN") return null;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch both ClientTracker and Indices data concurrently
                const [clientResponse, indicesResponse] = await Promise.all([
                    fetch('/api/ClientTracker'),
                    fetch('/api/indices')
                ]);

                if (!clientResponse.ok) {
                    throw new Error(`ClientTracker HTTP error! status: ${clientResponse.status}`);
                }
                if (!indicesResponse.ok) {
                    throw new Error(`Indices HTTP error! status: ${indicesResponse.status}`);
                }

                const clientResult = await clientResponse.json();
                const indicesResult = await indicesResponse.json();

                setData({
                    portfolio_tracker: processPortfolioData(clientResult.portfolio_tracker),
                    trailing_returns: processReturnsData(clientResult.trailing_returns)
                });

                // Extract NIFTY 50 data for benchmark
                const niftyData = indicesResult.data['NIFTY 50'];
                setBenchmarkData({
                    dataAsOf: indicesResult.dataAsOf,
                    ...niftyData
                });

                setLoading(false);
            } catch (err) {
                console.error('Fetch error:', err);
                setError('Failed to fetch data');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const processPortfolioData = (portfolioData) => {
        return portfolioData.map(item => ({
            ...item,
            portfolio_value: convertToNumber(item.portfolio_value),
            cash: convertToNumber(item.cash),
            cash_percentage: convertToNumber(item.cash_percentage)
        }));
    };

    const processReturnsData = (returnsData) => {
        return returnsData.map(item => ({
            ...item,
            d10: convertToNumber(item.d10),
            m1: convertToNumber(item.m1),
            m3: convertToNumber(item.m3),
            m6: convertToNumber(item.m6),
            y1: convertToNumber(item.y1),
            y2: convertToNumber(item.y2),
            y5: convertToNumber(item.y5),
            since_inception: convertToNumber(item.since_inception),
            mdd: convertToNumber(item.mdd),
            current_drawdown: convertToNumber(item.current_drawdown)
        }));
    };

    // Format numbers with Indian locale
    const formatNumber = (value, suffix = '') => {
        if (value === null || value === "NaN" || value === undefined) return "-";
        return Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + suffix;
    };

    // Color gradient for cash percentage
    const getCashPercentageColor = (percentage) => {
        const value = parseFloat(percentage);
        if (isNaN(value)) return '#FFFFFF';
        const idealLow = 0;
        const idealHigh = 15;
        if (value <= idealLow) {
            const ratio = idealLow === 0 ? 1 : value / idealLow;
            return `rgba(0, ${Math.round(100 + (155 * ratio))}, 0, 0.9)`;
        } else if (value <= idealHigh) {
            const ratio = (value - idealLow) / (idealHigh - idealLow);
            return `rgb(${Math.round(200 * ratio)}, ${Math.round(140 + (75 * ratio))}, 0 )`;
        } else if (value <= 30) {
            const ratio = (value - idealHigh) / (30 - idealHigh);
            return `rgba(255, ${Math.round(255 - (155 * ratio))}, 0, 0.6)`;
        } else if (value <= 50) {
            const ratio = (value - 30) / 20;
            return `rgba(255, ${Math.round(100 - (100 * ratio))}, 0, 0.6)`;
        } else {
            const ratio = Math.min((value - 50) / 50, 1);
            return `rgba(${Math.round(255 - (100 * ratio))}, 0, 0, 0.6)`;
        }
    };

    // Generic sort function
    const sortedData = (dataArray, sortConfig) => {
        if (!sortConfig.key) return dataArray;
        const sorted = [...dataArray].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return aValue - bValue;
            } else {
                return aValue.toString().localeCompare(bValue.toString());
            }
        });
        if (sortConfig.direction === 'descending') sorted.reverse();
        return sorted;
    };

    // Sorting handlers for portfolio and returns
    const requestPortfolioSort = (key) => {
        let direction = 'ascending';
        if (portfolioSortConfig.key === key && portfolioSortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setPortfolioSortConfig({ key, direction });
    };

    const requestReturnsSort = (key) => {
        let direction = 'ascending';
        if (returnsSortConfig.key === key && returnsSortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setReturnsSortConfig({ key, direction });
    };

    // Debounce search for portfolio
    useEffect(() => {
        clearTimeout(portfolioSearchTimeout.current);
        portfolioSearchTimeout.current = setTimeout(() => {
            setDebouncedPortfolioSearch(portfolioSearchQuery);
        }, 300);
        return () => clearTimeout(portfolioSearchTimeout.current);
    }, [portfolioSearchQuery]);

    // Debounce search for returns
    useEffect(() => {
        clearTimeout(returnsSearchTimeout.current);
        returnsSearchTimeout.current = setTimeout(() => {
            setDebouncedReturnsSearch(returnsSearchQuery);
        }, 300);
        return () => clearTimeout(returnsSearchTimeout.current);
    }, [returnsSearchQuery]);

    // Apply sorting and filtering to portfolio data
    const sortedPortfolioData = useMemo(() => sortedData(data.portfolio_tracker, portfolioSortConfig), [data.portfolio_tracker, portfolioSortConfig]);
    const filteredPortfolioData = useMemo(() => {
        return sortedPortfolioData.filter((item) => {
            const query = debouncedPortfolioSearch.toLowerCase();
            return (
                item.name.toLowerCase().includes(query) ||
                item.nuvama_code.toLowerCase().includes(query) ||
                item.account.toLowerCase().includes(query)
            );
        });
    }, [sortedPortfolioData, debouncedPortfolioSearch]);

    // Apply sorting and filtering to returns data
    const sortedReturnsData = useMemo(() => sortedData(data.trailing_returns, returnsSortConfig), [data.trailing_returns, returnsSortConfig]);
    const filteredReturnsData = useMemo(() => {
        return sortedReturnsData.filter((item) => {
            const query = debouncedReturnsSearch.toLowerCase();
            return (
                item.name.toLowerCase().includes(query) ||
                item.nuvama_code.toLowerCase().includes(query) ||
                item.account.toLowerCase().includes(query)
            );
        });
    }, [sortedReturnsData, debouncedReturnsSearch]);

    // Calculate portfolio totals
    const calculatePortfolioTotals = (data) => {
        return data.reduce((acc, item) => ({
            portfolio_value: (acc.portfolio_value || 0) + (convertToNumber(item.portfolio_value) || 0),
            cash: (acc.cash || 0) + (convertToNumber(item.cash) || 0),
            derivatives_percentage: (acc.derivatives_percentage || 0) + (convertToNumber(item.derivatives_percentage) || 0),
        }), {});
    };

    const portfolioTotals = useMemo(() => {
        const totals = calculatePortfolioTotals(filteredPortfolioData);
        const totalPortfolioValue = totals.portfolio_value || 0;
        return {
            ...totals,
            cash_percentage: totalPortfolioValue ? (totals.cash / totalPortfolioValue) * 100 : 0,
            derivatives_percentage: totals.derivatives_percentage / (filteredPortfolioData.length || 1),
        };
    }, [filteredPortfolioData]);

    // Calculate returns totals (averages)
    const calculateReturnsTotals = (data) => {
        const count = data.length;
        return data.reduce((acc, item) => ({
            d10: (acc.d10 || 0) + (convertToNumber(item.d10) || 0),
            m1: (acc.m1 || 0) + (convertToNumber(item.m1) || 0),
            m3: (acc.m3 || 0) + (convertToNumber(item.m3) || 0),
            m6: (acc.m6 || 0) + (convertToNumber(item.m6) || 0),
            y1: (acc.y1 || 0) + (convertToNumber(item.y1) || 0),
            y2: (acc.y2 || 0) + (convertToNumber(item.y2) || 0),
            y5: (acc.y5 || 0) + (convertToNumber(item.y5) || 0),
            since_inception: (acc.since_inception || 0) + (convertToNumber(item.since_inception) || 0),
            mdd: (acc.mdd || 0) + (convertToNumber(item.mdd) || 0),
            current_drawdown: (acc.current_drawdown || 0) + (convertToNumber(item.current_drawdown) || 0),
            count,
        }), {});
    };

    const returnsTotals = useMemo(() => {
        const totals = calculateReturnsTotals(filteredReturnsData);
        const count = totals.count || 1;
        return {
            d10: totals.d10 / count,
            m1: totals.m1 / count,
            m3: totals.m3 / count,
            m6: totals.m6 / count,
            y1: totals.y1 / count,
            y2: totals.y2 / count,
            y5: totals.y5 / count,
            since_inception: totals.since_inception / count,
            mdd: totals.mdd / count,
            current_drawdown: totals.current_drawdown / count,
        };
    }, [filteredReturnsData]);

    // Benchmark Table Component (unchanged)
    const BenchmarkTable = ({ benchmark }) => {
        if (!benchmark) return null;
        const {
            dataAsOf,
            '10D': d10,
            '1M': m1,
            '3M': m3,
            '6M': m6,
            '9M': m9,
            '1Y': y1,
            '2Y': y2,
            '3Y': y3,
            '4Y': y4,
            '5Y': y5,
            'Since Inception': sinceInception,
            'MDD': maxDrawdown,
            Drawdown: mdd
        } = benchmark;
        return (
            <div className="mb-4">
                <h5>Benchmark: NIFTY 50</h5>
                <p>Data As Of: {new Date(dataAsOf).toLocaleDateString('en-GB')}</p>
                <Table bordered striped hover responsive>
                    <thead>
                        <tr>
                            <th>Period</th>
                            <th>10D</th>
                            <th>1M</th>
                            <th>3M</th>
                            <th>6M</th>
                            <th>9M</th>
                            <th>1Y</th>
                            <th>2Y</th>
                            <th>3Y</th>
                            <th>4Y</th>
                            <th>5Y</th>
                            <th>Since Inception</th>
                            <th>MDD</th>
                            <th>Current Drawdown</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Return (%)</td>
                            <td>{formatNumber(d10)}%</td>
                            <td>{formatNumber(m1)}%</td>
                            <td>{formatNumber(m3)}%</td>
                            <td>{formatNumber(m6)}%</td>
                            <td>{formatNumber(m9)}%</td>
                            <td>{formatNumber(y1)}%</td>
                            <td>{formatNumber(y2)}%</td>
                            <td>{formatNumber(y3)}%</td>
                            <td>{formatNumber(y4)}%</td>
                            <td>{formatNumber(y5)}%</td>
                            <td>{formatNumber(sinceInception)}%</td>
                            <td>{maxDrawdown}</td>
                            <td>{formatNumber(mdd)}%</td>
                        </tr>
                    </tbody>
                </Table>
            </div>
        );
    };

    // Render functions for Portfolio view
    const renderPortfolioTableView = () => (
        <Table bordered responsive>
            <thead>
                <tr>
                    <th onClick={() => requestPortfolioSort('name')} style={{ cursor: 'pointer' }}>
                        Name {portfolioSortConfig.key === 'name' ? (portfolioSortConfig.direction === 'ascending' ? <FaSortUp style={{ marginLeft: '5px' }} /> : <FaSortDown style={{ marginLeft: '5px' }} />) : <FaSort style={{ marginLeft: '5px' }} />}
                    </th>
                    <th onClick={() => requestPortfolioSort('nuvama_code')} style={{ cursor: 'pointer' }}>
                        Code {portfolioSortConfig.key === 'nuvama_code' ? (portfolioSortConfig.direction === 'ascending' ? <FaSortUp style={{ marginLeft: '5px' }} /> : <FaSortDown style={{ marginLeft: '5px' }} />) : <FaSort style={{ marginLeft: '5px' }} />}
                    </th>
                    <th onClick={() => requestPortfolioSort('account')} style={{ cursor: 'pointer' }}>
                        Account {portfolioSortConfig.key === 'account' ? (portfolioSortConfig.direction === 'ascending' ? <FaSortUp style={{ marginLeft: '5px' }} /> : <FaSortDown style={{ marginLeft: '5px' }} />) : <FaSort style={{ marginLeft: '5px' }} />}
                    </th>
                    <th onClick={() => requestPortfolioSort('portfolio_value')} style={{ cursor: 'pointer' }}>
                        Portfolio Value {portfolioSortConfig.key === 'portfolio_value' ? (portfolioSortConfig.direction === 'ascending' ? <FaSortUp style={{ marginLeft: '5px' }} /> : <FaSortDown style={{ marginLeft: '5px' }} />) : <FaSort style={{ marginLeft: '5px' }} />}
                    </th>
                    <th onClick={() => requestPortfolioSort('cash')} style={{ cursor: 'pointer' }}>
                        Cash {portfolioSortConfig.key === 'cash' ? (portfolioSortConfig.direction === 'ascending' ? <FaSortUp style={{ marginLeft: '5px' }} /> : <FaSortDown style={{ marginLeft: '5px' }} />) : <FaSort style={{ marginLeft: '5px' }} />}
                    </th>
                    <th onClick={() => requestPortfolioSort('cash_percentage')} style={{ cursor: 'pointer' }}>
                        Cash % {portfolioSortConfig.key === 'cash_percentage' ? (portfolioSortConfig.direction === 'ascending' ? <FaSortUp style={{ marginLeft: '5px' }} /> : <FaSortDown style={{ marginLeft: '5px' }} />) : <FaSort style={{ marginLeft: '5px' }} />}
                    </th>
                    <th onClick={() => requestPortfolioSort('derivatives_percentage')} style={{ cursor: 'pointer' }}>
                        Derivatives % {portfolioSortConfig.key === 'derivatives_percentage' ? (portfolioSortConfig.direction === 'ascending' ? <FaSortUp style={{ marginLeft: '5px' }} /> : <FaSortDown style={{ marginLeft: '5px' }} />) : <FaSort style={{ marginLeft: '5px' }} />}
                    </th>
                </tr>
            </thead>
            <tbody>
                {filteredPortfolioData.length > 0 ? (
                    <>
                        {filteredPortfolioData.map((item, index) => (
                            <tr key={index}>
                                <td>{item.name}</td>
                                <td>{item.nuvama_code}</td>
                                <td>{item.account}</td>
                                <td>{formatNumber(item.portfolio_value)}</td>
                                <td>{formatNumber(item.cash)}</td>
                                <td style={{
                                    backgroundColor: getCashPercentageColor(item.cash_percentage),
                                    color: parseFloat(item.cash_percentage) > 30 ? 'white' : 'black',
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    padding: '8px'
                                }}>
                                    {formatNumber(item.cash_percentage)}%
                                </td>
                                <td>{formatNumber(item.derivatives_percentage || '-')}%</td>
                            </tr>
                        ))}
                        <tr className="font-bold bg-gray-100">
                            <td colSpan="3">Total / Average ({filteredPortfolioData.length} clients)</td>
                            <td>{formatNumber(portfolioTotals.portfolio_value)}</td>
                            <td>{formatNumber(portfolioTotals.cash)}</td>
                            <td style={{
                                backgroundColor: getCashPercentageColor(portfolioTotals.cash_percentage),
                                color: portfolioTotals.cash_percentage > 30 ? 'white' : 'black',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                padding: '8px'
                            }}>
                                {formatNumber(portfolioTotals.cash_percentage)}%
                            </td>
                            <td>{formatNumber(portfolioTotals.derivatives_percentage)}%</td>
                        </tr>
                    </>
                ) : (
                    <tr>
                        <td colSpan="7" className="text-center">
                            No portfolio entries found.
                        </td>
                    </tr>
                )}
            </tbody>
        </Table>
    );

    const renderPortfolioCardView = () => (
        <div className="card-grid">
            {filteredPortfolioData.length > 0 ? (
                filteredPortfolioData.map((item, index) => (
                    <div key={index} className="card mb-3">
                        <div className="card-header">
                            <h5>{item.name}</h5>
                            <small>{item.nuvama_code} | {item.account}</small>
                        </div>
                        <div className="card-body">
                            <div className="row g-2">
                                <div className="col-6">
                                    <div className="p-2 border rounded text-center">
                                        <div className="small text-muted">Portfolio Value</div>
                                        <div>{formatNumber(item.portfolio_value)}</div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="p-2 border rounded text-center">
                                        <div className="small text-muted">Cash</div>
                                        <div>{formatNumber(item.cash)}</div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="p-2 border rounded text-center" style={{
                                        backgroundColor: getCashPercentageColor(item.cash_percentage),
                                        color: parseFloat(item.cash_percentage) > 30 ? 'white' : 'black'
                                    }}>
                                        <div className="small text-muted">Cash %</div>
                                        <div>{formatNumber(item.cash_percentage)}%</div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="p-2 border rounded text-center">
                                        <div className="small text-muted">Derivatives %</div>
                                        <div>{formatNumber(item.derivatives_percentage || '-')}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center">No portfolio entries found.</p>
            )}
        </div>
    );

    // Render functions for Trailing Returns view
    const renderReturnsTableView = () => (
        <>
            <BenchmarkTable benchmark={benchmarkData} />
            <Table bordered striped hover responsive>
                <thead>
                    <tr>
                        <th onClick={() => requestReturnsSort('name')} style={{ cursor: 'pointer' }}>
                            Name {returnsSortConfig.key === 'name' ? (returnsSortConfig.direction === 'ascending' ? <FaSortUp style={{ marginLeft: '5px' }} /> : <FaSortDown style={{ marginLeft: '5px' }} />) : <FaSort style={{ marginLeft: '5px' }} />}
                        </th>
                        <th onClick={() => requestReturnsSort('nuvama_code')} style={{ cursor: 'pointer' }}>
                            Code {returnsSortConfig.key === 'nuvama_code' ? (returnsSortConfig.direction === 'ascending' ? <FaSortUp style={{ marginLeft: '5px' }} /> : <FaSortDown style={{ marginLeft: '5px' }} />) : <FaSort style={{ marginLeft: '5px' }} />}
                        </th>
                        <th onClick={() => requestReturnsSort('account')} style={{ cursor: 'pointer' }}>
                            Account {returnsSortConfig.key === 'account' ? (returnsSortConfig.direction === 'ascending' ? <FaSortUp style={{ marginLeft: '5px' }} /> : <FaSortDown style={{ marginLeft: '5px' }} />) : <FaSort style={{ marginLeft: '5px' }} />}
                        </th>
                        <th onClick={() => requestReturnsSort('d10')} style={{ cursor: 'pointer' }}>
                            10D {returnsSortConfig.key === 'd10' ? (returnsSortConfig.direction === 'ascending' ? <FaSortUp style={{ marginLeft: '5px' }} /> : <FaSortDown style={{ marginLeft: '5px' }} />) : <FaSort style={{ marginLeft: '5px' }} />}
                        </th>
                        <th onClick={() => requestReturnsSort('m1')} style={{ cursor: 'pointer' }}>
                            1M {returnsSortConfig.key === 'm1' ? (returnsSortConfig.direction === 'ascending' ? <FaSortUp style={{ marginLeft: '5px' }} /> : <FaSortDown style={{ marginLeft: '5px' }} />) : <FaSort style={{ marginLeft: '5px' }} />}
                        </th>
                        <th onClick={() => requestReturnsSort('m3')} style={{ cursor: 'pointer' }}>
                            3M {returnsSortConfig.key === 'm3' ? (returnsSortConfig.direction === 'ascending' ? <FaSortUp style={{ marginLeft: '5px' }} /> : <FaSortDown style={{ marginLeft: '5px' }} />) : <FaSort style={{ marginLeft: '5px' }} />}
                        </th>
                        <th onClick={() => requestReturnsSort('m6')} style={{ cursor: 'pointer' }}>
                            6M {returnsSortConfig.key === 'm6' ? (returnsSortConfig.direction === 'ascending' ? <FaSortUp style={{ marginLeft: '5px' }} /> : <FaSortDown style={{ marginLeft: '5px' }} />) : <FaSort style={{ marginLeft: '5px' }} />}
                        </th>
                        <th onClick={() => requestReturnsSort('y1')} style={{ cursor: 'pointer' }}>
                            1Y {returnsSortConfig.key === 'y1' ? (returnsSortConfig.direction === 'ascending' ? <FaSortUp style={{ marginLeft: '5px' }} /> : <FaSortDown style={{ marginLeft: '5px' }} />) : <FaSort style={{ marginLeft: '5px' }} />}
                        </th>
                        <th onClick={() => requestReturnsSort('y2')} style={{ cursor: 'pointer' }}>
                            2Y {returnsSortConfig.key === 'y2' ? (returnsSortConfig.direction === 'ascending' ? <FaSortUp style={{ marginLeft: '5px' }} /> : <FaSortDown style={{ marginLeft: '5px' }} />) : <FaSort style={{ marginLeft: '5px' }} />}
                        </th>
                        <th onClick={() => requestReturnsSort('y5')} style={{ cursor: 'pointer' }}>
                            5Y {returnsSortConfig.key === 'y5' ? (returnsSortConfig.direction === 'ascending' ? <FaSortUp style={{ marginLeft: '5px' }} /> : <FaSortDown style={{ marginLeft: '5px' }} />) : <FaSort style={{ marginLeft: '5px' }} />}
                        </th>
                        <th onClick={() => requestReturnsSort('since_inception')} style={{ cursor: 'pointer' }}>
                            Since Inception {returnsSortConfig.key === 'since_inception' ? (returnsSortConfig.direction === 'ascending' ? <FaSortUp style={{ marginLeft: '5px' }} /> : <FaSortDown style={{ marginLeft: '5px' }} />) : <FaSort style={{ marginLeft: '5px' }} />}
                        </th>
                        <th onClick={() => requestReturnsSort('mdd')} style={{ cursor: 'pointer' }}>
                            MDD {returnsSortConfig.key === 'mdd' ? (returnsSortConfig.direction === 'ascending' ? <FaSortUp style={{ marginLeft: '5px' }} /> : <FaSortDown style={{ marginLeft: '5px' }} />) : <FaSort style={{ marginLeft: '5px' }} />}
                        </th>
                        <th onClick={() => requestReturnsSort('current_drawdown')} style={{ cursor: 'pointer' }}>
                            Current Drawdown {returnsSortConfig.key === 'current_drawdown' ? (returnsSortConfig.direction === 'ascending' ? <FaSortUp style={{ marginLeft: '5px' }} /> : <FaSortDown style={{ marginLeft: '5px' }} />) : <FaSort style={{ marginLeft: '5px' }} />}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {filteredReturnsData.length > 0 ? (
                        <>
                            {filteredReturnsData.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.name}</td>
                                    <td>{item.nuvama_code}</td>
                                    <td>{item.account}</td>
                                    <td>{formatNumber(item.d10)}%</td>
                                    <td>{formatNumber(item.m1)}%</td>
                                    <td>{formatNumber(item.m3)}%</td>
                                    <td>{formatNumber(item.m6)}%</td>
                                    <td>{formatNumber(item.y1)}%</td>
                                    <td>{formatNumber(item.y2)}%</td>
                                    <td>{formatNumber(item.y5)}%</td>
                                    <td>{formatNumber(item.since_inception)}%</td>
                                    <td>{formatNumber(item.mdd)}%</td>
                                    <td>{formatNumber(item.current_drawdown)}%</td>
                                </tr>
                            ))}
                            <tr className="font-bold bg-gray-100">
                                <td colSpan="3">Average ({filteredReturnsData.length} clients)</td>
                                <td>{formatNumber(returnsTotals.d10)}%</td>
                                <td>{formatNumber(returnsTotals.m1)}%</td>
                                <td>{formatNumber(returnsTotals.m3)}%</td>
                                <td>{formatNumber(returnsTotals.m6)}%</td>
                                <td>{formatNumber(returnsTotals.y1)}%</td>
                                <td>{formatNumber(returnsTotals.y2)}%</td>
                                <td>{formatNumber(returnsTotals.y5)}%</td>
                                <td>{formatNumber(returnsTotals.since_inception)}%</td>
                                <td>{formatNumber(returnsTotals.mdd)}%</td>
                                <td>{formatNumber(returnsTotals.current_drawdown)}%</td>
                            </tr>
                        </>
                    ) : (
                        <tr>
                            <td colSpan="13" className="text-center">
                                No trailing returns entries found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </>
    );

    const renderReturnsCardView = () => (
        <div className="card-grid">
            {benchmarkData && <BenchmarkTable benchmark={benchmarkData} />}
            {filteredReturnsData.length > 0 ? (
                filteredReturnsData.map((item, index) => (
                    <div key={index} className="card mb-3">
                        <div className="card-header">
                            <h5>{item.name}</h5>
                            <small>{item.nuvama_code} | {item.account}</small>
                        </div>
                        <div className="card-body">
                            <div className="row g-2">
                                {[
                                    { label: '10D', value: `${formatNumber(item.d10)}%` },
                                    { label: '1M', value: `${formatNumber(item.m1)}%` },
                                    { label: '3M', value: `${formatNumber(item.m3)}%` },
                                    { label: '6M', value: `${formatNumber(item.m6)}%` },
                                    { label: '1Y', value: `${formatNumber(item.y1)}%` },
                                    { label: '2Y', value: `${formatNumber(item.y2)}%` },
                                    { label: '5Y', value: `${formatNumber(item.y5)}%` },
                                    { label: 'Since Inception', value: `${formatNumber(item.since_inception)}%` },
                                    { label: 'MDD', value: `${formatNumber(item.mdd)}%` },
                                    { label: 'Current DD', value: `${formatNumber(item.current_drawdown)}%` },
                                ].map((col, idx) => (
                                    <div key={idx} className="col-6 col-md-4">
                                        <div className="p-2 border rounded text-center">
                                            <div className="small text-muted">{col.label}</div>
                                            <div>{col.value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center">No trailing returns entries found.</p>
            )}
        </div>
    );

    return (
        <div className="m-6">
            <h1 className="mb-4">Client Tracker</h1>

            {/* Active View Toggle */}
            <div className="mb-3">
                <Button
                    variant={activeView === 'portfolio' ? 'primary' : 'outline-primary'}
                    className="me-2"
                    onClick={() => setActiveView('portfolio')}
                >
                    Portfolio Details
                </Button>
                <Button
                    variant={activeView === 'returns' ? 'primary' : 'outline-primary'}
                    onClick={() => setActiveView('returns')}
                >
                    Trailing Returns
                </Button>
            </div>

            {/* View Mode Toggle */}
            <div className="mb-3 d-flex justify-content-end">
                <div className="btn-group">
                    <Button
                        variant={viewMode === 'table' ? 'primary' : 'outline-primary'}
                        onClick={() => setViewMode('table')}
                    >
                        Table View
                    </Button>
                    <Button
                        variant={viewMode === 'card' ? 'primary' : 'outline-primary'}
                        onClick={() => setViewMode('card')}
                    >
                        Card View
                    </Button>
                </div>
            </div>

            {/* Error Message */}
            {error && <Alert variant="danger">{error}</Alert>}

            {/* Loading Spinner */}
            {loading && (
                <div className="text-center">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            )}

            {/* Portfolio Section */}
            {!loading && !error && activeView === 'portfolio' && (
                <>
                    <Form className="mb-3">
                        <Form.Control
                            type="text"
                            placeholder="Search Portfolio..."
                            value={portfolioSearchQuery}
                            onChange={(e) => setPortfolioSearchQuery(e.target.value)}
                            aria-label="Search Portfolio"
                        />
                    </Form>
                    {viewMode === 'card'
                        ? renderPortfolioCardView()
                        : renderPortfolioTableView()}
                </>
            )}

            {/* Trailing Returns Section */}
            {!loading && !error && activeView === 'returns' && (
                <>
                    <Form className="mb-3">
                        <Form.Control
                            type="text"
                            placeholder="Search Trailing Returns..."
                            value={returnsSearchQuery}
                            onChange={(e) => setReturnsSearchQuery(e.target.value)}
                            aria-label="Search Trailing Returns"
                        />
                    </Form>
                    {viewMode === 'card'
                        ? renderReturnsCardView()
                        : renderReturnsTableView()}
                </>
            )}
        </div>
    );
};

// Server-side protection: Check for the "auth" cookie and redirect if missing
export async function getServerSideProps(context) {
    const { req } = context;
    const cookies = req.headers.cookie || '';
    const parsedCookies = parse(cookies);

    if (!parsedCookies.auth) {
        return {
            redirect: {
                destination: '/login',
                permanent: false,
            },
        };
    }
    return { props: {} };
}

export default ClientTracker;
