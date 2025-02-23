// pages/ClientTracker.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Table, Button, Spinner, Alert, Form } from 'react-bootstrap';
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

                // Extract NIFTY 50 data
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

    // Updated formatNumber function to use 'en-IN' locale for Indian comma separators
    const formatNumber = (value, suffix = '') => {
        if (value === null || value === "NaN" || value === undefined) return "-";
        return Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + suffix;
    };

    // Improved color gradient function
    const getCashPercentageColor = (percentage) => {
        const value = parseFloat(percentage);
        if (isNaN(value)) return '#FFFFFF';

        // Define ideal cash percentage range (e.g., 0-15% might be ideal)
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

            // Handle null or undefined values
            if (aValue === null || aValue === undefined) return 1; // Place null/undefined at the end
            if (bValue === null || bValue === undefined) return -1; // Place null/undefined at the end

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
            );
        });
    }, [sortedReturnsData, debouncedReturnsSearch]);

    const calculatePortfolioTotals = (data) => {
        return data.reduce((acc, item) => ({
            portfolio_value: (acc.portfolio_value || 0) + (convertToNumber(item.portfolio_value) || 0),
            cash: (acc.cash || 0) + (convertToNumber(item.cash) || 0),
            derivatives_percentage: (acc.derivatives_percentage || 0) + (convertToNumber(item.derivatives_percentage) || 0),
        }), {});
    };

    // Calculate totals for returns data (averages for percentage values)
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

    // Calculate the portfolio totals memoized
    const portfolioTotals = useMemo(() => {
        const totals = calculatePortfolioTotals(filteredPortfolioData);
        const totalPortfolioValue = totals.portfolio_value || 0;
        return {
            ...totals,
            cash_percentage: totalPortfolioValue ? (totals.cash / totalPortfolioValue) * 100 : 0,
            derivatives_percentage: totals.derivatives_percentage / (filteredPortfolioData.length || 1),
        };
    }, [filteredPortfolioData]);

    // Calculate the returns totals memoized
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

    // Benchmark Table Component with Horizontal Layout
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
                </>
            )}

            {/* Trailing Returns Section */}
            {!loading && !error && activeView === 'returns' && (
                <>
                    {/* Benchmark Section */}
                    <BenchmarkTable benchmark={benchmarkData} />

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

    // If the auth cookie exists, render the page
    return { props: {} };
}

export default ClientTracker;
