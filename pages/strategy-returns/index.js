import { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert, Button } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ArrowUp, ArrowDown } from 'lucide-react';

const IndicesPage = () => {
    const [indicesData, setIndicesData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // New state for sorting
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'ascending'
    });

    // Define the indices for each category
    const broadBasedIndices = [
        'NSE:NIFTY 50',
        'NSE:NIFTY NEXT 50',
        'NSE:NIFTY 100',
        'NSE:NIFTY 500',
        'NSE:NIFTY MIDCAP 100',
        'NSE:NIFTY SMLCAP 250',
        'NSE:NIFTY MICROCAP250'
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

    // Segregate indices into Broad Based and Sectoral
    const segregateIndices = (data) => {
        const broadBased = {};
        const sectoral = {};

        Object.keys(data).forEach(index => {
            if (broadBasedIndices.includes(index)) {
                broadBased[index] = data[index];
            }
            if (sectoralIndices.includes(index)) {
                sectoral[index] = data[index];
            }
        });

        return { broadBased, sectoral };
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/indices');
                const result = await response.json();
                if (response.ok) {
                    setIndicesData(result.data);
                } else {
                    setError(result.message || 'Failed to fetch data');
                }
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const exportToExcel = () => {
        // Create a new workbook
        const workbook = XLSX.utils.book_new();

        // Function to transform data for Excel
        const transformData = (indices) => {
            return Object.entries(indices).map(([index, returns]) => ({
                Index: index,
                '10D Return': `${returns['10D']}%`,
                '1W Return': `${returns['1W']}%`,
                '1M Return': `${returns['1M']}%`,
                '3M Return': `${returns['3M']}%`,
                '6M Return': `${returns['6M']}%`,
                '9M Return': `${returns['9M']}%`,
                '1Y Return': `${returns['1Y']}%`
            }));
        };

        // If no data, return early
        if (!indicesData) return;

        // Segregate indices
        const { broadBased, sectoral } = segregateIndices(indicesData);

        // Create worksheets
        const broadBasedWorksheet = XLSX.utils.json_to_sheet(transformData(broadBased));
        XLSX.utils.book_append_sheet(workbook, broadBasedWorksheet, 'Broad Based Indices');

        const sectoralWorksheet = XLSX.utils.json_to_sheet(transformData(sectoral));
        XLSX.utils.book_append_sheet(workbook, sectoralWorksheet, 'Sectoral Indices');

        // Generate buffer
        const workbookOut = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        // Create a Blob from the buffer
        const blob = new Blob([workbookOut], { type: 'application/octet-stream' });

        // Trigger the download
        saveAs(blob, 'IndicesReturns.xlsx');
    };

    // Function to handle sorting
    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Function to sort indices
    const sortIndices = (indices) => {
        if (!sortConfig.key) return indices;

        return Object.fromEntries(
            Object.entries(indices).sort((a, b) => {
                const [indexA, returnsA] = a;
                const [indexB, returnsB] = b;

                // Special handling for Index column
                if (sortConfig.key === 'Index') {
                    return sortConfig.direction === 'ascending' 
                        ? indexA.localeCompare(indexB) 
                        : indexB.localeCompare(indexA);
                }

                // Handle return columns
                const valueA = parseFloat(returnsA[sortConfig.key.replace(' Return', '')]);
                const valueB = parseFloat(returnsB[sortConfig.key.replace(' Return', '')]);

                if (valueA === valueB) return 0;
                
                return sortConfig.direction === 'ascending'
                    ? valueA - valueB
                    : valueB - valueA;
            })
        );
    };

    // Render function for indices table
    const renderIndicesTable = (indices, title) => {
        // Apply sorting
        const sortedIndices = sortIndices(indices);

        // Sorting header rendering function
        const renderSortHeader = (key, label) => {
            return (
                <th 
                    onClick={() => handleSort(key)} 
                    className="text-nowrap align-middle position-relative"
                    style={{ 
                        cursor: 'pointer', 
                        userSelect: 'none',
                        paddingRight: '20px'
                    }}
                >
                    {label}
                    <div 
                        className="position-absolute" 
                        style={{ 
                            right: '4px', 
                            top: '50%', 
                            transform: 'translateY(-50%)' 
                        }}
                    >
                        {sortConfig.key === key && (
                            sortConfig.direction === 'ascending' 
                                ? <ArrowUp size={14} /> 
                                : <ArrowDown size={14} />
                        )}
                    </div>
                </th>
            );
        };

        return (
            <>
                <h3 className="my-3 text-primary">{title}</h3>
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            {renderSortHeader('Index', 'Index')}
                            {renderSortHeader('10D Return', '10D Return')}
                            {renderSortHeader('1W Return', '1W Return')}
                            {renderSortHeader('1M Return', '1M Return')}
                            {renderSortHeader('3M Return', '3M Return')}
                            {renderSortHeader('6M Return', '6M Return')}
                            {renderSortHeader('9M Return', '9M Return')}
                            {renderSortHeader('1Y Return', '1Y Return')}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(sortedIndices).map(([index, returns]) => (
                            <tr key={index}>
                                <td>{index}</td>
                                <td>{returns['10D']}%</td>
                                <td>{returns['1W']}%</td>
                                <td>{returns['1M']}%</td>
                                <td>{returns['3M']}%</td>
                                <td>{returns['6M']}%</td>
                                <td>{returns['9M']}%</td>
                                <td>{returns['1Y']}%</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </>
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

    // Segregate indices
    const { broadBased, sectoral } = segregateIndices(indicesData);

    return (
        <div className="p-4">
            <h1 className="mb-4">Indices Returns</h1>
            
            <div className="d-flex justify-content-end mb-3">
                <Button variant="success" onClick={exportToExcel}>
                    Export to Excel
                </Button>
            </div>

            {/* Broad Based Indices */}
            {renderIndicesTable(broadBased, 'Broad Based Indices')}

            {/* Sectoral Indices */}
            {renderIndicesTable(sectoral, 'Sectoral Indices')}
        </div>
    );
};

export default IndicesPage;