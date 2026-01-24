
// Native fetch in Node 18+

const AMC_WHITELIST = [
    'SBI',
    'ICICI Prudential',
    'HDFC',
    'Nippon India',
    'Kotak Mahindra',
    'Aditya Birla Sun Life',
    'UTI',
    'Axis',
    'Tata',
    'Mirae Asset'
];

async function debugFilter() {
    try {
        console.log('Fetching all funds...');
        const response = await fetch('https://api.mfapi.in/mf');
        const allFunds = await response.json();
        console.log(`Total Funds: ${allFunds.length}`);

        const filtered = allFunds.filter(fund => {
            const fundName = (fund.schemeName || '').toLowerCase();
            return AMC_WHITELIST.some(amc => fundName.includes(amc.toLowerCase()));
        });

        console.log(`Filtered Count (10 AMCs): ${filtered.length}`);

        // Check HDFC specifically
        const hdfc = filtered.filter(f => f.schemeName.toLowerCase().includes('hdfc'));
        console.log(`HDFC in Filtered: ${hdfc.length}`);

    } catch (error) {
        console.error(error);
    }
}

debugFilter();
