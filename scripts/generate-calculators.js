/**
 * Script to Generate All Calculator Components
 * Run this to create the remaining 18 calculator components
 * 
 * Usage: node scripts/generate-calculators.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Calculator configurations
const calculators = [
  {
    name: 'CompoundInterestCalculator',
    apiMethod: 'calculateCompoundInterest',
    title: 'Compound Interest Calculator',
    description: 'Compound Interest is calculated on the principal and accumulated interest. Formula: A = P(1 + r/n)^(nt)',
    fields: [
      { name: 'principal', label: 'Principal Amount (₹)', type: 'number', min: '1', step: '1', placeholder: '100000', required: true },
      { name: 'rate', label: 'Rate of Interest (% p.a.)', type: 'number', min: '0.1', max: '50', step: '0.1', placeholder: '7.5', required: true, defaultRate: 'savingsAccount' },
      { name: 'time', label: 'Time Period (years)', type: 'number', min: '0.1', max: '50', step: '0.1', placeholder: '5', required: true },
      { name: 'frequency', label: 'Compounding Frequency', type: 'select', options: [
        { value: '1', label: 'Yearly' },
        { value: '2', label: 'Half-Yearly' },
        { value: '4', label: 'Quarterly' },
        { value: '12', label: 'Monthly' }
      ], defaultValue: '4' }
    ],
    results: [
      { key: 'principal', label: 'Principal Amount' },
      { key: 'interest', label: 'Interest Earned', highlight: 'green' },
      { key: 'totalAmount', label: 'Total Amount', highlight: 'emerald' }
    ]
  },
  {
    name: 'LoanBasicCalculator',
    apiMethod: 'calculateBasicLoan',
    title: 'Loan EMI Calculator - Basic',
    description: 'Calculate your Equated Monthly Installment (EMI) for loans. Formula: EMI = [P × r × (1 + r)^n] / [(1 + r)^n – 1]',
    fields: [
      { name: 'principal', label: 'Loan Amount (₹)', type: 'number', min: '1000', step: '1000', placeholder: '500000', required: true },
      { name: 'rate', label: 'Interest Rate (% p.a.)', type: 'number', min: '1', max: '30', step: '0.1', placeholder: '8.5', required: true, defaultRate: 'loanHomeLoan' },
      { name: 'tenureMonths', label: 'Tenure (months)', type: 'number', min: '1', max: '360', step: '1', placeholder: '240', required: true }
    ],
    results: [
      { key: 'emi', label: 'Monthly EMI', highlight: 'emerald' },
      { key: 'principal', label: 'Loan Amount' },
      { key: 'totalInterest', label: 'Total Interest', highlight: 'orange' },
      { key: 'totalAmount', label: 'Total Payment' }
    ]
  },
  {
    name: 'PPFCalculator',
    apiMethod: 'calculatePPF',
    title: 'PPF Calculator',
    description: 'Public Provident Fund (PPF) is a government-backed savings scheme with tax benefits. Lock-in period: 15 years. Annual deposits: ₹500 to ₹1,50,000.',
    fields: [
      { name: 'annualDeposit', label: 'Annual Deposit (₹)', type: 'number', min: '500', max: '150000', step: '500', placeholder: '50000', required: true },
      { name: 'rate', label: 'Interest Rate (% p.a.)', type: 'number', min: '1', max: '15', step: '0.1', placeholder: '7.1', required: true, defaultRate: 'ppf' },
      { name: 'tenureYears', label: 'Tenure (years)', type: 'number', min: '15', max: '40', step: '1', placeholder: '15', required: true, defaultValue: '15' }
    ],
    results: [
      { key: 'totalDeposit', label: 'Total Invested' },
      { key: 'totalInterest', label: 'Total Interest', highlight: 'green' },
      { key: 'maturityAmount', label: 'Maturity Amount', highlight: 'emerald' }
    ]
  },
  // Add more calculator configurations here...
];

const generateCalculatorComponent = (config) => {
  const { name, apiMethod, title, description, fields, results } = config;
  
  return `import { useState } from 'react';
import { calculatorApi } from '../../api';
import LoadingSpinner from '../LoadingSpinner';

/**
 * ${title} Component
 */
