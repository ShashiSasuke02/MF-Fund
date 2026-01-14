/**
 * Investment Calculator Service
 * Provides comprehensive financial calculation tools for various investment schemes
 * 
 * Categories:
 * - Banking Schemes (10 calculators)
 * - Post Office Schemes (4 calculators)
 * - Mutual Fund Calculations (3 calculators)
 * - Retirement Planning (3 calculators)
 */

/**
 * Banking Schemes Calculator Functions
 */

/**
 * Calculate Simple Interest
 * Formula: SI = (P × R × T) / 100
 * 
 * @param {number} principal - Principal amount
 * @param {number} rate - Annual interest rate (%)
 * @param {number} time - Time period in years
 * @returns {Object} Calculation results
 */
export const calculateSimpleInterest = (principal, rate, time) => {
  if (principal <= 0 || rate < 0 || time <= 0) {
    throw new Error('Invalid input: Principal and time must be positive, rate cannot be negative');
  }

  const interest = (principal * rate * time) / 100;
  const totalAmount = principal + interest;

  return {
    principal: parseFloat(principal.toFixed(2)),
    rate: parseFloat(rate.toFixed(2)),
    time: parseFloat(time.toFixed(2)),
    interest: parseFloat(interest.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2))
  };
};

/**
 * Calculate Compound Interest
 * Formula: A = P(1 + r/n)^(nt)
 * 
 * @param {number} principal - Principal amount
 * @param {number} rate - Annual interest rate (%)
 * @param {number} time - Time period in years
 * @param {number} frequency - Compounding frequency per year (1=yearly, 2=half-yearly, 4=quarterly, 12=monthly)
 * @returns {Object} Calculation results
 */
export const calculateCompoundInterest = (principal, rate, time, frequency = 1) => {
  if (principal <= 0 || rate < 0 || time <= 0 || frequency <= 0) {
    throw new Error('Invalid input: All values must be positive');
  }

  const r = rate / 100;
  const amount = principal * Math.pow((1 + r / frequency), frequency * time);
  const interest = amount - principal;

  return {
    principal: parseFloat(principal.toFixed(2)),
    rate: parseFloat(rate.toFixed(2)),
    time: parseFloat(time.toFixed(2)),
    frequency,
    interest: parseFloat(interest.toFixed(2)),
    totalAmount: parseFloat(amount.toFixed(2))
  };
};

/**
 * Calculate Basic Loan EMI
 * Formula: EMI = [P × r × (1 + r)^n] / [(1 + r)^n – 1]
 * 
 * @param {number} principal - Loan amount
 * @param {number} rate - Annual interest rate (%)
 * @param {number} tenureMonths - Loan tenure in months
 * @returns {Object} Calculation results with EMI breakdown
 */
export const calculateBasicLoanEMI = (principal, rate, tenureMonths) => {
  if (principal <= 0 || rate < 0 || tenureMonths <= 0) {
    throw new Error('Invalid input: Principal and tenure must be positive, rate cannot be negative');
  }

  const monthlyRate = rate / (12 * 100);
  
  let emi;
  if (rate === 0) {
    emi = principal / tenureMonths;
  } else {
    emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
          (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  }

  const totalAmount = emi * tenureMonths;
  const totalInterest = totalAmount - principal;

  return {
    principal: parseFloat(principal.toFixed(2)),
    rate: parseFloat(rate.toFixed(2)),
    tenureMonths,
    emi: parseFloat(emi.toFixed(2)),
    totalInterest: parseFloat(totalInterest.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2))
  };
};

/**
 * Calculate Advanced Loan with Prepayment
 * Includes prepayment options and full amortization schedule
 * 
 * @param {number} principal - Loan amount
 * @param {number} rate - Annual interest rate (%)
 * @param {number} tenureMonths - Loan tenure in months
 * @param {Array} prepayments - Array of prepayment objects {month, amount}
 * @returns {Object} Detailed calculation with amortization schedule
 */
