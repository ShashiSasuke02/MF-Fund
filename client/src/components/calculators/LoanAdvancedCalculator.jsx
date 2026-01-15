import { useState } from 'react';
import { calculatorApi } from '../../api';
import LoadingSpinner from '../LoadingSpinner';
import { BannerAd, DisplayAd } from '../AdSense';

/**
 * Advanced Loan Calculator with prepayments
 */
export default function LoanAdvancedCalculator({ interestRates }) {
	const [formData, setFormData] = useState({
		principal: '',
		rate: interestRates?.loanHomeLoan || 8.5,
		tenureMonths: '',
		prepayments: [{ month: '', amount: '' }]
	});
	const [result, setResult] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		setError(null);
	};

	const handlePrepaymentChange = (index, field, value) => {
		setFormData((prev) => {
			const updated = [...prev.prepayments];
			updated[index] = { ...updated[index], [field]: value };
			return { ...prev, prepayments: updated };
		});
		setError(null);
	};

	const addPrepaymentRow = () => {
		setFormData((prev) => ({ ...prev, prepayments: [...prev.prepayments, { month: '', amount: '' }] }));
	};

	const removePrepaymentRow = (index) => {
		setFormData((prev) => ({
			...prev,
			prepayments: prev.prepayments.filter((_, i) => i !== index)
		}));
	};

	const handleCalculate = async (e) => {
		e.preventDefault();
		try {
			setLoading(true);
			setError(null);

			const sanitizedPrepayments = formData.prepayments
				.filter((p) => p.month && p.amount)
				.map((p) => ({ month: parseInt(p.month, 10), amount: parseFloat(p.amount) }));

			const response = await calculatorApi.calculateAdvancedLoan({
				principal: parseFloat(formData.principal),
				rate: parseFloat(formData.rate),
				tenureMonths: parseInt(formData.tenureMonths, 10),
				prepayments: sanitizedPrepayments
			});

			setResult(response.data.result);
		} catch (err) {
			setError(err.message || 'Failed to calculate advanced loan');
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setFormData({
			principal: '',
			rate: interestRates?.loanHomeLoan || 8.5,
			tenureMonths: '',
			prepayments: [{ month: '', amount: '' }]
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
						<h3 className="text-sm font-semibold text-blue-900 mb-1">About Advanced EMI</h3>
						<p className="text-sm text-blue-800">Plan lump-sum prepayments to reduce tenure or interest. Add optional prepayment rows; leave blank if none.</p>
					</div>
				</div>
			</div>

			<form onSubmit={handleCalculate} className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label htmlFor="principal" className="block text-sm font-semibold text-gray-700 mb-2">Loan Amount (₹) *</label>
						<input
							type="number"
							id="principal"
							name="principal"
							value={formData.principal}
							onChange={handleInputChange}
							required
							min="10000"
							step="1000"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
							placeholder="e.g., 1500000"
						/>
						<p className="text-xs text-gray-500 mt-1">Minimum ₹10,000</p>
					</div>

					<div>
						<label htmlFor="rate" className="block text-sm font-semibold text-gray-700 mb-2">Interest Rate (% p.a.) *</label>
						<input
							type="number"
							id="rate"
							name="rate"
							value={formData.rate}
							onChange={handleInputChange}
							required
							min="1"
							max="30"
							step="0.1"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
							placeholder={`e.g., ${interestRates?.loanHomeLoan || 8.5}`}
						/>
					</div>

					<div>
						<label htmlFor="tenureMonths" className="block text-sm font-semibold text-gray-700 mb-2">Tenure (months) *</label>
						<input
							type="number"
							id="tenureMonths"
							name="tenureMonths"
							value={formData.tenureMonths}
							onChange={handleInputChange}
							required
							min="1"
							max="480"
							step="1"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
							placeholder="e.g., 180"
						/>
					</div>
				</div>

				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h4 className="text-sm font-semibold text-gray-700">Optional Prepayments</h4>
						<button
							type="button"
							onClick={addPrepaymentRow}
							className="text-emerald-700 text-sm font-semibold hover:underline"
						>
							+ Add Row
						</button>
					</div>

					{formData.prepayments.map((row, index) => (
						<div key={`prepayment-${index}`} className="grid grid-cols-12 gap-3 items-end">
							<div className="col-span-5 sm:col-span-4">
								<label className="block text-xs font-semibold text-gray-700 mb-1">Month</label>
								<input
									type="number"
									min="1"
									max={formData.tenureMonths || 480}
									value={row.month}
									onChange={(e) => handlePrepaymentChange(index, 'month', e.target.value)}
									className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
									placeholder="e.g., 12"
								/>
							</div>
							<div className="col-span-6 sm:col-span-6">
								<label className="block text-xs font-semibold text-gray-700 mb-1">Amount (₹)</label>
								<input
									type="number"
									min="0"
									step="1000"
									value={row.amount}
									onChange={(e) => handlePrepaymentChange(index, 'amount', e.target.value)}
									className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
									placeholder="e.g., 50000"
								/>
							</div>
							<div className="col-span-1 flex justify-end">
								{formData.prepayments.length > 1 && (
									<button
										type="button"
										onClick={() => removePrepaymentRow(index)}
										className="text-red-500 text-sm font-semibold"
									>
										✕
									</button>
								)}
							</div>
						</div>
					))}
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
						{loading ? <LoadingSpinner size="small" /> : 'Calculate EMI & Savings'}
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
						EMI with Prepayments
					</h3>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
						<div className="bg-white rounded-lg p-4 shadow-md">
							<p className="text-sm text-gray-600 mb-1">Monthly EMI</p>
							<p className="text-2xl font-bold text-emerald-600">{formatCurrency(result.emi)}</p>
						</div>
						<div className="bg-white rounded-lg p-4 shadow-md">
							<p className="text-sm text-gray-600 mb-1">Total Interest</p>
							<p className="text-2xl font-bold text-blue-600">{formatCurrency(result.totalInterest)}</p>
						</div>
						<div className="bg-white rounded-lg p-4 shadow-md">
							<p className="text-sm text-gray-600 mb-1">Total Payment</p>
							<p className="text-2xl font-bold text-purple-600">{formatCurrency(result.totalAmount)}</p>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
						<div className="bg-white rounded-lg p-4 shadow-md">
							<p className="text-sm text-gray-600 mb-1">Tenure</p>
							<p className="font-semibold">Original: {result.originalTenure} months | Actual: {result.actualTenure} months</p>
						</div>
						<div className="bg-white rounded-lg p-4 shadow-md">
							<p className="text-sm text-gray-600 mb-1">Savings from Prepayment</p>
							<p className="font-semibold text-emerald-700">{formatCurrency(result.savingsFromPrepayment)}</p>
						</div>
					</div>

					<div className="bg-white rounded-lg p-4 shadow-md">
						<h4 className="text-sm font-semibold text-gray-800 mb-3">Sample Amortization (first 6 entries)</h4>
						<div className="grid grid-cols-6 text-xs font-semibold text-gray-500 mb-2">
							<span>Month</span>
							<span>EMI</span>
							<span>Principal</span>
							<span>Interest</span>
							<span>Prepay</span>
							<span>Balance</span>
						</div>
						{result.schedule.slice(0, 6).map((row) => (
							<div key={`row-${row.month}`} className="grid grid-cols-6 text-xs py-1 border-b border-gray-100">
								<span>{row.month}</span>
								<span>{formatCurrency(row.emi)}</span>
								<span>{formatCurrency(row.principalPayment)}</span>
								<span>{formatCurrency(row.interestPayment)}</span>
								<span>{formatCurrency(row.prepayment)}</span>
								<span>{formatCurrency(row.remainingPrincipal)}</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Display Ad - Shows after calculation */}
			{result && <DisplayAd className="mt-8" />}	</div>
);
}