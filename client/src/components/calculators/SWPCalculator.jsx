import { useState } from 'react';
import { calculatorApi } from '../../api';
import LoadingSpinner from '../LoadingSpinner';

/**
 * Systematic Withdrawal Plan Calculator
 */
export default function SWPCalculator({ interestRates }) {
	const [formData, setFormData] = useState({
		initialInvestment: '',
		monthlyWithdrawal: '',
		expectedReturn: interestRates?.mutualFundHybrid || 9.5,
		tenureYears: ''
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
				initialInvestment: parseFloat(formData.initialInvestment),
				monthlyWithdrawal: parseFloat(formData.monthlyWithdrawal),
				expectedReturn: parseFloat(formData.expectedReturn),
				tenureYears: parseFloat(formData.tenureYears)
			};

			const response = await calculatorApi.calculateSWP(payload);
			setResult(response.data.result);
		} catch (err) {
			setError(err.message || 'Failed to calculate SWP');
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setFormData({
			initialInvestment: '',
			monthlyWithdrawal: '',
			expectedReturn: interestRates?.mutualFundHybrid || 9.5,
			tenureYears: ''
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
						<h3 className="text-sm font-semibold text-blue-900 mb-1">About SWP</h3>
						<p className="text-sm text-blue-800">Steady withdrawals from a lump sum while the remaining corpus continues to earn returns. Useful for income needs.</p>
					</div>
				</div>
			</div>

			<form onSubmit={handleCalculate} className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="initialInvestment">Initial Investment (₹) *</label>
						<input
							id="initialInvestment"
							name="initialInvestment"
							type="number"
							value={formData.initialInvestment}
							onChange={handleChange}
							required
							min="1000"
							step="1000"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
							placeholder="e.g., 500000"
						/>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="monthlyWithdrawal">Monthly Withdrawal (₹) *</label>
						<input
							id="monthlyWithdrawal"
							name="monthlyWithdrawal"
							type="number"
							value={formData.monthlyWithdrawal}
							onChange={handleChange}
							required
							min="1000"
							step="500"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
							placeholder="e.g., 15000"
						/>
						<p className="text-xs text-gray-500 mt-1">Choose a sustainable withdrawal to avoid early depletion.</p>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="expectedReturn">Expected Return (% p.a.)</label>
						<input
							id="expectedReturn"
							name="expectedReturn"
							type="number"
							value={formData.expectedReturn}
							onChange={handleChange}
							min="1"
							max="20"
							step="0.1"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
							placeholder="e.g., 9.5"
						/>
						<p className="text-xs text-gray-500 mt-1">Default uses hybrid return assumption.</p>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="tenureYears">Withdrawal Tenure (years) *</label>
						<input
							id="tenureYears"
							name="tenureYears"
							type="number"
							value={formData.tenureYears}
							onChange={handleChange}
							required
							min="1"
							max="40"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
							placeholder="e.g., 15"
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
						{loading ? <LoadingSpinner size="small" /> : 'Calculate SWP'}
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
						SWP Withdrawal Summary
					</h3>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
						<div className="bg-white rounded-lg p-4 shadow-md">
							<p className="text-sm text-gray-600 mb-1">Total Withdrawn</p>
							<p className="text-2xl font-bold text-blue-600">{formatCurrency(result.totalWithdrawn)}</p>
						</div>
						<div className="bg-white rounded-lg p-4 shadow-md">
							<p className="text-sm text-gray-600 mb-1">Remaining Balance</p>
							<p className="text-2xl font-bold text-purple-600">{formatCurrency(result.remainingBalance)}</p>
						</div>
						<div className="bg-white rounded-lg p-4 shadow-md">
							<p className="text-sm text-gray-600 mb-1">Tenure</p>
							<p className="text-2xl font-bold text-emerald-600">{result.tenureYears} years</p>
						</div>
					</div>

					<div className="bg-white rounded-lg p-4 shadow-md grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-6">
						<div>
							<p className="text-gray-600">Initial Investment</p>
							<p className="font-semibold">{formatCurrency(result.initialInvestment)}</p>
						</div>
						<div>
							<p className="text-gray-600">Monthly Withdrawal</p>
							<p className="font-semibold">{formatCurrency(result.monthlyWithdrawal)}</p>
						</div>
						<div>
							<p className="text-gray-600">Expected Return</p>
							<p className="font-semibold">{result.expectedReturn}% p.a.</p>
						</div>
					</div>

					{result.monthlyBreakdown?.length > 0 && (
						<div className="bg-white rounded-lg p-4 shadow-md">
							<h4 className="text-lg font-semibold text-gray-800 mb-3">Yearly Snapshots</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								{result.monthlyBreakdown.map((item) => (
									<div key={item.month} className="border border-gray-100 rounded-lg p-3 flex items-center justify-between">
										<div>
											<p className="text-sm text-gray-600">Month {item.month}</p>
											<p className="text-xs text-gray-500">Withdrawal: {formatCurrency(item.withdrawal)} | Returns: {formatCurrency(item.returns)}</p>
										</div>
										<p className="text-base font-semibold text-emerald-700">{formatCurrency(item.balance)}</p>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
