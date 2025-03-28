import React, { useEffect, useState } from "react";
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

const Index = () => {
    const [data, setData] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [activeStrategy, setActiveStrategy] = useState("All");
    const [strategies, setStrategies] = useState(["All"]);

    useEffect(() => {
        const fetchHoldings = async () => {
            try {
                const res = await fetch("/api/holdings-percentage");
                const json = await res.json();
                setData(json);
                setFiltered(json);

                // Extract unique strategies
                const uniqueStrategies = ["All", ...new Set(json.map(stock => stock.strategy).filter(Boolean))];
                setStrategies(uniqueStrategies);
            } catch (error) {
                console.error("Error fetching holdings:", error);
            }
        };

        fetchHoldings();
    }, []);

    const handleSearch = (e) => {
        const keyword = e.target.value.toLowerCase();
        setSearch(keyword);
        filterData(keyword, activeStrategy);
    };

    const handleStrategyFilter = (strategy) => {
        setActiveStrategy(strategy);
        filterData(search, strategy);
    };

    const filterData = (keyword, strategy) => {
        let filteredData = data;

        // Filter by search keyword
        if (keyword) {
            filteredData = filteredData.filter((item) =>
                item.symbolname.toLowerCase().includes(keyword)
            );
        }

        // Filter by strategy
        if (strategy !== "All") {
            filteredData = filteredData.filter((item) => item.strategy === strategy);
        }

        setFiltered(filteredData);
    };

    return (
        <div className="holdings-container">
            <h1 className="page-title">Client Holdings by Stock</h1>

            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search stock name..."
                    value={search}
                    onChange={handleSearch}
                    className="search-input"
                />
            </div>

            {/* Strategy Tabs */}
            <div className="strategy-tabs">
                {strategies.map((strategy) => (
                    <button
                        key={strategy}
                        className={`strategy-tab ${activeStrategy === strategy ? 'active' : ''}`}
                        onClick={() => handleStrategyFilter(strategy)}
                    >
                        {strategy}
                    </button>
                ))}
            </div>

            <div className="charts-wrapper">
                <div className="charts-grid">
                    {filtered
                        .filter((stock) => stock.clients && stock.clients.length > 0)
                        .map((stock, stockIndex) => (
                            <div
                                key={stock.symbolname}
                                className="chart-card"
                            >
                                <h2 className="chart-title">
                                    {stock.symbolname} 
                                    <span className="strategy-badge">{stock.strategy}</span>
                                </h2>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart
                                        data={stock.clients.map((client) => ({
                                            ...client,
                                            percentassets: parseFloat(client.percentassets || 0),
                                        }))}
                                    >
                                        <CartesianGrid 
                                            stroke="#e0e0e0" 
                                            strokeDasharray="5 5" 
                                        />
                                        <XAxis 
                                            dataKey="clientcode" 
                                            tick={{fill: '#666'}}
                                        />
                                        <YAxis 
                                            tick={{fill: '#666'}}
                                        />
                                        <Tooltip 
                                            contentStyle={{
                                                backgroundColor: 'rgba(255,255,255,0.9)',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Legend 
                                            iconType="circle"
                                            wrapperStyle={{paddingTop: '10px'}}
                                        />
                                        <Bar
                                            dataKey="percentassets"
                                            fill="#4338ca"
                                            name="Client Holding (%)"
                                        />
                                        <ReferenceLine
                                            y={parseFloat(stock.total || 0)}
                                            stroke="#FF4136"
                                            strokeDasharray="6 6"
                                            label={{
                                                value: `Total: ${parseFloat(stock.total || 0).toFixed(2)}%`,
                                                position: "top",
                                                fill: "#FF4136",
                                            }}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default Index;