export default function ${name}({ interestRates }) {
  const [formData, setFormData] = useState({
${fields.map(f => {
  if (f.defaultRate) {
    return `    ${f.name}: interestRates?.${f.defaultRate} || ${f.placeholder},`;
  } else if (f.defaultValue) {
    return `    ${f.name}: '${f.defaultValue}',`;
  } else {
    return `    ${f.name}: '',`;
  }
}).join('\n')}
  });
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await calculatorApi.${apiMethod}(formData);
      setResult(response.data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
${fields.map(f => {
  if (f.defaultRate) {
    return `      ${f.name}: interestRates?.${f.defaultRate} || ${f.placeholder},`;
  } else if (f.defaultValue) {
    return `      ${f.name}: '${f.defaultValue}',`;
  } else {
    return `      ${f.name}: '',`;
  }
}).join('\n')}
    });
    setResult(null);
    setError(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">About ${title}</h3>
            <p className="text-sm text-blue-800">
              ${description}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleCalculate} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
${fields.map(field => {
  if (field.type === 'select') {
    return `          <div>
            <label htmlFor="${field.name}" className="block text-sm font-semibold text-gray-700 mb-2">
              ${field.label} ${field.required ? '*' : ''}
            </label>
            <select
              id="${field.name}"
              name="${field.name}"
              value={formData.${field.name}}
              onChange={handleInputChange}
              ${field.required ? 'required' : ''}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
            >
${field.options.map(opt => `              <option value="${opt.value}">${opt.label}</option>`).join('\n')}
            </select>
          </div>`;
  } else {
    return `          <div>
            <label htmlFor="${field.name}" className="block text-sm font-semibold text-gray-700 mb-2">
              ${field.label} ${field.required ? '*' : ''}
            </label>
            <input
              type="${field.type}"
              id="${field.name}"
              name="${field.name}"
              value={formData.${field.name}}
              onChange={handleInputChange}
              ${field.required ? 'required' : ''}
              ${field.min ? `min="${field.min}"` : ''}
              ${field.max ? `max="${field.max}"` : ''}
              ${field.step ? `step="${field.step}"` : ''}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
              placeholder="${field.placeholder}"
            />
          </div>`;
  }
}).join('\n')}
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? <LoadingSpinner size="small" /> : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Calculate
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 sm:flex-initial bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-8 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Calculation Results
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-${results.length > 3 ? '2 lg:grid-cols-4' : results.length} gap-4">
${results.map(r => `            <div className="bg-white rounded-lg p-4 shadow-md">
              <p className="text-sm text-gray-600 mb-1">${r.label}</p>
              <p className="text-2xl font-bold text-${r.highlight || 'gray-900'}-600">{formatCurrency(result.${r.key})}</p>
            </div>`).join('\n')}
          </div>
        </div>
      )}
    </div>
  );
}
`;
};

// Generate components
console.log('Generating calculator components...\n');

calculators.forEach(config => {
  const component = generateCalculatorComponent(config);
  const filePath = path.join(__dirname, '..', 'client', 'src', 'components', 'calculators', `${config.name}.jsx`);
  
  fs.writeFileSync(filePath, component);
  console.log(`✓ Generated ${config.name}.jsx`);
});

console.log(`\n✓ Successfully generated ${calculators.length} calculator components!`);
console.log('\nNote: You still need to create the following calculators manually:');
console.log('- LoanAdvancedCalculator (with prepayment schedule)');
console.log('- FDPayoutCalculator');
console.log('- FDCumulativeCalculator');
console.log('- RDCalculator');
console.log('- SSACalculator');
console.log('- SCSSCalculator');
console.log('- POMISCalculator');
console.log('- PORDCalculator');
console.log('- POTDCalculator');
console.log('- NSCCalculator');
console.log('- SWPCalculator');
console.log('- STPCalculator');
console.log('- NPSCalculator');
console.log('- EPFCalculator');
console.log('- APYCalculator');
