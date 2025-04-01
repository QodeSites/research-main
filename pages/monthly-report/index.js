import { useState } from "react";
import Papa from "papaparse";
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
  ProgressBar,
} from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import formatDate from "utils/formatDate";
import { parse } from 'cookie';


const MonthlyReport = () => {
  const [indicesData, setIndicesData] = useState(null);
  const [dataAsOf, setDataAsOf] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [fileName, setFileName] = useState("");
  const [parsedCsv, setParsedCsv] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState("");

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const [selectedGroup, setSelectedGroup] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tableSearchTerm, setTableSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const returnPeriods = [
    "1M",
    "3M",
    "6M",
    "1Y",
    "2Y",
    "3Y",
    "4Y",
    "5Y",
    "Since Inception",
  ];

  const qodeStrategyIndices = ["QAW", "QTF", "QGF", "QFH"];
  const broadBasedIndices = [
    "NIFTY 50",
    "BSE500",
    "NIFTY MIDCAP 100",
    "NIFTY SMLCAP 250",
    "NIFTY MICROCAP250",
  ];
  const strategyIndices = [
    "NIFTYM150MOMNTM50",
    "NIFTY100 LOWVOL30",
    "NIFTY200MOMENTM30",
    "GOLDBEES",
  ];
  const sectoralIndices = [
    "NIFTY AUTO",
    "NIFTY BANK",
    "NIFTY COMMODITIES",
    "NIFTY CONSR DURBL",
    "NIFTY CONSUMPTION",
    "NIFTY CPSE",
    "NIFTY ENERGY",
    "NIFTY FMCG",
    "NIFTY HEALTHCARE",
    "NIFTY INFRA",
    "NIFTY IT",
    "NIFTY MEDIA",
    "NIFTY METAL",
    "NIFTY MNC",
    "NIFTY PHARMA",
    "NIFTY PSU BANK",
    "NIFTY PVT BANK",
    "NIFTY REALTY",
  ];
  const predefinedGroups = {
    "Qode Strategies": qodeStrategyIndices,
    "Broad Based Indices": broadBasedIndices,
    "Strategy Indices": strategyIndices,
    "Sectoral Indices": sectoralIndices,
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {};
      if (selectedYear && selectedMonth) {
        payload.year = selectedYear;
        payload.month = selectedMonth;
      }
      const response = await fetch("/api/monthly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok) {
        const combinedData = { ...result.tblresearchData, ...result.csvData };
        setIndicesData(combinedData);
        setDataAsOf(result.upperLimit);
      } else {
        setError(result.message || "Failed to fetch data");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!selectedYear || !selectedMonth) {
      alert("Please select a Year and Month before selecting a CSV file.");
      return;
    }
    setFileName(file.name);
    setUploadMessage("");
    setParsedCsv([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const { data, meta, errors } = results;
        if (errors.length > 0) {
          setUploadMessage(`CSV parsing error: ${errors[0].message}`);
          return;
        }
        const expectedColumns = [
          "Category",
          "PMS Name",
          "1M",
          "3M",
          "6M",
          "1Y",
          "2Y",
          "3Y",
          "4Y",
          "5Y",
          "Since Inception",
          "year",
          "month",
        ];
        const actualColumns = meta.fields || [];
        const missingColumns = expectedColumns.filter(
          (col) => !actualColumns.includes(col)
        );
        const extraColumns = actualColumns.filter(
          (col) => !expectedColumns.includes(col)
        );
        if (missingColumns.length > 0 || extraColumns.length > 0) {
          let errorMsg = "";
          if (missingColumns.length > 0) {
            errorMsg += `Missing columns: ${missingColumns.join(", ")}. `;
          }
          if (extraColumns.length > 0) {
            errorMsg += `Unexpected columns: ${extraColumns.join(", ")}. `;
          }
          setUploadMessage(
            `Invalid CSV format: ${errorMsg}Expected columns: ${expectedColumns.join(
              ", "
            )}`
          );
          return;
        }
        const validData = [];
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          if (!row["Category"] && !row["PMS Name"]) {
            setUploadMessage(
              `Row ${i + 1}: Must provide at least one of 'Category' or 'PMS Name'.`
            );
            return;
          }
          const perfColumns = [
            "1M",
            "3M",
            "6M",
            "1Y",
            "2Y",
            "3Y",
            "4Y",
            "5Y",
            "Since Inception",
          ];
          for (const col of perfColumns) {
            const value = row[col]?.trim();
            if (
              value &&
              value !== "-" &&
              isNaN(parseFloat(value.replace("%", "")))
            ) {
              setUploadMessage(
                `Row ${i + 1}, Column ${col}: Invalid numeric value '${value}'. Must be a number or '-'.`
              );
              return;
            }
          }
          validData.push(row);
        }
        setParsedCsv(validData);
        setUploadMessage("CSV file parsed successfully. Ready to upload.");
      },
      error: (error) => {
        setUploadMessage(`Error parsing CSV: ${error.message}`);
      },
    });
  };

  const handleUploadCSV = () => {
    if (!parsedCsv || parsedCsv.length === 0) {
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
    fetch("/api/check-csv-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: selectedYear, month: selectedMonth }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then((result) => {
        if (result.ok && result.data.exists) {
          setUploadMessage(
            "Data for the selected month and year already exists. Upload cancelled."
          );
          setUploading(false);
          return;
        }
        const payload = JSON.stringify({
          year: selectedYear,
          month: selectedMonth,
          data: parsedCsv,
        });
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload-csv");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round(
              (event.loaded / event.total) * 100
            );
            setUploadProgress(percentComplete);
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadMessage("CSV data inserted successfully.");
          } else {
            const response = JSON.parse(xhr.responseText);
            setUploadMessage(`Error: ${response.message}`);
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
    setSelectedYear("");
    setSelectedMonth("");
    setIndicesData(null);
    setDataAsOf(null);
    setSortColumn(null);
    setSortDirection("asc");
    setParsedCsv([]);
    setSelectedGroup([]);
    setSearchTerm("");
    setTableSearchTerm("");
    setFileName("");
    setUploadMessage("");
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const combinedArray = indicesData
    ? Object.keys(indicesData).map((key) => {
        const item = indicesData[key];
        let group = "Other";
        for (const [groupName, indices] of Object.entries(predefinedGroups)) {
          if (indices.includes(key)) {
            group = groupName;
            break;
          }
        }
        return {
          ...item,
          index: key,
          group: item.group || group,
        };
      })
    : [];

  const getSortedIndices = (indices) => {
    // If no sort column is selected, prioritize "Qode Strategies" at the top
    if (!sortColumn) {
      const qodeStrategies = indices.filter(
        (item) => item.group === "Qode Strategies"
      );
      const others = indices.filter((item) => item.group !== "Qode Strategies");
      return [...qodeStrategies, ...others];
    }

    // When sorting is applied, sort all indices together without prioritization
    return [...indices].sort((a, b) => {
      let aValue, bValue;
      if (sortColumn === "index") {
        aValue = a.index.toLowerCase();
        bValue = b.index.toLowerCase();
      } else if (sortColumn === "group") {
        aValue = (a.group || "").toLowerCase();
        bValue = (b.group || "").toLowerCase();
      } else if (sortColumn === "S.No") {
        aValue = a.index;
        bValue = b.index;
      } else {
        aValue =
          a[sortColumn]?.value === "-"
            ? -Infinity
            : parseFloat(a[sortColumn]?.value || 0);
        bValue =
          b[sortColumn]?.value === "-"
            ? -Infinity
            : parseFloat(b[sortColumn]?.value || 0);
      }
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const uniqueCsvGroups = [
    ...new Set(combinedArray.map((item) => item.group)),
  ].filter(
    (group) => !Object.keys(predefinedGroups).includes(group) && group !== "Other"
  );

  const predefinedGroupsWithoutQode = Object.keys(predefinedGroups).filter(
    (group) => group !== "Qode Strategies"
  );
  const allGroupOptions = [
    "Qode Strategies",
    ...predefinedGroupsWithoutQode.sort(),
    ...uniqueCsvGroups.sort(),
  ];

  const filteredIndices = combinedArray.filter((item) => {
    const matchGroup =
      selectedGroup.length === 0 ||
      selectedGroup.includes(item.group) ||
      selectedGroup.some(
        (group) =>
          predefinedGroups[group] && predefinedGroups[group].includes(item.index)
      );
    const matchSearch = item.index
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchGroup && matchSearch;
  });

  const sortedIndices = getSortedIndices(filteredIndices);

  const tableFilteredIndices = sortedIndices.filter((item) =>
    item.index.toLowerCase().includes(tableSearchTerm.toLowerCase())
  );

  return (
    <div className="p-4">
      <h1 className="mb-4">PMS Monthly Comparison</h1>
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
                    {Array.from({ length: 16 }, (_, i) => 2025 - i).map(
                      (year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      )
                    )}
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
                    {[
                      "January",
                      "February",
                      "March",
                      "April",
                      "May",
                      "June",
                      "July",
                      "August",
                      "September",
                      "October",
                      "November",
                      "December",
                    ].map((month, index) => (
                      <option key={month} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </Col>
              <Col xs={12} sm={4} md={3}>
                <Button variant="primary" type="submit" className="me-2">
                  Submit
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </Col>
            </Row>
          </Form>

          <Form.Group controlId="csvUpload" className="mb-3">
            <Form.Label>Select CSV File</Form.Label>
            <Form.Control type="file" accept=".csv" onChange={handleFileSelect} />
            <Form.Text className="text-muted">
              CSV must contain columns: Category, PMS Name, 1M, 3M, 6M, 1Y, 2Y,
              3Y, 4Y, 5Y, Since Inception, year, month.
            </Form.Text>
            {fileName && <p className="mt-2">Selected file: {fileName}</p>}
          </Form.Group>

          <Button
            variant="success"
            onClick={handleUploadCSV}
            disabled={uploading || parsedCsv.length === 0}
          >
            {uploading ? "Uploading... Please wait" : "Upload CSV to Database"}
          </Button>
          {uploading && (
            <ProgressBar
              now={uploadProgress}
              label={`${uploadProgress}%`}
              className="mt-2"
            />
          )}
          {uploadMessage && (
            <Alert
              variant={uploadMessage.includes("error") ? "danger" : "success"}
              className="mt-2"
            >
              {uploadMessage}
            </Alert>
          )}

          <Button
            variant="outline-primary"
            onClick={() => setShowFilters(!showFilters)}
            className="mx-2"
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
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
                      onClick={() => setSearchTerm("")}
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
                  <Typeahead
                    id="group-select"
                    multiple
                    onChange={(selected) => setSelectedGroup(selected)}
                    options={["All", ...allGroupOptions]}
                    placeholder="Select groups..."
                    selected={selectedGroup}
                    clearButton
                  />
                </Form.Group>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      {loading && (
        <Container
          className="d-flex justify-content-center align-items-center"
          style={{ height: "50vh" }}
        >
          <Spinner animation="border" variant="primary" />
        </Container>
      )}
      {error && (
        <Container
          className="d-flex justify-content-center align-items-center"
          style={{ height: "50vh" }}
        >
          <Alert variant="danger">{error}</Alert>
        </Container>
      )}

      {indicesData && (
        <>
          {dataAsOf && (
            <p className="text-muted">Data as of: {formatDate(dataAsOf)}</p>
          )}
          <Form.Group className="mb-3" controlId="tableSearch">
            <Form.Label>Search Table by Index</Form.Label>
            <InputGroup>
              <FormControl
                type="text"
                placeholder="Search indices in table..."
                value={tableSearchTerm}
                onChange={(e) => setTableSearchTerm(e.target.value)}
              />
              <Button
                variant="outline-secondary"
                onClick={() => setTableSearchTerm("")}
                disabled={!tableSearchTerm}
              >
                Clear
              </Button>
            </InputGroup>
          </Form.Group>

          <Table bordered hover responsive className="mb-4">
            <thead>
              <tr>
                <th
                  onClick={() => handleSort("S.No")}
                  style={{ cursor: "pointer" }}
                >
                  S.No{" "}
                  {sortColumn === "S.No" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("index")}
                  style={{ cursor: "pointer" }}
                >
                  Index{" "}
                  {sortColumn === "index" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("group")}
                  style={{ cursor: "pointer" }}
                >
                  Group{" "}
                  {sortColumn === "group" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                {returnPeriods.map((period) => (
                  <th
                    key={period}
                    onClick={() => handleSort(period)}
                    style={{ cursor: "pointer" }}
                  >
                    {period}{" "}
                    {sortColumn === period &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableFilteredIndices.map((item, idx) => (
                <tr key={item.index}>
                  <td>{idx + 1}</td>
                  <td>{item.index}</td>
                  <td>
                    <Badge bg="info">{item.group}</Badge>
                  </td>
                  {returnPeriods.map((period) => (
                    <td
                      key={period}
                      className={
                        item[period] &&
                        item[period].value !== "-" &&
                        parseFloat(item[period].value) < 0
                          ? "text-danger"
                          : ""
                      }
                    >
                      {item[period] && item[period].value
                        ? item[period].value
                        : "-"}
                      {item[period] && item[period].value !== "-" ? "%" : ""}
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

    // If the auth cookie exists, render the page
    return { props: {} };
}


export default MonthlyReport;