export const calculateAdvancedLoan = (principal, rate, tenureMonths, prepayments = []) => {
  if (principal <= 0 || rate < 0 || tenureMonths <= 0) {
    throw new Error('Invalid input: Principal and tenure must be positive, rate cannot be negative');
  }

  const monthlyRate = rate / (12 * 100);
  let remainingPrincipal = principal;
  const schedule = [];
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  let currentMonth = 1;

  // Calculate base EMI
  const baseEMI = rate === 0 ? principal / tenureMonths :
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);

  while (remainingPrincipal > 0.01 && currentMonth <= tenureMonths * 2) { // Safety limit
    const interestPayment = remainingPrincipal * monthlyRate;
    let principalPayment = baseEMI - interestPayment;
    
    // Check for prepayment in this month
    const prepayment = prepayments.find(p => p.month === currentMonth);
    const prepaymentAmount = prepayment ? prepayment.amount : 0;

    // Adjust if final month
    if (principalPayment + prepaymentAmount >= remainingPrincipal) {
      principalPayment = remainingPrincipal;
    }

    const totalPayment = interestPayment + principalPayment + prepaymentAmount;
    remainingPrincipal -= (principalPayment + prepaymentAmount);
    
    totalInterestPaid += interestPayment;
    totalPrincipalPaid += principalPayment + prepaymentAmount;

    schedule.push({
      month: currentMonth,
      emi: parseFloat(baseEMI.toFixed(2)),
      principalPayment: parseFloat(principalPayment.toFixed(2)),
      interestPayment: parseFloat(interestPayment.toFixed(2)),
      prepayment: parseFloat(prepaymentAmount.toFixed(2)),
      totalPayment: parseFloat(totalPayment.toFixed(2)),
      remainingPrincipal: parseFloat(Math.max(0, remainingPrincipal).toFixed(2))
    });

    if (remainingPrincipal <= 0.01) break;
    currentMonth++;
  }

  return {
    principal: parseFloat(principal.toFixed(2)),
    rate: parseFloat(rate.toFixed(2)),
    originalTenure: tenureMonths,
    actualTenure: schedule.length,
    emi: parseFloat(baseEMI.toFixed(2)),
    totalInterest: parseFloat(totalInterestPaid.toFixed(2)),
    totalPrincipal: parseFloat(totalPrincipalPaid.toFixed(2)),
    totalAmount: parseFloat((totalInterestPaid + totalPrincipalPaid).toFixed(2)),
    savingsFromPrepayment: parseFloat((principal * rate / 100 * tenureMonths / 12 - totalInterestPaid).toFixed(2)),
    schedule
  };
};

/**
 * Calculate Fixed Deposit with Interest Payout
 * For periodic interest withdrawal (non-cumulative)
 * 
 * @param {number} principal - FD amount
 * @param {number} rate - Annual interest rate (%)
 * @param {number} tenureMonths - FD tenure in months
 * @param {string} payoutFrequency - 'monthly', 'quarterly', 'half-yearly', 'yearly'
 * @returns {Object} Calculation results with payout schedule
 */
export const calculateFDInterestPayout = (principal, rate, tenureMonths, payoutFrequency = 'monthly') => {
  if (principal <= 0 || rate < 0 || tenureMonths <= 0) {
    throw new Error('Invalid input: Principal and tenure must be positive, rate cannot be negative');
  }

  const frequencyMap = {
    'monthly': 12,
    'quarterly': 4,
    'half-yearly': 2,
    'yearly': 1
  };

  const frequency = frequencyMap[payoutFrequency];
  if (!frequency) {
    throw new Error('Invalid payout frequency');
  }

  const tenureYears = tenureMonths / 12;
  const interestPerPayout = (principal * rate * (1 / frequency)) / 100;
  const numberOfPayouts = Math.floor(tenureYears * frequency);
  const totalInterest = interestPerPayout * numberOfPayouts;

  return {
    principal: parseFloat(principal.toFixed(2)),
    rate: parseFloat(rate.toFixed(2)),
    tenureMonths,
    payoutFrequency,
    interestPerPayout: parseFloat(interestPerPayout.toFixed(2)),
    numberOfPayouts,
    totalInterest: parseFloat(totalInterest.toFixed(2)),
    maturityAmount: parseFloat((principal + totalInterest).toFixed(2))
  };
};

