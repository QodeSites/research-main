import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

// Optional: If you want to use additional Highcharts modules
// import Exporting from 'highcharts/modules/exporting';
// Exporting(Highcharts);

const AnnualReturnsChart = ({ portfolios }) => {
  // Step 1: Extract all unique years
  const allYearsSet = new Set();
  portfolios.forEach(portfolio => {
    if (portfolio.result?.annual_returns) {
      portfolio.result.annual_returns.forEach(entry => allYearsSet.add(entry.year));
    }
  });
  const allYears = Array.from(allYearsSet).sort();

  // Step 2: Prepare series data for each portfolio
  const series = portfolios.map((portfolio, index) => {
    const annualReturnsMap = new Map();
    portfolio.result?.annual_returns.forEach(entry => {
      annualReturnsMap.set(entry.year, parseFloat(entry.return.toFixed(2)));
    });

    const data = allYears.map(year => annualReturnsMap.get(year) || null); // Use null for missing data

    return {
      name: portfolio.portfolio_name || `Portfolio ${index + 1}`,
      data,
      color: `hsl(${(index * 120) % 360}, 70%, 50%)`,
      dataLabels: {
        enabled: true,
        format: '{y:.2f}%',
        style: {
          fontSize: '12px'
        }
      },
      // Assign an ID to each series for reference in plotLines
      id: `cagr-${index}`
    };
  });

  // Step 3: Prepare plotLines for CAGR of each portfolio
  const plotLines = portfolios.map((portfolio, index) => {
    const cagr = portfolio.result?.additional_risk_return_metrics?.['Annualized Return (CAGR)']
      ? parseFloat((portfolio.result.additional_risk_return_metrics['Annualized Return (CAGR)'] * 100).toFixed(2))
      : null;

    if (cagr === null) return null;

    return {
      color: series[index].color, // Match the color with the portfolio
      dashStyle: 'Dash',
      value: cagr,
      width: 2,
      label: {
        text: `CAGR (${series[index].name}): ${cagr}%`,
        align: 'right',
        style: {
          color: series[index].color,
          fontSize: '12px',
          fontWeight: 'bold'
        }
      },
      // Adjust the zIndex to ensure plotLines appear above other chart elements
      zIndex: 3
    };
  }).filter(line => line !== null); // Remove null entries

  // Step 4: Define Highcharts options
  const options = {
    chart: {
      type: 'column',
      height: 600, // Adjust height as needed
      backgroundColor: '#ffffff'
    },
    title: {
      text: 'Annual Returns Comparison with CAGR',
      style: {
        fontSize: '20px',
        fontWeight: 'bold'
      }
    },
    xAxis: {
      categories: allYears,
      title: {
        text: 'Year',
        style: { fontSize: '14px' }
      },
      labels: {
        style: { fontSize: '12px' }
      }
    },
    yAxis: {
      title: {
        text: 'Return (%)',
        style: { fontSize: '14px' }
      },
      labels: {
        formatter: function () {
          return `${this.value.toFixed(1)}%`;
        },
        style: { fontSize: '12px' }
      },
      plotLines: plotLines
    },
    tooltip: {
      headerFormat: '<span style="font-size:10px">{point.key}</span><br/>',
      shared: true,
      useHTML: true,
      formatter: function () {
        let tooltip = `<span style="font-size:10px">${this.x}</span><br/>`;
        this.points.forEach(point => {
          tooltip += `<span style="color:${point.series.color}">\u25CF</span> ${point.series.name}: <b>${point.y !== null ? point.y.toFixed(2) + '%' : 'N/A'}</b><br/>`;
        });
        // Add CAGR lines to tooltip
        plotLines.forEach(line => {
          if (line.value !== null) {
            tooltip += `<span style="color:${line.color}">\u2014</span> ${line.label.text}<br/>`;
          }
        });
        return tooltip;
      },
      style: {
        fontSize: '12px'
      }
    },
    plotOptions: {
      column: {
        grouping: true,
        shadow: false,
        borderWidth: 0
      }
    },
    series: series,
    credits: {
      enabled: false
    },
    legend: {
      enabled: true,
      align: 'center',
      verticalAlign: 'bottom',
      layout: 'horizontal',
      itemStyle: {
        fontSize: '12px'
      }
    }
  };

  return (
    <div className="w-full">
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        containerProps={{ style: { height: '600px', width: '100%' } }}
      />
      {/* Optionally, display CAGR information below the chart */}
      {/* <div className="mt-4">
        {portfolios.map((portfolio, index) => {
          const cagr = portfolio.result?.additional_risk_return_metrics?.['Annualized Return (CAGR)']
            ? parseFloat((portfolio.result.additional_risk_return_metrics['Annualized Return (CAGR)'] * 100).toFixed(2))
            : null;
          return (
            <div key={portfolio.portfolio_name || `portfolio-${index}`} className="mb-2">
              <strong>{portfolio.portfolio_name || `Portfolio ${index + 1}`}</strong> - CAGR: {cagr !== null ? `${cagr.toFixed(2)}%` : 'N/A'}
            </div>
          );
        })} */}
      {/* </div> */}
    </div>
  );
};

export default AnnualReturnsChart;
