import { useState, useEffect } from 'react';
import {
    Container,
    Table,
    Spinner,
    Alert,
    Button,
    Form,
    Row,
    Col,
    InputGroup,
    FormControl,
    Badge
} from 'react-bootstrap';
import formatDate from 'utils/formatDate';
import { parse } from 'cookie';


const ReturnsComparisonPage = () => {
    const [indicesData, setIndicesData] = useState(null);
    const [dataAsOf, setDataAsOf] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Filtering and Searching
    const [selectedGroup, setSelectedGroup] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Responsive display
    const [viewMode, setViewMode] = useState('full');
    const [selectedColumns, setSelectedColumns] = useState(['1Y', '3Y', 'CDR', 'CDR_MDD']);

    // Single sorting configuration
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc'
    });

    // Define the indices categories
    const qodeStrategyIndices = ['QAW', 'QTF', 'QGF', 'QFH'];
    const broadBasedIndices = [
        'NIFTY 50',
        'BSE500',
        'NIFTY MIDCAP 100',
        'NIFTY SMLCAP 250',
        'NIFTY MICROCAP250'
    ];
    const strategyIndices = [
        'NIFTYM150MOMNTM50',
        'NIFTY100 LOWVOL30',
        'NIFTY200MOMENTM30',
        'GOLDBEES'
    ];
    const sectoralIndices = [
        'NIFTY AUTO',
        'NIFTY BANK',
        'NIFTY COMMODITIES',
        'NIFTY CONSR DURBL',
        'NIFTY CONSUMPTION',
        'NIFTY CPSE',
        'NIFTY ENERGY',
        'NIFTY FMCG',
        'NIFTY HEALTHCARE',
        'NIFTY INFRA',
        'NIFTY IT',
        'NIFTY MEDIA',
        'NIFTY METAL',
        'NIFTY MNC',
        'NIFTY PHARMA',
        'NIFTY PSU BANK',
        'NIFTY PVT BANK',
        'NIFTY REALTY'
    ];

    const allIndicesGroups = {
        'Qode Strategies': qodeStrategyIndices,
        'Broad Based Indices': broadBasedIndices,
        'Strategy Indices': strategyIndices,
        'Sectoral Indices': sectoralIndices
    };

    // All available return periods
    const allReturnPeriods = ['1Y', '2Y', '3Y', '4Y', '5Y', 'CDR', 'CDR_MDD'];

    // Detect screen size on mount and window resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setViewMode('compact');
            } else {
                setViewMode('full');
            }
        };

        // Set initial value
        handleResize();

        // Add event listener
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const segregateIndices = (data = {}) => {
        const createDefaultReturns = () => ({
            '1D': '-',
            '2D': '-',
            '3D': '-',
            '10D': '-',
            '1W': '-',
            '1M': '-',
            '3M': '-',
            '6M': '-',
            '9M': '-',
            '1Y': '-',
            '2Y': '-',
            '3Y': '-',
            '4Y': '-',
            '5Y': '-',
            'Since Inception': '-',
            'Drawdown': '-',
            'MDD': '-',
            'CDR': '-',
            'CDR_MDD': '-' // Ensure CDR is included for all indices
        });

        const combined = [];

        // Initialize combined array with all indices and their categories
        for (const [category, indices] of Object.entries(allIndicesGroups)) {
            indices.forEach(index => {
                combined.push({
                    index,
                    category,
                    ...createDefaultReturns()
                });
            });
        }

        // Populate with actual data
        if (data) {
            Object.entries(data).forEach(([index, returns]) => {
                const processedReturns = { ...returns };

                // Find the corresponding index in combined and update returns
                const indexObj = combined.find(item => item.index === index);
                if (indexObj) {
                    Object.assign(indexObj, processedReturns);
                }
            });
        }

        return combined;
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const payload = {};
            if (startDate && endDate) {
                payload.startDate = startDate;
                payload.endDate = endDate;
            }

            const response = await fetch('/api/indices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (response.ok) {
                setIndicesData(result.data);
                setDataAsOf(result.dataAsOf || new Date().toISOString());
            } else {
                setError(result.message || 'Failed to fetch data');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDateSubmit = (e) => {
        e.preventDefault();
        fetchData();
    };

    const handleSort = (key) => {
        setSortConfig(prevConfig => {
            let direction = 'asc';
            if (prevConfig.key === key && prevConfig.direction === 'asc') {
                direction = 'desc';
            }
            return {
                key,
                direction
            };
        });
    };

    const handleColumnSelection = (column) => {
        setSelectedColumns(prev => {
            if (prev.includes(column)) {
                return prev.filter(col => col !== column);
            } else {
                return [...prev, column];
            }
        });
    };

    const getSortedIndices = (indices) => {
        const { key, direction } = sortConfig;
        if (!key) return indices;

        const sorted = [...indices];

        sorted.sort((a, b) => {
            let aValue, bValue;

            if (key === 'index' || key === 'category') {
                aValue = a[key].toUpperCase();
                bValue = b[key].toUpperCase();
                if (aValue < bValue) return direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return direction === 'asc' ? 1 : -1;
                return 0;
            } else {
                aValue = a[key] === '-' ? null : parseFloat(a[key]);
                bValue = b[key] === '-' ? null : parseFloat(b[key]);

                if (aValue === null && bValue === null) return 0;
                if (aValue === null) return 1;
                if (bValue === null) return -1;

                if (aValue < bValue) return direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return direction === 'asc' ? 1 : -1;
                return 0;
            }
        });

        return sorted;
    };

    const renderSortIndicator = (columnKey) => {
        const { key, direction } = sortConfig;
        if (key !== columnKey) return null;
        return direction === 'asc' ? ' ▲' : ' ▼';
    };

    const renderCardView = (indices) => {
        const sortedIndices = getSortedIndices(indices);

        return (
            <div className="card-grid">
                {sortedIndices.map((item, idx) => (
                    <div key={item.index} className="card mb-3">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">{item.index}</h5>
                            <Badge bg="info">{item.category}</Badge>
                        </div>
                        <div className="card-body">
                            <div className="row g-2">
                                {selectedColumns.map((period) => (
                                    <div key={period} className="col-4">
                                        <div
                                            className="p-2 border rounded text-center"
                                            style={
                                                period === 'CDR_MDD'
                                                    ? { backgroundColor: 'rgba(255, 0, 0, 0.1)' } // Transparent red background
                                                    : {}
                                            }
                                        >
                                            <div className="small text-muted">{period}</div>
                                            <div
                                                className={
                                                    period === 'CDR_MDD'
                                                        ? 'text-danger'
                                                        : item[period] !== '-' && parseFloat(item[period]) < 0
                                                            ? 'text-danger'
                                                            : ''
                                                }
                                            >
                                                {period === 'CDR_MDD' && item[period] !== '-' && parseFloat(item[period]) > 0
                                                    ? `-${item[period]}`
                                                    : item[period]}
                                                {item[period] !== '-' ? '%' : ''}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderFullTable = (indices) => {
        const sortedIndices = getSortedIndices(indices);
        const displayColumns = viewMode === 'full' ? allReturnPeriods : selectedColumns;

        return (
            <div className="table-responsive">
                <Table bordered hover className="elegant-table">
                    <thead className="sticky-header">
                        <tr>
                            <th>S.No</th>
                            <th
                                style={{ cursor: 'pointer', minWidth: '150px' }}
                                onClick={() => handleSort('index')}
                            >
                                Index{renderSortIndicator('index')}
                            </th>
                            <th
                                style={{ cursor: 'pointer', minWidth: '150px' }}
                                onClick={() => handleSort('category')}
                            >
                                Category{renderSortIndicator('category')}
                            </th>
                            {displayColumns.map((period) => (
                                <th
                                    key={period}
                                    style={{ cursor: 'pointer', minWidth: '80px' }}
                                    onClick={() => handleSort(period)}
                                >
                                    {period} {renderSortIndicator(period)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedIndices.map((item, idx) => (
                            <tr key={item.index}>
                                <td>{idx + 1}</td>
                                <td>{item.index}</td>
                                <td>{item.category}</td>
                                {displayColumns.map((period) => (
                                    <td
                                        key={period}
                                        className={
                                            period === 'CDR_MDD'
                                                ? 'text-danger'
                                                : item[period] !== '-' && parseFloat(item[period]) < 0
                                                    ? 'text-danger'
                                                    : ''
                                        }
                                        style={
                                            period === 'CDR_MDD'
                                                ? { backgroundColor: 'rgba(255, 0, 0, 0.1)' } // Transparent red background
                                                : {}
                                        }
                                    >
                                        {period === 'CDR_MDD' && item[period] !== '-' && parseFloat(item[period]) > 0
                                            ? `-${item[period]}`
                                            : item[period]}
                                        {item[period] !== '-' ? '%' : ''}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        );
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    const combinedIndices = segregateIndices(indicesData);

    // Apply Group Filter
    const filteredByGroup = selectedGroup === 'All'
        ? combinedIndices
        : combinedIndices.filter(item => item.category === selectedGroup);

    // Apply Search Filter
    const finalFilteredIndices = filteredByGroup.filter(item =>
        item.index.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4">
            <h1 className="mb-4">Returns Comparison</h1>

            <div className="d-flex justify-content-between align-items-center mb-3">
                <Button variant="outline-primary" onClick={() => setShowFilters(!showFilters)}>
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>

                <div className="d-flex align-items-center">
                    <div className="btn-group me-2">
                        <Button
                            variant={viewMode === 'full' ? 'primary' : 'outline-primary'}
                            onClick={() => setViewMode('full')}
                            className="d-none d-md-inline"
                        >
                            Full View
                        </Button>
                        <Button
                            variant={viewMode === 'compact' ? 'primary' : 'outline-primary'}
                            onClick={() => setViewMode('compact')}
                        >
                            {window.innerWidth < 768 ? 'Table View' : 'Compact View'}
                        </Button>
                        <Button
                            variant={viewMode === 'card' ? 'primary' : 'outline-primary'}
                            onClick={() => setViewMode('card')}
                            className="d-md-none"
                        >
                            Card View
                        </Button>
                    </div>
                </div>
            </div>

            {showFilters && (
                <Form onSubmit={handleDateSubmit} className="mb-4">
                    <Row className="mb-3">
                        <Col xs={12} md={3} className="mb-2 mb-md-0">
                            <Form.Group>
                                <Form.Label>Search Index</Form.Label>
                                <InputGroup>
                                    <FormControl
                                        type="text"
                                        placeholder="Search by index name"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => setSearchTerm('')}
                                        disabled={!searchTerm}
                                    >
                                        Clear
                                    </Button>
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={3} className="mb-2 mb-md-0">
                            <Form.Group>
                                <Form.Label>Filter by Group</Form.Label>
                                <Form.Control
                                    as="select"
                                    value={selectedGroup}
                                    onChange={(e) => setSelectedGroup(e.target.value)}
                                >
                                    <option value="All">All Groups</option>
                                    {Object.keys(allIndicesGroups).map(group => (
                                        <option key={group} value={group}>{group}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col xs={6} md={3}>
                            <Form.Group>
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col xs={6} md={3}>
                            <Form.Group>
                                <Form.Label>End Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    {viewMode !== 'full' && (
                        <Row className="mb-3">
                            <Col xs={12}>
                                <Form.Label>Select Columns to Display</Form.Label>
                                <div className="d-flex flex-wrap gap-2">
                                    {allReturnPeriods.map(period => (
                                        <Form.Check
                                            key={period}
                                            type="checkbox"
                                            id={`column-${period}`}
                                            label={period}
                                            checked={selectedColumns.includes(period)}
                                            onChange={() => handleColumnSelection(period)}
                                            inline
                                        />
                                    ))}
                                </div>
                            </Col>
                        </Row>
                    )}

                    <Row>
                        <Col>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={(!startDate || !endDate)}
                            >
                                Calculate Custom Returns
                            </Button>
                        </Col>
                    </Row>
                </Form>
            )}

            <div className="mt-3">
                <h3 className="my-3 text-primary">All Indices</h3>
                {dataAsOf && <p className="text-muted">Data as of: {formatDate(dataAsOf)}</p>}

                {viewMode === 'card' ?
                    renderCardView(finalFilteredIndices) :
                    renderFullTable(finalFilteredIndices)
                }
            </div>
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

export default ReturnsComparisonPage;