/**
 * Calculate Fixed Deposit Cumulative (with compounding)
 * 
 * @param {number} principal - FD amount
 * @param {number} rate - Annual interest rate (%)
 * @param {number} tenureMonths - FD tenure in months
 * @param {number} compoundingFrequency - Times per year (4=quarterly, 12=monthly)
 * @returns {Object} Calculation results
 */
export const calculateFDCumulative = (principal, rate, tenureMonths, compoundingFrequency = 4) => {
  if (principal <= 0 || rate < 0 || tenureMonths <= 0) {
    throw new Error('Invalid input: Principal and tenure must be positive, rate cannot be negative');
  }

  const tenureYears = tenureMonths / 12;
  const r = rate / 100;
  const maturityAmount = principal * Math.pow((1 + r / compoundingFrequency), compoundingFrequency * tenureYears);
  const totalInterest = maturityAmount - principal;

  return {
    principal: parseFloat(principal.toFixed(2)),
    rate: parseFloat(rate.toFixed(2)),
    tenureMonths,
    compoundingFrequency,
    totalInterest: parseFloat(totalInterest.toFixed(2)),
    maturityAmount: parseFloat(maturityAmount.toFixed(2))
  };
};

/**
 * Calculate Recurring Deposit (RD)
 * Formula: M = P × [{(1 + r)^n – 1} / r]
 * 
 * @param {number} monthlyDeposit - Monthly deposit amount
 * @param {number} rate - Annual interest rate (%)
 * @param {number} tenureMonths - RD tenure in months
 * @returns {Object} Calculation results
 */
export const calculateRD = (monthlyDeposit, rate, tenureMonths) => {
  if (monthlyDeposit <= 0 || rate < 0 || tenureMonths <= 0) {
    throw new Error('Invalid input: Monthly deposit and tenure must be positive, rate cannot be negative');
  }

  const quarterlyRate = rate / 400; // Quarterly compounding
  const quarters = tenureMonths / 3;
  
  let maturityAmount = 0;
  for (let i = 0; i < tenureMonths; i++) {
    const remainingQuarters = (tenureMonths - i) / 3;
    maturityAmount += monthlyDeposit * Math.pow(1 + quarterlyRate, remainingQuarters);
  }

  const totalDeposit = monthlyDeposit * tenureMonths;
  const totalInterest = maturityAmount - totalDeposit;

  return {
    monthlyDeposit: parseFloat(monthlyDeposit.toFixed(2)),
    rate: parseFloat(rate.toFixed(2)),
    tenureMonths,
    totalDeposit: parseFloat(totalDeposit.toFixed(2)),
    totalInterest: parseFloat(totalInterest.toFixed(2)),
    maturityAmount: parseFloat(maturityAmount.toFixed(2))
  };
};

/**
 * Calculate Public Provident Fund (PPF)
 * 15 years lock-in with annual compounding
 * 
 * @param {number} annualDeposit - Annual deposit amount (min ₹500, max ₹1,50,000)
 * @param {number} rate - Annual interest rate (%)
 * @param {number} tenureYears - PPF tenure in years (default 15)
 * @returns {Object} Calculation results with year-wise breakdown
 */
export const calculatePPF = (annualDeposit, rate, tenureYears = 15) => {
  if (annualDeposit < 500 || annualDeposit > 150000) {
    throw new Error('Annual deposit must be between ₹500 and ₹1,50,000');
  }
  if (rate < 0 || tenureYears < 15) {
    throw new Error('Invalid input: Rate cannot be negative, tenure must be at least 15 years');
  }

  let balance = 0;
  const yearlyBreakdown = [];

  for (let year = 1; year <= tenureYears; year++) {
    balance += annualDeposit;
    const interest = balance * (rate / 100);
    balance += interest;

    yearlyBreakdown.push({
      year,
      deposit: parseFloat(annualDeposit.toFixed(2)),
      interest: parseFloat(interest.toFixed(2)),
      balance: parseFloat(balance.toFixed(2))
    });
  }

  const totalDeposit = annualDeposit * tenureYears;
  const totalInterest = balance - totalDeposit;

  return {
    annualDeposit: parseFloat(annualDeposit.toFixed(2)),
    rate: parseFloat(rate.toFixed(2)),
    tenureYears,
    totalDeposit: parseFloat(totalDeposit.toFixed(2)),
    totalInterest: parseFloat(totalInterest.toFixed(2)),
    maturityAmount: parseFloat(balance.toFixed(2)),
    yearlyBreakdown
  };
};

