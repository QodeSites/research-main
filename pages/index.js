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

const IndicesPage = () => {
    // Data and error states
    const [indicesData, setIndicesData] = useState(null);
    const [dataAsOf, setDataAsOf] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Filtering and searching
    const [selectedGroup, setSelectedGroup] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // View mode and column selection (for card view)
    const [viewMode, setViewMode] = useState('table'); // "table" or "card"
    const allReturnPeriods = ['1D', '2D', '3D', '1W', '1M', '3M', '6M', '9M', '1Y', 'DD'];
    const [selectedColumns, setSelectedColumns] = useState(['1D', '1M', '1Y']);

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

    // Prepare indices with default returns values
    const segregateIndices = (data = {}) => {
        const createDefaultReturns = () => ({
            '1D': '-',
            '2D': '-',
            '3D': '-',
            '1W': '-',
            '1M': '-',
            '3M': '-',
            '6M': '-',
            '9M': '-',
            '1Y': '-',
            'DD': '-'
        });

        const combined = [];
        for (const [category, indices] of Object.entries(allIndicesGroups)) {
            indices.forEach(index => {
                combined.push({
                    index,
                    category,
                    ...createDefaultReturns()
                });
            });
        }

        if (data) {
            Object.entries(data).forEach(([index, returns]) => {
                const indexObj = combined.find(item => item.index === index);
                if (indexObj) {
                    indexObj['1D'] = returns['1D'] || '-';
                    indexObj['2D'] = returns['2D'] || '-';
                    indexObj['3D'] = returns['3D'] || '-';
                    indexObj['1W'] = returns['1W'] || '-';
                    indexObj['1M'] = returns['1M'] || '-';
                    indexObj['3M'] = returns['3M'] || '-';
                    indexObj['6M'] = returns['6M'] || '-';
                    indexObj['9M'] = returns['9M'] || '-';
                    indexObj['1Y'] = returns['1Y'] || '-';
                    indexObj['DD'] = returns['Drawdown'] || '-';
                }
            });
        }

        return combined;
    };

    // Fetch data from the API
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
                headers: { 'Content-Type': 'application/json' },
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

    // Sorting handler
    const handleSort = (key) => {
        setSortConfig(prev => {
            let direction = 'asc';
            if (prev.key === key && prev.direction === 'asc') {
                direction = 'desc';
            }
            return { key, direction };
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

    // Toggle column selection for card view
    const handleColumnSelection = (column) => {
        setSelectedColumns(prev => {
            if (prev.includes(column)) {
                return prev.filter(col => col !== column);
            } else {
                return [...prev, column];
            }
        });
    };

    // Render table view with all columns
    const renderTableView = (indices) => {
        const sortedIndices = getSortedIndices(indices);
        return (
            <div className="table-responsive">
                <Table striped bordered hover className="elegant-table">
                    <thead className="sticky-header">
                        <tr>
                            <th style={{ cursor: 'pointer', minWidth: '60px' }} onClick={() => handleSort('index')}>
                                S.No {renderSortIndicator('index')}
                            </th>
                            <th style={{ cursor: 'pointer', minWidth: '150px' }} onClick={() => handleSort('index')}>
                                Index {renderSortIndicator('index')}
                            </th>
                            <th style={{ cursor: 'pointer', minWidth: '150px' }} onClick={() => handleSort('category')}>
                                Category {renderSortIndicator('category')}
                            </th>
                            {allReturnPeriods.map(period => (
                                <th
                                    key={period}
                                    style={{ cursor: 'pointer', minWidth: '80px' }}
                                    onClick={() => handleSort(period)}
                                >
                                    {period === 'DD' ? 'Drawdown' : period} {renderSortIndicator(period)}
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
                                {allReturnPeriods.map(period => (
                                    <td
                                        key={period}
                                        className={item[period] !== '-' && parseFloat(item[period]) < 0 ? 'text-danger' : ''}
                                    >
                                        {item[period] !== '-' ? `${item[period]}%` : '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        );
    };

    // Render card view using the selected columns
    const renderCardView = (indices) => {
        const sortedIndices = getSortedIndices(indices);
        return (
            <div className="card-grid">
                {sortedIndices.map((item) => (
                    <div key={item.index} className="card mb-3">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">{item.index}</h5>
                            <Badge bg="info">{item.category}</Badge>
                        </div>
                        <div className="card-body">
                            <div className="row g-2">
                                {selectedColumns.map(period => (
                                    <div key={period} className="col-4">
                                        <div className="p-2 border rounded text-center">
                                            <div className="small text-muted">
                                                {period === 'DD' ? 'Drawdown' : period}
                                            </div>
                                            <div className={item[period] !== '-' && parseFloat(item[period]) < 0 ? 'text-danger' : ''}>
                                                {item[period] !== '-' ? `${item[period]}%` : '-'}
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

    // Filter the combined indices based on group and search term
    const combinedIndices = segregateIndices(indicesData);
    const filteredByGroup = selectedGroup === 'All'
        ? combinedIndices
        : combinedIndices.filter(item => item.category === selectedGroup);
    const finalFilteredIndices = filteredByGroup.filter(item =>
        item.index.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4">
            {loading ? (
                <div className="text-center">
                    <Spinner animation="border" />
                </div>
            ) : (
                <>
                    <h1 className="mb-4">Indices Returns</h1>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Button variant="outline-primary" onClick={() => setShowFilters(!showFilters)}>
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </Button>
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
                            {viewMode === 'card' && (
                                <Row className="mb-3">
                                    <Col xs={12}>
                                        <Form.Label>Select Columns to Display</Form.Label>
                                        <div className="d-flex flex-wrap gap-2">
                                            {allReturnPeriods.map(period => (
                                                <Form.Check
                                                    key={period}
                                                    type="checkbox"
                                                    id={`column-${period}`}
                                                    label={period === 'DD' ? 'Drawdown' : period}
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
                        {viewMode === 'card'
                            ? renderCardView(finalFilteredIndices)
                            : renderTableView(finalFilteredIndices)}
                    </div>
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

export default IndicesPage;