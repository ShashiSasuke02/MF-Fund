import { useState } from 'react';
import { calculatorApi } from '../../api';
import LoadingSpinner from '../LoadingSpinner';
import { BannerAd, DisplayAd } from '../AdSense';

/**
 * Systematic Transfer Plan Calculator
 */
export default function STPCalculator({ interestRates }) {
	const [formData, setFormData] = useState({
		initialInvestment: '',
		monthlyTransfer: '',
		sourceFundReturn: interestRates?.mutualFundDebt || 7.5,
		targetFundReturn: interestRates?.mutualFundEquity || 12,
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
				monthlyTransfer: parseFloat(formData.monthlyTransfer),
				sourceFundReturn: parseFloat(formData.sourceFundReturn),
				targetFundReturn: parseFloat(formData.targetFundReturn),
				tenureYears: parseFloat(formData.tenureYears)
			};

			const response = await calculatorApi.calculateSTP(payload);
			setResult(response.data.result);
		} catch (err) {
			setError(err.message || 'Failed to calculate STP');
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setFormData({
			initialInvestment: '',
			monthlyTransfer: '',
			sourceFundReturn: interestRates?.mutualFundDebt || 7.5,
			targetFundReturn: interestRates?.mutualFundEquity || 12,
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
			{/* Top Banner Ad */}
			<BannerAd className="mb-6" />
			
			<div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
				<div className="flex">
					<svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div>
						<h3 className="text-sm font-semibold text-blue-900 mb-1">About STP</h3>
						<p className="text-sm text-blue-800">Shifts money from a source fund to a target fund at regular intervals. Useful for staggered deployment of lumpsum investments.</p>
					</div>
				</div>
			</div>

			<form onSubmit={handleCalculate} className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="initialInvestment">Initial Investment in Source Fund (?) *</label>
						<input
							id="initialInvestment"
							name="initialInvestment"
							type="number"
							value={formData.initialInvestment}
							onChange={handleChange}
							required
							min="1000"
							step="any"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
							placeholder="e.g., 200000"
						/>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="monthlyTransfer">Monthly Transfer Amount (?) *</label>
						<input
							id="monthlyTransfer"
							name="monthlyTransfer"
							type="number"
							value={formData.monthlyTransfer}
							onChange={handleChange}
							required
							min="500"
							step="any"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
							placeholder="e.g., 10000"
						/>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="sourceFundReturn">Source Fund Return (% p.a.)</label>
						<input
							id="sourceFundReturn"
							name="sourceFundReturn"
							type="number"
							value={formData.sourceFundReturn}
							onChange={handleChange}
							min="1"
							max="15"
							step="0.1"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
						/>
						<p className="text-xs text-gray-500 mt-1">Default uses debt-like return</p>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="targetFundReturn">Target Fund Return (% p.a.)</label>
						<input
							id="targetFundReturn"
							name="targetFundReturn"
							type="number"
							value={formData.targetFundReturn}
							onChange={handleChange}
							min="1"
							max="20"
							step="0.1"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
						/>
						<p className="text-xs text-gray-500 mt-1">Default uses equity-like return</p>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="tenureYears">Transfer Tenure (years) *</label>
						<input
							id="tenureYears"
							name="tenureYears"
							type="number"
							value={formData.tenureYears}
							onChange={handleChange}
							required
							min="1"
							max="20"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
							placeholder="e.g., 3"
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
						{loading ? <LoadingSpinner size="small" /> : 'Calculate STP'}
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
						STP Transfer Summary
					</h3>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
						<div className="bg-white rounded-lg p-4 shadow-md">
							<p className="text-sm text-gray-600 mb-1">Total Transferred</p>
							<p className="text-2xl font-bold text-blue-600">{formatCurrency(result.totalTransferred)}</p>
						</div>
						<div className="bg-white rounded-lg p-4 shadow-md">
							<p className="text-sm text-gray-600 mb-1">Source Fund Balance</p>
							<p className="text-2xl font-bold text-purple-600">{formatCurrency(result.sourceBalance)}</p>
						</div>
						<div className="bg-white rounded-lg p-4 shadow-md">
							<p className="text-sm text-gray-600 mb-1">Target Fund Value</p>
							<p className="text-2xl font-bold text-emerald-600">{formatCurrency(result.targetBalance)}</p>
						</div>
					</div>

					<div className="bg-white rounded-lg p-4 shadow-md grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
						<div>
							<p className="text-gray-600">Initial Investment</p>
							<p className="font-semibold">{formatCurrency(result.initialInvestment)}</p>
						</div>
						<div>
							<p className="text-gray-600">Monthly Transfer</p>
							<p className="font-semibold">{formatCurrency(result.monthlyTransfer)}</p>
						</div>
						<div>
							<p className="text-gray-600">Total Value (Source + Target)</p>
							<p className="font-semibold text-emerald-700">{formatCurrency(result.totalValue)}</p>
						</div>
						<div>
							<p className="text-gray-600">Source Return</p>
							<p className="font-semibold">{result.sourceFundReturn}% p.a.</p>
						</div>
						<div>
							<p className="text-gray-600">Target Return</p>
							<p className="font-semibold">{result.targetFundReturn}% p.a.</p>
						</div>
						<div>
							<p className="text-gray-600">Tenure</p>
							<p className="font-semibold">{result.tenureYears} years</p>
						</div>
					</div>
				</div>
			)}

			{/* Display Ad - Shows after calculation */}
			{result && <DisplayAd className="mt-8" />}
		</div>
	);
}