/**
 * Calculate Sukanya Samriddhi Account (SSA)
 * For girl child, 21 years maturity
 * 
 * @param {number} annualDeposit - Annual deposit (min ₹250, max ₹1,50,000)
 * @param {number} rate - Annual interest rate (%)
 * @param {number} depositYears - Years of deposit (max 15)
 * @returns {Object} Calculation results
 */
export const calculateSSA = (annualDeposit, rate, depositYears = 15) => {
  if (annualDeposit < 250 || annualDeposit > 150000) {
    throw new Error('Annual deposit must be between ₹250 and ₹1,50,000');
  }
  if (depositYears > 15 || depositYears <= 0) {
    throw new Error('Deposit years must be between 1 and 15');
  }

  const maturityYears = 21;
  let balance = 0;
  const yearlyBreakdown = [];

  for (let year = 1; year <= maturityYears; year++) {
    // Deposits only for first 15 years (or specified years)
    if (year <= depositYears) {
      balance += annualDeposit;
    }
    
    const interest = balance * (rate / 100);
    balance += interest;

    yearlyBreakdown.push({
      year,
      deposit: year <= depositYears ? parseFloat(annualDeposit.toFixed(2)) : 0,
      interest: parseFloat(interest.toFixed(2)),
      balance: parseFloat(balance.toFixed(2))
    });
  }

  const totalDeposit = annualDeposit * depositYears;
  const totalInterest = balance - totalDeposit;

  return {
    annualDeposit: parseFloat(annualDeposit.toFixed(2)),
    rate: parseFloat(rate.toFixed(2)),
    depositYears,
    maturityYears,
    totalDeposit: parseFloat(totalDeposit.toFixed(2)),
    totalInterest: parseFloat(totalInterest.toFixed(2)),
    maturityAmount: parseFloat(balance.toFixed(2)),
    yearlyBreakdown
  };
};

/**
 * Calculate Senior Citizen Savings Scheme (SCSS)
 * 5 years tenure, quarterly interest payout
 * 
 * @param {number} principal - Investment amount (min ₹1,000, max ₹30,00,000)
 * @param {number} rate - Annual interest rate (%)
 * @returns {Object} Calculation results
 */
export const calculateSCSS = (principal, rate) => {
  if (principal < 1000 || principal > 3000000) {
    throw new Error('Investment must be between ₹1,000 and ₹30,00,000');
  }

  const tenureYears = 5;
  const quartersPerYear = 4;
  const totalQuarters = tenureYears * quartersPerYear;
  const quarterlyInterest = (principal * rate) / (4 * 100);
  const totalInterest = quarterlyInterest * totalQuarters;

  return {
    principal: parseFloat(principal.toFixed(2)),
    rate: parseFloat(rate.toFixed(2)),
    tenureYears,
    quarterlyInterest: parseFloat(quarterlyInterest.toFixed(2)),
    totalQuarters,
    totalInterest: parseFloat(totalInterest.toFixed(2)),
    maturityAmount: parseFloat((principal + totalInterest).toFixed(2))
  };
};

/**
 * Post Office Schemes Calculator Functions
 */

/**
 * Calculate Post Office Monthly Income Scheme (MIS)
 * Fixed monthly income for 5 years
 * 
 * @param {number} principal - Investment amount (min ₹1,000, max ₹9,00,000)
 * @param {number} rate - Annual interest rate (%)
 * @returns {Object} Calculation results
 */
