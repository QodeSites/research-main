import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
} from "react-bootstrap";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import { calculateDaysBetween } from "utils/dateUtils";
import { toast } from "react-toastify";
import DonutChart from "./DonutChart";
import AnnualReturnsChart from "./AnnualReturnsChart";
import TrailingReturnsTable from "./TrailingReturnsTable";
import RollingReturnsTable from "./RollingReturnsTable ";
import AnnualMetricsTable from "./AnnualReturns";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,CartesianGrid } from "recharts";
import MonthlyPLTable from "./MonthlyPLTable";

// --------------------- Metrics Arrays ---------------------
const performanceMetrics = [
  { label: "Annualized Return (CAGR)", key: "Annualized Return (CAGR)" },
  {
    label: "Standard Deviation (annualized)",
    key: "Standard Deviation (annualized)",
  },
  { label: "Best Year", key: "Best Year" },
  { label: "Worst Year", key: "Worst Year" },
  { label: "Maximum Drawdown", key: "Maximum Drawdown" },
  { label: "Sharpe Ratio", key: "Sharpe Ratio" },
  { label: "Sortino Ratio", key: "Sortino Ratio" },

];

const riskReturnMetrics = [
  { label: "Standard Deviation (annualized)", key: "Standard Deviation (annualized)" },
  { label: "Average Drawdown", key: "Average Drawdown" },
  { label: "Average Days in Drawdown", key: "Average Days in Drawdown" },
  { label: "Maximum Drawdown", key: "Maximum Drawdown" },
  { label: "Benchmark Correlation", key: "Benchmark Correlation" },
  { label: "Sharpe Ratio", key: "Sharpe Ratio" },
  { label: "Sortino Ratio", key: "Sortino Ratio" },
];



