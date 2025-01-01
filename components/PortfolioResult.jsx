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


// --------------------- Rolling Returns ---------------------
const calculateRollingReturns = (equityData, window) => {
  if (!equityData || equityData.length < window) return [];
  const rollingReturns = [];

  for (let i = window; i < equityData.length; i++) {
    const currentNAV = equityData[i].NAV;
    const pastNAV = equityData[i - window].NAV;
    const return_ = (currentNAV / pastNAV - 1) * 100; // as a percent

    // Parse the date correctly
    const [day, month, year] = equityData[i].date.split("-");
    const dateUTC = Date.UTC(+year, +month - 1, +day);

    rollingReturns.push({
      date: dateUTC,
      return: return_,
    });
  }
  return rollingReturns;
};

// --------------------- Trailing Returns ---------------------
const calculateTrailingReturns = (equityData, periods) => {
  if (!equityData?.length) return [];

  const lastIndex = equityData.length - 1;
  const lastDate = new Date(equityData[lastIndex].date);

  return periods.map((period) => {
    const daysAgo = period * 365;

    const startIndex = equityData.findIndex((point) => {
      const pointDate = new Date(point.date);
      const diffDays = (lastDate - pointDate) / (1000 * 60 * 60 * 24);
      return diffDays <= daysAgo;
    });

    if (startIndex === -1) return null; // Not enough data

    const startNAV = equityData[startIndex].NAV;
    const endNAV = equityData[lastIndex].NAV;
    // Annualized return
    const return_ = ((endNAV / startNAV) ** (1 / period) - 1) * 100;

    return {
      period: `${period}Y`,
      return: return_,
    };
  });
};

