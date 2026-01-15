import { useState } from 'react';
import { calculatorApi } from '../../api';
import LoadingSpinner from '../LoadingSpinner';

/**
 * Employees' Provident Fund Calculator
 */
export default function EPFCalculator({ interestRates }) {
	const defaultRate = interestRates?.epf || 8.25;
	const [formData, setFormData] = useState({
		basicSalary: '',
		employeeContribution: 12,
		employerContribution: 12,
		currentAge: '',
		retirementAge: 58,
		annualIncrement: 5,
		interestRate: defaultRate
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
				basicSalary: parseFloat(formData.basicSalary),
				employeeContribution: parseFloat(formData.employeeContribution),
				employerContribution: parseFloat(formData.employerContribution),
				currentAge: parseInt(formData.currentAge, 10),
				retirementAge: parseInt(formData.retirementAge, 10),
				annualIncrement: parseFloat(formData.annualIncrement),
				interestRate: parseFloat(formData.interestRate)
			};

			const response = await calculatorApi.calculateEPF(payload);
			setResult(response.data.result);
		} catch (err) {
			setError(err.message || 'Failed to calculate EPF');
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setFormData({
			basicSalary: '',
			employeeContribution: 12,
			employerContribution: 12,
			currentAge: '',
			retirementAge: 58,
			annualIncrement: 5,
			interestRate: defaultRate
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
						<h3 className="text-sm font-semibold text-blue-900 mb-1">About EPF</h3>
						<p className="text-sm text-blue-800">Mandatory retirement savings for salaried employees. Default rate {defaultRate}% p.a.; standard contribution 12% each from employee and employer.</p>
					</div>
				</div>
			</div>

			<form onSubmit={handleCalculate} className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="basicSalary">Monthly Basic Salary (₹) *</label>
						<input
							id="basicSalary"
							name="basicSalary"
							type="number"
							value={formData.basicSalary}
							onChange={handleChange}
							required
							min="1000"
							step="500"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
							placeholder="e.g., 30000"
						/>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="interestRate">EPF Interest Rate (% p.a.) *</label>
						<input
							id="interestRate"
							name="interestRate"
							type="number"
							value={formData.interestRate}
							onChange={handleChange}
							required
							min="1"
							max="12"
							step="0.01"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
							placeholder={`e.g., ${defaultRate}`}
						/>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="employeeContribution">Employee Contribution (%) *</label>
						<input
							id="employeeContribution"
							name="employeeContribution"
							type="number"
							value={formData.employeeContribution}
							onChange={handleChange}
							required
							min="1"
							max="20"
							step="0.5"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
						/>
						<p className="text-xs text-gray-500 mt-1">Standard is 12%</p>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="employerContribution">Employer Contribution (%) *</label>
						<input
							id="employerContribution"
							name="employerContribution"
							type="number"
							value={formData.employerContribution}
							onChange={handleChange}
							required
							min="1"
							max="20"
							step="0.5"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
						/>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="annualIncrement">Annual Salary Increment (%)</label>
						<input
							id="annualIncrement"
							name="annualIncrement"
							type="number"
							value={formData.annualIncrement}
							onChange={handleChange}
							min="0"
							max="20"
							step="0.5"
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
							placeholder="e.g., 5"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
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
								max="55"
								className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
								placeholder="e.g., 28"
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
								placeholder="e.g., 58"
							/>
						</div>
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
						{loading ? <LoadingSpinner size="small" /> : 'Calculate EPF'}
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
						EPF Corpus Projection
					</h3>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
						<div className="bg-white rounded-lg p-4 shadow-md">
							<p className="text-sm text-gray-600 mb-1">Total Employee Contribution</p>
							<p className="text-2xl font-bold text-blue-600">{formatCurrency(result.totalEmployeeContribution)}</p>
						</div>
						<div className="bg-white rounded-lg p-4 shadow-md">
							<p className="text-sm text-gray-600 mb-1">Total Employer Contribution</p>
							<p className="text-2xl font-bold text-purple-600">{formatCurrency(result.totalEmployerContribution)}</p>
						</div>
						<div className="bg-white rounded-lg p-4 shadow-md">
							<p className="text-sm text-gray-600 mb-1">Total Interest Earned</p>
							<p className="text-2xl font-bold text-emerald-600">{formatCurrency(result.totalInterest)}</p>
						</div>
					</div>

					<div className="bg-white rounded-lg p-4 shadow-md grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
						<div>
							<p className="text-gray-600">Total Contribution</p>
							<p className="font-semibold">{formatCurrency(result.totalContribution)}</p>
						</div>
						<div>
							<p className="text-gray-600">Retirement Corpus</p>
							<p className="font-semibold text-emerald-700">{formatCurrency(result.retirementCorpus)}</p>
						</div>
						<div>
							<p className="text-gray-600">Tenure</p>
							<p className="font-semibold">{result.tenureYears} years</p>
						</div>
						<div>
							<p className="text-gray-600">Employee / Employer</p>
							<p className="font-semibold">{result.employeeContribution}% / {result.employerContribution}%</p>
						</div>
						<div>
							<p className="text-gray-600">Annual Increment</p>
							<p className="font-semibold">{result.annualIncrement}%</p>
						</div>
						<div>
							<p className="text-gray-600">Interest Rate</p>
							<p className="font-semibold">{result.interestRate}% p.a.</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
