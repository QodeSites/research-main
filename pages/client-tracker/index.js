import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Table, Button, Container, Spinner, Alert, Form } from 'react-bootstrap';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

const ClientTracker = () => {
    const [data, setData] = useState({
        portfolio_tracker: [],
        trailing_returns: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeView, setActiveView] = useState('portfolio');

    const [portfolioSortConfig, setPortfolioSortConfig] = useState({ key: null, direction: 'ascending' });
    const [returnsSortConfig, setReturnsSortConfig] = useState({ key: null, direction: 'ascending' });

    const [portfolioSearchQuery, setPortfolioSearchQuery] = useState("");
    const [returnsSearchQuery, setReturnsSearchQuery] = useState("");

    const portfolioSearchTimeout = useRef(null);
    const returnsSearchTimeout = useRef(null);

    const [debouncedPortfolioSearch, setDebouncedPortfolioSearch] = useState("");
    const [debouncedReturnsSearch, setDebouncedReturnsSearch] = useState("");

    const convertToNumber = (value) => {
        if (value === null || value === undefined || value === "NaN") return null;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/ClientTracker'); 
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();
                setData({
                    portfolio_tracker: processPortfolioData(result.portfolio_tracker),
                    trailing_returns: processReturnsData(result.trailing_returns)
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
    
    const formatNumber = (value) => {
        if (value === null || value === "NaN" || value === undefined) return "-";
        return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Improved color gradient function
    const getCashPercentageColor = (percentage) => {
        const value = parseFloat(percentage);
        if (isNaN(value)) return '#FFFFFF';

        // Define ideal cash percentage range (e.g., 5-15% might be ideal)
        const idealLow = 0;
        const idealHigh = 15;
        
        // RGB values for different ranges
        if (value <= idealLow) {
            // Dark green (ideal) to yellow-green
            const ratio = idealLow === 0 ? 1 : value / idealLow;
            return `rgba(0, ${Math.round(100 + (155 * ratio))}, 0, 0.9)`;
        } else if (value <= idealHigh) {
            // Yellow-green to yellow
            const ratio = (value - idealLow) / (idealHigh - idealLow);
            return `rgb(${Math.round(200 * ratio)}, ${Math.round(140 + (75 * ratio))}, 0 )`;
        } else if (value <= 30) {
            // Yellow to orange
            const ratio = (value - idealHigh) / (30 - idealHigh);
            return `rgba(255, ${Math.round(255 - (155 * ratio))}, 0, 0.6)`;
        } else if (value <= 50) {
            // Orange to light red
            const ratio = (value - 30) / 20;
            return `rgba(255, ${Math.round(100 - (100 * ratio))}, 0, 0.6)`;
        } else {
            // Light red to dark red
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

            // Handle different data types
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return aValue - bValue;
            } else {
                // Compare as strings
                return aValue.toString().localeCompare(bValue.toString());
            }
        });

        if (sortConfig.direction === 'descending') {
            sorted.reverse();
        }

        return sorted;
    };

    // Handle sorting for Portfolio Table
    const requestPortfolioSort = (key) => {
        let direction = 'ascending';
        if (portfolioSortConfig.key === key && portfolioSortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setPortfolioSortConfig({ key, direction });
    };

    // Handle sorting for Trailing Returns Table
    const requestReturnsSort = (key) => {
        let direction = 'ascending';
        if (returnsSortConfig.key === key && returnsSortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setReturnsSortConfig({ key, direction });
    };

    // Apply sorting to the data using useMemo for performance optimization
    const sortedPortfolioData = useMemo(() => sortedData(data.portfolio_tracker, portfolioSortConfig), [data.portfolio_tracker, portfolioSortConfig]);
    const sortedReturnsData = useMemo(() => sortedData(data.trailing_returns, returnsSortConfig), [data.trailing_returns, returnsSortConfig]);

    // Function to render sort icons
    const renderSortIcon = (sortConfig, key) => {
        if (sortConfig.key !== key) {
            return <FaSort style={{ marginLeft: '5px' }} />;
        }
        if (sortConfig.direction === 'ascending') {
            return <FaSortUp style={{ marginLeft: '5px' }} />;
        } else {
            return <FaSortDown style={{ marginLeft: '5px' }} />;
        }
    };

    // Debounce logic for Portfolio Search
    useEffect(() => {
        clearTimeout(portfolioSearchTimeout.current);
        portfolioSearchTimeout.current = setTimeout(() => {
            setDebouncedPortfolioSearch(portfolioSearchQuery);
        }, 300); // 300ms delay

        return () => clearTimeout(portfolioSearchTimeout.current);
    }, [portfolioSearchQuery]);

    // Debounce logic for Returns Search
    useEffect(() => {
        clearTimeout(returnsSearchTimeout.current);
        returnsSearchTimeout.current = setTimeout(() => {
            setDebouncedReturnsSearch(returnsSearchQuery);
        }, 300); // 300ms delay

        return () => clearTimeout(returnsSearchTimeout.current);
    }, [returnsSearchQuery]);

    // Filtered Portfolio Data based on debounced search query
    const filteredPortfolioData = useMemo(() => {
        return sortedPortfolioData.filter((item) => {
            const query = debouncedPortfolioSearch.toLowerCase();
            return (
                item.name.toLowerCase().includes(query) ||
                item.nuvama_code.toLowerCase().includes(query) ||
                item.account.toLowerCase().includes(query)
                // Add more fields if necessary
            );
        });
    }, [sortedPortfolioData, debouncedPortfolioSearch]);

    // Filtered Returns Data based on debounced search query
    const filteredReturnsData = useMemo(() => {
        return sortedReturnsData.filter((item) => {
            const query = debouncedReturnsSearch.toLowerCase();
            return (
                item.name.toLowerCase().includes(query) ||
                item.nuvama_code.toLowerCase().includes(query) ||
                item.account.toLowerCase().includes(query)
                // Add more fields if necessary
            );
        });
    }, [sortedReturnsData, debouncedReturnsSearch]);

    return (
        <div className="m-6">
            <h1 className="mb-4">Client Tracker</h1>
            
            {/* Toggle Buttons */}
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

            {/* Portfolio Details Section */}
            {!loading && !error && activeView === 'portfolio' && (
                <>
                    {/* Search Input */}
                    <Form className="mb-3">
                        <Form.Control
                            type="text"
                            placeholder="Search Portfolio..."
                            value={portfolioSearchQuery}
                            onChange={(e) => setPortfolioSearchQuery(e.target.value)}
                            aria-label="Search Portfolio"
                        />
                    </Form>

                    <Table bordered responsive>
                        <thead>
                            <tr>
                                <th onClick={() => requestPortfolioSort('name')} style={{ cursor: 'pointer' }}>
                                    Name {renderSortIcon(portfolioSortConfig, 'name')}
                                </th>
                                <th onClick={() => requestPortfolioSort('nuvama_code')} style={{ cursor: 'pointer' }}>
                                    Code {renderSortIcon(portfolioSortConfig, 'nuvama_code')}
                                </th>
                                <th onClick={() => requestPortfolioSort('account')} style={{ cursor: 'pointer' }}>
                                    Account {renderSortIcon(portfolioSortConfig, 'account')}
                                </th>
                                <th onClick={() => requestPortfolioSort('portfolio_value')} style={{ cursor: 'pointer' }}>
                                    Portfolio Value {renderSortIcon(portfolioSortConfig, 'portfolio_value')}
                                </th>
                                <th onClick={() => requestPortfolioSort('cash')} style={{ cursor: 'pointer' }}>
                                    Cash {renderSortIcon(portfolioSortConfig, 'cash')}
                                </th>
                                <th onClick={() => requestPortfolioSort('cash_percentage')} style={{ cursor: 'pointer' }}>
                                    Cash % {renderSortIcon(portfolioSortConfig, 'cash_percentage')}
                                </th>
                                <th onClick={() => requestPortfolioSort('derivatives_percentage')} style={{ cursor: 'pointer' }}>
                                    Derivatives Percentage {renderSortIcon(portfolioSortConfig, 'derivatives_percentage')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPortfolioData.length > 0 ? (
                                filteredPortfolioData.map((item, index) => (
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
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center">
                                        No portfolio entries found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </>
            )}

            {/* Trailing Returns Section */}
            {!loading && !error && activeView === 'returns' && (
                <>
                    {/* Search Input */}
                    <Form className="mb-3">
                        <Form.Control
                            type="text"
                            placeholder="Search Trailing Returns..."
                            value={returnsSearchQuery}
                            onChange={(e) => setReturnsSearchQuery(e.target.value)}
                            aria-label="Search Trailing Returns"
                        />
                    </Form>

                    <Table bordered striped hover responsive>
                        <thead>
                            <tr>
                                <th onClick={() => requestReturnsSort('name')} style={{ cursor: 'pointer' }}>
                                    Name {renderSortIcon(returnsSortConfig, 'name')}
                                </th>
                                <th onClick={() => requestReturnsSort('nuvama_code')} style={{ cursor: 'pointer' }}>
                                    Code {renderSortIcon(returnsSortConfig, 'nuvama_code')}
                                </th>
                                <th onClick={() => requestReturnsSort('account')} style={{ cursor: 'pointer' }}>
                                    Account {renderSortIcon(returnsSortConfig, 'account')}
                                </th>
                                <th onClick={() => requestReturnsSort('d10')} style={{ cursor: 'pointer' }}>
                                    10D {renderSortIcon(returnsSortConfig, 'd10')}
                                </th>
                                <th onClick={() => requestReturnsSort('m1')} style={{ cursor: 'pointer' }}>
                                    1M {renderSortIcon(returnsSortConfig, 'm1')}
                                </th>
                                <th onClick={() => requestReturnsSort('m3')} style={{ cursor: 'pointer' }}>
                                    3M {renderSortIcon(returnsSortConfig, 'm3')}
                                </th>
                                <th onClick={() => requestReturnsSort('m6')} style={{ cursor: 'pointer' }}>
                                    6M {renderSortIcon(returnsSortConfig, 'm6')}
                                </th>
                                <th onClick={() => requestReturnsSort('y1')} style={{ cursor: 'pointer' }}>
                                    1Y {renderSortIcon(returnsSortConfig, 'y1')}
                                </th>
                                <th onClick={() => requestReturnsSort('y2')} style={{ cursor: 'pointer' }}>
                                    2Y {renderSortIcon(returnsSortConfig, 'y2')}
                                </th>
                                <th onClick={() => requestReturnsSort('y5')} style={{ cursor: 'pointer' }}>
                                    5Y {renderSortIcon(returnsSortConfig, 'y5')}
                                </th>
                                <th onClick={() => requestReturnsSort('since_inception')} style={{ cursor: 'pointer' }}>
                                    Since Inception {renderSortIcon(returnsSortConfig, 'since_inception')}
                                </th>
                                <th onClick={() => requestReturnsSort('mdd')} style={{ cursor: 'pointer' }}>
                                    MDD {renderSortIcon(returnsSortConfig, 'mdd')}
                                </th>
                                <th onClick={() => requestReturnsSort('current_drawdown')} style={{ cursor: 'pointer' }}>
                                    Current Drawdown {renderSortIcon(returnsSortConfig, 'current_drawdown')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReturnsData.length > 0 ? (
                                filteredReturnsData.map((item, index) => (
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
                                ))
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
            )}
        </div>
    );
};

export default ClientTracker;
