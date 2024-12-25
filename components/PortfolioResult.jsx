import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Alert,
  Button,
  Nav,
  Tab,
} from "react-bootstrap";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import { calculateDaysBetween } from "utils/dateUtils";
import { toast } from "react-toastify";

// --------------------- Metrics Arrays ---------------------
const performanceMetrics = [
  { label: "Annualized Return (CAGR)", key: "Annualized Return (CAGR)" },
  {
    label: "Standard Deviation (annualized)",
    key: "Standard Deviation (annualized)",
  },
  { label: "Best Year", key: "Best Year" },
  { label: "Best Year Return", key: "Best Year Return" },
  { label: "Worst Year", key: "Worst Year" },
  { label: "Worst Year Return", key: "Worst Year Return" },
  { label: "Maximum Drawdown", key: "Maximum Drawdown" },
];

const riskReturnMetrics = [
  {
    label: "Standard Deviation (annualized)",
    key: "Standard Deviation (annualized)",
  },
  { label: "Maximum Drawdown", key: "Maximum Drawdown" },
  { label: "Beta", key: "Beta" },
  { label: "Alpha (annualized)", key: "Alpha (annualized)" },
  { label: "Sharpe Ratio", key: "Sharpe Ratio" },
  { label: "Sortino Ratio", key: "Sortino Ratio" },
  { label: "Treynor Ratio (%)", key: "Treynor Ratio (%)" },
  { label: "Calmar Ratio", key: "Calmar Ratio" },
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
  // periods is an array like [1, 3, 5, 10] (years)
  if (!equityData?.length) return [];

  const lastIndex = equityData.length - 1;
  const lastDate = new Date(equityData[lastIndex].date);

  return periods.map((period) => {
    // Convert years to approximate days
    const daysAgo = period * 365;

    // Find the earliest date in equityData that is within 'daysAgo' from lastDate
    const startIndex = equityData.findIndex((point) => {
      const pointDate = new Date(point.date);
      const diffDays = (lastDate - pointDate) / (1000 * 60 * 60 * 24);
      return diffDays <= daysAgo;
    });

    if (startIndex === -1) return null; // Not enough data for this period

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
  // --------------------- Main NAV + Drawdown Chart Options ---------------------
  const [chartOptions, setChartOptions] = useState({
    title: {
      text: "Portfolio Performance",
      align: "left",
      style: { fontSize: "18px" },
    },
    chart: {
      backgroundColor: "white",
      zoomType: "x",
      height: 600,
      spacingRight: 10,
      spacingLeft: 0,
      spacingBottom: 15,
      spacingTop: 10,
      marginLeft: 80,
      marginRight: 50,
      style: {
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
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
    yAxis: [
      {
        title: {
          align: "middle",
          style: { fontSize: "12px" },
        },
        height: "65%",
        min: 0,
        tickAmount: 6,
        labels: {
          align: "left",
          x: -60,
          style: { fontSize: "12px" },
          formatter: function () {
            return Highcharts.numberFormat(this.value, 0);
          },
        },
        offset: 0,
        gridLineWidth: 1,
        tickLength: 5,
        tickPosition: 'inside',
        tickmarkPlacement: 'on',
      },
      {
        title: {
          align: "middle",
          style: { fontSize: "12px" },
        },
        opposite: false,
        top: "70%",
        height: "30%",
        labels: {
          align: "left",
          x: -60,
          style: { fontSize: "12px" },
          formatter: function () {
            return Highcharts.numberFormat(this.value, 1) + "%";
          },
        },
        offset: 0,
        gridLineWidth: 1,
        tickLength: 5,
        tickPosition: 'inside',
        tickmarkPlacement: 'on',
      },
    ],
    legend: {
      enabled: true,
      align: "left",
      verticalAlign: "top",
      floating: false,
      padding: 10,
      itemStyle: { fontSize: "12px" },
    },
    tooltip: {
      shared: true,
      split: false,
      formatter: function () {
        let tooltipHtml = `<b>${Highcharts.dateFormat(
          "%Y-%m-%d",
          this.x
        )}</b><br/>`;
        this.points.forEach((point) => {
          const value = point.series.name.includes("Drawdown")
            ? `${Highcharts.numberFormat(point.y, 1)}%`
            : Highcharts.numberFormat(point.y, 0);
          tooltipHtml += `<span style="color:${point.series.color}">\u25CF</span> ${point.series.name}: <b>${value}</b><br/>`;
        });
        return tooltipHtml;
      },
    },
    plotOptions: {
      series: {
        animation: { duration: 1500 },
        states: {
          hover: {
            enabled: true,
            lineWidthPlus: 1,
          },
        },
      },
    },
    series: [],
    credits: { enabled: false },
    responsive: {
      rules: [
        {
          condition: {
            maxWidth: 100,
          },
          chartOptions: {
            legend: {
              layout: "horizontal",
              align: "center",
              verticalAlign: "bottom",
            },
          },
        },
      ],
    },
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

    // ----------------------------------
    // (A) Main NAV + Drawdown Chart
    // ----------------------------------
    const mainSeries = [];
    portfolios.forEach((portfolio, index) => {
      if (portfolio.result?.equity_curve_data) {
        // NAV
        const chartData = portfolio.result.equity_curve_data.map((point) => {
          const [day, month, year] = point.date.split("-");
          const dateUTC = Date.UTC(+year, +month - 1, +day);
          return [dateUTC, point.NAV];
        });

        mainSeries.push({
          name: `Portfolio ${index + 1} NAV`,
          data: chartData,
          color: `hsl(${(index * 120) % 360}, 70%, 50%)`,
          lineWidth: 1,
          yAxis: 0,
          type: "line",
        });

        // Drawdown
        const drawdownData = portfolio.result.drawdown_data.map((point) => {
          const [day, month, year] = point.date.split("-");
          const dateUTC = Date.UTC(+year, +month - 1, +day);
          return [dateUTC, point.Drawdown];
        });

        mainSeries.push({
          name: `Portfolio ${index + 1} Drawdown`,
          data: drawdownData,
          color: `hsl(${(index * 120) % 360}, 70%, 35%)`,
          lineWidth: 1,
          yAxis: 1,
          dashStyle: "shortdot",
        });
      }
    });

    setChartOptions((prev) => ({
      ...prev,
      series: mainSeries,
    }));

    // ----------------------------------
    // (B) Rolling Returns Chart (1Y)
    // ----------------------------------
    const rollingReturnsSeries = portfolios
      .map((portfolio, index) => {
        const eqData = portfolio.result?.equity_curve_data || [];
        const rolling1Y = calculateRollingReturns(eqData, 252); // 252 trading days

        return {
          name: `Portfolio ${index + 1} - 1Y Rolling`,
          data: rolling1Y.map((pt) => [pt.date, pt.return]),
          color: `hsl(${(index * 120) % 360}, 70%, 50%)`,
          type: "line",
        };
      })
      .filter((series) => series.data.length > 0); // Only include series with data

    setRollingReturnsOptions({
      title: {
        text: "Rolling Returns (1 Year)",
        style: { fontSize: "18px" },
      },
      chart: {
        type: "line",
        height: 400,
        backgroundColor: "white",
        zoomType: "x",
      },
      xAxis: {
        type: "datetime",
        labels: {
          formatter: function () {
            return Highcharts.dateFormat("%Y-%m-%d", this.value);
          },
        },
      },
      yAxis: {
        title: {
          text: "Return (%)",
          style: { fontSize: "12px" },
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
          let tooltipHtml = `<b>${Highcharts.dateFormat(
            "%Y-%m-%d",
            this.x
          )}</b><br/>`;
          this.points.forEach((point) => {
            tooltipHtml += `<span style="color:${
              point.series.color
            }">\u25CF</span> ${point.series.name}: <b>${point.y.toFixed(
              2
            )}%</b><br/>`;
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
          animation: { duration: 1500 },
          states: {
            hover: {
              enabled: true,
              lineWidthPlus: 1,
            },
          },
        },
      },
      series: rollingReturnsSeries,
      credits: { enabled: false },
    });

    // ----------------------------------
    // (C) Trailing Returns Chart
    // ----------------------------------
    // Example periods: 1, 3, 5, 10 years
    const periods = [1, 3, 5, 10];
    const trailingReturnsSeries = portfolios.map((portfolio, index) => {
      const eqData = portfolio.result?.equity_curve_data || [];
      const trailing = calculateTrailingReturns(eqData, periods);
      return {
        name: `Portfolio ${index + 1}`,
        data: trailing.map((tr) => (tr ? tr.return : null)),
        color: `hsl(${(index * 120) % 360}, 70%, 50%)`,
      };
    });

    setTrailingReturnsOptions({
      title: { text: "Trailing Returns" },
      chart: {
        type: "column",
        height: 400,
        backgroundColor: "white",
      },
      xAxis: {
        categories: periods.map((p) => `${p}Y`),
      },
      yAxis: {
        title: { text: "Return (%)" },
        labels: {
          format: "{value:.1f}%",
        },
      },
      tooltip: {
        shared: true,
        valueDecimals: 2,
        valueSuffix: "%",
      },
      series: trailingReturnsSeries,
    });
  }, [portfolios]);

  

  // =================================================================
  // Table / Utility functions
  // =================================================================
  const renderMetricsComparison = () => {
    if (!portfolios?.length) return null;
    return (
      <Row className="mt-4">
        <Col xs={12}>
          <h5 className="mb-3">Performance Metrics Comparison</h5>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Metric</th>
                {portfolios.map((_, idx) => (
                  <th key={idx}>Portfolio {idx + 1}</th>
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
        </Col>
      </Row>
    );
  };

  const renderDrawdownsComparison = () => {
    if (!portfolios?.length) return null;
    return (
      <Row className="mt-4">
        {portfolios.map((portfolio, portfolioIndex) => (
          <Col md={6} key={portfolioIndex}>
            <h5 className="mb-3">
              Portfolio {portfolioIndex + 1} - Top Drawdowns
            </h5>
            <Table striped bordered hover responsive size="sm">
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
    if (value == null || isNaN(value)) return 'N/A';

    if (key === 'Best Year' || key === 'Worst Year') {
      return Math.round(value).toString();
    }

    const percentageMetrics = [
      'Annualized Return (CAGR)',
      'Best Year Return',
      'Worst Year Return',
      'Standard Deviation (annualized)',
      'Maximum Drawdown',
      'Treynor Ratio (%)'
    ];

    if (percentageMetrics.includes(key)) {
      return `${(value * 100).toFixed(2)}%`;
    }

    return value.toFixed(2);
  };

  const MetricsTable = ({ title, metrics }) => (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">{title}</h5>
      </Card.Header>
      <Card.Body>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Metric</th>
              {portfolios.map((_, index) => (
                <th key={index} className="text-center">
                  Portfolio {index + 1}
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
                  return (
                    <td key={idx} className="text-center">
                      {formatValue(value, key)}
                    </td>
                  );
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
    <Container fluid className="mb-4">
      {/* Download Buttons */}
      <Row className="my-3">
        {portfolios.map((_, index) => (
          <Col key={index} xs="auto">
            <Button
              variant="primary"
              onClick={() => handleDownloadReport(index)}
            >
              Download Portfolio {index + 1}
            </Button>
          </Col>
        ))}
      </Row>

      {/* Main NAV + Drawdown Chart */}
      <HighchartsReact highcharts={Highcharts} options={chartOptions} />

      {/* Rolling Returns Chart */}
      <Row className="mt-4">
        <Col>
          {rollingReturnsOptions?.series &&
            rollingReturnsOptions.series.length > 0 && (
              <HighchartsReact
                highcharts={Highcharts}
                options={rollingReturnsOptions}
              />
            )}
        </Col>
      </Row>

      {/* Trailing Returns Chart */}
      <Row className="mt-4">
        <Col>
          {trailingReturnsOptions?.series &&
            trailingReturnsOptions.series.length > 0 && (
              <HighchartsReact
                highcharts={Highcharts}
                options={trailingReturnsOptions}
              />
            )}
        </Col>
      </Row>

      {/* Additional Tables */}
      {renderMetricsComparison()}

      {/* New risk and return metrics sections */}
      <div className="mt-4">
          <MetricsTable 
            title="1 Performance Summary" 
            metrics={performanceMetrics} 
          />
          <MetricsTable 
            title="4 Risk and Return Metrics" 
            metrics={riskReturnMetrics} 
          />
        </div>
      {renderDrawdownsComparison()}
    </Container>
  );
}

export default CombinedPortfolioResults;
