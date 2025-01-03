import { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert, Button } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ArrowUp, ArrowDown } from 'lucide-react';
import formatDate from 'utils/formatDate';

const IndicesPage = () => {
    const [indicesData, setIndicesData] = useState(null);
    const [dataAsOf, setDataAsOf] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Sorting state
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'ascending'
    });

    // Define the indices for each category in the desired order
    const qodeStrategyIndices = [
        'QAW',
        'QTF',
        'QGF',
        'QFH'
    ];

    const broadBasedIndices = [
        'NIFTY 50',
        'BSE 500',
        'NIFTY MIDCAP 100',
        'NIFTY SMALLCAP 250',
        'NIFTY MICROCAP 250'
    ];

    const strategyIndices = [
        'NSE 500 Momentum 50',
        'NSE 150 Midcap Momentum 50',
        'NSE 100 Low Volatility 30',
        'Gold ETF'
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

    // Segregate indices into categories maintaining the specified order
    const segregateIndices = (data = {}) => {
        const createDefaultReturns = () => ({
            '1M': '-',
            '3M': '-',
            '6M': '-',
            '1Y': '-',
            'Drawdown': '-'
        });

        const segregated = {
            qodeStrategies: {},
            broadBased: {},
            strategy: {},
            sectoral: {}
        };

        // Populate with all indices first, with default values
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

        // Override with actual data where available
        if (data) {
            Object.entries(data).forEach(([index, returns]) => {
                const processedReturns = {
                    '1M': returns['1M'] || '-',
                    '3M': returns['3M'] || '-',
                    '6M': returns['6M'] || '-',
                    '1Y': returns['1Y'] || '-',
                    'Drawdown': returns['Drawdown'] || '-'
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

    const renderIndicesTable = (indices, title) => {
        return (
            <>
                <h3 className="my-3 text-primary">{title}</h3>
                {dataAsOf && <p className="text-muted">Data as of: {formatDate(dataAsOf)}</p>}
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Index</th>
                            <th>1M Return</th>
                            <th>3M Return</th>
                            <th>6M Return</th>
                            <th>1Y Return</th>
                            <th>Drawdown</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(indices).map(([index, returns], idx) => (
                            <tr key={index}>
                                <td>{idx + 1}</td>
                                <td>{index}</td>
                                <td className={returns['1M'] !== '-' && parseFloat(returns['1M']) < 0 ? 'text-danger' : ''}>
                                    {returns['1M']}{returns['1M'] !== '-' ? '%' : ''}
                                </td>
                                <td className={returns['3M'] !== '-' && parseFloat(returns['3M']) < 0 ? 'text-danger' : ''}>
                                    {returns['3M']}{returns['3M'] !== '-' ? '%' : ''}
                                </td>
                                <td className={returns['6M'] !== '-' && parseFloat(returns['6M']) < 0 ? 'text-danger' : ''}>
                                    {returns['6M']}{returns['6M'] !== '-' ? '%' : ''}
                                </td>
                                <td className={returns['1Y'] !== '-' && parseFloat(returns['1Y']) < 0 ? 'text-danger' : ''}>
                                    {returns['1Y']}{returns['1Y'] !== '-' ? '%' : ''}
                                </td>
                                <td className="text-danger">
                                    {returns['Drawdown']}{returns['Drawdown'] !== '-' ? '%' : ''}
                                </td>
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