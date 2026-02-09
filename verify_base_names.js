const separators = [' - Direct', ' - Regular', ' - Growth', ' - Dividend', ' - IDCW'];

function extractBaseName(schemeName) {
    if (!schemeName) return null;
    let base = schemeName;
    for (const sep of separators) {
        if (base.includes(sep)) {
            base = base.split(sep)[0];
        }
    }
    return base.trim();
}

const examples = [
    "ICICI Prudential Active Momentum Fund - Direct Plan - Growth",
    "ICICI Prudential Active Momentum Fund - Growth",
    "SBI Automotive Opportunities Fund - Direct Plan - Growth",
    "SBI Automotive Opportunities Fund - Direct Plan - Income Distributio",
    "SBI Automotive Opportunities Fund - Regular Plan - Growth"
];

console.log("--- Base Name Extraction Logic Verification ---");
examples.forEach(name => {
    console.log(`Original: "${name}"\nExtracted: "${extractBaseName(name)}"\n`);
});
