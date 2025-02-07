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
    FormControl 
} from 'react-bootstrap';
import {
    GraphUpArrow,
    GraphDownArrow,
    DashCircleFill,
    CaretUpFill,
    CaretDownFill
} from 'react-bootstrap-icons';
import { formatCurrency } from 'utils/formatCurrency';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import formatDate from 'utils/formatDate';
import { parse } from 'cookie';

const IndexTable = () => {
    const [data, setData] = useState([]);
    const [date, setDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filtering and Searching
    const [selectedGroup, setSelectedGroup] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Single sorting configuration
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'ascending'
    });

    // New state for last fetch time
    const [lastFetchTime, setLastFetchTime] = useState(null);

    // Define the indices for each category in the desired order
    const qodeStrategyIndices = ['QAW', 'QTF', 'QGF', 'QFH'];
    const broadBasedIndices = [
        'NIFTY 50',
        'NIFTY 500',
        'NIFTY NEXT 50',
        'NIFTY MIDCAP 100',
        'NIFTY SMLCAP 250',
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
        const dataMap = new Map(rawData.map(item => [item.indices, item]));

        const combined = [];

        // Initialize combined array with all indices and their categories
        for (const [category, indices] of Object.entries(allIndicesGroups)) {
            indices.forEach(index => {
                const item = dataMap.get(index);
                if (item) {
                    combined.push({
                        ...item,
                        category
                    });
                } else {
                    // If data for the index is missing, initialize with default values
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
            // Fetch the most recent data (which is today's data)
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

                // Filter and sanitize the data
                const filteredData = result.data.map(item => ({
                    ...item,
                    indices: item.indices || 'N/A', // Ensure indices is a string
                    currentDD: typeof item.currentDD === 'number' ? `${item.currentDD}%` : 'N/A', // Ensure currentDD is a valid percentage string
                    nav: typeof item.nav === 'number' ? item.nav : 'N/A',
                    peak: typeof item.peak === 'number' ? item.peak : 'N/A',
                    dd10: Boolean(item.dd10),
                    dd15: Boolean(item.dd15),
                    dd20: Boolean(item.dd20),
                    dd10_value: typeof item.dd10_value === 'number' ? formatCurrency(item.dd10_value) : 'N/A',
                    dd15_value: typeof item.dd15_value === 'number' ? formatCurrency(item.dd15_value) : 'N/A',
                    dd20_value: typeof item.dd20_value === 'number' ? formatCurrency(item.dd20_value) : 'N/A',
                    direction: item.direction || 'NONE', // Ensure direction has a default value
                }));

                console.log('Filtered and Mapped Data:', filteredData); // Debugging

                setData(filteredData);
                setLastFetchTime(new Date()); // Update last fetch time
            } else {
                console.error('Invalid data structure or no data returned');
                setError('Invalid data structure or no data returned');
            }
        } catch (error) {
            console.error('Error fetching indices:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Sorting function for the unified table
    const getSortedData = (items) => {
        const { key, direction } = sortConfig;
        if (!key) return items;

        const sortedItems = [...items].sort((a, b) => {
            let aValue = a[key];
            let bValue = b[key];

            // Handle different data types
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                aValue = aValue ? 1 : 0;
                bValue = bValue ? 1 : 0;
            } else if (key.includes('dd') && typeof aValue === 'string' && typeof bValue === 'string') {
                // Convert percentage strings to numbers for comparison
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

    // Segregate and sort data using useMemo for performance optimization
    const sortedData = useMemo(() => {
        const combined = segregateIndices(data);

        // Apply Group Filter
        const filteredByGroup = selectedGroup === 'All' 
            ? combined 
            : combined.filter(item => item.category === selectedGroup);

        // Apply Search Filter
        const finalFilteredIndices = filteredByGroup.filter(item => 
            item.indices.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return getSortedData(finalFilteredIndices);
    }, [data, sortConfig, selectedGroup, searchTerm]);

    // Sorting request handler for the unified table
    const requestSort = (key) => {
        setSortConfig(prevConfig => {
            let direction = 'ascending';
            if (prevConfig.key === key && prevConfig.direction === 'ascending') {
                direction = 'descending';
            }
            return {
                key,
                direction
            };
        });
    };

    // Sorting icon renderer for the unified table
    const renderSortIcon = (key) => {
        const { key: sortedKey, direction } = sortConfig;
        if (sortedKey !== key) return null;
        return direction === 'ascending'
            ? <CaretUpFill className="ml-1 sort-icon" />
            : <CaretDownFill className="ml-1 sort-icon" />;
    };

    useEffect(() => {
        fetchIndices();
    }, []);

    // Function to render table headers for the unified table
    const renderTableHeader = () => (
        <tr>
            <th
                style={{ cursor: 'pointer' }}
                onClick={() => requestSort('serialNo')}
            >
                S.No {renderSortIcon('serialNo')}
            </th>
            <th
                style={{ cursor: 'pointer' }}
                onClick={() => requestSort('indices')}
            >
                Indices {renderSortIcon('indices')}
            </th>
            <th
                style={{ cursor: 'pointer' }}
                onClick={() => requestSort('category')}
            >
                Category {renderSortIcon('category')}
            </th>
            <th
                style={{ cursor: 'pointer' }}
                onClick={() => requestSort('nav')}
            >
                Current NAV {renderSortIcon('nav')}
                {date && <div style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>({date})</div>}
            </th>
            <th
                style={{ cursor: 'pointer' }}
                onClick={() => requestSort('currentDD')}
            >
                Current DD {renderSortIcon('currentDD')}
            </th>
            <th
                style={{ cursor: 'pointer' }}
                onClick={() => requestSort('peak')}
            >
                Peak {renderSortIcon('peak')}
            </th>
            <th
                style={{ cursor: 'pointer' }}
                onClick={() => requestSort('dd10')}
            >
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#dc3546' }}>10% </span>DD {renderSortIcon('dd10')}
            </th>
            <th
                style={{ cursor: 'pointer' }}
                onClick={() => requestSort('dd15')}
            >
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#dc3546' }}>15% </span>DD {renderSortIcon('dd15')}
            </th>
            <th
                style={{ cursor: 'pointer' }}
                onClick={() => requestSort('dd20')}
            >
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#dc3546' }}>20% </span>DD {renderSortIcon('dd20')}
            </th>
        </tr>
    );

    // Function to render table rows for the unified table
    const renderTableRows = () => (
        sortedData.map((item, index) => (
            <tr key={item.indices}>
                <td className="s-no-column">{index + 1}</td> {/* Serial Number */}
                <td>
                    {item.indices} &nbsp;
                </td>
                <td>{item.category}</td>
                <td>{item.nav !== 'N/A' ? formatCurrency(item.nav) : 'N/A'}</td>
                <td className="drawdown">
                    {item.currentDD}
                </td>
                <td>{item.peak !== 'N/A' ? formatCurrency(item.peak) : 'N/A'}</td>
                <td className={item.dd10 ? 'bg-true' : ''}>
                    {item.dd10 ? (
                        <OverlayTrigger
                            placement="top"
                            overlay={
                                <Tooltip>
                                    Value: {item.dd10_value}
                                </Tooltip>
                            }
                        >
                            <span
                                className="true-value"
                                style={{ fontStyle: 'italic' }}
                            >
                                Done
                            </span>
                        </OverlayTrigger>
                    ) : (
                        <span
                            style={{
                                fontWeight: 'bold',
                                color: 'rgba(0, 0, 0, 1)',
                            }}
                        >
                            {item.dd10_value}
                        </span>
                    )}
                </td>
                <td className={item.dd15 ? 'bg-true' : ''}>
                    {item.dd15 ? (
                        <OverlayTrigger
                            placement="top"
                            overlay={
                                <Tooltip>
                                    Value: {item.dd15_value}
                                </Tooltip>
                            }
                        >
                            <span
                                className="true-value"
                                style={{ fontStyle: 'italic' }}
                            >
                                Done
                            </span>
                        </OverlayTrigger>
                    ) : (
                        <span
                            style={{
                                fontWeight: item.dd10 ? 'bold' : 'normal',
                                color: item.dd10
                                    ? 'rgba(0, 0, 0, 0.8)'
                                    : 'rgba(0, 0, 0, 1)',
                            }}
                        >
                            {item.dd15_value}
                        </span>
                    )}
                </td>
                <td className={item.dd20 ? 'bg-true' : ''}>
                    {item.dd20 ? (
                        <OverlayTrigger
                            placement="top"
                            overlay={
                                <Tooltip>
                                    Value: {item.dd20_value}
                                </Tooltip>
                            }
                        >
                            <span
                                className="true-value"
                                style={{ fontStyle: 'italic' }}
                            >
                                Done
                            </span>
                        </OverlayTrigger>
                    ) : (
                        <span
                            style={{
                                fontWeight: item.dd15 ? 'bold' : 'normal',
                                color: item.dd15
                                    ? 'rgba(0, 0, 0, 0.8)'
                                    : 'rgba(0, 0, 0, 1)',
                            }}
                        >
                            {item.dd20_value}
                        </span>
                    )}
                </td>
            </tr>
        ))
    );

    // Function to export the unified table to Excel
    const exportToExcel = () => {
        // Create a new workbook
        const workbook = XLSX.utils.book_new();

        // Function to transform data for Excel
        const transformData = (items) => {
            return items.map((item, index) => ({
                'S.No': index + 1,
                Indices: item.indices,
                Category: item.category,
                'Direction': item.direction,
                'Current NAV': item.nav !== 'N/A' ? formatCurrency(item.nav) : 'N/A',
                'Current DD (%)': item.currentDD,
                Peak: item.peak !== 'N/A' ? formatCurrency(item.peak) : 'N/A',
                '10% DD': item.dd10 ? 'Done' : item.dd10_value,
                '15% DD': item.dd15 ? 'Done' : item.dd15_value,
                '20% DD': item.dd20 ? 'Done' : item.dd20_value,
            }));
        };

        // Transform data
        const transformedData = transformData(sortedData);

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(transformedData);

        // Append worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Indices Drawdowns');

        // Generate buffer
        const workbookOut = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        // Create a Blob from the buffer
        const blob = new Blob([workbookOut], { type: 'application/octet-stream' });

        // Trigger the download
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

            {!isLoading && (
                <>
                    {/* Controls: Search, Group Filter, Export */}
                    <Row className="mb-3 align-items-center">
                        <Col md={6}>
                            <Row>
                                <Col md={6}>
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
                                <Col md={6}>
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
                        </Col>
                        <Col md={6} className="d-flex justify-content-end">
                            <Button variant="success" onClick={exportToExcel}>
                                Export to Excel
                            </Button>
                        </Col>
                    </Row>

                    {/* Unified Table */}
                    <div className="table-container">
                        <Table bordered striped responsive className="elegant-table table-fixed">
                            <colgroup>
                                <col style={{ width: '60px' }} /> {/* S.No column */}
                                <col style={{ width: '200px' }} /> {/* Indices column */}
                                <col style={{ width: '150px' }} /> {/* Category column */}
                                <col style={{ width: '120px' }} /> {/* Current NAV */}
                                <col style={{ width: '100px' }} /> {/* Current DD */}
                                <col style={{ width: '120px' }} /> {/* Peak */}
                                <col style={{ width: '100px' }} /> {/* 10% DD */}
                                <col style={{ width: '100px' }} /> {/* 15% DD */}
                                <col style={{ width: '100px' }} /> {/* 20% DD */}
                            </colgroup>
                            <thead className="table-header sticky-header">
                                {renderTableHeader()}
                            </thead>
                            <tbody>
                                {renderTableRows()}
                            </tbody>
                        </Table>
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

    // If the auth cookie exists, render the page
    return { props: {} };
}
export default IndexTable;

