import DefaultDashboardLayout from "layouts/DefaultDashboardLayout";
import React, { useEffect, useState, useMemo, useCallback } from "react";
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

// Modal component for expanded chart view
const ChartModal = ({ isOpen, closeModal, stock }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {stock.symbolname}
                        <div className="modal-badges">
                            <span className="strategy-badge">{stock.strategy}</span>
                            <span className={`strategy-badge category-${stock.category.toLowerCase()}`}>
                                {stock.category}
                            </span>
                        </div>
                    </h2>
                    <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="modal-body">
                    <ResponsiveContainer width="100%" height={500}>
                        <BarChart
                            data={stock.clients.map((client) => ({
                                ...client,
                                percentassets: parseFloat(client.percentassets || 0),
                            }))}
                            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                            <CartesianGrid stroke="#e0e0e0" strokeDasharray="5 5" />
                            <XAxis
                                dataKey="clientcode"
                                tick={{ fill: '#666', fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={70}
                            />
                            <YAxis tick={{ fill: '#666', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255,255,255,0.95)',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    fontSize: '13px'
                                }}
                            />
                            <Legend
                                iconType="circle"
                                wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }}
                            />
                            <Bar
                                dataKey="percentassets"
                                fill="#D1A47B"
                                name="Client Holding (%)"
                                radius={[4, 4, 0, 0]}
                            />
                            <ReferenceLine
                                y={parseFloat(stock.total || 0)}
                                stroke="#FF4136"
                                strokeDasharray="6 6"
                                label={{
                                    value: `Total: ${parseFloat(stock.total || 0).toFixed(2)}%`,
                                    position: "top",
                                    fill: "#FF4136",
                                    fontSize: 13
                                }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="modal-footer">
                    <p className="client-count">Clients: {stock.clients.length}</p>
                    <button className="modal-close-btn" onClick={closeModal}>Close</button>
                </div>
            </div>

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
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
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

// Memoized chart component to prevent unnecessary re-renders
const StockChart = React.memo(({ stock, onExpand }) => {
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-25">
                {/* Left side: Symbol name + badges */}
                <div className="flex items-center flex-1 min-w-0 gap-3">
                    <h3 className="text-base font-medium text-gray-900 tracking-tight">
                        {stock.symbolname}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded-full uppercase tracking-wide">
                            {stock.strategy}
                        </span>
                        <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wide ${stock.category === "CASH"
                                ? "bg-green-100 text-green-800"
                                : stock.category === "OPTIONS"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                        >
                            {stock.category}
                        </span>
                    </div>
                </div>

                {/* Right side: Expand button */}
                <button
                    className="w-9 h-9 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200"
                    onClick={() => onExpand(stock)}
                    aria-label="Expand chart"
                >
                    <FiMaximize2 className="w-5 h-5" />
                </button>
            </div>

            <div className="px-2 py-1">
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                        data={stock.clients.map((client) => ({
                            ...client,
                            percentassets: parseFloat(client.percentassets || 0),
                        }))}
                        margin={{ top: 15, right: 5, left: 0, bottom: 5 }}
                    >
                        <CartesianGrid stroke="#e0e0e0" strokeDasharray="5 5" opacity={0.5} />
                        <XAxis
                            dataKey="clientcode"
                            tick={{ fill: '#666', fontSize: 10 }}
                            tickLine={{ stroke: '#e0e0e0' }}
                        />
                        <YAxis
                            tick={{ fill: '#666', fontSize: 10 }}
                            tickLine={{ stroke: '#e0e0e0' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255,255,255,0.95)',
                                borderRadius: '6px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                fontSize: '12px'
                            }}
                        />
                        <Bar
                            dataKey="percentassets"
                            fill="#D1A47B"
                            name="Client Holding (%)"
                            radius={[2, 2, 0, 0]}
                        />
                        <ReferenceLine
                            y={parseFloat(stock.total || 0)}
                            stroke="#FF4136"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="flex justify-between items-center px-4 py-2 border-t border-gray-200 bg-gray-50 text-sm">
                <span className="text-red-600 font-medium">Total: {parseFloat(stock.total || 0).toFixed(2)}%</span>
                <span className="text-gray-500">{stock.clients.length} Clients</span>
            </div>
        </div>
    );
});
StockChart.displayName = 'StockChart';