// ====================== Main Component ======================
function CombinedPortfolioResults({ portfolios }) {
  console.log(portfolios);
  
  // --------------------- NAV Chart Options ---------------------
  const COLORS = [
    "#4682B4", // Steel Blue
    "#20B2AA", // Light Sea Green
    "#87CEEB", // Sky Blue
    "#66CDAA", // Medium Aquamarine
    "#6495ED", // Cornflower Blue
    "#8FBC8F", // Dark Sea Green
    "#B0C4DE", // Light Steel Blue
    "#98FB98", // Pale Green
    "#87CEFA", // Light Sky Blue
    "#90EE90", // Light Green
  ];

  const [navChartOptions, setNavChartOptions] = useState({
    title: {
      text: "Portfolio NAV",
      align: "left",
      style: { fontSize: "18px" },
    },
    chart: {
      backgroundColor: "white",
      zoomType: "x",
      height: 600,
      spacingRight: 15,
      spacingLeft: 15,
      spacingBottom: 15,
      spacingTop: 15,
      style: {
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      },
    },
    xAxis: {
      type: "datetime",
      labels: {
        formatter: function () {
          const date = new Date(this.value);
          return `${date.toLocaleString("default", {
            month: "short",
          })} ${date.getFullYear()}`;
        },
        style: { fontSize: "12px" },
      },
    },
    yAxis: {
      title: {
        text: "NAV",
        style: { fontSize: "14px" },
      },
      min: 0,
      labels: {
        style: { fontSize: "12px" },
        formatter: function () {
          return Highcharts.numberFormat(this.value, 0);
        },
      },
      gridLineWidth: 1,
    },
    legend: {
      enabled: true,
      itemStyle: { fontSize: "12px" },
    },
    tooltip: {
      shared: true,
      split: false,
      formatter: function () {
        let tooltipHtml = `<b>${Highcharts.dateFormat("%Y-%m-%d", this.x)}</b><br/>`;
        this.points.forEach((point) => {
          const value = Highcharts.numberFormat(point.y, 0);
          tooltipHtml += `<span style="color:${point.series.color}">\u25CF</span> ${point.series.name}: <b>${value}</b><br/>`;
        });
        return tooltipHtml;
      },
    },
    plotOptions: {
      series: {
        lineWidth: 2,
        animation: { duration: 1500 },
      },
    },
    colors: COLORS, // Add the colors array here
    series: [], // Series will be dynamically set
    credits: { enabled: false },
  });
  // --------------------- Drawdown Chart Options ---------------------
  const [drawdownChartOptions, setDrawdownChartOptions] = useState({
    title: {
      text: "Portfolio Drawdowns",
      align: "left",
      style: { fontSize: "18px" },
    },
    chart: {
      backgroundColor: "white",
      zoomType: "x",
      type: "line",
      height: 400,
      spacingRight: 15,
      spacingLeft: 15,
      spacingBottom: 15,
      spacingTop: 15,
      style: {
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      },
    },
    xAxis: {
      type: "datetime",
      labels: {
        formatter: function () {
          const date = new Date(this.value);
          return `${date.toLocaleString("default", {
            month: "short",
          })} ${date.getFullYear()}`;
        },
        style: { fontSize: "12px" },
      },
    },
    yAxis: {
      title: {
        text: "Drawdown (%)",
        style: { fontSize: "14px" },
      },
      min: -50, // Set the y-axis limit to -50%
      labels: {
        style: { fontSize: "12px" },
        formatter: function () {
          return `${Highcharts.numberFormat(Math.abs(this.value), 1)}%`;
        },
      },
      gridLineWidth: 1,
    },
    legend: {
      enabled: true,
      itemStyle: { fontSize: "12px" },
    },
    tooltip: {
      shared: true,
      split: false,
      formatter: function () {
        let tooltipHtml = `<b>${Highcharts.dateFormat("%Y-%m-%d", this.x)}</b><br/>`;
        this.points.forEach((point) => {
          const value = `${Highcharts.numberFormat(Math.abs(point.y), 1)}%`;
          tooltipHtml += `<span style="color:${point.series.color}">\u25CF</span> ${point.series.name}: <b>${value}</b><br/>`;
        });
        return tooltipHtml;
      },
    },
    plotOptions: {
      series: {
        lineWidth: 2,
        dashStyle: "Solid",  // Ensure solid line
        animation: { duration: 1500 },
        marker: {
          enabled: false
        },
        states: {
          hover: {
            lineWidth: 2
          }
        }
      }
    },
    series: [], // Data series will be dynamically updated
    credits: { enabled: false },
  });
  

  const renderRechartsDrawdownChart = (portfolios) => {
    if (!portfolios?.length) return null;
  
    // Prepare the data for Recharts
    const rechartsData = [];
    portfolios.forEach((portfolio, index) => {
      if (portfolio.result?.drawdown_data) {
        portfolio.result.drawdown_data.forEach((point) => {
          const [day, month, year] = point.date.split("-");
          const date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
          if (!rechartsData.find((d) => d.date === date)) {
            rechartsData.push({ date });
          }
          const dataPoint = rechartsData.find((d) => d.date === date);
          dataPoint[`portfolio_${index + 1}`] = point.Drawdown;
        });
      }
    });
  
    // Sort data by date
    rechartsData.sort((a, b) => new Date(a.date) - new Date(b.date));
  
    return (
      <Card className="mb-5 shadow-sm">
        <Card.Header>
          <h5 className="mb-0">Portfolio Drawdowns</h5>
        </Card.Header>
        <Card.Body>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={rechartsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(tick) => {
                  const date = new Date(tick);
                  return `${date.toLocaleString("default", {
                    month: "short",
                  })} ${date.getFullYear()}`;
                }}
                style={{ fontSize: "12px" }}
              />
              <YAxis
                domain={[-50, 0]}
                tickFormatter={(value) => `${Math.abs(value).toFixed(1)}%`}
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                formatter={(value) => `${Math.abs(value).toFixed(1)}%`}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toDateString();
                }}
              />
              <Legend />
              {portfolios.map((portfolio, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={`portfolio_${index + 1}`}
                  name={portfolio.portfolio_name || `Portfolio ${index + 1}`}
                  stroke={`hsl(${(index * 120) % 360}, 70%, 35%)`}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
    );
  };


  useEffect(() => {
    if (!portfolios?.length) return;

    // =========== (A) NAV Chart ===========
    const navSeries = portfolios
      .map((portfolio, index) => {
        if (portfolio.result?.equity_curve_data) {
          const chartData = portfolio.result.equity_curve_data.map((point) => {
            const [day, month, year] = point.date.split("-");
            const dateUTC = Date.UTC(+year, +month - 1, +day);
            return [dateUTC, point.NAV];
          });

          return {
            name: `${portfolio.portfolio_name} NAV`,
            data: chartData,
            color: `hsl(${(index * 120) % 360}, 70%, 50%)`,
          };
        }
        return null;
      })
      .filter((series) => series !== null);

    setNavChartOptions((prev) => ({
      ...prev,
      series: navSeries,
    }));

    // =========== (B) Drawdown Chart ===========
    const drawdownSeries = portfolios
      .map((portfolio, index) => {
        if (portfolio.result?.drawdown_data) {
          const drawdownData = portfolio.result.drawdown_data.map((point) => {
            const [day, month, year] = point.date.split("-");
            const dateUTC = Date.UTC(+year, +month - 1, +day);
            return [dateUTC, point.Drawdown];
          });

          return {
            name: `${portfolio.portfolio_name}`,
            data: drawdownData,
            color: `hsl(${(index * 120) % 360}, 70%, 35%)`,
            dashStyle: "shortdot",
          };
        }
        return null;
      })
      .filter((series) => series !== null);

    setDrawdownChartOptions((prev) => ({
      ...prev,
      series: drawdownSeries,
    }));

  }, [portfolios]);

  const renderMetricsComparison = () => {
    if (!portfolios?.length) return null;
    return (
      <Card className="shadow-sm">
        <Card.Header>
          <h5 className="mb-0">Performance Metrics Comparison</h5>
        </Card.Header>
        <Card.Body>
          <Table
            striped
            bordered
            hover
            responsive
            className="align-middle text-start mb-0"
          >
            <thead>
              <tr>
                <th className="text-center align-middle">Metric</th>
                {portfolios.map((p, idx) => (
                  <th key={idx} className="text-center">{p.portfolio_name || `Portfolio ${idx + 1}`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { key: "car", label: "CAGR (%)" },
                { key: "max_dd", label: "Max Drawdown (%)" },
                { key: "avg_dd", label: "Avg Drawdown (%)" },
                { key: "carbymdd", label: "CAR/MDD" },
                { key: "max_gain", label: "Max Gain/Day (%)" },
                { key: "max_loss", label: "Max Loss/Day (%)" },
              ].map((metric) => (
                <tr key={metric.key}>
                  <td className="text-start">{metric.label}</td>
                  {portfolios.map((portfolio, idx) => (
                    <td
                      key={idx}
                      className="text-center"
                      style={{
                        color: portfolio.result?.[metric.key] > 0
                          ? '#198754'
                          : portfolio.result?.[metric.key] < 0
                            ? '#dc3545'
                            : 'inherit',
                      }}
                    >
                      {portfolio.result?.[metric.key]?.toFixed(1) || "N/A"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    );
  };


  const renderDrawdownsComparison = () => {
    if (!portfolios?.length) return null;
    return (
      <Row className="mt-4">
        {portfolios.map((portfolio, portfolioIndex) => (
          <Col md={6} key={portfolioIndex} className="mb-4">
            <Card className="shadow-sm">
              <Card.Header>
                <h5 className="mb-0">{portfolio.portfolio_name || `Portfolio ${portfolioIndex + 1}`} - Top Drawdowns</h5>
              </Card.Header>
              <Card.Body>
                <Table
                  striped
                  bordered
                  hover
                  responsive
                  size="sm"
                  className="align-middle text-start mb-0"
                >
                  <thead>
                    <tr>
                      <th className="text-center">DD (%)</th>
                      <th className="text-center">Peak</th>
                      <th className="text-center">Bottom</th>
                      <th className="text-center">Recovery</th>
                      <th className="text-center">Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.result?.top_10_worst_drawdowns
                      ?.slice(0, 5)
                      .map((dd, idx) => (
                        <tr key={idx}>
                          <td className="text-center" style={{ color: dd.Drawdown < 0 ? '#dc3545' : 'inherit' }}>
                            {dd.Drawdown.toFixed(1)}
                          </td>
                          <td className="text-center">{dd.Peak_date}</td>
                          <td className="text-center">{dd.Drawdown_date}</td>
                          <td className="text-center">{dd.Recovery_date}</td>
                          <td className="text-center">
                            {dd.Recovery_date !== "Not Recovered"
                              ? calculateDaysBetween(dd.Peak_date, dd.Recovery_date)
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };


  const handleDownloadReport = (portfolioIndex) => {
    const portfolio = portfolios[portfolioIndex];
    if (!portfolio?.result?.equity_curve_data) return;

    const csvContent =
      "date,NAV\n" +
      portfolio.result.equity_curve_data
        .map((point) => `${point.date},${point.NAV}`)
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `equity_curve_portfolio_${portfolioIndex + 1}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Report downloaded successfully.");
  };

  const getMetricValue = (portfolio, key) => {
    return portfolio?.result?.additional_risk_return_metrics?.[key];
  };

  const formatValue = (value, key) => {
    if (value == null || isNaN(value)) return "N/A";

    if (key === "Best Year" || key === "Worst Year") {
      return Math.round(value).toString();
    }

    const percentageMetrics = [
      "Annualized Return (CAGR)",
      "Best Year Return",
      "Worst Year Return",
      "Standard Deviation (annualized)",
      "Maximum Drawdown",
      "Treynor Ratio (%)",
    ];

    if (percentageMetrics.includes(key)) {
      return `${(value * 100).toFixed(2)}%`;
    }

    return value.toFixed(2);
  };

  const MetricsTable = ({ title, metrics }) => (
    <Card className="mb-4 shadow-sm">
      <Card.Header>
        <h5 className="mb-0">{title}</h5>
      </Card.Header>
      <Card.Body>
        <Table
          striped
          bordered
          hover
          responsive
          className="align-middle text-start"
        >
          <thead>
            <tr>
              <th>Metric</th>
              {portfolios.map((_, index) => (
                <th key={index}>
                  {portfolios[index].portfolio_name ||
                    `Portfolio ${index + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map(({ label, key }) => (
              <tr key={key}>
                <td>{label}</td>
                {portfolios.map((portfolio, idx) => {
                  const value = getMetricValue(portfolio, key);
                  return <td key={idx}>{formatValue(value, key)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  // =================================================================
  //  Final Render
  // =================================================================
  return (
    <Container fluid className="pb-5">
      {/* Download Buttons */}
      <Row className="my-4 justify-content-start">
        {portfolios.map((portfolio, index) => (
          <Col key={index} xs="auto" className="mb-2">
            <Button
              variant="primary"
              onClick={() => handleDownloadReport(index)}
              className="d-flex align-items-center"
            >
              <i className="bi bi-download me-2"></i>
              Download {portfolio.portfolio_name || `Portfolio ${index + 1}`} Report
            </Button>
          </Col>
        ))}
      </Row>

      {/* Portfolio Pie (Donut) Charts */}
      <Row className="mb-5">
        {portfolios.map((portfolio, index) => {
          const systems = portfolio.selected_systems || [];
          if (systems.length === 0) return null;

          const data = systems.map((system) => ({
            name: system.system,
            y: system.weightage,
          }));

          return (
            <Col key={index} md={6} lg={4} className="mb-4">
              <DonutChart
                data={data}
                title={`${portfolio.portfolio_name || `Portfolio ${index + 1}`} - Selected Systems Weightage`}
              />
            </Col>
          );
        })}
      </Row>

      <MetricsTable
        title="Performance Summary"
        metrics={performanceMetrics}
      />


      {/* Charts Section */}
      <div className="mb-5">
        {/* NAV Chart */}
        <Card className="mb-5 shadow-sm">
          <Card.Body>
            <HighchartsReact highcharts={Highcharts} options={navChartOptions} />
          </Card.Body>
        </Card>

        {/* Drawdown Chart */}
        <Row className="mb-5">
          {renderRechartsDrawdownChart(portfolios)}
        </Row>

        {/* Performance Metrics Comparison */}
        <Card className="mb-5 shadow-sm">
          <AnnualReturnsChart portfolios={portfolios} />
        </Card>
        <div className="mb-5">
          <TrailingReturnsTable portfolios={portfolios} separateTables={true} />
        </div>
        <div className="mb-5">
          <RollingReturnsTable portfolios={portfolios} />
        </div>
        <MetricsTable
          title="Risk and Return Metrics"
          metrics={riskReturnMetrics}
        />
        <div className="mb-5">

          <AnnualMetricsTable portfolios={portfolios} />
        </div>




        {/* Rolling Returns Chart */}


        {/* Trailing Returns Tables */}

      </div>


      {/* Metrics Tables */}




      <Row className="mt-5">
        <Col md={12} className="mb-4">{renderMetricsComparison()} </Col>
      </Row>

      <Row>
        <MonthlyPLTable portfolios={portfolios} />
      </Row>


      {/* Drawdowns Comparison */}
      <div className="mt-5">{renderDrawdownsComparison()}</div>



    </Container>
  );
}

export default CombinedPortfolioResults;
