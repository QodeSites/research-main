export function calculateReturns(data, period) {
    if (!data || data.length === 0) return '-';
    
    const currentValue = data[data.length - 1].nav;
    let comparisonValue;
    let daysToLookBack;

    // Determine days to look back based on period
    switch (period) {
        case '1D':
            daysToLookBack = 1;
            break;
        case '2D':
            daysToLookBack = 2;
            break;
        case '3D':
            daysToLookBack = 3;
            break;
        case '1W':
            daysToLookBack = 7;
            break;
        case '1M':
            daysToLookBack = 30;
            break;
        case '3M':
            daysToLookBack = 90;
            break;
        case '6M':
            daysToLookBack = 180;
            break;
        case '9M':
            daysToLookBack = 270;
            break;
        case '1Y':
            daysToLookBack = 365;
            break;
        case '2Y':
            daysToLookBack = 730;
            break;
        case '3Y':
            daysToLookBack = 1095;
            break;
        case '4Y':
            daysToLookBack = 1460;
            break;
        case '5Y':
            daysToLookBack = 1825;
            break;
        default:
            return '-';
    }

    // Find comparison value based on days to look back
    const targetIndex = data.length - daysToLookBack - 1;
    
    // Check if we have enough data points for the requested period
    if (targetIndex < 0) {
        return '-';
    }

    comparisonValue = data[targetIndex].nav;

    if (comparisonValue && comparisonValue !== 0) {
        const yearDiff = daysToLookBack / 365.25;
        
        // Use absolute returns for periods <= 1 year
        if (yearDiff <= 1) {
            return (((currentValue - comparisonValue) / comparisonValue) * 100).toFixed(2);
        } else {
            // Use CAGR for periods > 1 year
            const cagr = (Math.pow(currentValue / comparisonValue, 1/yearDiff) - 1) * 100;
            return cagr.toFixed(2);
        }
    }

    return '-';
}


export function calculateDrawdown(data) {
    if (!data || data.length === 0) return '-';

    const peakNav = Math.max(...data.map(d => d.nav));
    const currentNav = data[data.length - 1].nav;
    const drawdown = ((currentNav - peakNav) / peakNav) * 100;
    
    return drawdown.toFixed(2);
}