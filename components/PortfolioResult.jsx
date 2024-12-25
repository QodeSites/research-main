// src/components/pythonCalculator/PortfolioResult.jsx

import React, { useState, useEffect } from "react";
import { Table, Spinner, Button, Row, Col, Card, Alert } from "react-bootstrap";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import MonthlyPLTable from "./MonthlyPLTable";
import CAGRBarChart from "./CagrBarChart";
import { calculateDaysBetween } from "utils/dateUtils";
import { toast } from "react-toastify";

function PortfolioResult({ portfolio, index }) {
  const [chartOptions, setChartOptions] = useState({
    title: {
      text: `Portfolio ${index + 1} Equity Curve`,
    },
    xAxis: {
      type: "datetime",
      labels: {
        formatter: function () {
          const date = new Date(this.value);
          return `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;
        },
      },
    },
    yAxis: [
      {
        title: {
          text: "Value",
        },
        height: "60%",
        min: 0,
        tickAmount: 4,
      },
      {
        title: {
          text: "Drawdown (%)",
        },
        opposite: false,
        top: "60%",
        height: "40%",
        left: "6%",
      },
    ],
    series: [
      {
        name: "NAV",
        data: [],
        color: "#d1a47b",
        lineWidth: 1,
        marker: {
          enabled: false,
          states: {
            hover: {
              enabled: true,
              radius: 5,
            },
          },
        },
        type: "line",
        yAxis: 0,
        animation: { duration: 2000 },
      },
      {
        name: "Drawdown",
        data: [],
        color: "rgba(250, 65, 65, 1)",
        lineWidth: 2,
        marker: {
          enabled: false,
        },
        fillColor: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1,
          },
          stops: [
            [0, "rgba(0, 0, 0, 0.2)"],
            [1, "rgba(0, 0, 0, 0.9)"],
          ],
        },
        type: "line",
        yAxis: 1,
        threshold: 0,
        animation: { duration: 2000 },
      },
    ],
    chart: {
      backgroundColor: "none",
      zoomType: "x",
      marginLeft: 0,
      marginRight: 0,
    },
    tooltip: {
      shared: true,
    },
    legend: {
      enabled: true,
    },
    credits: {
      enabled: false,
    },
    exporting: {
      enabled: true,
    },
    plotOptions: {
      series: {
        animation: { duration: 2000 },
        states: {
          hover: {
            enabled: true,
            lineWidthPlus: 1,
          },
        },
      },
    },
    navigation: {
      buttonOptions: {
        enabled: true,
      },
    },
  });

  useEffect(() => {
    if (
      portfolio.result &&
      portfolio.result.equity_curve_data &&
      portfolio.result.drawdown_data
    ) {
      const chartData = portfolio.result.equity_curve_data.map((point) => {
        const [day, month, year] = point.date.split("-");
        const date = Date.UTC(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );

        return [date, point.NAV];
      });

      const drawdownData = portfolio.result.drawdown_data.map((point) => {
        const [day, month, year] = point.date.split("-");
        const date = Date.UTC(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );
        return [date, point.Drawdown];
      });

      setChartOptions((prevOptions) => ({
        ...prevOptions,
        series: [
          {
            ...prevOptions.series[0],
            data: chartData,
          },
          {
            ...prevOptions.series[1],
            data: drawdownData,
          },
        ],
        tooltip: {
          shared: true,
          formatter: function () {
            let tooltipHtml = `<b>${Highcharts.dateFormat("%Y-%m-%d", this.x)}</b><br/>`;
            this.points.forEach((point) => {
              tooltipHtml += `<span style="color:${point.series.color}">\u25CF</span> ${point.series.name}: <b>${Math.round(point.y)}</b><br/>`;
            });
            return tooltipHtml;
          },
        },
      }));
    }
  }, [portfolio]);

  const handleDownloadReport = () => {
    if (!portfolio.result || !portfolio.result.equity_curve_data) return;

    // Convert equity_curve_data to CSV
    let csvContent = "date,NAV\n";
    portfolio.result.equity_curve_data.forEach((point) => {
      csvContent += `${point.date},${point.NAV}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `equity_curve_portfolio_${portfolio.portfolio_index}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Report downloaded successfully.");
  };

  const renderMetrics = () => {
    if (
      !portfolio.result ||
      !portfolio.result.equity_curve_data ||
      portfolio.result.equity_curve_data.length < 2
    )
      return null;

    // Get the first and last dates from equity_curve_data
    const dates = portfolio.result.equity_curve_data.map(
      (point) => new Date(point.date.split("-").reverse().join("-"))
    );
    const startdate = dates[0];
    const enddate = dates[dates.length - 1];

    // Calculate the date range in days
    const dateRangeInDays = (enddate - startdate) / (1000 * 60 * 60 * 24);
    const isLessThanOneYear = dateRangeInDays <= 365;

    const metrics = [
      {
        key: isLessThanOneYear ? "Absolute Returns" : "CAGR",
        value: portfolio.result.car.toFixed(1) + "%",
      },
      { key: "Max Drawdown", value: portfolio.result.max_dd.toFixed(1) + "%" },
      { key: "Avg Drawdown", value: portfolio.result.avg_dd.toFixed(1) + "%" },
      { key: "CAR/MDD", value: portfolio.result.carbymdd.toFixed(1) },
      { key: "Max Gain / Day", value: portfolio.result.max_gain.toFixed(1) + "%" },
      { key: "Max Loss / Day", value: portfolio.result.max_loss.toFixed(1) + "%" },
    ];

    return (
      <>
        <h5 className="mt-4 mb-3">
          Performance Metrics - Portfolio {portfolio.portfolio_index}
        </h5>
        <Row>
          {metrics.map((metric, idx) => (
            <Col xs={12} sm={6} md={4} key={idx} className="mb-3">
              <Card className="text-center h-100">
                <Card.Body>
                  <Card.Title className="text-muted">{metric.key}</Card.Title>
                  <Card.Text className="fw-bold">{metric.value}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </>
    );
  };

  const renderDrawdownsTable = () => {
    if (
      !portfolio.result?.top_10_worst_drawdowns ||
      portfolio.result.top_10_worst_drawdowns.length === 0
    ) {
      return <Alert variant="info">No drawdown data available.</Alert>;
    }

    return (
      <>
        <h5 className="mt-4 mb-3">
          Top 10 Worst Drawdowns - Portfolio {portfolio.portfolio_index}
        </h5>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Drawdown</th>
              <th>Peak date</th>
              <th>Drawdown date</th>
              <th>Recovery date</th>
              <th>Days to Recover</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.result.top_10_worst_drawdowns.map((row, index) => (
              <tr key={index}>
                <td>{row.Drawdown.toFixed(1)}%</td>
                <td>{row.Peak_date}</td>
                <td>{row.Drawdown_date}</td>
                <td>{row.Recovery_date}</td>
                <td>
                  {row.Recovery_date !== "Not Recovered"
                    ? calculateDaysBetween(row.Peak_date, row.Recovery_date)
                    : "Not Recovered"}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </>
    );
  };

  return (
    <Card className="mb-4">
      <Card.Body>
        <Button
          variant="primary"
          onClick={handleDownloadReport}
          className="mb-3"
        >
          Download Report
        </Button>

        <HighchartsReact highcharts={Highcharts} options={chartOptions} />

        {renderMetrics()}
        {renderDrawdownsTable()}

        {/* Assuming MonthlyPLTable and CAGRBarChart are also updated to use React Bootstrap */}
        <MonthlyPLTable data={portfolio.result?.monthly_pl_table || []} />
        {portfolio.result?.cagrData && (
          <CAGRBarChart cagrData={portfolio.result.cagrData} />
        )}
      </Card.Body>
    </Card>
  );
}

export default PortfolioResult;
