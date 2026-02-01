
// Simulate IST environment
process.env.TZ = 'Asia/Kolkata';

// Replica of the buggy function
const calculateNextDate_Buggy = (currentDate, frequency) => {
    const current = new Date(currentDate); // If currentDate is Date obj from setHours(0,0,0,0)
    let next;

    switch (frequency) {
        case 'DAILY':
            next = new Date(current);
            next.setDate(current.getDate() + 1);
            break;
        // ... monthly etc
    }
    // This is the problematic line:
    return next.toISOString().split('T')[0];
};

// Simulate the flow in demo.service.js
console.log("--- Simulating demo.service.js Logic in IST ---");

// 1. Get Today 00:00:00 IST
const today = new Date();
today.setHours(0, 0, 0, 0);
console.log(`Today (Local Object): ${today.toString()}`);
console.log(`Today (ISO): ${today.toISOString()}`);

// 2. Call calculateNextDate (DAILY)
const nextDate = calculateNextDate_Buggy(today, 'DAILY');

console.log(`\nFREQUENCY: DAILY`);
console.log(`Calculated Next Date (Result): ${nextDate}`);

// Expected: Tomorrow's date string (e.g., 2026-02-01)
// Hypothesis: It returns Today's date string (2026-01-31) because of UTC shift.

// 3. Check Monthly too logic
const calculateNextDate_Monthly = (currentDate) => {
    const current = new Date(currentDate);
    const next = new Date(current);
    next.setMonth(current.getMonth() + 1);
    return next.toISOString().split('T')[0];
}

const nextMonth = calculateNextDate_Monthly(today);
console.log(`\nFREQUENCY: MONTHLY`);
console.log(`Calculated Next Month (Result): ${nextMonth}`);
