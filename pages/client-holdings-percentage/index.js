import DefaultDashboardLayout from "layouts/DefaultDashboardLayout";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { FiMaximize2 } from "react-icons/fi";
import { parse } from "cookie";
/* -------------------------------------------------------
   1) MODAL for Large Chart 
      (Shows both Total & Average lines, chronological sort)
   ------------------------------------------------------- */
const ChartModal = ({ isOpen, closeModal, stock }) => {
  if (!isOpen) return null;

  // Convert clients => parse floats + chronological sort
  const chartData = (stock?.clients || [])
    .map((client) => ({
      ...client,
      percentassets: parseFloat(client.percentassets || 0),
    }))
    .sort((a, b) => {
      // If you have a date field (e.g. "date"), sort by it:
      // Adjust as needed. If no date, remove or alter this comparison.
      if (a.date && b.date) return new Date(a.date) - new Date(b.date);
      return 0;
    });

  // Compute average
  const dataCount = chartData.length;
  const sumData = chartData.reduce((acc, c) => acc + c.percentassets, 0);
  const avgValue = dataCount > 0 ? sumData / dataCount : 0;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {stock.symbolname || stock.category}
            {stock.strategy && (
              <div className="modal-badges">
                <span className="strategy-badge">{stock.strategy}</span>
                {stock.category && (
                  <span
                    className={`strategy-badge category-${stock.category.toLowerCase()}`}
                  >
                    {stock.category}
                  </span>
                )}
              </div>
            )}
          </h2>
          <button className="modal-close" onClick={closeModal}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid stroke="#e0e0e0" strokeDasharray="5 5" />
              <XAxis
                dataKey="clientcode"
                tick={{ fill: "#666", fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis tick={{ fill: "#666", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  fontSize: "13px",
                }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ paddingTop: "20px", fontSize: "13px" }}
              />
              <Bar
                dataKey="percentassets"
                fill="#D1A47B"
                name="Client Holding (%)"
                radius={[4, 4, 0, 0]}
              />

              {/* Red line for total */}
              <ReferenceLine
                y={parseFloat(stock.total || 0)}
                stroke="#FF4136"
                strokeDasharray="6 6"
                label={{
                  value: `Total: ${parseFloat(stock.total || 0).toFixed(2)}%`,
                  position: "top",
                  fill: "#FF4136",
                  fontSize: 13,
                }}
              />

              {/* Green line for average */}
              <ReferenceLine
                y={avgValue}
                stroke="green"
                strokeDasharray="6 6"
                label={{
                  value: `Avg: ${avgValue.toFixed(2)}%`,
                  position: "top",
                  fill: "green",
                  fontSize: 13,
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="modal-footer">
          <p className="client-count">Clients: {dataCount || 0}</p>
          <button className="modal-close-btn" onClick={closeModal}>
            Close
          </button>
        </div>
      </div>

      {/* Quick styling for the modal */}
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background-color: white;
          border-radius: 12px;
          width: 90%;
          max-width: 1200px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          animation: modalFadeIn 0.3s ease-out;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-title {
          margin: 0;
          font-size: 20px;
          color: #111827;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .modal-badges {
          display: flex;
          gap: 8px;
          margin-top: 5px;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          margin-left: 16px;
        }

        .modal-body {
          padding: 24px;
          flex: 1;
          overflow-y: auto;
        }

        .modal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }

        .client-count {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        }

        .modal-close-btn {
          padding: 8px 16px;
          background-color: #f3f4f6;
          color: #374151;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }

        .modal-close-btn:hover {
          background-color: #e5e7eb;
        }
      `}</style>
    </div>
  );
};

/* -----------------------------------------------------------
   2) CHART COMPONENT (used for top-level, sub-cat, or individual)
      - Also shows total & average lines, sorts data chronologically.
   ----------------------------------------------------------- */
const StockChart = React.memo(({ stock, onExpand }) => {
  // Sort bar data chronologically
  const chartData = stock.clients
    .map((client) => ({
      ...client,
      percentassets: parseFloat(client.percentassets || 0),
    }))
    .sort((a, b) => {
      // If you have a "date" field in each client
      if (a.date && b.date) {
        return new Date(a.date) - new Date(b.date);
      }
      return 0;
    });

  // Compute average
  const dataCount = chartData.length;
  const sumData = chartData.reduce((acc, c) => acc + c.percentassets, 0);
  const avgValue = dataCount > 0 ? sumData / dataCount : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-25">
        {/* Title */}
        <div className="flex items-center flex-1 min-w-0 gap-3">
          <h3 className="text-base font-medium text-gray-900 tracking-tight">
            {stock.symbolname || stock.category}
          </h3>
        </div>

        {/* Expand */}
        <button
          className="w-9 h-9 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200"
          onClick={() => onExpand(stock)}
          aria-label="Expand chart"
        >
          <FiMaximize2 className="w-5 h-5" />
        </button>
      </div>

      {/* The bar chart */}
      <div className="px-2 py-1">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={chartData}
            margin={{ top: 15, right: 5, left: 0, bottom: 5 }}
          >
            <CartesianGrid stroke="#e0e0e0" strokeDasharray="5 5" opacity={0.5} />
            <XAxis
              dataKey="clientcode"
              tick={{ fill: "#666", fontSize: 10 }}
              tickLine={{ stroke: "#e0e0e0" }}
            />
            <YAxis
              tick={{ fill: "#666", fontSize: 10 }}
              tickLine={{ stroke: "#e0e0e0" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255,255,255,0.95)",
                borderRadius: "6px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar
              dataKey="percentassets"
              fill="#D1A47B"
              name="Client Holding (%)"
              radius={[2, 2, 0, 0]}
            />

            {/* Red line for total */}
            <ReferenceLine
              y={parseFloat(stock.total || 0)}
              stroke="#FF4136"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Total: ${parseFloat(stock.total || 0).toFixed(2)}%`,
                position: "top",
                fill: "#FF4136",
                fontSize: 11,
              }}
            />

            {/* Green line for average */}
            <ReferenceLine
              y={avgValue}
              stroke="green"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Avg: ${avgValue.toFixed(2)}%`,
                position: "top",
                fill: "green",
                fontSize: 11,
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between items-center px-4 py-2 border-t border-gray-200 bg-gray-50 text-sm">
        <span className="text-red-600 font-medium">
          Total: {parseFloat(stock.total || 0).toFixed(2)}%
        </span>
        <span className="text-gray-500">{dataCount} Clients</span>
      </div>
    </div>
  );
});
StockChart.displayName = "StockChart";

/* -----------------------------------------------------------
   3) HELPER: Build combined data from multiple items
   ----------------------------------------------------------- */
function buildCombinedData(label, stocks) {
  const clientsMap = new Map();
  let sumTotal = 0;

  stocks.forEach((stock) => {
    stock.clients.forEach((c) => {
      const oldVal = clientsMap.get(c.clientcode) || 0;
      const newVal = oldVal + parseFloat(c.percentassets || 0);
      clientsMap.set(c.clientcode, newVal);
    });
  });

  const clientsArr = [];
  clientsMap.forEach((val, key) => {
    sumTotal += val;
    clientsArr.push({ clientcode: key, percentassets: val });
  });
  clientsArr.sort((a, b) => b.percentassets - a.percentassets); // sorted by largest

  return {
    symbolname: label,
    total: sumTotal,
    clients: clientsArr,
  };
}

/* -----------------------------------------------------------
   4) "Individual" Category Section (unchanged, if you keep it)
   ----------------------------------------------------------- */
const CategorySection = ({
  title,
  stocks,
  expanded,
  toggleExpand,
  onExpandChart,
}) => {
  if (!stocks || stocks.length === 0) return null;

  return (
    <div className="category-section mb-6">
      <div className="category-header cursor-pointer" onClick={toggleExpand}>
        <h2 className="category-title text-2xl font-extrabold inline-block">
          {title} <span className="category-count">({stocks.length})</span>
        </h2>
        <div className="inline-block ml-4 text-gray-500">
          {expanded
            ? `Showing ${stocks.length} items`
            : `${stocks.length} items hidden`}
        </div>
      </div>

      {expanded && (
        <div className="charts-grid mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {stocks.map((stock, index) => (
            <StockChart
              key={`${stock.symbolname}-${index}`}
              stock={stock}
              onExpand={onExpandChart}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* -----------------------------------------------------------
   5) THREE-LEVEL COMBINED FLOW (Simplified with Tabs):
      - Top-level: All Momentum, All Cash, All Low Vol, All Options
      - Tabs within each: Sub-categories or Individual Stocks
   ----------------------------------------------------------- */
function CombinedView({ stocks, onExpandChart }) {
  // State to track active tab for each top-level category
  const [activeTabs, setActiveTabs] = useState({
    momentum: "all", // Options: "all", "150", "500", "individual"
    cash: "all",     // Options: "all", "cash", "im", "individual"
    lowVol: "all",   // Options: "all", "100", "individual"
    options: "all",  // Options: "all", "calls", "puts", "individual"
  });

  // Filter and prepare data
  const lower = stocks.map((s) => ({
    ...s,
    lowerName: (s.symbolname || "").toLowerCase(),
  }));

  /* ---------- Momentum ---------- */
  const momentum150Items = lower.filter((s) => s.lowerName.includes("150 momentum"));
  const momentum500Items = lower.filter((s) => s.lowerName.includes("500 momentum"));
  const combined150 = buildCombinedData("All 150 Momentum", momentum150Items);
  const combined500 = buildCombinedData("All 500 Momentum", momentum500Items);
  const combinedAllMomentum = buildCombinedData("All Momentum", [
    ...momentum150Items,
    ...momentum500Items,
  ]);

  /* ---------- Cash ---------- */
  const cashOnly = lower.filter(
    (s) => s.lowerName.includes("cash") && !s.lowerName.includes("initial margin")
  );
  const initialMargin = lower.filter((s) => s.lowerName.includes("initial margin"));
  const combinedCash = buildCombinedData("All Cash", cashOnly);
  const combinedIM = buildCombinedData("All Initial Margin", initialMargin);
  const combinedCashIM = buildCombinedData("All Cash & IM", [
    ...cashOnly,
    ...initialMargin,
  ]);

  /* ---------- Low Volatility ---------- */
  const lowVolItems = lower.filter((s) => s.lowerName.includes("100 low volatility"));
  const combinedLowVolSingle = buildCombinedData("All 100 Low Volatility", lowVolItems);
  const combinedAllLowVol = buildCombinedData("All Low Volatility", lowVolItems);

  /* ---------- Options ---------- */
  const calls = lower.filter((s) => s.lowerName.includes(" call "));
  const puts = lower.filter((s) => s.lowerName.includes(" put "));
  const combinedCalls = buildCombinedData("All Calls", calls);
  const combinedPuts = buildCombinedData("All Puts", puts);
  const combinedAllOptions = buildCombinedData("All Options", [...calls, ...puts]);

  // Helper to switch tabs
  const setTab = (category, tab) => {
    setActiveTabs((prev) => ({
      ...prev,
      [category]: tab,
    }));
  };

  // Render a category section with tabs
  const renderCategorySection = (category, title, tabsConfig) => {
    const activeTab = activeTabs[category];

    return (
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Category Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {Object.entries(tabsConfig).map(([tabKey, tabData]) => (
            <button
              key={tabKey}
              onClick={() => setTab(category, tabKey)}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === tabKey
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-gray-600 hover:text-indigo-600"
              }`}
            >
              {tabData.label} {/* Render the label here */}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {tabsConfig[activeTab].content} {/* Render only the content */}
        </div>
      </div>
    );
  };

  // Define tab configurations for each category
  const momentumTabs = {
    all: {
      label: "All Momentum",
      content: <StockChart stock={combinedAllMomentum} onExpand={onExpandChart} />,
    },
    "150": {
      label: "150 Momentum",
      content: <StockChart stock={combined150} onExpand={onExpandChart} />,
    },
    "500": {
      label: "500 Momentum",
      content: <StockChart stock={combined500} onExpand={onExpandChart} />,
    },
    individual: {
      label: "Individual Stocks",
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...momentum150Items, ...momentum500Items].map((stock, idx) => (
            <StockChart
              key={`${stock.symbolname}-${idx}`}
              stock={stock}
              onExpand={onExpandChart}
            />
          ))}
        </div>
      ),
    },
  };

  const cashTabs = {
    all: {
      label: "All Cash & IM",
      content: <StockChart stock={combinedCashIM} onExpand={onExpandChart} />,
    },
    cash: {
      label: "Cash",
      content: <StockChart stock={combinedCash} onExpand={onExpandChart} />,
    },
    im: {
      label: "Initial Margin",
      content: <StockChart stock={combinedIM} onExpand={onExpandChart} />,
    },
    individual: {
      label: "Individual Items",
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...cashOnly, ...initialMargin].map((stock, idx) => (
            <StockChart
              key={`${stock.symbolname}-${idx}`}
              stock={stock}
              onExpand={onExpandChart}
            />
          ))}
        </div>
      ),
    },
  };

  const lowVolTabs = {
    all: {
      label: "All Low Volatility",
      content: <StockChart stock={combinedAllLowVol} onExpand={onExpandChart} />,
    },
    "100": {
      label: "100 Low Volatility",
      content: <StockChart stock={combinedLowVolSingle} onExpand={onExpandChart} />,
    },
    individual: {
      label: "Individual Stocks",
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {lowVolItems.map((stock, idx) => (
            <StockChart
              key={`${stock.symbolname}-${idx}`}
              stock={stock}
              onExpand={onExpandChart}
            />
          ))}
        </div>
      ),
    },
  };

  const optionsTabs = {
    all: {
      label: "All Options",
      content: <StockChart stock={combinedAllOptions} onExpand={onExpandChart} />,
    },
    calls: {
      label: "Calls",
      content: <StockChart stock={combinedCalls} onExpand={onExpandChart} />,
    },
    puts: {
      label: "Puts",
      content: <StockChart stock={combinedPuts} onExpand={onExpandChart} />,
    },
    individual: {
      label: "Individual Options",
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...calls, ...puts].map((stock, idx) => (
            <StockChart
              key={`${stock.symbolname}-${idx}`}
              stock={stock}
              onExpand={onExpandChart}
            />
          ))}
        </div>
      ),
    },
  };

  return (
    <div className="space-y-6">
      {renderCategorySection("momentum", "Momentum", momentumTabs)}
      {renderCategorySection("cash", "Cash & Initial Margin", cashTabs)}
      {renderCategorySection("lowVol", "Low Volatility", lowVolTabs)}
      {renderCategorySection("options", "Options", optionsTabs)}
    </div>
  );
}

