import { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert, Button, Form, Row, Col } from 'react-bootstrap';
import formatDate from 'utils/formatDate';

const ReturnsComparisonPage = () => {
    const [indicesData, setIndicesData] = useState(null);
    const [dataAsOf, setDataAsOf] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Sorting configuration for each table
    const [sortConfig, setSortConfig] = useState({
        qodeStrategies: { key: null, direction: 'asc' },
        broadBased: { key: null, direction: 'asc' },
        strategy: { key: null, direction: 'asc' },
        sectoral: { key: null, direction: 'asc' },
    });

    // Define the indices categories (same as IndicesPage)
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

    const segregateIndices = (data = {}) => {
        const createDefaultReturns = () => ({
            '1Y': '-',
            '2Y': '-',
            '3Y': '-',
            '4Y': '-',
            '5Y': '-',
            'CDR': '-'
        });

        const segregated = {
            qodeStrategies: {},
            broadBased: {},
            strategy: {},
            sectoral: {}
        };

        // Initialize with default values
        qodeStrategyIndices.forEach(index => {
            segregated.qodeStrategies[index] = createDefaultReturns();
        });
        broadBasedIndices.forEach(index => {
            segregated.broadBased[index] = createDefaultReturns();
        });
        strategyIndices.forEach(index => {
            segregated.strategy[index] = createDefaultReturns();
        });
        sectoralIndices.forEach(index => {
            segregated.sectoral[index] = createDefaultReturns();
        });

        // Populate with actual data, excluding qodeStrategies
        if (data) {
            Object.entries(data).forEach(([index, returns]) => {
                const processedReturns = {
                    '1Y': returns['1Y'] || '-',
                    '2Y': returns['2Y'] || '-',
                    '3Y': returns['3Y'] || '-',
                    '4Y': returns['4Y'] || '-',
                    '5Y': returns['5Y'] || '-',
                    'CDR': returns['CDR'] || '-'
                };

                if (broadBasedIndices.includes(index)) {
                    segregated.broadBased[index] = processedReturns;
                } else if (strategyIndices.includes(index)) {
                    segregated.strategy[index] = processedReturns;
                } else if (sectoralIndices.includes(index)) {
                    segregated.sectoral[index] = processedReturns;
                }
                // Intentionally exclude qodeStrategyIndices to keep them as '-'
            });
        }

        return segregated;
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

    const handleSort = (tableType, key) => {
        setSortConfig(prevConfig => {
            const currentConfig = prevConfig[tableType];
            let direction = 'asc';
            if (currentConfig.key === key && currentConfig.direction === 'asc') {
                direction = 'desc';
            }
            return {
                ...prevConfig,
                [tableType]: { key, direction }
            };
        });
    };

    const getSortedIndices = (indices, tableType) => {
        const { key, direction } = sortConfig[tableType];
        if (!key) return indices;

        const sortedEntries = [...Object.entries(indices)];

        sortedEntries.sort((a, b) => {
            let aValue, bValue;

            if (key === 'Index') {
                aValue = a[0].toUpperCase();
                bValue = b[0].toUpperCase();
                if (aValue < bValue) return direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return direction === 'asc' ? 1 : -1;
                return 0;
            } else {
                aValue = a[1][key] === '-' ? null : parseFloat(a[1][key]);
                bValue = b[1][key] === '-' ? null : parseFloat(b[1][key]);

                if (aValue === null && bValue === null) return 0;
                if (aValue === null) return 1;
                if (bValue === null) return -1;

                if (aValue < bValue) return direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return direction === 'asc' ? 1 : -1;
                return 0;
            }
        });

        return Object.fromEntries(sortedEntries);
    };

    const renderSortIndicator = (tableType, columnKey) => {
        const { key, direction } = sortConfig[tableType];
        if (key !== columnKey) return null;
        return direction === 'asc' ? ' ▲' : ' ▼';
    };

    const renderIndicesTable = (indices, title, tableType) => {
        const sortedIndices = getSortedIndices(indices, tableType);

        return (
            <>
                <h3 className="my-3 text-primary">{title}</h3>
                {dataAsOf && <p className="text-muted">Data as of: {formatDate(dataAsOf)}</p>}
                <div className="table-container">
                    <Table striped bordered hover responsive className="elegant-table table-fixed">
                        <colgroup>
                            <col style={{ width: '50px' }} /> {/* S.No column */}
                            <col style={{ width: '200px' }} /> {/* Index column */}
                            <col style={{ width: '100px' }} /> {/* 1Y Return */}
                            <col style={{ width: '100px' }} /> {/* 2Y Return */}
                            <col style={{ width: '100px' }} /> {/* 3Y Return */}
                            <col style={{ width: '100px' }} /> {/* 4Y Return */}
                            <col style={{ width: '100px' }} /> {/* 5Y Return */}
                            <col style={{ width: '100px' }} /> {/* CDR */}
                        </colgroup>
                        <thead className="sticky-header">
                            <tr>
                                <th
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleSort(tableType, 'S.No')}
                                >
                                    S.No{renderSortIndicator(tableType, 'S.No')}
                                </th>
                                <th
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleSort(tableType, 'Index')}
                                >
                                    Index{renderSortIndicator(tableType, 'Index')}
                                </th>
                                <th
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleSort(tableType, '1Y')}
                                >
                                    1Y Return{renderSortIndicator(tableType, '1Y')}
                                </th>
                                <th
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleSort(tableType, '2Y')}
                                >
                                    2Y Return{renderSortIndicator(tableType, '2Y')}
                                </th>
                                <th
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleSort(tableType, '3Y')}
                                >
                                    3Y Return{renderSortIndicator(tableType, '3Y')}
                                </th>
                                <th
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleSort(tableType, '4Y')}
                                >
                                    4Y Return{renderSortIndicator(tableType, '4Y')}
                                </th>
                                <th
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleSort(tableType, '5Y')}
                                >
                                    5Y Return{renderSortIndicator(tableType, '5Y')}
                                </th>
                                <th
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleSort(tableType, 'CDR')}
                                >
                                    CDR{renderSortIndicator(tableType, 'CDR')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(sortedIndices).map(([index, returns], idx) => (
                                <tr key={index}>
                                    <td className="s-no-column">{idx + 1}</td>
                                    <td className="index-column">{index}</td>
                                    <td className={returns['1Y'] !== '-' && parseFloat(returns['1Y']) < 0 ? 'text-danger' : ''}>
                                        {returns['1Y']}{returns['1Y'] !== '-' ? '%' : ''}
                                    </td>
                                    <td className={returns['2Y'] !== '-' && parseFloat(returns['2Y']) < 0 ? 'text-danger' : ''}>
                                        {returns['2Y']}{returns['2Y'] !== '-' ? '%' : ''}
                                    </td>
                                    <td className={returns['3Y'] !== '-' && parseFloat(returns['3Y']) < 0 ? 'text-danger' : ''}>
                                        {returns['3Y']}{returns['3Y'] !== '-' ? '%' : ''}
                                    </td>
                                    <td className={returns['4Y'] !== '-' && parseFloat(returns['4Y']) < 0 ? 'text-danger' : ''}>
                                        {returns['4Y']}{returns['4Y'] !== '-' ? '%' : ''}
                                    </td>
                                    <td className={returns['5Y'] !== '-' && parseFloat(returns['5Y']) < 0 ? 'text-danger' : ''}>
                                        {returns['5Y']}{returns['5Y'] !== '-' ? '%' : ''}
                                    </td>
                                    <td className={returns['CDR'] !== '-' && parseFloat(returns['CDR']) < 0 ? 'text-danger' : ''}>
                                        {returns['CDR']}{returns['CDR'] !== '-' ? '%' : ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
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

    const { qodeStrategies, broadBased, strategy, sectoral } = segregateIndices(indicesData);

    return (
        <div className="p-4">
            <h1 className="mb-4">Returns Comparison</h1>
            
            <Form onSubmit={handleDateSubmit} className="mb-4">
                <Row>
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Start Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>End Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4} className="d-flex align-items-end">
                        <Button 
                            variant="primary" 
                            type="submit"
                            disabled={!startDate || !endDate}
                        >
                            Calculate Custom Returns
                        </Button>
                    </Col>
                </Row>
            </Form>

            {renderIndicesTable(qodeStrategies, 'Qode Strategies', 'qodeStrategies')}
            {renderIndicesTable(broadBased, 'Broad Based Indices', 'broadBased')}
            {renderIndicesTable(strategy, 'Strategy Indices', 'strategy')}
            {renderIndicesTable(sectoral, 'Sectoral Indices', 'sectoral')}
        </div>
    );
};

export default ReturnsComparisonPage;