// Define category section component
const CategorySection = ({ title, stocks, expanded, toggleExpand, onExpandChart }) => {
    if (!stocks || stocks.length === 0) return null;

    return (
        <div className="category-section">
            <div className="category-header" onClick={toggleExpand}>
                <h2 className="category-title text-2xl font-extrabold">{title} <span className="category-count">({stocks.length})</span></h2>
                <div className="category-header-right mb-2">
                    {stocks.length > 0 && (
                        <span className="total-stocks">
                            {expanded ? `Showing ${stocks.length} stocks` : `${stocks.length} stocks hidden`}
                        </span>
                    )}
                    <span className="expand-icon">{expanded ? '−' : '+'}</span>
                </div>
            </div>

            {expanded && (
                <div className="charts-grid">
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

const Index = () => {
    const [data, setData] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [activeStrategy, setActiveStrategy] = useState("All");
    const [strategies, setStrategies] = useState(["All"]);
    const [loading, setLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState({
        CASH: true,
        OPTIONS: true,
        STOCKS: true
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);

    // Function to categorize stocks
    const categorizeStock = (stockName) => {
        const name = stockName.toLowerCase();
        if (name.includes('cash') || name.includes('initial margin')) {
            return 'CASH';
        } else if (name.includes('call') || name.includes('put')) {
            return 'OPTIONS';
        } else {
            return 'STOCKS';
        }
    };

    useEffect(() => {
        const fetchHoldings = async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/holdings-percentage");
                const json = await res.json();

                // Check if data is valid and has the expected structure
                if (Array.isArray(json) && json.length > 0) {
                    // Add category to each stock if not already present
                    const categorizedData = json.map(stock => ({
                        ...stock,
                        category: stock.category || categorizeStock(stock.symbolname)
                    }));

                    setData(categorizedData);
                    setFiltered(categorizedData);

                    // Extract unique strategies
                    const uniqueStrategies = ["All", ...new Set(json.map(stock => stock.strategy).filter(Boolean))];
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

    const filterData = useCallback((keyword, strategy) => {
        let filteredData = [...data]; // Create a copy to avoid mutation

        // Filter by strategy first
        if (strategy && strategy !== "All") {
            filteredData = filteredData.filter((item) => item.strategy === strategy);
        }

        // Then filter by search keyword
        if (keyword) {
            filteredData = filteredData.filter((item) =>
                item.symbolname.toLowerCase().includes(keyword.toLowerCase())
            );
        }

        setFiltered(filteredData);
    }, [data]);

    const handleSearch = useCallback((e) => {
        const keyword = e.target.value;
        setSearch(keyword);
        filterData(keyword, activeStrategy);
    }, [activeStrategy, filterData]);

    const handleStrategyFilter = useCallback((strategy) => {
        setActiveStrategy(strategy);
        filterData(search, strategy);
    }, [search, filterData]);

    // Toggle category expansion
    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    // Handle chart expand
    const handleExpandChart = (stock) => {
        setSelectedStock(stock);
        setModalOpen(true);

        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';
    };

    // Handle modal close
    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedStock(null);

        // Restore body scrolling
        document.body.style.overflow = 'auto';
    };

    // Clear all filters
    const clearFilters = () => {
        setSearch("");
        setActiveStrategy("All");
        setFiltered(data);
    };

    // Memoize the filtered data with valid clients
    const validFilteredData = useMemo(() => {
        return filtered.filter((stock) =>
            stock && stock.clients && Array.isArray(stock.clients) && stock.clients.length > 0
        );
    }, [filtered]);

    // Categorize the filtered data
    const categorizedData = useMemo(() => {
        const categories = {
            CASH: [],
            OPTIONS: [],
            STOCKS: []
        };

        validFilteredData.forEach(stock => {
            categories[stock.category].push(stock);
        });

        return categories;
    }, [validFilteredData]);

    // Calculate stats for category display
    const categoryStats = useMemo(() => {
        return {
            CASH: categorizedData.CASH.length,
            OPTIONS: categorizedData.OPTIONS.length,
            STOCKS: categorizedData.STOCKS.length,
            TOTAL: validFilteredData.length
        };
    }, [categorizedData, validFilteredData]);

    return (
        <DefaultDashboardLayout>
            <div className="px-6 py-8 max-w-8xl mx-auto text-gray-800">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Client Holdings by Stock</h1>
                    <div className="flex flex-wrap items-center gap-6 bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-semibold">{categoryStats.TOTAL}</span>
                            <span className="text-sm text-gray-500">Total Stocks</span>
                        </div>
                        <div className="w-px h-6 bg-gray-300" />
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-semibold">{categoryStats.CASH}</span>
                            <span className="text-sm text-gray-500">Cash</span>
                        </div>
                        <div className="w-px h-6 bg-gray-300" />
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-semibold">{categoryStats.OPTIONS}</span>
                            <span className="text-sm text-gray-500">Options</span>
                        </div>
                        <div className="w-px h-6 bg-gray-300" />
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-semibold">{categoryStats.STOCKS}</span>
                            <span className="text-sm text-gray-500">Stocks</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                    {/* Search */}
                    <div className="relative w-full lg:max-w-sm">
                        <input
                            type="text"
                            placeholder="Search stock name..."
                            value={search}
                            onChange={handleSearch}
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                        <div className="absolute left-3 top-2.5 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

                    {/* Strategy filters */}
                    <div className="flex flex-col gap-2 w-full lg:w-auto">
                        <span className="text-sm text-gray-600 font-medium">Strategies:</span>
                        <div className="flex flex-wrap gap-2">
                            {strategies.map((strategy) => (
                                <button
                                    key={strategy}
                                    onClick={() => handleStrategyFilter(strategy)}
                                    className={`px-3 py-1 text-sm rounded border ${activeStrategy === strategy
                                        ? "bg-[#D1A47B] text-white border-[#D1A47B]"
                                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                        }`}
                                >
                                    {strategy}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Active Filters */}
                {(search || activeStrategy !== "All") && (
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-100 p-3 rounded mb-6">
                        <div className="flex flex-wrap gap-2 text-sm text-gray-700 mb-2 md:mb-0">
                            <span className="font-medium">Active Filters:</span>
                            {search && <span className="px-2 py-0.5 bg-white border border-gray-300 rounded">{`Search: "${search}"`}</span>}
                            {activeStrategy !== "All" && <span className="px-2 py-0.5 bg-white border border-gray-300 rounded">{`Strategy: ${activeStrategy}`}</span>}
                        </div>
                        <button
                            onClick={clearFilters}
                            className="text-sm text-gray-600 hover:text-gray-800 underline"
                        >
                            Clear All
                        </button>
                    </div>
                )}

                {/* Loading / No results / Charts */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mb-4" />
                        <p>Loading stock data...</p>
                    </div>
                ) : validFilteredData.length > 0 ? (
                    <div className="space-y-6">
                        <CategorySection
                            title="CASH"
                            stocks={categorizedData.CASH}
                            expanded={expandedCategories.CASH}
                            toggleExpand={() => toggleCategory('CASH')}
                            onExpandChart={handleExpandChart}
                        />

                        <CategorySection
                            title="STOCKS"
                            stocks={categorizedData.STOCKS}
                            expanded={expandedCategories.STOCKS}
                            toggleExpand={() => toggleCategory('STOCKS')}
                            onExpandChart={handleExpandChart}
                        />


                        <CategorySection
                            title="OPTIONS"
                            stocks={categorizedData.OPTIONS}
                            expanded={expandedCategories.OPTIONS}
                            toggleExpand={() => toggleCategory('OPTIONS')}
                            onExpandChart={handleExpandChart}
                        />

                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-gray-500 py-20">
                        <div className="mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                <line x1="8" y1="11" x2="14" y2="11"></line>
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No stocks found matching your criteria</h3>
                        <p className="mb-4 text-sm">Try adjusting your search terms or strategy filter.</p>
                        <button
                            onClick={clearFilters}
                            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm"
                        >
                            Reset All Filters
                        </button>
                    </div>
                )}
            </div>


            {/* Chart Modal */}
            <ChartModal
                isOpen={modalOpen}
                closeModal={handleCloseModal}
                stock={selectedStock}
            />
        </DefaultDashboardLayout>
    );
};
Index.displayName = 'ClientHoldingsPercentagePage';
export default Index;

// Server-side function to handle authentication (optional)
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
