
// Native fetch in Node 18+

async function checkMeta() {
    try {
        const schemeCode = 101349; // ICICI Prudential Nifty 50 Index Fund
        console.log(`Fetching NAV for ${schemeCode}...`);
        const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}/latest`);
        const data = await response.json();

        console.log('Meta Data:');
        console.log(JSON.stringify(data.meta, null, 2));

    } catch (error) {
        console.error(error);
    }
}

checkMeta();
