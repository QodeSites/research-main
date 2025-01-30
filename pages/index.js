import React, { useEffect, useState, useMemo } from 'react';
import { Button, OverlayTrigger, Spinner, Table, Tooltip } from 'react-bootstrap';
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

const IndexTable = () => {
    const [data, setData] = useState([]);
    const [date, setDate] = useState();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Separate sorting configurations for each table
    const [sortConfig, setSortConfig] = useState({
        qodeStrategies: { key: null, direction: 'ascending' },
        strategy: { key: null, direction: 'ascending' },
        broadBased: { key: null, direction: 'ascending' },
        sectoral: { key: null, direction: 'ascending' },
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

    // Function to segregate and order indices into categories
    const segregateIndices = (rawData) => {
        const dataMap = new Map(rawData.map(item => [item.indices, item]));

        const broadBased = broadBasedIndices
            .map(index => dataMap.get(index))
            .filter(item => item !== undefined);

        const sectoral = sectoralIndices
            .map(index => dataMap.get(index))
            .filter(item => item !== undefined);

        const strategy = strategyIndices
            .map(index => dataMap.get(index))
            .filter(item => item !== undefined);

        const qodeStrategies = qodeStrategyIndices
            .map(index => dataMap.get(index))
            .filter(item => item !== undefined);

        return { broadBased, sectoral, strategy, qodeStrategies };
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
                    currentDD: isNaN(item.currentDD) ? 0 : item.currentDD, // Ensure currentDD is a valid number
                    nav: isNaN(item.nav) ? 0 : item.nav,
                    peak: isNaN(item.peak) ? 0 : item.peak,
                    dd10: Boolean(item.dd10),
                    dd15: Boolean(item.dd15),
                    dd20: Boolean(item.dd20),
                    dd10_value: isNaN(item.dd10_value) ? 0 : item.dd10_value,
                    dd15_value: isNaN(item.dd15_value) ? 0 : item.dd15_value,
                    dd20_value: isNaN(item.dd20_value) ? 0 : item.dd20_value,
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

    // Sorting function for individual tables
    const getSortedData = (items, tableType) => {
        const config = sortConfig[tableType];
        if (!config.key) return items;

        const sortedItems = [...items].sort((a, b) => {
            let aValue = a[config.key];
            let bValue = b[config.key];

            // Handle different data types
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                aValue = aValue ? 1 : 0;
                bValue = bValue ? 1 : 0;
            }

            if (aValue < bValue) {
                return config.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return config.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });

        return sortedItems;
    };

    // Segregate sorted data
    const segregatedData = useMemo(() => {
        const sortedSegregate = segregateIndices(data);
        return {
            qodeStrategies: getSortedData(sortedSegregate.qodeStrategies, 'qodeStrategies'),
            strategy: getSortedData(sortedSegregate.strategy, 'strategy'),
            broadBased: getSortedData(sortedSegregate.broadBased, 'broadBased'),
            sectoral: getSortedData(sortedSegregate.sectoral, 'sectoral'),
        };
    }, [data, sortConfig]);

    // Sorting request handler for individual tables
    const requestSort = (tableType, key) => {
        setSortConfig(prevConfig => {
            const currentConfig = prevConfig[tableType];
            let direction = 'ascending';
            if (currentConfig.key === key && currentConfig.direction === 'ascending') {
                direction = 'descending';
            }
            return {
                ...prevConfig,
                [tableType]: { key, direction }
            };
        });
    };

    // Sorting icon renderer for individual tables
    const renderSortIcon = (tableType, key) => {
        const config = sortConfig[tableType];
        if (config.key !== key) return null;
        return config.direction === 'ascending'
            ? <CaretUpFill className="ml-1 sort-icon" />
            : <CaretDownFill className="ml-1 sort-icon" />;
    };

    useEffect(() => {
        fetchIndices();
    }, []);

    // Function to render table headers (including serial number column) for individual tables
    const renderTableHeader = (tableType) => (
        <tr>
            <th
                style={{ cursor: 'pointer' }}
                onClick={() => requestSort(tableType, 'serialNo')}
                className="s-no-column"
            >
                S.No {renderSortIcon(tableType, 'serialNo')}
            </th>
            <th
                style={{ cursor: 'pointer' }}
                onClick={() => requestSort(tableType, 'indices')}
            >
                Indices {renderSortIcon(tableType, 'indices')}
            </th>
            <th
                style={{ cursor: 'pointer' }}
                onClick={() => requestSort(tableType, 'nav')}
            >
                Current NAV {renderSortIcon(tableType, 'nav')}
                {date && <div style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>({date})</div>}
            </th>
            <th
                style={{ cursor: 'pointer' }}
                onClick={() => requestSort(tableType, 'currentDD')}
            >
                Current DD {renderSortIcon(tableType, 'currentDD')}
            </th>
            <th
                style={{ cursor: 'pointer' }}
                onClick={() => requestSort(tableType, 'peak')}
            >
                Peak {renderSortIcon(tableType, 'peak')}
            </th>
            <th
                style={{ cursor: 'pointer' }}
                onClick={() => requestSort(tableType, 'dd10')}
            >
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#dc3546' }}>10% </span>DD {renderSortIcon(tableType, 'dd10')}
            </th>
            <th
                style={{ cursor: 'pointer' }}
                onClick={() => requestSort(tableType, 'dd15')}
            >
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#dc3546' }}>15% </span>DD {renderSortIcon(tableType, 'dd15')}
            </th>
            <th
                style={{ cursor: 'pointer' }}
                onClick={() => requestSort(tableType, 'dd20')}
            >
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#dc3546' }}>20% </span>DD {renderSortIcon(tableType, 'dd20')}
            </th>
        </tr>
    );

    // Function to render table rows (including serial number column)
    const renderTableRows = (items) => (
        items.map((item, index) => (
            <tr key={index} className="table-row">
                <td className="s-no-column">{index + 1}</td> {/* Serial Number */}
                <td>
                    {item.indices} &nbsp;
                    {item.direction === 'UP' ? (
                        <GraphUpArrow color="green" />
                    ) : item.direction === 'DOWN' ? (
                        <GraphDownArrow color="red" />
                    ) : (
                        <DashCircleFill color="gray" />
                    )}
                </td>
                <td>{isNaN(item.nav) ? 'N/A' : formatCurrency(item.nav)}</td>
                <td className="drawdown">
                    {isNaN(item.currentDD) ? 'N/A' : `${item.currentDD}%`}
                </td>
                <td>{isNaN(item.peak) ? 'N/A' : formatCurrency(item.peak)}</td>
                <td className={item.dd10 ? 'bg-true' : ''}>
                    {item.dd10 ? (
                        <OverlayTrigger
                            placement="top"
                            overlay={
                                <Tooltip>
                                    Value: {isNaN(item.dd10_value) ? 'N/A' : formatCurrency(item.dd10_value)}
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
                            {isNaN(item.dd10_value) ? 'N/A' : formatCurrency(item.dd10_value)}
                        </span>
                    )}
                </td>
                <td className={item.dd15 ? 'bg-true' : ''}>
                    {item.dd15 ? (
                        <OverlayTrigger
                            placement="top"
                            overlay={
                                <Tooltip>
                                    Value: {isNaN(item.dd15_value) ? 'N/A' : formatCurrency(item.dd15_value)}
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
                                fontWeight: item.dd10 ? 'bold' : item.dd20 ? 'lighter' : 'normal',
                                color: item.dd10
                                    ? 'rgba(0, 0, 0, 0.8)'
                                    : item.dd20
                                        ? 'rgba(0, 0, 0, 0.6)'
                                        : 'rgba(0, 0, 0, 1)',
                            }}
                        >
                            {isNaN(item.dd15_value) ? 'N/A' : formatCurrency(item.dd15_value)}
                        </span>
                    )}
                </td>
                <td className={item.dd20 ? 'bg-true' : ''}>
                    {item.dd20 ? (
                        <OverlayTrigger
                            placement="top"
                            overlay={
                                <Tooltip>
                                    Value: {isNaN(item.dd20_value) ? 'N/A' : formatCurrency(item.dd20_value)}
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
                                    : 'rgba(0, 0, 0, 0.6)',
                            }}
                        >
                            {isNaN(item.dd20_value) ? 'N/A' : formatCurrency(item.dd20_value)}
                        </span>
                    )}
                </td>
            </tr>
        ))
    );

    const exportToExcel = () => {
        // Create a new workbook
        const workbook = XLSX.utils.book_new();

        // Function to transform data for Excel
        const transformData = (items) => {
            return items.map(item => ({
                Indices: item.indices,
                Direction: item.direction,
                'Current NAV': isNaN(item.nav) ? 'N/A' : formatCurrency(item.nav),
                'Current DD (%)': isNaN(item.currentDD) ? 'N/A' : `${item.currentDD}%`,
                Peak: isNaN(item.peak) ? 'N/A' : formatCurrency(item.peak),
                '10% DD': item.dd10 ? 'Done' : isNaN(item.dd10_value) ? 'N/A' : formatCurrency(item.dd10_value),
                '15% DD': item.dd15 ? 'Done' : isNaN(item.dd15_value) ? 'N/A' : formatCurrency(item.dd15_value),
                '20% DD': item.dd20 ? 'Done' : isNaN(item.dd20_value) ? 'N/A' : formatCurrency(item.dd20_value),
            }));
        };

        // Transform each category's data
        const categories = [
            { data: segregatedData.qodeStrategies, name: 'Qode Strategies' },
            { data: segregatedData.strategy, name: 'Strategy Indices' },
            { data: segregatedData.broadBased, name: 'Broad Based Indices' },
            { data: segregatedData.sectoral, name: 'Sectoral Indices' },
        ];

        categories.forEach(category => {
            const transformedData = transformData(category.data);
            const worksheet = XLSX.utils.json_to_sheet(transformedData);
            XLSX.utils.book_append_sheet(workbook, worksheet, category.name);
        });

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

            {/* Display last fetch time */}
            {/* {lastFetchTime && (
                <p className="text-muted">
                    Last Fetch: {formatDate(lastFetchTime).toLocaleString()}
                </p>
            )} */}

            {error && <div className="alert alert-danger">{error}</div>}

            {!isLoading && (
                <>
                    <div className="d-flex gap-2 justify-content-end mb-3 align-items-center">
                        <Button variant="success" onClick={exportToExcel}>
                            Export to Excel
                        </Button>
                    </div>
                    {/* Qode Strategies */}
                    {segregatedData.qodeStrategies.length > 0 && (
                        <>
                            <h3 className="my-3 text-primary">Qode Strategies</h3>
                            {/* Data As Of label */}
                            {date && (
                                <p className="text-muted">
                                    Data as of: {date}
                                </p>
                            )}
                            <div className="table-container">
                                <Table bordered striped responsive className="elegant-table table-fixed">
                                    <colgroup>
                                        <col style={{ width: '60px' }} /> {/* S.No column */}
                                        <col style={{ width: '200px' }} /> {/* Indices column */}
                                        <col style={{ width: '120px' }} /> {/* Current NAV */}
                                        <col style={{ width: '100px' }} /> {/* Current DD */}
                                        <col style={{ width: '120px' }} /> {/* Peak */}
                                        <col style={{ width: '100px' }} /> {/* 10% DD */}
                                        <col style={{ width: '100px' }} /> {/* 15% DD */}
                                        <col style={{ width: '100px' }} /> {/* 20% DD */}
                                    </colgroup>
                                    <thead className="table-header">
                                        {renderTableHeader('qodeStrategies')}
                                    </thead>
                                    <tbody>
                                        {renderTableRows(segregatedData.qodeStrategies)}
                                    </tbody>
                                </Table>
                            </div>
                        </>
                    )}
                    {/* Strategy Indices */}
                    {segregatedData.strategy.length > 0 && (
                        <>
                            <h3 className="my-3 text-primary">Strategy Indices</h3>
                            {/* Data As Of label */}
                            {date && (
                                <p className="text-muted">
                                    Data as of: {date}
                                </p>
                            )}
                            <div className="table-container">
                                <Table bordered striped responsive className="elegant-table table-fixed">
                                    <colgroup>
                                        <col style={{ width: '60px' }} /> {/* S.No column */}
                                        <col style={{ width: '200px' }} /> {/* Indices column */}
                                        <col style={{ width: '120px' }} /> {/* Current NAV */}
                                        <col style={{ width: '100px' }} /> {/* Current DD */}
                                        <col style={{ width: '120px' }} /> {/* Peak */}
                                        <col style={{ width: '100px' }} /> {/* 10% DD */}
                                        <col style={{ width: '100px' }} /> {/* 15% DD */}
                                        <col style={{ width: '100px' }} /> {/* 20% DD */}
                                    </colgroup>
                                    <thead className="table-header">
                                        {renderTableHeader('strategy')}
                                    </thead>
                                    <tbody>
                                        {renderTableRows(segregatedData.strategy)}
                                    </tbody>
                                </Table>
                            </div>
                        </>
                    )}
                    {/* Broad Based Indices */}
                    {segregatedData.broadBased.length > 0 && (
                        <>
                            <h3 className="my-3 text-primary">Broad Based Indices</h3>
                            {/* Data As Of label */}
                            {date && (
                                <p className="text-muted">
                                    Data as of: {date}
                                </p>
                            )}
                            <div className="table-container">
                                <Table bordered striped responsive className="elegant-table table-fixed">
                                    <colgroup>
                                        <col style={{ width: '60px' }} /> {/* S.No column */}
                                        <col style={{ width: '200px' }} /> {/* Indices column */}
                                        <col style={{ width: '120px' }} /> {/* Current NAV */}
                                        <col style={{ width: '100px' }} /> {/* Current DD */}
                                        <col style={{ width: '120px' }} /> {/* Peak */}
                                        <col style={{ width: '100px' }} /> {/* 10% DD */}
                                        <col style={{ width: '100px' }} /> {/* 15% DD */}
                                        <col style={{ width: '100px' }} /> {/* 20% DD */}
                                    </colgroup>
                                    <thead className="table-header">
                                        {renderTableHeader('broadBased')}
                                    </thead>
                                    <tbody>
                                        {renderTableRows(segregatedData.broadBased)}
                                    </tbody>
                                </Table>
                            </div>
                        </>
                    )}
                    {/* Sectoral Indices */}
                    {segregatedData.sectoral.length > 0 && (
                        <>
                            <h3 className="my-3 text-primary">Sectoral Indices</h3>
                            {/* Data As Of label */}
                            {date && (
                                <p className="text-muted">
                                    Data as of: {date}
                                </p>
                            )}
                            <div className="table-container">
                                <Table bordered striped responsive className="elegant-table table-fixed">
                                    <colgroup>
                                        <col style={{ width: '60px' }} /> {/* S.No column */}
                                        <col style={{ width: '200px' }} /> {/* Indices column */}
                                        <col style={{ width: '120px' }} /> {/* Current NAV */}
                                        <col style={{ width: '100px' }} /> {/* Current DD */}
                                        <col style={{ width: '120px' }} /> {/* Peak */}
                                        <col style={{ width: '100px' }} /> {/* 10% DD */}
                                        <col style={{ width: '100px' }} /> {/* 15% DD */}
                                        <col style={{ width: '100px' }} /> {/* 20% DD */}
                                    </colgroup>
                                    <thead className="table-header">
                                        {renderTableHeader('sectoral')}
                                    </thead>
                                    <tbody>
                                        {renderTableRows(segregatedData.sectoral)}
                                    </tbody>
                                </Table>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default IndexTable;
