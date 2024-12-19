// utils/calculateReturns.js

export function calculateReturns(data, period) {
    const currentValue = data[data.length - 1].nav;  // Latest nav value
    let comparisonValue;

    // Determine the comparison value based on the period
    switch (period) {
        case '1D':
            comparisonValue = data[data.length - 2]?.nav;  // 1 day ago
            break;
        case '2D':
            comparisonValue = data[data.length - 3]?.nav;  // 2 days ago
            break;
        case '3D':
            comparisonValue = data[data.length - 4]?.nav;  // 3 days ago
            break;
        case '10D':
            comparisonValue = data[data.length - 10]?.nav;  // 10 days ago
            break;
        case '1W':
            comparisonValue = data[data.length - 7]?.nav;   // 7 days ago
            break;
        case '1M':
            comparisonValue = data[data.length - 30]?.nav;  // 30 days ago
            break;
        case '3M':
            comparisonValue = data[data.length - 90]?.nav;  // 90 days ago
            break;
        case '6M':
            comparisonValue = data[data.length - 180]?.nav; // 180 days ago
            break;
        case '9M':
            comparisonValue = data[data.length - 270]?.nav; // 270 days ago
            break;
        case '1Y':
            comparisonValue = data[data.length - 365]?.nav; // 365 days ago
            break;
        default:
            comparisonValue = data[0]?.nav;  // Fallback to the first value
    }

    // If comparisonValue is undefined (e.g., not enough data), return 0
    if (comparisonValue !== undefined) {
        return (((currentValue - comparisonValue) / comparisonValue) * 100).toFixed(2); // Percentage change
    }

    return 0;  // Return 0% if not enough data
}