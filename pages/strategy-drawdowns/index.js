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

    // Sorting state
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'ascending'
    });

    // New state for last fetch time
    const [lastFetchTime, setLastFetchTime] = useState(null);

    // Define the indices for each category in the desired order
    const broadBasedIndices = [
        'NSE:NIFTY 50',
        'NSE:NIFTY 500',
        'NSE:NIFTY NEXT 50',
        // 'NSE:NIFTY 100',
        'NSE:NIFTY MIDCAP 100',
        'NSE:NIFTY SMLCAP 250',
        // 'NSE:NIFTY MICROCAP250'
    ];

    const sectoralIndices = [
        'NSE:NIFTY BANK',
        'NSE:NIFTY AUTO',
        'NSE:NIFTY FINANCIAL SVC',
        'NSE:NIFTY FMCG',
        'NSE:NIFTY IT',
        'NSE:NIFTY MEDIA',
        'NSE:NIFTY METAL',
        'NSE:NIFTY PHARMA',
        'NSE:NIFTY PSU BANK',
        'NSE:NIFTY PVT BANK',
        'NSE:NIFTY REALTY',
        'NSE:NIFTY HEALTHCARE',
        'NSE:NIFTY CONSR DURBL',
        'NSE:NIFTY NIFTY OIL AND GAS',
        'NSE:NIFTY COMMODITIES',
        'NSE:NIFTY CONSUMPTION',
        'NSE:NIFTY CPSE',
        'NSE:NIFTY ENERGY',
        'NSE:NIFTY INFRA',
        'NSE:NIFTY PSE'
    ];

    // Function to segregate and order indices into Broad Based and Sectoral
    const segregateIndices = (rawData) => {
        const dataMap = new Map(rawData.map(item => [item.indices, item]));

        const broadBased = broadBasedIndices
            .map(index => dataMap.get(index))
            .filter(item => item !== undefined);

        const sectoral = sectoralIndices
            .map(index => dataMap.get(index))
            .filter(item => item !== undefined);

        return { broadBased, sectoral };
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

    // Sorting function
    const sortedData = useMemo(() => {
        let sortableData = [...data];
        if (sortConfig.key !== null) {
            sortableData.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle different data types
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                    aValue = aValue ? 1 : 0;
                    bValue = bValue ? 1 : 0;
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        console.log('Sorted Data:', sortableData); // Debugging
        return sortableData;
    }, [data, sortConfig]);

    // Segregate sorted data
    const segregatedData = useMemo(() => {
        const result = segregateIndices(sortedData);
        console.log("Segregated Data: ", result); // Debugging the segregated data
        return result;
    }, [sortedData]);

    // Sorting request handler
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Sorting icon renderer
    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending'
            ? <CaretUpFill className="ml-1 sort-icon" />
            : <CaretDownFill className="ml-1 sort-icon" />;
    };

    useEffect(() => {
        fetchIndices();
    }, []);



    // Function to render table headers (including serial number column)
    const renderTableHeader = () => (
        <tr>
            <th style={{ cursor: 'pointer' }} onClick={() => requestSort('serialNo')}>
                S.No {renderSortIcon('serialNo')}
            </th>
            <th style={{ cursor: 'pointer' }} onClick={() => requestSort('indices')}>
                Indices {renderSortIcon('indices')}
            </th>
            <th style={{ cursor: 'pointer' }} onClick={() => requestSort('nav')}>
                <div className="nav-header">
                    Current NAV {renderSortIcon('nav')}
                    {date && <div className="nav-date"><strong>({date})</strong></div>}
                </div>
            </th>
            <th onClick={() => requestSort('currentDD')} style={{ cursor: 'pointer' }}>
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
    );

    // Function to render table rows (including serial number column)
    const renderTableRows = (items) => (
        items.map((item, index) => (
            <tr key={index} className="table-row">
                <td>{index + 1}</td> {/* Serial Number */}
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

        // Transform Broad Based Indices
        const broadBasedData = transformData(segregatedData.broadBased);
        const broadBasedWorksheet = XLSX.utils.json_to_sheet(broadBasedData);
        XLSX.utils.book_append_sheet(workbook, broadBasedWorksheet, 'Broad Based Indices');

        // Transform Sectoral Indices
        const sectoralData = transformData(segregatedData.sectoral);
        const sectoralWorksheet = XLSX.utils.json_to_sheet(sectoralData);
        XLSX.utils.book_append_sheet(workbook, sectoralWorksheet, 'Sectoral Indices');

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
            {lastFetchTime && (
                <p className="text-muted">
                    Last Fetch: {formatDate(lastFetchTime).toLocaleString()}
                </p>
            )}

            {error && <div className="alert alert-danger">{error}</div>}

            {!isLoading && (
                <>
                    <div className="d-flex gap-2 justify-content-end mb-3 align-items-center">
                        <Button variant="success" onClick={exportToExcel}>
                            Export to Excel
                        </Button>
                    </div>
                    {/* Broad Based Indices */}
                    {segregatedData.broadBased.length > 0 && (
                        <>
                            <h3 className="my-3 text-primary">Broad Based Indices</h3>
                            {/* Data As Of label for Broad Based Indices */}
                            {date && (
                                <p className="text-muted">
                                    Data as of: {date}
                                </p>
                            )}
                            <Table bordered striped responsive className="elegant-table">
                                <thead className="table-header">
                                    {renderTableHeader()}
                                </thead>
                                <tbody>
                                    {renderTableRows(segregatedData.broadBased)}
                                </tbody>
                            </Table>
                        </>
                    )}

                    {/* Sectoral Indices */}
                    {segregatedData.sectoral.length > 0 && (
                        <>
                            <h3 className="my-3 text-primary">Sectoral Indices</h3>
                            {/* Data As Of label for Sectoral Indices */}
                            {date && (
                                <p className="text-muted">
                                    Data as of: {date}
                                </p>
                            )}
                            <Table bordered striped responsive className="elegant-table">
                                <thead className="table-header">
                                    {renderTableHeader()}
                                </thead>
                                <tbody>
                                    {renderTableRows(segregatedData.sectoral)}
                                </tbody>
                            </Table>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default IndexTable;
