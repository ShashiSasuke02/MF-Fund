
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
    'Mirae Asset',
    'DSP',
    'Bandhan'
];

// CURRENT LOGIC
const EXCLUDED_KEYWORDS = ['( IDCW )', '(IDCW)', ' IDCW', '-IDCW', 'DIVIDEND'];

async function analyze() {
    console.log("Fetching all funds...");
    try {
        const resp = await fetch('https://api.mfapi.in/mf');
        const allFunds = await resp.json();
        console.log(`Total funds: ${allFunds.length}`);

        // 1. Whitelist Filter
        const whitelisted = allFunds.filter(fund => {
            const name = (fund.schemeName || '').toLowerCase();

            return AMC_WHITELIST.some(amc => {
                const amcLower = amc.toLowerCase();
                const escapedAmc = amcLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escapedAmc}\\b`, 'i');
                return regex.test(name);
            });
        });

        console.log(`Whitelisted (matches Top 10): ${whitelisted.length}`);

        // 2. Exclusion Filter
        const accepted = [];
        const rejected = [];

        const suspiciousKeywords = ['Div', 'Payout', 'Bonus', 'Quarterly', 'Monthly', 'Daily', 'Annual', 'Reinvestment', 'Reinv'];

        for (const fund of whitelisted) {
            const name = fund.schemeName.toUpperCase();
            const isExcluded = EXCLUDED_KEYWORDS.some(k => name.includes(k.toUpperCase()));

            if (isExcluded) {
                rejected.push(fund.schemeName);
            } else {
                accepted.push(fund.schemeName);
            }
        }

        console.log(`Accepted for Import: ${accepted.length}`);
        console.log(`Rejected by Filters: ${rejected.length}`);

        const leaks = accepted.filter(name => {
            return suspiciousKeywords.some(kw => name.toUpperCase().includes(kw.toUpperCase()));
        });

        const fs = await import('fs');
        const suspiciousOutput = leaks.map(name => `[SUSPICIOUS] ${name}`).join('\n');
        const acceptedOutput = accepted.slice(0, 50).map(name => `[OK] ${name}`).join('\n');

        const fullOutput = `--- SUSPICIOUS ACCEPTED FUNDS ---\n${suspiciousOutput}\n\n--- SAMPLE ACCEPTED ---\n${acceptedOutput}`;
        fs.writeFileSync('./scripts/analysis_results.txt', fullOutput);

        console.log(`Analysis complete. Results saved to ./scripts/analysis_results.txt`);
    } catch (error) {
        console.error("Error:", error);
    }
}

analyze();