// ====================== Main Component ======================
function CombinedPortfolioResults({ portfolios }) {
  console.log("CombinedPortfolioResults -> portfolios", portfolios);
  
  // --------------------- NAV Chart Options ---------------------
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
    series: [],
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
      // just in case no data is present, fallback to -20
      min: Math.min(
        ...portfolios.flatMap((p) =>
          p.result?.drawdown_data?.map((d) => d.Drawdown) || [-20]
        )
      ),
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
        animation: { duration: 1500 },
      },
    },
    series: [],
    credits: { enabled: false },
  });

  // --------------------- Rolling Returns Chart ---------------------
  const [rollingReturnsOptions, setRollingReturnsOptions] = useState({});

  // --------------------- Trailing Returns Chart ---------------------
  const [trailingReturnsOptions, setTrailingReturnsOptions] = useState({});

  // =================================================================
  //  Build Chart Data in useEffect when portfolios changes
  // =================================================================
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

    // =========== (C) Rolling Returns Chart (1Y) ===========
    const rollingReturnsSeries = portfolios
      .map((portfolio, index) => {
        const eqData = portfolio.result?.equity_curve_data || [];
        const rolling1Y = calculateRollingReturns(eqData, 252); // ~252 trading days

        return {
          name: `${portfolio.portfolio_name} - 1Y Rolling`,
          data: rolling1Y.map((pt) => [pt.date, pt.return]),
          color: `hsl(${(index * 120) % 360}, 70%, 50%)`,
        };
      })
      .filter((series) => series.data.length > 0);

    setRollingReturnsOptions({
      title: {
        text: "Rolling Returns (1 Year)",
        style: { fontSize: "18px" },
      },
      chart: {
        type: "line",
        height: 400,
        backgroundColor: "white",
        spacingRight: 15,
        spacingLeft: 15,
        spacingBottom: 15,
        spacingTop: 15,
        style: {
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        zoomType: "x",
      },
      xAxis: {
        type: "datetime",
        labels: {
          formatter: function () {
            return Highcharts.dateFormat("%Y-%m-%d", this.value);
          },
          style: { fontSize: "12px" },
        },
      },
      yAxis: {
        title: {
          text: "Return (%)",
          style: { fontSize: "14px" },
        },
        labels: {
          format: "{value:.1f}%",
          style: { fontSize: "12px" },
        },
      },
      tooltip: {
        shared: true,
        crosshairs: true,
        formatter: function () {
          let tooltipHtml = `<b>${Highcharts.dateFormat("%Y-%m-%d", this.x)}</b><br/>`;
          this.points.forEach((point) => {
            tooltipHtml += `<span style="color:${point.series.color}">\u25CF</span> ${point.series.name
              }: <b>${point.y.toFixed(2)}%</b><br/>`;
          });
          return tooltipHtml;
        },
      },
      legend: {
        enabled: true,
        itemStyle: { fontSize: "12px" },
      },
      plotOptions: {
        series: {
          lineWidth: 2,
          animation: { duration: 1500 },
        },
      },
      series: rollingReturnsSeries,
      credits: { enabled: false },
    });

    // =========== (D) Trailing Returns Chart ===========
    // Example periods: 1, 3, 5, 10 years
    const periods = [1, 3, 5, 10];
    const trailingReturnsSeries = portfolios.map((portfolio, index) => {
      const eqData = portfolio.result?.equity_curve_data || [];
      const trailing = calculateTrailingReturns(eqData, periods);
      return {
        name: `${portfolio.portfolio_name}`,
        data: trailing.map((tr) => (tr ? tr.return : null)),
        color: `hsl(${(index * 120) % 360}, 70%, 50%)`,
        type: "column",
      };
    });

    setTrailingReturnsOptions({
      title: { text: "Trailing Returns", style: { fontSize: "18px" } },
      chart: {
        type: "column",
        height: 400,
        backgroundColor: "white",
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
        categories: periods.map((p) => `${p}Y`),
        labels: { style: { fontSize: "12px" } },
      },
      yAxis: {
        title: {
          text: "Return (%)",
          style: { fontSize: "14px" },
        },
        labels: {
          format: "{value:.1f}%",
          style: { fontSize: "12px" },
        },
      },
      tooltip: {
        shared: true,
        valueDecimals: 2,
        valueSuffix: "%",
      },
      legend: {
        itemStyle: { fontSize: "12px" },
      },
      plotOptions: {
        series: {
          groupPadding: 0.1,
          borderWidth: 0,
          animation: { duration: 1500 },
        },
      },
      series: trailingReturnsSeries,
      credits: { enabled: false },
    });
  }, [portfolios]);

  // =================================================================
  // Table / Utility functions
  // =================================================================
  const renderMetricsComparison = () => {
    if (!portfolios?.length) return null;
    return (
      <Card className="mb-4 shadow-sm">
      <Card.Header>
      <h5 className="mb-3">Performance Metrics Comparison</h5>

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
                {portfolios.map((p, idx) => (
                  <th key={idx}>{p.portfolio_name}</th>
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
                  <td>{metric.label}</td>
                  {portfolios.map((portfolio, idx) => (
                    <td key={idx}>
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
          <Col md={6} key={portfolioIndex} className="mb-5">
            <h5 className="mb-3">{portfolio.portfolio_name} - Top Drawdowns</h5>
            <Table
              striped
              bordered
              hover
              responsive
              size="sm"
              className="align-middle text-start"
            >
              <thead>
                <tr>
                  <th>DD (%)</th>
                  <th>Peak</th>
                  <th>Bottom</th>
                  <th>Recovery</th>
                  <th>Days</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.result?.top_10_worst_drawdowns
                  ?.slice(0, 5)
                  .map((dd, idx) => (
                    <tr key={idx}>
                      <td>{dd.Drawdown.toFixed(1)}</td>
                      <td>{dd.Peak_date}</td>
                      <td>{dd.Drawdown_date}</td>
                      <td>{dd.Recovery_date}</td>
                      <td>
                        {dd.Recovery_date !== "Not Recovered"
                          ? calculateDaysBetween(dd.Peak_date, dd.Recovery_date)
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Table>
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


      {/* Charts Section */}
      <div className="mb-5">
        {/* NAV Chart */}
        <Card className="mb-5 shadow-sm">
          <Card.Body>
            <HighchartsReact highcharts={Highcharts} options={navChartOptions} />
          </Card.Body>
        </Card>

        {/* Drawdown Chart */}
        <Card className="mb-5 shadow-sm">
          <Card.Body>
            <HighchartsReact
              highcharts={Highcharts}
              options={drawdownChartOptions}
            />
          </Card.Body>
        </Card>

        {/* Performance Metrics Comparison */}
      <Card className="mb-5 shadow-sm">
          <AnnualReturnsChart portfolios={portfolios} />
      </Card>

        {/* Rolling Returns Chart */}
        <Card className="mb-5 shadow-sm">
          <Card.Body>
            <RollingReturnsTable portfolios={portfolios} />
          </Card.Body>
        </Card>

        {/* Trailing Returns Tables */}
        <div className="mb-5">
          <TrailingReturnsTable portfolios={portfolios} separateTables={true} />
        </div>
      </div>

      
      {/* Metrics Tables */}
      <Row className="mt-5">
        <Col md={12} className="mb-4">
          <MetricsTable
            title="Performance Summary"
            metrics={performanceMetrics}
          />
        </Col>
        <Col md={12} className="mb-4">
          <MetricsTable
            title="Risk and Return Metrics"
            metrics={riskReturnMetrics}
          />
        </Col>
      </Row>

      <Row className="mt-5">
        <Col md={12} className="mb-4">{renderMetricsComparison()} </Col>
      </Row>


      {/* Drawdowns Comparison */}
      <div className="mt-5">{renderDrawdownsComparison()}</div>


      <Card className="mb-5 shadow-sm">
          <Card.Body>
            <AnnualMetricsTable portfolios={portfolios} />
          </Card.Body>
        </Card>
    </Container>
  );
}

export default CombinedPortfolioResults;