/* -----------------------------------------------------------
   6) MAIN PAGE
   ----------------------------------------------------------- */
const Index = () => {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [activeStrategy, setActiveStrategy] = useState("All");
  const [strategies, setStrategies] = useState(["All"]);
  const [loading, setLoading] = useState(true);

  // "viewMode" toggles between "individual" and "combined"
  const [viewMode, setViewMode] = useState("combined"); 
  // ^ Start in "combined" by default, as per your new flow.

  // For the "Individual" expansions
  const [expandedCategories, setExpandedCategories] = useState({
    CASH: true,
    OPTIONS: true,
    STOCKS: true,
  });

  // For the modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  // Fetch data
  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/holdings-percentage");
        const json = await res.json();

        if (Array.isArray(json) && json.length > 0) {
          setData(json);
          setFiltered(json);

          // Extract unique strategies
          const uniqueStrategies = [
            "All",
            ...new Set(json.map((stock) => stock.strategy).filter(Boolean)),
          ];
          setStrategies(uniqueStrategies);
        } else {
          console.error("Invalid data format received:", json);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching holdings:", error);
        setLoading(false);
      }
    };

    fetchHoldings();
  }, []);

  /* ------ Filtering ------ */
  const filterData = useCallback(
    (keyword, strategy) => {
      let filteredData = [...data];

      // strategy
      if (strategy && strategy !== "All") {
        filteredData = filteredData.filter((item) => item.strategy === strategy);
      }

      // keyword
      if (keyword) {
        filteredData = filteredData.filter((item) =>
          item.symbolname.toLowerCase().includes(keyword.toLowerCase())
        );
      }

      setFiltered(filteredData);
    },
    [data]
  );

  const handleSearch = (e) => {
    const keyword = e.target.value;
    setSearch(keyword);
    filterData(keyword, activeStrategy);
  };

  const handleStrategyFilter = (strategy) => {
    setActiveStrategy(strategy);
    filterData(search, strategy);
  };

  const clearFilters = () => {
    setSearch("");
    setActiveStrategy("All");
    setFiltered(data);
  };

  /* ------ Expand/Collapse in Individual mode ------ */
  const toggleCategory = (categoryKey) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  };

  /* ------ Modal Logic ------ */
  const handleExpandChart = (stock) => {
    setSelectedStock(stock);
    setModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedStock(null);
    document.body.style.overflow = "auto";
  };

  /* ------ Filter out invalid data ------ */
  const validFilteredData = useMemo(() => {
    return filtered.filter(
      (stock) =>
        stock &&
        stock.clients &&
        Array.isArray(stock.clients) &&
        stock.clients.length > 0
    );
  }, [filtered]);

  const noData = validFilteredData.length === 0;

  /* =============== INDIVIDUAL MODE LOGIC =============== */
  // Group into: CASH, OPTIONS, STOCKS
  const categorizeStock = (symbolName) => {
    const name = symbolName.toLowerCase();
    if (name.includes("cash") || name.includes("initial margin")) {
      return "CASH";
    } else if (name.includes("call") || name.includes("put")) {
      return "OPTIONS";
    } else {
      return "STOCKS";
    }
  };

  const individualData = useMemo(() => {
    return validFilteredData.map((s) => ({
      ...s,
      category: s.category || categorizeStock(s.symbolname),
    }));
  }, [validFilteredData]);

  const categoriesGrouped = useMemo(() => {
    const result = { CASH: [], OPTIONS: [], STOCKS: [] };
    individualData.forEach((stock) => {
      if (result[stock.category]) {
        result[stock.category].push(stock);
      } else {
        result.STOCKS.push(stock);
      }
    });
    return result;
  }, [individualData]);

  const categoryStats = useMemo(() => {
    return {
      CASH: categoriesGrouped.CASH.length,
      OPTIONS: categoriesGrouped.OPTIONS.length,
      STOCKS: categoriesGrouped.STOCKS.length,
      TOTAL: individualData.length,
    };
  }, [categoriesGrouped, individualData]);

  /* -----------------------------------------------------------
     RENDER
  ----------------------------------------------------------- */
  if (loading) {
    return (
      <DefaultDashboardLayout>
        <div className="p-8 text-gray-800 flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mb-4" />
          <p>Loading data...</p>
        </div>
      </DefaultDashboardLayout>
    );
  }

  return (
    <DefaultDashboardLayout>
      <div className="px-6 py-8 max-w-8xl mx-auto text-gray-800">
        {/* Strategy Filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 font-medium mr-2">Strategies:</span>
          {strategies.map((strategy) => (
            <button
              key={strategy}
              onClick={() => handleStrategyFilter(strategy)}
              className={`px-3 py-1 text-sm rounded border ${
                activeStrategy === strategy
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {strategy}
            </button>
          ))}
        </div>

        {/* Search + Clear Filters + View Mode Switch */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* Search */}
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search stock name..."
              value={search}
              onChange={handleSearch}
              className="w-full sm:w-64 pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            {search && (
              <button
                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 text-sm"
                onClick={() => {
                  setSearch("");
                  filterData("", activeStrategy);
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* Active filters row */}
        {(search || activeStrategy !== "All") && (
            <div className="bg-gray-100 p-2 rounded text-sm text-gray-600 flex flex-wrap gap-2 items-center">
                <span className="font-medium">Active:</span>
                {activeStrategy !== "All" && (
                    <span className="px-2 py-0.5 bg-white border border-gray-300 rounded">
                        Strategy: {activeStrategy}
                    </span>
                )}
                {search && (
                    <span className="px-2 py-0.5 bg-white border border-gray-300 rounded">
                        Search: \"{search}\"
                    </span>
                )}
                <button
                    onClick={clearFilters}
                    className="text-red-600 underline ml-2"
                >
                    Clear
                </button>
            </div>
        )}

          {/* View Mode Switch */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("individual")}
              className={`px-3 py-1 text-sm rounded border ${
                viewMode === "individual"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              Individual
            </button>
            <button
              onClick={() => setViewMode("combined")}
              className={`px-3 py-1 text-sm rounded border ${
                viewMode === "combined"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              Combined
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        {noData ? (
          <div className="text-center text-gray-500 mt-10">
            No data found...
          </div>
        ) : viewMode === "individual" ? (
          /* --------------------------------
             INDIVIDUAL MODE
          -------------------------------- */
          <div>
            <CategorySection
              title="CASH"
              stocks={categoriesGrouped.CASH}
              expanded={expandedCategories.CASH}
              toggleExpand={() => toggleCategory("CASH")}
              onExpandChart={handleExpandChart}
            />
            <CategorySection
              title="OPTIONS"
              stocks={categoriesGrouped.OPTIONS}
              expanded={expandedCategories.OPTIONS}
              toggleExpand={() => toggleCategory("OPTIONS")}
              onExpandChart={handleExpandChart}
            />
            <CategorySection
              title="STOCKS"
              stocks={categoriesGrouped.STOCKS}
              expanded={expandedCategories.STOCKS}
              toggleExpand={() => toggleCategory("STOCKS")}
              onExpandChart={handleExpandChart}
            />

            <div className="mt-6 text-sm text-gray-600">
              Total: {categoryStats.TOTAL} items (Stocks: {categoryStats.STOCKS},{" "}
              Options: {categoryStats.OPTIONS}, Cash: {categoryStats.CASH})
            </div>
          </div>
        ) : (
          /* --------------------------------
             COMBINED MODE (3-level Flow)
          -------------------------------- */
          <CombinedView stocks={validFilteredData} onExpandChart={handleExpandChart} />
        )}

        {/* Modal for Large Chart */}
        <ChartModal
          isOpen={modalOpen}
          closeModal={handleCloseModal}
          stock={selectedStock}
        />
      </div>
    </DefaultDashboardLayout>
  );
};

export default Index;


// Server-side protection: Check for the "auth" cookie and redirect if missing
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
