export function calculateReturns(data, period) {
    if (!data || data.length === 0) return '-';

    // Ensure data is sorted by date in ascending order
    const sortedData = data.slice().sort((a, b) => new Date(a.date) - new Date(b.date));

    const currentEntry = sortedData[sortedData.length - 1];
    const currentValue = currentEntry.nav; // Latest NAV
    const currentDate = new Date(currentEntry.date); // Latest date

    let comparisonValue;
    let yearDiff;

    // Define periods less than 1 week
    const shortPeriods = ['1D', '2D', '3D'];

    if (shortPeriods.includes(period)) {
        // Handle periods less than 1 week by direct indexing
        const daysMap = {
            '1D': 1,
            '2D': 2,
            '3D': 3,
        };

        const daysBack = daysMap[period];
        const requiredIndex = sortedData.length - 1 - daysBack;

        if (requiredIndex < 0) {
            return '-'; // Not enough data points
        }

        const comparisonData = sortedData[requiredIndex];
        comparisonValue = comparisonData.nav;

        yearDiff = daysBack / 365.25; // Approximate year difference

        // Use absolute returns for periods < 1 year
        return (((currentValue - comparisonValue) / comparisonValue) * 100).toFixed(2);
    } else {
        // Handle periods 1 week and above with backfilling
        let comparisonDate;

        if (period === '1W') {
            // For 1W, go back exactly 7 days
            comparisonDate = addDays(currentDate, -7);
        } else {
            // For periods >= 1M, find the same date in the previous month(s)
            switch (period) {
                case '1M':
                    comparisonDate = subtractMonths(currentDate, 1);
                    break;
                case '3M':
                    comparisonDate = subtractMonths(currentDate, 3);
                    break;
                case '6M':
                    comparisonDate = subtractMonths(currentDate, 6);
                    break;
                case '9M':
                    comparisonDate = subtractMonths(currentDate, 9);
                    break;
                case '1Y':
                    comparisonDate = subtractYears(currentDate, 1);
                    break;
                case '2Y':
                    comparisonDate = subtractYears(currentDate, 2);
                    break;
                case '3Y':
                    comparisonDate = subtractYears(currentDate, 3);
                    break;
                case '4Y':
                    comparisonDate = subtractYears(currentDate, 4);
                    break;
                case '5Y':
                    comparisonDate = subtractYears(currentDate, 5);
                    break;
                default:
                    return '-';
            }
        }

        // Find the NAV on the comparison date or the most recent prior date
        const comparisonDataFound = findClosestData(sortedData, comparisonDate);

        if (!comparisonDataFound) {
            return '-'; // No data available for the comparison date or any prior date
        }

        comparisonValue = comparisonDataFound.nav;
        const actualComparisonDate = new Date(comparisonDataFound.date);
        
        // Calculate exact year difference
        yearDiff = (currentDate - actualComparisonDate) / (1000 * 60 * 60 * 24 * 365.25);
        
        if (comparisonValue && comparisonValue !== 0) {
            if (yearDiff <= 1) {
                // Use absolute returns for periods <= 1 year
                return (((currentValue - comparisonValue) / comparisonValue) * 100).toFixed(2);
            } else {
                // Use CAGR for periods > 1 year
                const cagr = (Math.pow(currentValue / comparisonValue, 1 / yearDiff) - 1) * 100;
                return cagr.toFixed(2);
            }
        }

        return '-';
    }
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