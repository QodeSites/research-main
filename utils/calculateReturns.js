export function calculateReturns(data, period, validTradingDays) {
    if (!data || data.length === 0) return '-';

    const sortedData = data.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    const currentEntry = sortedData[sortedData.length - 1];
    const currentValue = currentEntry.nav;
    const currentDate = new Date(currentEntry.date);

    let comparisonValue;
    let yearDiff;

    if (period === 'Since Inception') {
        const inceptionData = sortedData[0];
        if (!inceptionData || !inceptionData.nav) return '-';

        comparisonValue = inceptionData.nav;
        const inceptionDate = new Date(inceptionData.date);
        yearDiff = (currentDate - inceptionDate) / (1000 * 60 * 60 * 24 * 365.25);

        return yearDiff <= 1 
            ? (((currentValue - comparisonValue) / comparisonValue) * 100).toFixed(2)
            : ((Math.pow(currentValue / comparisonValue, 1 / yearDiff) - 1) * 100).toFixed(2);
    }

    const shortPeriods = ['1D', '2D', '3D'];
    if (shortPeriods.includes(period)) {
        const daysMap = { '1D': 1, '2D': 2, '3D': 3 };
        const targetDaysBack = daysMap[period];

        let validDaysCount = 0;
        let comparisonData = null;
        
        for (let i = sortedData.length - 2; i >= 0; i--) {
            const dateStr = new Date(sortedData[i].date).toISOString().split('T')[0];
            if (!validTradingDays || validTradingDays.has(dateStr)) {
                validDaysCount++;
                if (validDaysCount === targetDaysBack) {
                    comparisonData = sortedData[i];
                    break;
                }
            }
        }

        if (!comparisonData || !comparisonData.nav) return '-';
        
        comparisonValue = comparisonData.nav;
        return (((currentValue - comparisonValue) / comparisonValue) * 100).toFixed(2);
    }

    let comparisonDate;
    let minimumDataPoints;

    if (period === '1W') {
        comparisonDate = addDays(currentDate, -7);
        minimumDataPoints = 5;
    } else if (period === '10D') {
        comparisonDate = addDays(currentDate, -10);
        minimumDataPoints = 7;
    } else {
        const periodMap = {
            '1M': [1, 15], '3M': [3, 45], '6M': [6, 90], '9M': [9, 135],
            '1Y': [12, 180], '2Y': [24, 360], '3Y': [36, 540],
            '4Y': [48, 720], '5Y': [60, 900]
        };
        
        if (!periodMap[period]) return '-';
        
        const [months, points] = periodMap[period];
        comparisonDate = subtractMonths(currentDate, months);
        minimumDataPoints = points;
    }

    const dataPointsInPeriod = sortedData.filter(d => {
        const date = new Date(d.date);
        const dateStr = date.toISOString().split('T')[0];
        return date >= comparisonDate && 
               date <= currentDate && 
               (!validTradingDays || validTradingDays.has(dateStr));
    }).length;

    if (dataPointsInPeriod < minimumDataPoints) return '-';

    const comparisonDataFound = findClosestData(sortedData, comparisonDate, validTradingDays);
    if (!comparisonDataFound || !comparisonDataFound.nav) return '-';

    comparisonValue = comparisonDataFound.nav;
    const actualComparisonDate = new Date(comparisonDataFound.date);
    yearDiff = (currentDate - actualComparisonDate) / (1000 * 60 * 60 * 24 * 365.25);

    return yearDiff <= 1
        ? (((currentValue - comparisonValue) / comparisonValue) * 100).toFixed(2)
        : ((Math.pow(currentValue / comparisonValue, 1 / yearDiff) - 1) * 100).toFixed(2);
}

// Helper functions
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function subtractMonths(date, months) {
    const result = new Date(date);
    const targetMonth = result.getMonth() - months;
    const targetYear = result.getFullYear() + Math.floor(targetMonth / 12);

    // Calculate the target month properly, handling negative months
    const normalizedTargetMonth = ((targetMonth % 12) + 12) % 12;

    result.setFullYear(targetYear);
    result.setMonth(normalizedTargetMonth);

    // Handle end-of-month cases
    const originalDate = date.getDate();
    const newLastDay = new Date(targetYear, normalizedTargetMonth + 1, 0).getDate();

    // Set to the last day of month if original date is greater than last day of target month
    result.setDate(Math.min(originalDate, newLastDay));

    return result;
}

function subtractYears(date, years) {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() - years);

    // Handle February 29 for leap years
    if (date.getMonth() === 1 && date.getDate() === 29 && !isLeapYear(result.getFullYear())) {
        result.setDate(28);
    }
    return result;
}

function isLeapYear(year) {
    return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
}

function findClosestData(sortedData, targetDate) {
    let closest = null;
    let minDiff = Infinity;

    // First try to find exact match or closest previous date
    for (let i = sortedData.length - 1; i >= 0; i--) {
        const currentDate = new Date(sortedData[i].date);
        const diff = targetDate - currentDate;

        if (diff >= 0 && diff < minDiff) {
            minDiff = diff;
            closest = sortedData[i];
        }
    }

    // If no previous date found, take the earliest available date
    if (!closest && sortedData.length > 0) {
        closest = sortedData[0];
    }

    return closest ? { ...closest, date: new Date(closest.date) } : null;
}

export function calculateDrawdown(data) {
    if (!data || data.length === 0) return '-';

    const peakNav = Math.max(...data.map(d => d.nav));
    const currentNav = data[data.length - 1].nav;
    const drawdown = ((currentNav - peakNav) / peakNav) * 100;

    return drawdown.toFixed(2);
}

export function calculateMDD(data) {
    if (!data || data.length === 0) return '-';

    // Ensure data is sorted by date in ascending order
    const sortedData = data.slice().sort((a, b) => new Date(a.date) - new Date(b.date));

    let peak = sortedData[0].nav; // Initialize peak with the first NAV
    let maxDrawdown = 0; // Initialize maximum drawdown

    for (let i = 1; i < sortedData.length; i++) {
        const currentNav = sortedData[i].nav;

        // Update the peak if the current NAV is higher than the previous peak
        if (currentNav > peak) {
            peak = currentNav;
        }

        // Calculate the drawdown from the current peak
        const drawdown = ((peak - currentNav) / peak) * 100;

        // Update the maximum drawdown if the current drawdown is larger
        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
        }
    }

    return `${maxDrawdown.toFixed(2)}%`; // Return MDD as a percentage string with 2 decimal places
}