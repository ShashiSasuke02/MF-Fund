import { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { calculatorApi } from '../api';

// Import calculator sub-components
import SimpleInterestCalculator from '../components/calculators/SimpleInterestCalculator';
import CompoundInterestCalculator from '../components/calculators/CompoundInterestCalculator';
import LoanBasicCalculator from '../components/calculators/LoanBasicCalculator';
import LoanAdvancedCalculator from '../components/calculators/LoanAdvancedCalculator';
import FDPayoutCalculator from '../components/calculators/FDPayoutCalculator';
import FDCumulativeCalculator from '../components/calculators/FDCumulativeCalculator';
import RDCalculator from '../components/calculators/RDCalculator';
import PPFCalculator from '../components/calculators/PPFCalculator';
import SSACalculator from '../components/calculators/SSACalculator';
import SCSSCalculator from '../components/calculators/SCSSCalculator';
import POMISCalculator from '../components/calculators/POMISCalculator';
import PORDCalculator from '../components/calculators/PORDCalculator';
import POTDCalculator from '../components/calculators/POTDCalculator';
import NSCCalculator from '../components/calculators/NSCCalculator';
import SIPCalculator from '../components/calculators/SIPCalculator';
import SWPCalculator from '../components/calculators/SWPCalculator';
import STPCalculator from '../components/calculators/STPCalculator';
import NPSCalculator from '../components/calculators/NPSCalculator';
import EPFCalculator from '../components/calculators/EPFCalculator';
import APYCalculator from '../components/calculators/APYCalculator';

const CALCULATOR_CATEGORIES = {
  banking: {
    name: 'Banking Schemes',
    icon: '🏦',
    calculators: [
      { id: 'simple-interest', name: 'Simple Interest', component: SimpleInterestCalculator },
      { id: 'compound-interest', name: 'Compound Interest', component: CompoundInterestCalculator },
      { id: 'loan-basic', name: 'Loan EMI - Basic', component: LoanBasicCalculator },
      { id: 'loan-advanced', name: 'Loan EMI - Advanced', component: LoanAdvancedCalculator },
      { id: 'fd-payout', name: 'Fixed Deposit - Payout', component: FDPayoutCalculator },
      { id: 'fd-cumulative', name: 'Fixed Deposit - Cumulative', component: FDCumulativeCalculator },
      { id: 'rd', name: 'Recurring Deposit', component: RDCalculator },
      { id: 'ppf', name: 'Public Provident Fund (PPF)', component: PPFCalculator },
      { id: 'ssa', name: 'Sukanya Samriddhi Account', component: SSACalculator },
      { id: 'scss', name: 'Senior Citizen Savings Scheme', component: SCSSCalculator }
    ]
  },
  postOffice: {
    name: 'Post Office Schemes',
    icon: '📮',
    calculators: [
      { id: 'po-mis', name: 'Monthly Income Scheme', component: POMISCalculator },
      { id: 'po-rd', name: 'Recurring Deposit', component: PORDCalculator },
      { id: 'po-td', name: 'Time Deposit', component: POTDCalculator },
      { id: 'nsc', name: 'National Savings Certificate', component: NSCCalculator }
    ]
  },
  mutualFunds: {
    name: 'Mutual Fund Calculators',
    icon: '📈',
    calculators: [
      { id: 'sip', name: 'SIP Calculator', component: SIPCalculator },
      { id: 'swp', name: 'SWP Calculator', component: SWPCalculator },
      { id: 'stp', name: 'STP Calculator', component: STPCalculator }
    ]
  },
  retirement: {
    name: 'Retirement Planning',
    icon: '🏖️',
    calculators: [
      { id: 'nps', name: 'National Pension System', component: NPSCalculator },
      { id: 'epf', name: "Employees' Provident Fund", component: EPFCalculator },
      { id: 'apy', name: 'Atal Pension Yojana', component: APYCalculator }
    ]
  }
};

export default function Calculator() {
  const [selectedCategory, setSelectedCategory] = useState('banking');
  const [selectedCalculator, setSelectedCalculator] = useState(null);
  const [interestRates, setInterestRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInterestRates();
  }, []);

  const loadInterestRates = async () => {
    try {
      setLoading(true);
      setError(null);
      const rates = await calculatorApi.getInterestRates();
      setInterestRates(rates);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculatorSelect = (calculator) => {
    setSelectedCalculator(calculator);
  };

  const handleBackToList = () => {
    setSelectedCalculator(null);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const SelectedComponent = selectedCalculator?.component;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with decorative elements */}
      <div className="relative mb-8">
        {/* Decorative blob */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob pointer-events-none"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000 pointer-events-none"></div>
        
        <div className="relative">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
            <svg className="w-10 h-10 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Investment Calculators
          </h1>
          <p className="text-gray-600">
            Comprehensive financial planning tools for all your investment needs
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} onRetry={loadInterestRates} />
        </div>
      )}

      {/* Calculator Selection or Display */}
      {!selectedCalculator ? (
        <>
          {/* Category Tabs */}
          <div className="mb-6 overflow-x-auto">
            <div className="flex space-x-2 min-w-max">
              {Object.entries(CALCULATOR_CATEGORIES).map(([key, category]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 whitespace-nowrap ${
                    selectedCategory === key
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-emerald-50'
                  }`}
                >
                  <span className="text-xl">{category.icon}</span>
                  <span className="text-sm sm:text-base">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Calculator Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {CALCULATOR_CATEGORIES[selectedCategory].calculators.map((calculator) => (
              <button
                key={calculator.id}
                onClick={() => handleCalculatorSelect(calculator)}
                className="bg-white rounded-xl p-4 sm:p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-emerald-500 text-left group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                    {calculator.name}
                  </h3>
                  <svg 
                    className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 group-hover:translate-x-1 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">
                  Calculate returns and plan your investments
                </p>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Back Button */}
          <button
            type="button"
            onClick={handleBackToList}
            className="mb-6 flex items-center text-emerald-600 hover:text-emerald-700 font-semibold"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Calculators
          </button>

          {/* Selected Calculator Component */}
          <div className="bg-white rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              {selectedCalculator.name}
            </h2>
            {SelectedComponent && <SelectedComponent interestRates={interestRates} />}
          </div>
        </>
      )}
    </div>
  );
}
