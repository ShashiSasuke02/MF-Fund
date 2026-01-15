import { useState } from 'react';
import { calculatorApi } from '../../api';
import LoadingSpinner from '../LoadingSpinner';

/**
 * National Pension System Calculator
 */
export default function NPSCalculator({ interestRates }) {
	const defaultReturn = interestRates?.nps || 10;
	const [formData, setFormData] = useState({
		monthlyContribution: '',
		currentAge: '',
		retirementAge: 60,
		expectedReturn: defaultReturn
	});
	const [result, setResult] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		setError(null);
	};

	const handleCalculate = async (e) => {
		e.preventDefault();
		try {
			setLoading(true);
			setError(null);

			const payload = {
				monthlyContribution: parseFloat(formData.monthlyContribution),
				currentAge: parseInt(formData.currentAge, 10),
				retirementAge: parseInt(formData.retirementAge, 10),
				expectedReturn: parseFloat(formData.expectedReturn)
			};

			const response = await calculatorApi.calculateNPS(payload);
			setResult(response.data.result);
		} catch (err) {
			setError(err.message || 'Failed to calculate NPS');
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setFormData({
			monthlyContribution: '',
			currentAge: '',
			retirementAge: 60,
			expectedReturn: defaultReturn
		});
		setResult(null);
		setError(null);
	};

	const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(amount || 0);

	return (
		<div className="space-y-6">
			<div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
				<div className="flex">
					<svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div>
						<h3 className="text-sm font-semibold text-blue-900 mb-1">About NPS</h3>
						<p className="text-sm text-blue-800">Market-linked retirement scheme. 60% lump sum withdrawal allowed, 40% annuity for pension. Default expected return {defaultReturn}% p.a.</p>
					</div>
				</div>
			</div>

			<form onSubmit={handleCalculate} className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="monthlyContribution">Monthly Contribution (₹) *</label>
						<input
							id="monthlyContribution"
							name="monthlyContribution"
							type="number"
							value={formData.monthlyContribution}
							onChange={handleChange}
							required
							min="500"
							step="500"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
							placeholder="e.g., 5000"
						/>
						<p className="text-xs text-gray-500 mt-1">Minimum ₹500</p>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="expectedReturn">Expected Return (% p.a.) *</label>
						<input
							id="expectedReturn"
							name="expectedReturn"
							type="number"
							value={formData.expectedReturn}
							onChange={handleChange}
							required
							min="4"
							max="20"
							step="0.1"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
							placeholder={`e.g., ${defaultReturn}`}
						/>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="currentAge">Current Age *</label>
						<input
							id="currentAge"
							name="currentAge"
							type="number"
							value={formData.currentAge}
							onChange={handleChange}
							required
							min="18"
							max="60"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
							placeholder="e.g., 30"
						/>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="retirementAge">Retirement Age *</label>
						<input
							id="retirementAge"
							name="retirementAge"
							type="number"
							value={formData.retirementAge}
							onChange={handleChange}
							required
							min="40"
							max="60"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
							placeholder="e.g., 60"
						/>
					</div>
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
						{loading ? <LoadingSpinner size="small" /> : 'Calculate NPS Corpus'}
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
						NPS Retirement Projection
					</h3>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
						<div className="bg-white rounded-lg p-4 shadow-md">
							<p className="text-sm text-gray-600 mb-1">Total Investment</p>
							<p className="text-2xl font-bold text-gray-900">{formatCurrency(result.totalInvestment)}</p>
						</div>
						<div className="bg-white rounded-lg p-4 shadow-md">
							<p className="text-sm text-gray-600 mb-1">Total Returns</p>
							<p className="text-2xl font-bold text-green-600">{formatCurrency(result.totalReturns)}</p>
						</div>
						<div className="bg-white rounded-lg p-4 shadow-md">
							<p className="text-sm text-gray-600 mb-1">Retirement Corpus</p>
							<p className="text-2xl font-bold text-emerald-600">{formatCurrency(result.retirementCorpus)}</p>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
						<div className="bg-white rounded-lg p-4 shadow-md">
							<p className="text-sm text-gray-600 mb-1">Lump Sum Withdrawal (60%)</p>
							<p className="text-xl font-semibold text-blue-700">{formatCurrency(result.lumpSumWithdrawal)}</p>
						</div>
						<div className="bg-white rounded-lg p-4 shadow-md">
							<p className="text-sm text-gray-600 mb-1">Annuity Purchase (40%)</p>
							<p className="text-xl font-semibold text-purple-700">{formatCurrency(result.annuityAmount)}</p>
						</div>
					</div>

					<div className="bg-white rounded-lg p-4 shadow-md grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
						<div>
							<p className="text-gray-600">Estimated Monthly Pension</p>
							<p className="font-semibold text-emerald-700">{formatCurrency(result.estimatedMonthlyPension)}</p>
						</div>
						<div>
							<p className="text-gray-600">Monthly Contribution</p>
							<p className="font-semibold">{formatCurrency(result.monthlyContribution)}</p>
						</div>
						<div>
							<p className="text-gray-600">Tenure</p>
							<p className="font-semibold">{result.tenureYears} years</p>
						</div>
						<div>
							<p className="text-gray-600">Return Assumption</p>
							<p className="font-semibold">{result.expectedReturn}% p.a.</p>
						</div>
						<div>
							<p className="text-gray-600">Retirement Age</p>
							<p className="font-semibold">{result.retirementAge}</p>
						</div>
						<div>
							<p className="text-gray-600">Current Age</p>
							<p className="font-semibold">{result.currentAge}</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
