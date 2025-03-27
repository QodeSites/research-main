import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import {
    Container,
    Table,
    Spinner,
    Alert,
    Button,
    Form,
    Row,
    Col,
    Card,
    InputGroup,
    FormControl,
    Badge,
    ProgressBar
} from 'react-bootstrap';
import formatDate from 'utils/formatDate';
import { parse } from 'cookie';

const MonthlyReport = () => {
    // State for API and CSV data
    const [indicesData, setIndicesData] = useState(null);
    const [csvData, setCsvData] = useState([]);
    const [dataAsOf, setDataAsOf] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // File upload and upload status state
    const [fileName, setFileName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadMessage, setUploadMessage] = useState('');

    // Filter state for Year and Month
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');

    // Additional filters: group and search
    const [selectedGroup, setSelectedGroup] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Sorting states
    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');



    // Return periods to display
    const returnPeriods = ['1M', '3M', '6M', '1Y', '2Y', '3Y', '4Y', '5Y', 'Since Inception'];

    // Predefined groups for API data
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
    const predefinedGroups = {
        'Qode Strategies': qodeStrategyIndices,
        'Broad Based Indices': broadBasedIndices,
        'Strategy Indices': strategyIndices,
        'Sectoral Indices': sectoralIndices
    };

    // Build a key for localStorage based on selected year and month
    const getCsvKey = (year, month) => {
        return `uploadedCsvData_${year}_${month}`;
    };

    // On mount (or when selectedYear/selectedMonth change), load any stored CSV data
    useEffect(() => {
        if (selectedYear && selectedMonth) {
            const stored = localStorage.getItem(getCsvKey(selectedYear, selectedMonth));
            if (stored) {
                try {
                    setCsvData(JSON.parse(stored));
                } catch (e) {
                    console.error("Error parsing stored CSV data", e);
                }
            } else {
                setCsvData([]);
            }
        }
    }, [selectedYear, selectedMonth]);

    // --- API Data Fetching ---
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const payload = {};
            if (selectedYear && selectedMonth) {
                payload.year = selectedYear;
                payload.month = selectedMonth;
            }
            const response = await fetch('/api/monthly-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            console.log('result', result);
            if (response.ok) {
                setIndicesData(result.data);
                setDataAsOf(result.upperLimit);
            } else {
                setError(result.message || 'Failed to fetch data');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- CSV File Selection Handling ---
    // This function only parses the CSV file and saves it in state/localStorage.
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!selectedYear || !selectedMonth) {
            alert("Please select a Year and Month before selecting a CSV file.");
            return;
        }
        // Store the file name if desired
        // Parse CSV file with PapaParse and store in state/localStorage
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setCsvData(results.data);
                localStorage.setItem(getCsvKey(selectedYear, selectedMonth), JSON.stringify(results.data));
            }
        });
    };

    // --- CSV Upload Handling using XMLHttpRequest for progress ---
    const handleUploadCSV = () => {
        if (!csvData || csvData.length === 0) {
            alert("No CSV data available. Please select a CSV file first.");
            return;
        }
        if (!selectedYear || !selectedMonth) {
            alert("Please select a Year and Month.");
            return;
        }

        setUploading(true);
        setUploadMessage("Uploading CSV data to the database. Please wait...");
        setUploadProgress(0);

        // First check if data exists on the server
        fetch('/api/check-csv-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year: selectedYear, month: selectedMonth })
        })
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .then(result => {
                if (result.ok && result.data.exists) {
                    setUploadMessage("Data for the selected month and year already exists. Upload cancelled.");
                    setUploading(false);
                    return;
                }
                // Prepare data payload for upload
                const payload = JSON.stringify({
                    year: selectedYear,
                    month: selectedMonth,
                    data: csvData
                });

                // Use XMLHttpRequest for upload with progress events
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/upload-csv');
                xhr.setRequestHeader('Content-Type', 'application/json');

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        setUploadProgress(percentComplete);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        setUploadMessage("CSV data inserted successfully.");
                    } else {
                        setUploadMessage("Error inserting CSV data: " + xhr.responseText);
                    }
                    setUploading(false);
                };

                xhr.onerror = () => {
                    setUploadMessage("Error inserting CSV data. Please try again.");
                    setUploading(false);
                };

                xhr.send(payload);
            })
            .catch((err) => {
                console.error("Error checking CSV upload status:", err);
                alert("Could not verify if data already exists. Please try again later.");
                setUploading(false);
            });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        fetchData();
    };

    const handleReset = () => {
        setSelectedYear('');
        setSelectedMonth('');
        setIndicesData(null);
        setDataAsOf(null);
        setSortColumn(null);
        setSortDirection('asc');
        setCsvData([]);
        setSelectedGroup('All');
        setSearchTerm('');
        setFileName('');
        setUploadMessage('');
        // Optionally clear all stored CSV data if desired.
    };

    // --- Transform CSV Row ---
    // Now using the CSV "Group" column if provided.
    const transformCsvRow = (row) => {
        return {
            index: row["PMS Investment Approach(s)"] || row["Category"] || "Unknown",
            "1M": { value: row["1M"] || '-', date: '' },
            "3M": { value: row["3M"] || '-', date: '' },
            "6M": { value: row["6M"] || '-', date: '' },
            "1Y": { value: row["1Y"] || '-', date: '' },
            "2Y": { value: row["2Y"] || '-', date: '' },
            "3Y": { value: row["3Y"] || '-', date: '' },
            "4Y": { value: row["4Y"] || '-', date: '' },
            "5Y": { value: row["5Y"] || '-', date: '' },
            "Since Inception": { value: row["Since Inception"] || '-', date: '' },
            source: "CSV",
            group: row["Group"] || row["Category"] || "Other"
        };
    };

    // --- Combine API and CSV Data ---
    const combineIndicesData = () => {
        const apiRows = indicesData
            ? Object.keys(indicesData).map((key) => ({
                index: key,
                ...indicesData[key],
                source: "API"
            }))
            : [];
        const csvRows = csvData ? csvData.map(transformCsvRow) : [];
        return [...apiRows, ...csvRows];
    };

    let combinedIndices = combineIndicesData();

    // --- Assign Group ---
    const assignGroup = (item) => {
        if (item.source === "CSV") {
            return item.group;
        } else {
            if (qodeStrategyIndices.includes(item.index)) return "Qode Strategies";
            if (broadBasedIndices.includes(item.index)) return "Broad Based Indices";
            if (strategyIndices.includes(item.index)) return "Strategy Indices";
            if (sectoralIndices.includes(item.index)) return "Sectoral Indices";
            return "Other";
        }
    };

    combinedIndices = combinedIndices.map(item => ({
        ...item,
        group: assignGroup(item)
    }));

    // --- Group Filter Dropdown Options ---
    const predefinedGroupNames = Object.keys(predefinedGroups);
    const csvGroupNames = Array.from(new Set(csvData.map(row => (row["Group"] || row["Category"] || "Other"))));
    const allGroupOptions = Array.from(new Set([...predefinedGroupNames, ...csvGroupNames])).sort();

    // --- Apply Group and Search Filters ---
    const filteredIndices = combinedIndices.filter(item => {
        const matchGroup = selectedGroup === 'All' || item.group === selectedGroup;
        const matchSearch = item.index.toLowerCase().includes(searchTerm.toLowerCase());
        return matchGroup && matchSearch;
    });

    // --- Sorting ---
    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const getSortedIndices = (indices) => {
        if (!sortColumn) return indices;
        return [...indices].sort((a, b) => {
            let aValue, bValue;
            if (sortColumn === 'index') {
                aValue = a.index.toLowerCase();
                bValue = b.index.toLowerCase();
            } else if (sortColumn === 'group') {
                aValue = a.group.toLowerCase();
                bValue = b.group.toLowerCase();
            } else {
                aValue = a[sortColumn]?.value === '-' ? -Infinity : parseFloat(a[sortColumn]?.value || 0);
                bValue = b[sortColumn]?.value === '-' ? -Infinity : parseFloat(b[sortColumn]?.value || 0);
            }
            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const sortedIndices = getSortedIndices(filteredIndices);
    const displayDataAsOf = dataAsOf ? formatDate(dataAsOf) : null;

    return (
        <div className="p-4">
            <h1 className="mb-4">PMS Monthly Comparison</h1>

            {/* Filter Section */}
            <Card className="mb-4">
                <Card.Body>
                    <Form onSubmit={handleSubmit} className="mb-4">
                        <Row className="align-items-end">
                            <Col xs={12} sm={4} md={3}>
                                <Form.Group controlId="yearSelect">
                                    <Form.Label>Year</Form.Label>
                                    <Form.Control
                                        as="select"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                    >
                                        <option value="">Select Year</option>
                                        <option value="2025">2025</option>
                                        <option value="2024">2024</option>
                                        <option value="2023">2023</option>
                                        <option value="2022">2022</option>
                                        <option value="2021">2021</option>
                                        <option value="2020">2020</option>
                                        <option value="2019">2019</option>
                                        <option value="2018">2018</option>
                                        <option value="2017">2017</option>
                                        <option value="2016">2016</option>
                                        <option value="2015">2015</option>
                                        <option value="2014">2014</option>
                                        <option value="2013">2013</option>
                                        <option value="2012">2012</option>
                                        <option value="2011">2011</option>
                                        <option value="2010">2010</option>
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                            <Col xs={12} sm={4} md={3}>
                                <Form.Group controlId="monthSelect">
                                    <Form.Label>Month</Form.Label>
                                    <Form.Control
                                        as="select"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                    >
                                        <option value="">Select Month</option>
                                        <option value="1">January</option>
                                        <option value="2">February</option>
                                        <option value="3">March</option>
                                        <option value="4">April</option>
                                        <option value="5">May</option>
                                        <option value="6">June</option>
                                        <option value="7">July</option>
                                        <option value="8">August</option>
                                        <option value="9">September</option>
                                        <option value="10">October</option>
                                        <option value="11">November</option>
                                        <option value="12">December</option>
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                            <Col xs={12} sm={4} md={3}>
                                <Button variant="primary" type="submit" className="me-2">
                                    Submit
                                </Button>
                                <Button variant="secondary" type="button" onClick={handleReset}>
                                    Reset
                                </Button>
                            </Col>
                        </Row>
                    </Form>

                    {/* CSV File Selection */}
                    <Form.Group controlId="csvUpload" className="mb-3">
                        <Form.Label>Select CSV File</Form.Label>
                        <Form.Control type="file" accept=".csv" onChange={handleFileSelect} />
                        <Form.Text className="text-muted">
                            CSV must contain columns: Group, Category, PMS Investment Approach(s), 1M, 3M, 6M, 1Y, 2Y, 3Y, 5Y, Since Inception.
                        </Form.Text>
                        {fileName && <p className="mt-2">Selected file: {fileName}</p>}
                    </Form.Group>

                    {/* Upload CSV Button */}
                    <Button variant="success" onClick={handleUploadCSV} disabled={uploading || csvData.length === 0}>
                        {uploading ? 'Uploading... Please wait' : 'Upload CSV to Database'}
                    </Button>
                    {uploading && <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} className="mt-2" />}
                    {uploadMessage && <p className="mt-2">{uploadMessage}</p>}

                    {/* Toggle additional filters */}
                    <Button variant="outline-primary" onClick={() => setShowFilters(!showFilters)} className="mx-2">
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </Button>

                    {showFilters && (
                        <Row className="mt-3">
                            <Col xs={12} md={4} className="mb-2">
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
                            <Col xs={12} md={4} className="mb-2">
                                <Form.Group>
                                    <Form.Label>Filter by Group</Form.Label>
                                    <Form.Control
                                        as="select"
                                        value={selectedGroup}
                                        onChange={(e) => setSelectedGroup(e.target.value)}
                                    >
                                        <option value="All">All Groups</option>
                                        {allGroupOptions.map(group => (
                                            <option key={group} value={group}>{group}</option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                        </Row>
                    )}
                </Card.Body>
            </Card>

            {loading && (
                <Container className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                    <Spinner animation="border" variant="primary" />
                </Container>
            )}
            {error && (
                <Container className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                    <Alert variant="danger">{error}</Alert>
                </Container>
            )}

            {(indicesData || csvData.length > 0) && (
                <>
                    {dataAsOf && <p className="text-muted">Data as of: {formatDate(dataAsOf)}</p>}
                    <Table bordered hover responsive className="mb-4">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('S.No')} style={{ cursor: 'pointer' }}>
                                    S.No {sortColumn === 'S.No' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('index')} style={{ cursor: 'pointer' }}>
                                    Index {sortColumn === 'index' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('group')} style={{ cursor: 'pointer' }}>
                                    Group {sortColumn === 'group' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                {returnPeriods.map((period) => (
                                    <th key={period} onClick={() => handleSort(period)} style={{ cursor: 'pointer' }}>
                                        {period} {sortColumn === period && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {getSortedIndices(sortedIndices).map((item, idx) => (
                                <tr key={item.index} className={item.source === "CSV" ? "table-success" : ""}>
                                    <td>{idx + 1}</td>
                                    <td>{item.index}</td>
                                    <td>
                                        <Badge bg="info">{item.group}</Badge>
                                    </td>
                                    {returnPeriods.map((period) => (
                                        <td
                                            key={period}
                                            className={item[period] && item[period].value !== '-' && parseFloat(item[period].value) < 0 ? 'text-danger' : ''}
                                        >
                                            {item[period] && item[period].value ? item[period].value : '-'}
                                            {item[period] && item[period].value !== '-' ? '%' : ''}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </>
            )}
        </div>
    );
};

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

export default MonthlyReport;
