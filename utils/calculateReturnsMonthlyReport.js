//utils/calculateReturnsMonthlyReport.js
export function calculateReturns(data, period, validTradingDays, upperLimit = null) {
    if (!data || data.length === 0) return { value: '-', date: null };

    const sortedData = data.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Use upperLimit if provided, otherwise use the latest data point
    const currentEntry = upperLimit 
        ? sortedData.find(d => new Date(d.date).toISOString().split('T')[0] === upperLimit.toISOString().split('T')[0]) 
            || sortedData[sortedData.length - 1]
        : sortedData[sortedData.length - 1];
    if (!currentEntry) return { value: '-', date: null };

    const currentValue = currentEntry.nav;
    const currentDate = new Date(currentEntry.date);
    console.log('currentDate', currentDate);
    let comparisonValue;
    let yearDiff;
    let compDate;

    if (period === 'Since Inception') {
        const inceptionData = sortedData[0];
        if (!inceptionData || !inceptionData.nav) return { value: '-', date: null };
    
        comparisonValue = inceptionData.nav;
        compDate = new Date(inceptionData.date);
        yearDiff = (currentDate - compDate) / (1000 * 60 * 60 * 24 * 365.25);
        const computedReturn = yearDiff <= 1 
            ? (((currentValue - comparisonValue) / comparisonValue) * 100).toFixed(2)
            : ((Math.pow(currentValue / comparisonValue, 1 / yearDiff) - 1) * 100).toFixed(2);
        return { value: computedReturn, date: compDate.toISOString().split('T')[0] };
    }
    
    // Handle short periods (1D, 2D, 3D, 10D, 1W)
    const shortPeriods = ['1D', '2D', '3D', '10D', '1W'];
    if (shortPeriods.includes(period)) {
        const daysMap = { '1D': 1, '2D': 2, '3D': 3, '10D': 10, '1W': 7 };
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
        if (!comparisonData || !comparisonData.nav) return { value: '-', date: null };
        comparisonValue = comparisonData.nav;
        compDate = new Date(comparisonData.date);
        const computedReturn = (((currentValue - comparisonValue) / comparisonValue) * 100).toFixed(2);
        return { value: computedReturn, date: compDate.toISOString().split('T')[0] };
    }
    
    // Handle month-based periods (1M, 3M, 6M, 9M, 1Y, 2Y, 3Y, 4Y, 5Y)
    const periodMap = {
        '1M': 1, '3M': 3, '6M': 6, '9M': 9,
        '1Y': 12, '2Y': 24, '3Y': 36, '4Y': 48, '5Y': 60
    };
    if (!periodMap[period]) return { value: '-', date: null };
    
    const months = periodMap[period];
    const comparisonDate = subtractMonths(currentDate, months);
    if (months === 1){
        console.log('compDate', comparisonDate);
    }
    const comparisonDataFound = findClosestEOMData(sortedData, comparisonDate, validTradingDays);
    if (!comparisonDataFound || !comparisonDataFound.nav) return { value: '-', date: null };
    comparisonValue = comparisonDataFound.nav;
    compDate = new Date(comparisonDataFound.date);
    

    yearDiff = (currentDate - compDate) / (1000 * 60 * 60 * 24 * 365.25);
    const computedReturn = yearDiff <= 1
        ? (((currentValue - comparisonValue) / comparisonValue) * 100).toFixed(2)
        : ((Math.pow(currentValue / comparisonValue, 1 / yearDiff) - 1) * 100).toFixed(2);
    return { value: computedReturn, date: compDate.toISOString().split('T')[0] };
}

function subtractMonths(date, months) {
    const result = new Date(date);
    const targetMonth = result.getMonth() - months;
    const targetYear = result.getFullYear() + Math.floor(targetMonth / 12);
    const normalizedTargetMonth = ((targetMonth % 12) + 12) % 12;
    // Set to last day of the target month
    result.setFullYear(targetYear);
    result.setMonth(normalizedTargetMonth + 1, 0); // Last day of the target month
    return result;
}

function findClosestEOMData(sortedData, targetEndOfMonth, validTradingDays) {
    // Adjust window to ensure we capture the correct EOM date
    const windowStart = new Date(targetEndOfMonth);
    windowStart.setDate(windowStart.getDate() - 7);

    const eligiblePoints = sortedData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate <= targetEndOfMonth &&
               itemDate >= windowStart &&
               (!validTradingDays || validTradingDays.has(itemDate.toISOString().split('T')[0]));
    });

    eligiblePoints.sort((a, b) => new Date(b.date) - new Date(a.date));

    const exactMatch = eligiblePoints.find(item => {
        return new Date(item.date).toISOString().split('T')[0] === targetEndOfMonth.toISOString().split('T')[0];
    });

    if (exactMatch) {
        return { ...exactMatch, date: new Date(exactMatch.date) };
    }
    
    if (eligiblePoints.length > 0) {
        return { ...eligiblePoints[0], date: eligiblePoints[0].date };
    }
    
    return null;
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