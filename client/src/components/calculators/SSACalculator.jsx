import { useState } from 'react';
import { calculatorApi } from '../../api';
import LoadingSpinner from '../LoadingSpinner';
import { BannerAd, DisplayAd } from '../AdSense';

/**
 * Sukanya Samriddhi Account Calculator
 */
export default function SSACalculator({ interestRates }) {
	const defaultRate = interestRates?.ssa || 8.2;
	const [formData, setFormData] = useState({
		annualDeposit: '',
		rate: defaultRate,
		depositYears: '15'
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

			const response = await calculatorApi.calculateSSA({
				annualDeposit: parseFloat(formData.annualDeposit),
				rate: parseFloat(formData.rate),
				depositYears: parseInt(formData.depositYears, 10)
			});

			setResult(response.data.result);
		} catch (err) {
			setError(err.message || 'Failed to calculate SSA');
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setFormData({ annualDeposit: '', rate: defaultRate, depositYears: '15' });
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
						<h3 className="text-sm font-semibold text-blue-900 mb-1">About SSA</h3>
						<p className="text-sm text-blue-800">For girl child, deposits up to 15 years, maturity at 21 years. Default rate {defaultRate}% p.a.</p>
					</div>
				</div>
			</div>

			<form onSubmit={handleCalculate} className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="annualDeposit">Annual Deposit (₹) *</label>
						<input
							id="annualDeposit"
							name="annualDeposit"
							type="number"
							value={formData.annualDeposit}
							onChange={handleChange}
							required
							min="250"
							max="150000"
							step="250"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
							placeholder="e.g., 60000"
						/>
						<p className="text-xs text-gray-500 mt-1">Min ₹250 | Max ₹1,50,000 per year</p>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="rate">Interest Rate (% p.a.) *</label>
						<input
							id="rate"
							name="rate"
							type="number"
							value={formData.rate}
							onChange={handleChange}
							required
							min="1"
							max="15"
							step="0.1"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
							placeholder={`e.g., ${defaultRate}`}
						/>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="depositYears">Deposit Years *</label>
						<input
							id="depositYears"
							name="depositYears"
							type="number"
							value={formData.depositYears}
							onChange={handleChange}
							required
							min="1"
							max="15"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
							placeholder="e.g., 15"
						/>
						<p className="text-xs text-gray-500 mt-1">Deposits allowed up to 15 years; maturity at 21 years</p>
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
						{loading ? <LoadingSpinner size="small" /> : 'Calculate SSA Maturity'}
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
						SSA Maturity Details
					</h3>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
						<div className="bg-white rounded-lg p-4 shadow-md">
							<p className="text-sm text-gray-600 mb-1">Total Deposits</p>
							<p className="text-2xl font-bold text-gray-900">{formatCurrency(result.totalDeposit)}</p>
						</div>
						<div className="bg-white rounded-lg p-4 shadow-md">
							<p className="text-sm text-gray-600 mb-1">Total Interest</p>
							<p className="text-2xl font-bold text-green-600">{formatCurrency(result.totalInterest)}</p>
						</div>
						<div className="bg-white rounded-lg p-4 shadow-md">
							<p className="text-sm text-gray-600 mb-1">Maturity Amount</p>
							<p className="text-2xl font-bold text-emerald-600">{formatCurrency(result.maturityAmount)}</p>
						</div>
					</div>

					<div className="bg-white rounded-lg p-4 shadow-md grid grid-cols-2 gap-4 text-sm">
						<div>
							<p className="text-gray-600">Annual Deposit</p>
							<p className="font-semibold">{formatCurrency(result.annualDeposit)}</p>
						</div>
						<div>
							<p className="text-gray-600">Deposit Years</p>
							<p className="font-semibold">{result.depositYears} years</p>
						</div>
						<div>
							<p className="text-gray-600">Maturity Year</p>
							<p className="font-semibold">{result.maturityYears} years total</p>
						</div>
						<div>
							<p className="text-gray-600">Interest Rate</p>
							<p className="font-semibold">{result.rate}% p.a.</p>
						</div>
					</div>
				</div>
			)}

			{/* Display Ad - Shows after calculation */}
			{result && <DisplayAd className="mt-8" />}
		</div>
	);
}