export const calculatePOMIS = (principal, rate) => {
  if (principal < 1000 || principal > 900000) {
    throw new Error('Investment must be between ₹1,000 and ₹9,00,000');
  }

  const tenureYears = 5;
  const monthlyIncome = (principal * rate) / (12 * 100);
  const totalMonths = tenureYears * 12;
  const totalInterest = monthlyIncome * totalMonths;

  return {
    principal: parseFloat(principal.toFixed(2)),
    rate: parseFloat(rate.toFixed(2)),
    tenureYears,
    monthlyIncome: parseFloat(monthlyIncome.toFixed(2)),
    totalMonths,
    totalInterest: parseFloat(totalInterest.toFixed(2)),
    maturityAmount: parseFloat(principal.toFixed(2)) // Principal returned at maturity
  };
};

/**
 * Calculate Post Office Recurring Deposit (RD)
 * 
 * @param {number} monthlyDeposit - Monthly deposit amount
 * @param {number} rate - Annual interest rate (%)
 * @param {number} tenureMonths - Tenure in months (60 months = 5 years)
 * @returns {Object} Calculation results
 */
export const calculatePORD = (monthlyDeposit, rate, tenureMonths = 60) => {
  // Same calculation as bank RD
  return calculateRD(monthlyDeposit, rate, tenureMonths);
};

/**
 * Calculate Post Office Time Deposit (TD)
 * Similar to Fixed Deposit
 * 
 * @param {number} principal - Deposit amount
 * @param {number} rate - Annual interest rate (%)
 * @param {number} tenureYears - Tenure in years (1, 2, 3, or 5 years)
 * @returns {Object} Calculation results
 */
export const calculatePOTD = (principal, rate, tenureYears) => {
  if (principal <= 0 || rate < 0) {
    throw new Error('Invalid input: Principal must be positive, rate cannot be negative');
  }
  if (![1, 2, 3, 5].includes(tenureYears)) {
    throw new Error('Tenure must be 1, 2, 3, or 5 years');
  }

  // Quarterly compounding for Post Office TD
  const compoundingFrequency = 4;
  const r = rate / 100;
  const maturityAmount = principal * Math.pow((1 + r / compoundingFrequency), compoundingFrequency * tenureYears);
  const totalInterest = maturityAmount - principal;

  return {
    principal: parseFloat(principal.toFixed(2)),
    rate: parseFloat(rate.toFixed(2)),
    tenureYears,
    compoundingFrequency,
    totalInterest: parseFloat(totalInterest.toFixed(2)),
    maturityAmount: parseFloat(maturityAmount.toFixed(2))
  };
};

/**
 * Calculate National Savings Certificate (NSC)
 * 5 years fixed tenure with annual compounding
 * 
 * @param {number} principal - Investment amount
 * @param {number} rate - Annual interest rate (%)
 * @returns {Object} Calculation results
 */
export const calculateNSC = (principal, rate) => {
  if (principal <= 0 || rate < 0) {
    throw new Error('Invalid input: Principal must be positive, rate cannot be negative');
  }

  const tenureYears = 5;
  const maturityAmount = principal * Math.pow(1 + rate / 100, tenureYears);
  const totalInterest = maturityAmount - principal;

  return {
    principal: parseFloat(principal.toFixed(2)),
    rate: parseFloat(rate.toFixed(2)),
    tenureYears,
    totalInterest: parseFloat(totalInterest.toFixed(2)),
    maturityAmount: parseFloat(maturityAmount.toFixed(2))
  };
};

/**
 * Mutual Fund Calculator Functions
 */

/**
 * Calculate Systematic Investment Plan (SIP)
 * Formula: M = P × ({[1 + i]^n – 1} / i) × (1 + i)
 * 
 * @param {number} monthlyInvestment - Monthly SIP amount
 * @param {number} expectedReturn - Expected annual return (%)
 * @param {number} tenureYears - Investment tenure in years
 * @returns {Object} Calculation results
 */
