
// Native fetch used


async function compareCounts() {
    try {
        console.log('Fetching all funds from MFAPI...');
        const response = await fetch('https://api.mfapi.in/mf');
        const allFunds = await response.json();

        // Filter for HDFC
        const hdfcFunds = allFunds.filter(f => f.schemeName.toLowerCase().includes('hdfc'));
        console.log(`MFAPI 'HDFC' Count: ${hdfcFunds.length}`);

        // Check some examples that might be missing?
        // We know local is 757.
        // If remote is significantly higher, we are dropping them.

        // Let's print the first 5 and last 5 to see naming patterns
        if (hdfcFunds.length > 0) {
            console.log('First 5 HDFC Funds from API:');
            hdfcFunds.slice(0, 5).forEach(f => console.log(`- ${f.schemeName} (${f.schemeCode})`));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

compareCounts();
