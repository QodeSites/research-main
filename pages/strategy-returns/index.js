import { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert } from 'react-bootstrap';
import formatDate from 'utils/formatDate';

const IndicesPage = () => {
    const [indicesData, setIndicesData] = useState(null);
    const [dataAsOf, setDataAsOf] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const renderIndicesTable = (indices, title) => {
        const isQodeStrategy = title === 'Qode Strategies';
        const allPeriods = ['1D', '2D', '3D', '1W', '1M', '3M', '6M', '9M', '1Y', 'DD'];

        return (
            <>
                <h3 className="my-3 text-primary">{title}</h3>
                {dataAsOf && <p className="text-muted">Data as of: {formatDate(dataAsOf)}</p>}
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Index</th>
                            {allPeriods.map(period => (
                                <th key={period}>
                                    {period === 'DD' ? 'Drawdown' : `${period} Return`}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(indices).map(([index, returns], idx) => (
                            <tr key={index}>
                                <td>{idx + 1}</td>
                                <td>{index}</td>
                                {allPeriods.map(period => {
                                    const value = getDisplayValue(returns, period, isQodeStrategy);
                                    const isNegative = value !== '-' && parseFloat(returns[period]) < 0;
                                    const cellClass = isNegative ? 'text-danger' : '';
                                    return (
                                        <td key={period} className={cellClass}>
                                            {value}
                                        </td>
                                    );
                                })}
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

    const { qodeStrategies, broadBased, strategy, sectoral } = segregateIndices(indicesData);

    return (
        <div className="p-4">
            <h1 className="mb-4">Indices Returns</h1>
            {renderIndicesTable(qodeStrategies, 'Qode Strategies')}
            {renderIndicesTable(broadBased, 'Broad Based Indices')}
            {renderIndicesTable(strategy, 'Strategy Indices')}
            {renderIndicesTable(sectoral, 'Sectoral Indices')}
        </div>
    );
};

export default IndicesPage;