export const calculateSIP = (monthlyInvestment, expectedReturn, tenureYears) => {
  if (monthlyInvestment <= 0 || expectedReturn < 0 || tenureYears <= 0) {
    throw new Error('Invalid input: All values must be positive');
  }

  const monthlyRate = expectedReturn / (12 * 100);
  const months = tenureYears * 12;
  
  const futureValue = monthlyInvestment * 
    (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
  
  const totalInvestment = monthlyInvestment * months;
  const totalReturns = futureValue - totalInvestment;

  return {
    monthlyInvestment: parseFloat(monthlyInvestment.toFixed(2)),
    expectedReturn: parseFloat(expectedReturn.toFixed(2)),
    tenureYears,
    totalMonths: months,
    totalInvestment: parseFloat(totalInvestment.toFixed(2)),
    totalReturns: parseFloat(totalReturns.toFixed(2)),
    futureValue: parseFloat(futureValue.toFixed(2))
  };
};

/**
 * Calculate Systematic Withdrawal Plan (SWP)
 * 
 * @param {number} initialInvestment - Initial lump sum investment
 * @param {number} monthlyWithdrawal - Monthly withdrawal amount
 * @param {number} expectedReturn - Expected annual return (%)
 * @param {number} tenureYears - Withdrawal tenure in years
 * @returns {Object} Calculation results with month-wise breakdown
 */
export const calculateSWP = (initialInvestment, monthlyWithdrawal, expectedReturn, tenureYears) => {
  if (initialInvestment <= 0 || monthlyWithdrawal < 0 || expectedReturn < 0 || tenureYears <= 0) {
    throw new Error('Invalid input: Investment and tenure must be positive');
  }

  const monthlyRate = expectedReturn / (12 * 100);
  const months = tenureYears * 12;
  let balance = initialInvestment;
  let totalWithdrawn = 0;
  const monthlyBreakdown = [];

  for (let month = 1; month <= months; month++) {
    // Apply returns
    const returns = balance * monthlyRate;
    balance += returns;
    
    // Withdraw
    const withdrawal = Math.min(monthlyWithdrawal, balance);
    balance -= withdrawal;
    totalWithdrawn += withdrawal;

    if (month <= 12 || month % 12 === 0) { // Store yearly snapshots
      monthlyBreakdown.push({
        month,
        withdrawal: parseFloat(withdrawal.toFixed(2)),
        returns: parseFloat(returns.toFixed(2)),
        balance: parseFloat(balance.toFixed(2))
      });
    }

    if (balance <= 0) break;
  }

  return {
    initialInvestment: parseFloat(initialInvestment.toFixed(2)),
    monthlyWithdrawal: parseFloat(monthlyWithdrawal.toFixed(2)),
    expectedReturn: parseFloat(expectedReturn.toFixed(2)),
    tenureYears,
    totalWithdrawn: parseFloat(totalWithdrawn.toFixed(2)),
    remainingBalance: parseFloat(balance.toFixed(2)),
    monthlyBreakdown
  };
};

/**
 * Calculate Systematic Transfer Plan (STP)
 * Transfer from one fund to another
 * 
 * @param {number} initialInvestment - Initial investment in source fund
 * @param {number} monthlyTransfer - Monthly transfer amount
 * @param {number} sourceFundReturn - Expected annual return of source fund (%)
 * @param {number} targetFundReturn - Expected annual return of target fund (%)
 * @param {number} tenureYears - Transfer tenure in years
 * @returns {Object} Calculation results
 */
export const calculateSTP = (initialInvestment, monthlyTransfer, sourceFundReturn, targetFundReturn, tenureYears) => {
  if (initialInvestment <= 0 || monthlyTransfer <= 0 || tenureYears <= 0) {
    throw new Error('Invalid input: All values must be positive');
  }

  const sourceMonthlyRate = sourceFundReturn / (12 * 100);
  const targetMonthlyRate = targetFundReturn / (12 * 100);
  const months = tenureYears * 12;
  
  let sourceBalance = initialInvestment;
  let targetBalance = 0;
  let totalTransferred = 0;

  for (let month = 1; month <= months; month++) {
    // Apply returns to source fund
    sourceBalance += sourceBalance * sourceMonthlyRate;
    
    // Transfer amount
    const transfer = Math.min(monthlyTransfer, sourceBalance);
    sourceBalance -= transfer;
    targetBalance += transfer;
    totalTransferred += transfer;
    
    // Apply returns to target fund
    targetBalance += targetBalance * targetMonthlyRate;

    if (sourceBalance <= 0) break;
  }

  return {
    initialInvestment: parseFloat(initialInvestment.toFixed(2)),
    monthlyTransfer: parseFloat(monthlyTransfer.toFixed(2)),
    sourceFundReturn: parseFloat(sourceFundReturn.toFixed(2)),
    targetFundReturn: parseFloat(targetFundReturn.toFixed(2)),
    tenureYears,
    totalTransferred: parseFloat(totalTransferred.toFixed(2)),
    sourceBalance: parseFloat(sourceBalance.toFixed(2)),
    targetBalance: parseFloat(targetBalance.toFixed(2)),
    totalValue: parseFloat((sourceBalance + targetBalance).toFixed(2))
  };
};

/**
 * Retirement Planning Calculator Functions
 */

/**
 * Calculate National Pension System (NPS)
 * 
 * @param {number} monthlyContribution - Monthly contribution
 * @param {number} currentAge - Current age
 * @param {number} retirementAge - Retirement age (default 60)
 * @param {number} expectedReturn - Expected annual return (%)
 * @returns {Object} Calculation results with retirement corpus
 */
export const calculateNPS = (monthlyContribution, currentAge, retirementAge = 60, expectedReturn) => {
  if (monthlyContribution <= 0 || currentAge <= 0 || retirementAge <= currentAge) {
    throw new Error('Invalid input: Check age and contribution values');
  }

  const tenureYears = retirementAge - currentAge;
  const months = tenureYears * 12;
  const monthlyRate = expectedReturn / (12 * 100);
  
  // Calculate corpus at retirement
  const corpus = monthlyContribution * 
    (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
  
  const totalInvestment = monthlyContribution * months;
  const totalReturns = corpus - totalInvestment;
  
  // NPS rules: 60% can be withdrawn, 40% must be used for annuity
  const lumpSumWithdrawal = corpus * 0.6;
  const annuityAmount = corpus * 0.4;
  
  // Assumed annuity rate of 6% per year
  const monthlyPension = (annuityAmount * 0.06) / 12;

  return {
    monthlyContribution: parseFloat(monthlyContribution.toFixed(2)),
    currentAge,
    retirementAge,
    expectedReturn: parseFloat(expectedReturn.toFixed(2)),
    tenureYears,
    totalInvestment: parseFloat(totalInvestment.toFixed(2)),
    totalReturns: parseFloat(totalReturns.toFixed(2)),
    retirementCorpus: parseFloat(corpus.toFixed(2)),
    lumpSumWithdrawal: parseFloat(lumpSumWithdrawal.toFixed(2)),
    annuityAmount: parseFloat(annuityAmount.toFixed(2)),
    estimatedMonthlyPension: parseFloat(monthlyPension.toFixed(2))
  };
};

/**
 * Calculate Employees' Provident Fund (EPF)
 * 
 * @param {number} basicSalary - Monthly basic salary
 * @param {number} employeeContribution - Employee contribution (% of basic, default 12%)
 * @param {number} employerContribution - Employer contribution (% of basic, default 12%)
 * @param {number} currentAge - Current age
 * @param {number} retirementAge - Retirement age (default 58)
 * @param {number} annualIncrement - Expected annual salary increment (%)
 * @param {number} interestRate - EPF interest rate (%)
 * @returns {Object} Calculation results
 */
export const calculateEPF = (
  basicSalary, 
  employeeContribution = 12, 
  employerContribution = 12, 
  currentAge, 
  retirementAge = 58, 
  annualIncrement = 5, 
  interestRate
) => {
  if (basicSalary <= 0 || currentAge <= 0 || retirementAge <= currentAge) {
    throw new Error('Invalid input: Check salary and age values');
  }

  const tenureYears = retirementAge - currentAge;
  let balance = 0;
  let currentSalary = basicSalary;
  let totalEmployeeContribution = 0;
  let totalEmployerContribution = 0;

  for (let year = 1; year <= tenureYears; year++) {
    // Calculate monthly contributions
    const monthlyEmployeeContribution = (currentSalary * employeeContribution) / 100;
    const monthlyEmployerContribution = (currentSalary * employerContribution) / 100;
    
    // Annual contributions
    const annualEmployeeContribution = monthlyEmployeeContribution * 12;
    const annualEmployerContribution = monthlyEmployerContribution * 12;
    
    balance += annualEmployeeContribution + annualEmployerContribution;
    totalEmployeeContribution += annualEmployeeContribution;
    totalEmployerContribution += annualEmployerContribution;
    
    // Apply interest
    const interest = balance * (interestRate / 100);
    balance += interest;
    
    // Apply salary increment for next year
    currentSalary += (currentSalary * annualIncrement) / 100;
  }

  const totalContribution = totalEmployeeContribution + totalEmployerContribution;
  const totalInterest = balance - totalContribution;

  return {
    basicSalary: parseFloat(basicSalary.toFixed(2)),
    employeeContribution: parseFloat(employeeContribution.toFixed(2)),
    employerContribution: parseFloat(employerContribution.toFixed(2)),
    currentAge,
    retirementAge,
    annualIncrement: parseFloat(annualIncrement.toFixed(2)),
    interestRate: parseFloat(interestRate.toFixed(2)),
    tenureYears,
    totalEmployeeContribution: parseFloat(totalEmployeeContribution.toFixed(2)),
    totalEmployerContribution: parseFloat(totalEmployerContribution.toFixed(2)),
    totalContribution: parseFloat(totalContribution.toFixed(2)),
    totalInterest: parseFloat(totalInterest.toFixed(2)),
    retirementCorpus: parseFloat(balance.toFixed(2))
  };
};

/**
 * Calculate Atal Pension Yojana (APY)
 * 
 * @param {number} currentAge - Current age (18-40)
 * @param {number} pensionAmount - Desired monthly pension (₹1000, ₹2000, ₹3000, ₹4000, ₹5000)
 * @returns {Object} Calculation results with contribution amount
 */
export const calculateAPY = (currentAge, pensionAmount) => {
  if (currentAge < 18 || currentAge > 40) {
    throw new Error('Age must be between 18 and 40 years');
  }
  if (![1000, 2000, 3000, 4000, 5000].includes(pensionAmount)) {
    throw new Error('Pension amount must be ₹1000, ₹2000, ₹3000, ₹4000, or ₹5000');
  }

  // APY contribution chart (approximate values based on age)
  const contributionChart = {
    1000: { 18: 42, 25: 76, 30: 116, 35: 181, 40: 291 },
    2000: { 18: 84, 25: 151, 30: 231, 35: 362, 40: 582 },
    3000: { 18: 126, 25: 226, 30: 347, 35: 543, 40: 873 },
    4000: { 18: 168, 25: 301, 30: 462, 35: 724, 40: 1164 },
    5000: { 18: 210, 25: 376, 30: 577, 35: 902, 40: 1454 }
  };

  // Find nearest age in chart
  const ages = [18, 25, 30, 35, 40];
  const nearestAge = ages.reduce((prev, curr) => 
    Math.abs(curr - currentAge) < Math.abs(prev - currentAge) ? curr : prev
  );

  const monthlyContribution = contributionChart[pensionAmount][nearestAge];
  const contributionYears = 60 - currentAge;
  const totalContribution = monthlyContribution * 12 * contributionYears;

  return {
    currentAge,
    retirementAge: 60,
    pensionAmount: parseFloat(pensionAmount.toFixed(2)),
    monthlyContribution: parseFloat(monthlyContribution.toFixed(2)),
    contributionYears,
    totalContribution: parseFloat(totalContribution.toFixed(2))
  };
};

// Export all calculator functions
export default {
  // Banking Schemes
  calculateSimpleInterest,
  calculateCompoundInterest,
  calculateBasicLoanEMI,
  calculateAdvancedLoan,
  calculateFDInterestPayout,
  calculateFDCumulative,
  calculateRD,
  calculatePPF,
  calculateSSA,
  calculateSCSS,
  
  // Post Office Schemes
  calculatePOMIS,
  calculatePORD,
  calculatePOTD,
  calculateNSC,
  
  // Mutual Fund Calculations
  calculateSIP,
  calculateSWP,
  calculateSTP,
  
  // Retirement Planning
  calculateNPS,
  calculateEPF,
  calculateAPY
};
