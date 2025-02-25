import React, { useEffect, useState, useMemo } from 'react';
import { 
    Button, 
    OverlayTrigger, 
    Spinner, 
    Table, 
    Tooltip, 
    Form, 
    Row, 
    Col, 
    InputGroup, 
    FormControl, 
    Badge 
} from 'react-bootstrap';
import {
    CaretUpFill,
    CaretDownFill
} from 'react-bootstrap-icons';
import { formatCurrency } from 'utils/formatCurrency';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import formatDate from 'utils/formatDate';
import { parse } from 'cookie';

const IndexTable = () => {
    // Data and loading states
    const [data, setData] = useState([]);
    const [date, setDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastFetchTime, setLastFetchTime] = useState(null);

    // Filtering and Searching
    const [selectedGroup, setSelectedGroup] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Toggle for filters and view mode
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

    // For card view column selection – available keys and labels
    const allCardColumns = [
        { key: 'nav', label: 'Current NAV' },
        { key: 'currentDD', label: 'Current DD' },
        { key: 'peak', label: 'Peak' },
        { key: 'dd10', label: '10% DD' },
        { key: 'dd15', label: '15% DD' },
        { key: 'dd20', label: '20% DD' }
    ];
    const [selectedColumns, setSelectedColumns] = useState(allCardColumns.map(col => col.key));

    // Sorting configuration
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'ascending'
    });

    // Define the indices groups and order
    const qodeStrategyIndices = ['QAW', 'QTF', 'QGF', 'QFH'];
    const broadBasedIndices = [
        'NIFTY 50',
        'NIFTY 500',
        'NIFTY NEXT 50',
        'NIFTY MIDCAP 100',
        'NIFTY SMLCAP 250'
    ];
    const strategyIndices = [
        'NIFTYM150MOMNTM50',
        'NIFTY100 LOWVOL30',
        'NIFTY200MOMENTM30',
        'GOLDBEES'
    ];
    const sectoralIndices = [
        'NIFTY BANK',
        'NIFTY AUTO',
        'NIFTY FINANCIAL SVC',
        'NIFTY FMCG',
        'NIFTY IT',
        'NIFTY MEDIA',
        'NIFTY METAL',
        'NIFTY PHARMA',
        'NIFTY PSU BANK',
        'NIFTY PVT BANK',
        'NIFTY REALTY',
        'NIFTY HEALTHCARE',
        'NIFTY CONSR DURBL',
        'NIFTY OIL AND GAS',
        'NIFTY COMMODITIES',
        'NIFTY CONSUMPTION',
        'NIFTY CPSE',
        'NIFTY ENERGY',
        'NIFTY INFRA',
        'NIFTY PSE'
    ];
    const allIndicesGroups = {
        'Qode Strategies': qodeStrategyIndices,
        'Broad Based Indices': broadBasedIndices,
        'Strategy Indices': strategyIndices,
        'Sectoral Indices': sectoralIndices
    };

    // Function to segregate and order indices into categories
    const segregateIndices = (rawData) => {
        // Create a map of rawData using indices as key
        const dataMap = new Map(rawData.map(item => [item.indices, item]));
        const combined = [];
        for (const [category, indices] of Object.entries(allIndicesGroups)) {
            indices.forEach(index => {
                const item = dataMap.get(index);
                if (item) {
                    combined.push({
                        ...item,
                        category
                    });
                } else {
                    combined.push({
                        indices: index,
                        direction: 'NONE',
                        nav: 'N/A',
                        currentDD: 'N/A',
                        peak: 'N/A',
                        dd10: false,
                        dd15: false,
                        dd20: false,
                        dd10_value: 'N/A',
                        dd15_value: 'N/A',
                        dd20_value: 'N/A',
                        category
                    });
                }
            });
        }
        return combined;
    };

    const fetchIndices = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${window.location.origin}/api/fetchIndex`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const result = await response.json();
            if (Array.isArray(result.data)) {
                const latestDate = result.data.length > 0
                    ? formatDate(result.data[0].date || result.date || new Date())
                    : formatDate(new Date());
                setDate(latestDate);
                // Map and sanitize data
                const filteredData = result.data.map(item => ({
                    ...item,
                    indices: item.indices || 'N/A',
                    currentDD: typeof item.currentDD === 'number' ? `${item.currentDD}%` : 'N/A',
                    nav: typeof item.nav === 'number' ? item.nav : 'N/A',
                    peak: typeof item.peak === 'number' ? item.peak : 'N/A',
                    dd10: Boolean(item.dd10),
                    dd15: Boolean(item.dd15),
                    dd20: Boolean(item.dd20),
                    dd10_value: typeof item.dd10_value === 'number' ? formatCurrency(item.dd10_value) : 'N/A',
                    dd15_value: typeof item.dd15_value === 'number' ? formatCurrency(item.dd15_value) : 'N/A',
                    dd20_value: typeof item.dd20_value === 'number' ? formatCurrency(item.dd20_value) : 'N/A',
                    direction: item.direction || 'NONE',
                }));
                setData(filteredData);
                setLastFetchTime(new Date());
            } else {
                setError('Invalid data structure or no data returned');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchIndices();
    }, []);

    // Sorting helper function
    const getSortedData = (items) => {
        const { key, direction } = sortConfig;
        if (!key) return items;
        const sortedItems = [...items].sort((a, b) => {
            let aValue = a[key];
            let bValue = b[key];
            // Convert strings to lowercase for comparison
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            } else if (key.includes('dd') && typeof aValue === 'string' && typeof bValue === 'string') {
                // For percentage strings
                aValue = aValue.endsWith('%') ? parseFloat(aValue) : 0;
                bValue = bValue.endsWith('%') ? parseFloat(bValue) : 0;
            }
            if (aValue < bValue) {
                return direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        return sortedItems;
    };

    // useMemo to combine, filter, and sort the data for performance
    const sortedData = useMemo(() => {
        const combined = segregateIndices(data);
        const filteredByGroup = selectedGroup === 'All'
            ? combined
            : combined.filter(item => item.category === selectedGroup);
        const finalFiltered = filteredByGroup.filter(item =>
            item.indices.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return getSortedData(finalFiltered);
    }, [data, sortConfig, selectedGroup, searchTerm]);

    // Sorting request handler
    const requestSort = (key) => {
        setSortConfig(prev => {
            let direction = 'ascending';
            if (prev.key === key && prev.direction === 'ascending') {
                direction = 'descending';
            }
            return { key, direction };
        });
    };

    // Render sort icon
    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending'
            ? <CaretUpFill className="ml-1 sort-icon" />
            : <CaretDownFill className="ml-1 sort-icon" />;
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

    // Render table view
    const renderTableView = () => (
        <div className="table-responsive">
            <Table bordered striped responsive className="elegant-table table-fixed">
                <colgroup>
                    <col style={{ width: '60px' }} />
                    <col style={{ width: '200px' }} />
                    <col style={{ width: '150px' }} />
                    <col style={{ width: '120px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '120px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '100px' }} />
                </colgroup>
                <thead className="sticky-header">
                    <tr>
                        <th style={{ cursor: 'pointer' }} onClick={() => requestSort('serialNo')}>
                            S.No {renderSortIcon('serialNo')}
                        </th>
                        <th style={{ cursor: 'pointer' }} onClick={() => requestSort('indices')}>
                            Indices {renderSortIcon('indices')}
                        </th>
                        <th style={{ cursor: 'pointer' }} onClick={() => requestSort('category')}>
                            Category {renderSortIcon('category')}
                        </th>
                        <th style={{ cursor: 'pointer' }} onClick={() => requestSort('nav')}>
                            Current NAV {renderSortIcon('nav')}
                            {date && <div style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>({date})</div>}
                        </th>
                        <th style={{ cursor: 'pointer' }} onClick={() => requestSort('currentDD')}>
                            Current DD {renderSortIcon('currentDD')}
                        </th>
                        <th style={{ cursor: 'pointer' }} onClick={() => requestSort('peak')}>
                            Peak {renderSortIcon('peak')}
                        </th>
                        <th style={{ cursor: 'pointer' }} onClick={() => requestSort('dd10')}>
                            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#dc3546' }}>10% </span>DD {renderSortIcon('dd10')}
                        </th>
                        <th style={{ cursor: 'pointer' }} onClick={() => requestSort('dd15')}>
                            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#dc3546' }}>15% </span>DD {renderSortIcon('dd15')}
                        </th>
                        <th style={{ cursor: 'pointer' }} onClick={() => requestSort('dd20')}>
                            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#dc3546' }}>20% </span>DD {renderSortIcon('dd20')}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((item, index) => (
                        <tr key={item.indices}>
                            <td>{index + 1}</td>
                            <td>{item.indices}</td>
                            <td>{item.category}</td>
                            <td>{item.nav !== 'N/A' ? formatCurrency(item.nav) : 'N/A'}</td>
                            <td>{item.currentDD}</td>
                            <td>{item.peak !== 'N/A' ? formatCurrency(item.peak) : 'N/A'}</td>
                            <td className={item.dd10 ? 'bg-true' : ''}>
                                {item.dd10 
                                    ? <OverlayTrigger placement="top" overlay={<Tooltip>Value: {item.dd10_value}</Tooltip>}>
                                        <span style={{ fontStyle: 'italic' }}>Done</span>
                                      </OverlayTrigger>
                                    : <span style={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 1)' }}>{item.dd10_value}</span>
                                }
                            </td>
                            <td className={item.dd15 ? 'bg-true' : ''}>
                                {item.dd15 
                                    ? <OverlayTrigger placement="top" overlay={<Tooltip>Value: {item.dd15_value}</Tooltip>}>
                                        <span style={{ fontStyle: 'italic' }}>Done</span>
                                      </OverlayTrigger>
                                    : <span style={{ fontWeight: item.dd10 ? 'bold' : 'normal', color: item.dd10 ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 1)' }}>{item.dd15_value}</span>
                                }
                            </td>
                            <td className={item.dd20 ? 'bg-true' : ''}>
                                {item.dd20 
                                    ? <OverlayTrigger placement="top" overlay={<Tooltip>Value: {item.dd20_value}</Tooltip>}>
                                        <span style={{ fontStyle: 'italic' }}>Done</span>
                                      </OverlayTrigger>
                                    : <span style={{ fontWeight: item.dd15 ? 'bold' : 'normal', color: item.dd15 ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 1)' }}>{item.dd20_value}</span>
                                }
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );

    // Render card view
    const renderCardView = () => (
        <div className="card-grid">
            {sortedData.map((item, index) => (
                <div key={item.indices} className="card mb-3">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{item.indices}</h5>
                        <Badge bg="info">{item.category}</Badge>
                    </div>
                    <div className="card-body">
                        <Row className="g-2">
                            {selectedColumns.map(colKey => {
                                const colDef = allCardColumns.find(col => col.key === colKey);
                                let value;
                                if (colKey === 'nav') {
                                    value = item.nav !== 'N/A' ? formatCurrency(item.nav) : 'N/A';
                                } else if (colKey === 'currentDD') {
                                    value = item.currentDD;
                                } else if (colKey === 'peak') {
                                    value = item.peak !== 'N/A' ? formatCurrency(item.peak) : 'N/A';
                                } else if (colKey === 'dd10') {
                                    value = item.dd10 ? 'Done' : item.dd10_value;
                                } else if (colKey === 'dd15') {
                                    value = item.dd15 ? 'Done' : item.dd15_value;
                                } else if (colKey === 'dd20') {
                                    value = item.dd20 ? 'Done' : item.dd20_value;
                                }
                                return (
                                    <Col key={colKey} xs={6} md={4}>
                                        <div className="p-2 border rounded text-center">
                                            <div className="small text-muted">{colDef.label}</div>
                                            <div className={ (colKey.startsWith('dd') && value !== 'Done' && parseFloat(value) < 0) ? 'text-danger' : '' }>
                                                {value}
                                            </div>
                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>
                    </div>
                </div>
            ))}
        </div>
    );

    // Function to export table view to Excel
    const exportToExcel = () => {
        const workbook = XLSX.utils.book_new();
        const transformData = (items) => {
            return items.map((item, index) => ({
                'S.No': index + 1,
                Indices: item.indices,
                Category: item.category,
                Direction: item.direction,
                'Current NAV': item.nav !== 'N/A' ? formatCurrency(item.nav) : 'N/A',
                'Current DD (%)': item.currentDD,
                Peak: item.peak !== 'N/A' ? formatCurrency(item.peak) : 'N/A',
                '10% DD': item.dd10 ? 'Done' : item.dd10_value,
                '15% DD': item.dd15 ? 'Done' : item.dd15_value,
                '20% DD': item.dd20 ? 'Done' : item.dd20_value,
            }));
        };
        const transformedData = transformData(sortedData);
        const worksheet = XLSX.utils.json_to_sheet(transformedData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Indices Drawdowns');
        const workbookOut = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([workbookOut], { type: 'application/octet-stream' });
        saveAs(blob, 'IndicesDrawdowns.xlsx');
    };

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center loading-spinner" style={{ height: '100vh' }}>
                <Spinner animation="border" role="status" variant="primary">
                    <span className="sr-only">Loading...</span>
                </Spinner>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="text-left my-4 elegant-title">Indices Drawdowns</h2>
            {error && <div className="alert alert-danger">{error}</div>}
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
                <Form className="mb-4">
                    <Row className="mb-3">
                        <Col xs={12} md={6} className="mb-2 mb-md-0">
                            <Form.Group controlId="searchIndex">
                                <Form.Label>Search Indices</Form.Label>
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
                        <Col xs={12} md={6}>
                            <Form.Group controlId="groupFilter">
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
                    </Row>
                    {viewMode === 'card' && (
                        <Row className="mb-3">
                            <Col xs={12}>
                                <Form.Label>Select Columns to Display</Form.Label>
                                <div className="d-flex flex-wrap gap-2">
                                    {allCardColumns.map(col => (
                                        <Form.Check
                                            key={col.key}
                                            type="checkbox"
                                            id={`column-${col.key}`}
                                            label={col.label}
                                            checked={selectedColumns.includes(col.key)}
                                            onChange={() => handleColumnSelection(col.key)}
                                            inline
                                        />
                                    ))}
                                </div>
                            </Col>
                        </Row>
                    )}
                    {/* If needed, additional filters (like date) can be added here */}
                </Form>
            )}
            <div className="mb-3 d-flex justify-content-end">
                {viewMode === 'table' && (
                    <Button variant="success" onClick={exportToExcel}>
                        Export to Excel
                    </Button>
                )}
            </div>
            {viewMode === 'card' ? renderCardView() : renderTableView()}
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

export default IndexTable;
