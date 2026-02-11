/**
 * Fund related utility functions
 */

/**
 * Extracts the base name of a mutual fund scheme by removing common suffixes.
 * This is "Smart Truncation" logic to find the "Root" fund name.
 *
 * Example:
 * "ICICI Prudential Bluechip Fund - Direct Plan - Growth" -> "ICICI Prudential Bluechip Fund"
 * "Aditya Birla Sun Life - Tax Relief 96 - Direct Plan" -> "Aditya Birla Sun Life - Tax Relief 96"
 *
 * @param {string} schemeName - The full scheme name
 * @returns {string|null} - The base name or null if input is invalid
 */
export const extractBaseName = (schemeName) => {
    if (!schemeName || typeof schemeName !== 'string') return null;

    // Markers that indicate the start of a suffix
    // Order matters: simpler ones should be checked, but we split by the *first* occurrence
    const markers = [
        ' - Direct',
        ' - Regular',
        ' - Growth',
        ' - Dividend',
        ' - IDCW',
        ' - Bonus'
    ];

    let base = schemeName;

    for (const marker of markers) {
        if (base.includes(marker)) {
            base = base.split(marker)[0];
            break; // Stop at the first marker found to be safe
        }
    }

    return base.trim();
};
