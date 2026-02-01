
const calculateNextExecutionDate = (currentDate, frequency) => {
    const current = new Date(currentDate);
    let next;

    console.log(`Input: ${currentDate}, Freq: ${frequency}`);
    console.log(`Parsed Date: ${current.toISOString()} (UTC)`);

    switch (frequency) {
        case 'DAILY':
            next = new Date(current);
            next.setDate(current.getDate() + 1);
            break;
        case 'MONTHLY':
            next = new Date(current);
            next.setMonth(current.getMonth() + 1);
            break;
    }

    console.log(`Next Date Obj: ${next.toISOString()} (UTC)`);
    return next.toISOString().split('T')[0];
};

const date1 = "2026-01-31";
const next1 = calculateNextExecutionDate(date1, 'DAILY');
console.log(`Next Daily: ${next1}`); // Expect 2026-02-01

const next2 = calculateNextExecutionDate(date1, 'MONTHLY');
console.log(`Next Monthly: ${next2}`); // Expect 2026-02-28 or 2026-03-03? (JS Month rollover)
// JS setMonth adds month. 31st Jan + 1 month -> 31st Feb? No, JS auto-adjusts to March 3rd (non-leap) or March 2nd/3rd.
// Wait, 2026 is not a leap year. Feb has 28 days.
// Jan 31 + 1 month -> Feb 31 does not exist.
// JS Date behavior: Feb 28 + 3 days -> March 3.
