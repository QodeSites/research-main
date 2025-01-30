import { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert } from 'react-bootstrap';
import formatDate from 'utils/formatDate';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa'; // For sort icons

const IndicesPage = () => {
    const [indicesData, setIndicesData] = useState(null);
    const [dataAsOf, setDataAsOf] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Sorting states for each table
    const [sortConfigQode, setSortConfigQode] = useState({ key: null, direction: 'asc' });
    const [sortConfigBroad, setSortConfigBroad] = useState({ key: null, direction: 'asc' });
    const [sortConfigStrategy, setSortConfigStrategy] = useState({ key: null, direction: 'asc' });
    const [sortConfigSectoral, setSortConfigSectoral] = useState({ key: null, direction: 'asc' });

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

        // Populate with actual data
        if (data) {
            Object.entries(data).forEach(([index, returns]) => {
                const processedReturns = {
                    '1D': returns['1D'] || '-',
                    '2D': returns['2D'] || '-',
                    '3D': returns['3D'] || '-',
                    '1W': returns['1W'] || '-',
                    '1M': returns['1M'] || '-',
                    '3M': returns['3M'] || '-',
                    '6M': returns['6M'] || '-',
                    '9M': returns['9M'] || '-',
                    '1Y': returns['1Y'] || '-',
                    'DD': returns['Drawdown'] || '-'
                };

                if (qodeStrategyIndices.includes(index)) {
                    segregated.qodeStrategies[index] = processedReturns;
                } else if (broadBasedIndices.includes(index)) {
                    segregated.broadBased[index] = processedReturns;
                } else if (strategyIndices.includes(index)) {
                    segregated.strategy[index] = processedReturns;
                } else if (sectoralIndices.includes(index)) {
                    segregated.sectoral[index] = processedReturns;
                }
            });
        }

        return segregated;
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/indices');
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

    const getDisplayValue = (returns, period, isQodeStrategy) => {
        // Define the periods beyond which data should be hidden for Qode Strategies
        const periodsToHideForQode = ['3M', '6M', '9M', '1Y', 'DD'];

        if (isQodeStrategy && periodsToHideForQode.includes(period)) {
            return '-';
        }

        return returns[period] !== '-' ? `${returns[period]}%` : '-';
    };

    const handleSort = (sortConfig, setSortConfig, key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedIndices = (indices, sortConfig) => {
        if (!sortConfig.key) return indices;

        const sortedEntries = [...Object.entries(indices)].sort((a, b) => {
            const aValue = a[1][sortConfig.key];
            const bValue = b[1][sortConfig.key];

            // Handle '-' as null or 0
            const aNum = aValue === '-' ? (sortConfig.key === 'DD' ? 0 : 0) : parseFloat(aValue);
            const bNum = bValue === '-' ? (sortConfig.key === 'DD' ? 0 : 0) : parseFloat(bValue);

            if (aNum < bNum) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aNum > bNum) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return Object.fromEntries(sortedEntries);
    };

    const renderSortIcon = (sortConfig, key) => {
        if (sortConfig.key !== key) {
            return <FaSort />;
        }
        if (sortConfig.direction === 'asc') {
            return <FaSortUp />;
        }
        return <FaSortDown />;
    };

    const renderIndicesTable = (indices, title, sortConfig, setSortConfig) => {
        const isQodeStrategy = title === 'Qode Strategies';
        const allPeriods = ['1D', '2D', '3D', '1W', '1M', '3M', '6M', '9M', '1Y', 'DD'];
    
        // Apply sorting
        const sorted = sortedIndices(indices, sortConfig);
    
        return (
            <>
                <h3 className="my-3 text-primary">{title}</h3>
                {dataAsOf && <p className="text-muted">Data as of: {formatDate(dataAsOf)}</p>}
                <div className="table-container">
                    <Table striped bordered hover responsive className="table-fixed">
                        <colgroup>
                            <col style={{ width: '60px' }} /> {/* S.No column */}
                            <col style={{ width: '200px' }} /> {/* Index column */}
                            {allPeriods.map(() => (
                                <col key={Math.random()} style={{ width: '100px' }} /> // Period columns
                            ))}
                        </colgroup>
                        <thead>
                            <tr>
                                <th className="sticky-header fixed-width s-no-column">S.No</th>
                                <th className="sticky-header index-column">
                                    Index
                                    {/* Index column is not sortable */}
                                </th>
                                {allPeriods.map(period => (
                                    <th
                                        key={period}
                                        className="sticky-header fixed-width"
                                        onClick={() => handleSort(sortConfig, setSortConfig, period === 'DD' ? 'DD' : period)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {period === 'DD' ? 'Drawdown' : `${period}`} {renderSortIcon(sortConfig, period === 'DD' ? 'DD' : period)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(sorted).map(([index, returns], idx) => (
                                <tr key={index}>
                                    <td className="sticky-column fixed-width s-no-column">{idx + 1}</td>
                                    <td className="sticky-column index-column">{index}</td>
                                    {allPeriods.map(period => {
                                        const value = getDisplayValue(returns, period, isQodeStrategy);
                                        const numericValue = parseFloat(returns[period]);
                                        const isNegative = value !== '-' && !isNaN(numericValue) && numericValue < 0;
                                        const cellClass = isNegative ? 'text-danger' : '';
                                        return (
                                            <td key={period} className={cellClass + ' fixed-width'}>
                                                {value}
                                            </td>
                                        );
                                    })}
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
            <h1 className="mb-4">Indices Returns</h1>
            {renderIndicesTable(qodeStrategies, 'Qode Strategies', sortConfigQode, setSortConfigQode)}
            {renderIndicesTable(broadBased, 'Broad Based Indices', sortConfigBroad, setSortConfigBroad)}
            {renderIndicesTable(strategy, 'Strategy Indices', sortConfigStrategy, setSortConfigStrategy)}
            {renderIndicesTable(sectoral, 'Sectoral Indices', sortConfigSectoral, setSortConfigSectoral)}
        </div>
    );
};

export default IndicesPage;
