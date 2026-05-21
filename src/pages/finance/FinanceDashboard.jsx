import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { 
  DollarSign, TrendingUp, TrendingDown, Building, PackageOpen, 
  PlusCircle, CreditCard, Activity, PieChart, ArrowRightLeft, FileText 
} from 'lucide-react';

export default function FinanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ 
	revenue: 0, 
	operatingExpenses: 0, 
	payrollExpenses: 0, 
	assetValue: 0 
  });
  
  const [transactions, setTransactions] = useState([]);
  const [assets, setAssets] = useState([]);
  const [expensesByCategory, setExpensesByCategory] = useState({});
  
  // Data Entry Forms
  const [assetForm, setAssetForm] = useState({ name: '', category: 'Medical Equipment', value: '' });
  const [transForm, setTransForm] = useState({ type: 'expense', category: 'General', amount: '', description: '' });

  const fetchFinanceData = async () => {
	setLoading(true);

	// 1. Clinical Revenue (From automated ticket billing)
	const { data: tickets } = await supabase.from('tickets').select('consultation_fee');
	const ticketRev = tickets ? tickets.reduce((sum, t) => sum + (parseFloat(t.consultation_fee) || 0), 0) : 0;

	// 2. Fetch all Manual Transactions & Payroll Dispatches
	const { data: transData } = await supabase.from('transactions').select('*').order('transaction_date', { ascending: false });
	
	let manualRev = 0;
	let opExp = 0;
	let payrollExp = 0;
	let categoryMap = {};

	if (transData) {
	  transData.forEach(t => {
		const amt = parseFloat(t.amount);
		if (t.type === 'income') {
		  manualRev += amt;
		} else if (t.type === 'expense') {
		  // Isolate Payroll from General Operations
		  if (t.category.toLowerCase().includes('payroll')) {
			payrollExp += amt;
		  } else {
			opExp += amt;
		  }
		  // Build category breakdown map
		  categoryMap[t.category] = (categoryMap[t.category] || 0) + amt;
		}
	  });
	}

	// 3. Fetch Capitalized Assets
	const { data: assetData } = await supabase.from('assets').select('*').order('purchase_date', { ascending: false });
	const totalAssetVal = assetData ? assetData.reduce((sum, a) => sum + parseFloat(a.purchase_value), 0) : 0;

	setMetrics({ 
	  revenue: ticketRev + manualRev, 
	  operatingExpenses: opExp, 
	  payrollExpenses: payrollExp, 
	  assetValue: totalAssetVal 
	});
	
	setTransactions(transData || []);
	setAssets(assetData || []);
	setExpensesByCategory(categoryMap);
	setLoading(false);
  };

  useEffect(() => { fetchFinanceData(); }, []);

  const handleRegisterAsset = async (e) => {
	e.preventDefault();
	setLoading(true);
	await supabase.from('assets').insert([{ 
	  asset_name: assetForm.name, 
	  category: assetForm.category, 
	  purchase_value: parseFloat(assetForm.value) 
	}]);
	setAssetForm({ name: '', category: 'Medical Equipment', value: '' });
	fetchFinanceData();
  };

  const handleRegisterTransaction = async (e) => {
	e.preventDefault();
	setLoading(true);
	await supabase.from('transactions').insert([{ 
	  type: transForm.type, 
	  category: transForm.category, 
	  amount: parseFloat(transForm.amount), 
	  description: transForm.description 
	}]);
	setTransForm({ type: 'expense', category: 'General', amount: '', description: '' });
	fetchFinanceData();
  };

  const totalExpenses = metrics.operatingExpenses + metrics.payrollExpenses;
  const netProfit = metrics.revenue - totalExpenses;

  return (
	<div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
	  
	  {/* HEADER */}
	  <div className="border-b-2 border-slate-200 dark:border-slate-800 pb-4 flex justify-between items-end">
		<div>
		  <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
			<Building className="w-7 h-7 text-emerald-600" /> Enterprise Finance & P&L
		  </h1>
		  <p className="text-sm text-slate-500 font-medium mt-1">Cross-departmental budget, payroll, and asset management.</p>
		</div>
		<button onClick={fetchFinanceData} disabled={loading} className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-lg text-sm transition hover:scale-105 shadow-md flex items-center gap-2">
		  {loading ? 'Auditing...' : <><Activity className="w-4 h-4"/> Sync Ledger</>}
		</button>
	  </div>

	  {/* KPI METRICS ROW */}
	  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
		<div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-t-4 border-t-emerald-500">
		  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500"/> Gross Revenue</div>
		  <div className="text-2xl font-black text-slate-900 dark:text-white">${metrics.revenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
		</div>
		
		<div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-t-4 border-t-amber-500">
		  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><CreditCard className="w-3 h-3 text-amber-500"/> Payroll Burn</div>
		  <div className="text-2xl font-black text-slate-900 dark:text-white">${metrics.payrollExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
		</div>

		<div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-t-4 border-t-red-500">
		  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3 text-red-500"/> Operating Exp.</div>
		  <div className="text-2xl font-black text-slate-900 dark:text-white">${metrics.operatingExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
		</div>

		<div className={`bg-slate-900 dark:bg-slate-50 p-5 rounded-xl shadow-md border-t-4 ${netProfit >= 0 ? 'border-t-emerald-500' : 'border-t-red-500'}`}>
		  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Net Income (P&L)</div>
		  <div className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-400 dark:text-emerald-600' : 'text-red-400 dark:text-red-600'}`}>
			${netProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}
		  </div>
		</div>
	  </div>

	  {/* DASHBOARD GRID */}
	  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
		
		{/* LEFT COLUMN: Data Entry & Category Breakdown */}
		<div className="lg:col-span-1 space-y-6">
		  
		  {/* Action: Log Transaction */}
		  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
			<h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
			  <PlusCircle className="w-4 h-4 text-emerald-600"/> Log Transaction
			</h2>
			<form onSubmit={handleRegisterTransaction} className="space-y-3">
			  <div className="grid grid-cols-2 gap-2">
				<div>
				  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Type</label>
				  <select value={transForm.type} onChange={e=>setTransForm({...transForm, type: e.target.value})} className="w-full border dark:border-slate-800 p-2 rounded-lg text-sm font-bold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
					<option value="expense">Expense</option>
					<option value="income">Income</option>
				  </select>
				</div>
				<div>
				  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Amount ($)</label>
				  <input required type="number" step="0.01" value={transForm.amount} onChange={e=>setTransForm({...transForm, amount: e.target.value})} className="w-full border dark:border-slate-800 p-2 rounded-lg text-sm font-bold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"/>
				</div>
			  </div>
			  <div className="flex gap-2">
				<div className="flex-1">
				  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description</label>
				  <input required type="text" value={transForm.description} onChange={e=>setTransForm({...transForm, description: e.target.value})} placeholder="e.g. Server Hosting" className="w-full border dark:border-slate-800 p-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"/>
				</div>
				<div className="w-1/3">
				  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
				  <input required type="text" value={transForm.category} onChange={e=>setTransForm({...transForm, category: e.target.value})} placeholder="IT" className="w-full border dark:border-slate-800 p-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"/>
				</div>
			  </div>
			  <button type="submit" className="w-full bg-slate-800 hover:bg-black text-white font-bold py-2.5 rounded-lg transition text-xs uppercase tracking-widest mt-2">Post to Ledger</button>
			</form>
		  </div>

		  {/* Budget Breakdown */}
		  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
			<h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
			  <PieChart className="w-4 h-4 text-blue-600"/> Expense Burn by Category
			</h2>
			<div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
			  {Object.keys(expensesByCategory).length === 0 ? (
				<div className="text-xs text-slate-400 text-center py-4">No expenses logged.</div>
			  ) : Object.entries(expensesByCategory)
				  .sort((a, b) => b[1] - a[1]) // Sort highest to lowest
				  .map(([category, amount]) => (
				<div key={category}>
				  <div className="flex justify-between text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
					<span className="uppercase">{category}</span>
					<span>${amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
				  </div>
				  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
					<div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min((amount / totalExpenses) * 100, 100)}%` }}></div>
				  </div>
				</div>
			  ))}
			</div>
		  </div>
		  
		</div>

		{/* RIGHT COLUMN: The Master Ledger & Assets */}
		<div className="lg:col-span-2 space-y-6">
		  
		  {/* Unified Transactions Ledger */}
		  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[400px]">
			<div className="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
			  <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
				<ArrowRightLeft className="w-4 h-4 text-slate-500"/> General Ledger
			  </h2>
			  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{transactions.length} Records</span>
			</div>
			
			<div className="overflow-y-auto flex-1 p-2 space-y-1">
			  {transactions.length === 0 ? (
				<div className="text-center p-8 text-slate-500 text-sm">Ledger is clean. No transactions recorded.</div>
			  ) : transactions.map(t => (
				<div key={t.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 border-b border-slate-100 dark:border-slate-800/50 transition last:border-0">
				  <div className="flex items-center gap-3">
					<div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
					  {t.type === 'income' ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
					</div>
					<div>
					  <div className="text-sm font-bold text-slate-900 dark:text-white">{t.description}</div>
					  <div className="flex gap-2 items-center mt-0.5">
						<span className="text-[9px] font-black text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{t.category}</span>
						<span className="text-[10px] text-slate-400 font-mono">{new Date(t.transaction_date).toLocaleString()}</span>
					  </div>
					</div>
				  </div>
				  <div className={`font-mono font-black text-base ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
					{t.type === 'income' ? '+' : '-'}${parseFloat(t.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
				  </div>
				</div>
			  ))}
			</div>
		  </div>

		  {/* Enterprise Asset Management */}
		  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
			<div className="flex justify-between items-end mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
			  <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
				<PackageOpen className="w-4 h-4 text-purple-600"/> Capitalized Assets Vault
			  </h2>
			  <div className="text-right">
				<div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Valuation</div>
				<div className="text-lg font-black text-purple-600 dark:text-purple-400">${metrics.assetValue.toLocaleString()}</div>
			  </div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			  {/* Asset Form */}
			  <form onSubmit={handleRegisterAsset} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
				<div>
				  <input required type="text" value={assetForm.name} onChange={e=>setAssetForm({...assetForm, name: e.target.value})} placeholder="Asset Name (e.g. MRI Scanner)" className="w-full border dark:border-slate-800 p-2 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white"/>
				</div>
				<div className="flex gap-2">
				  <input required type="text" value={assetForm.category} onChange={e=>setAssetForm({...assetForm, category: e.target.value})} placeholder="Category" className="w-1/2 border dark:border-slate-800 p-2 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"/>
				  <input required type="number" step="0.01" value={assetForm.value} onChange={e=>setAssetForm({...assetForm, value: e.target.value})} placeholder="Value ($)" className="w-1/2 border dark:border-slate-800 p-2 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"/>
				</div>
				<button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition text-xs uppercase tracking-widest">Capitalize Asset</button>
			  </form>

			  {/* Asset List */}
			  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
				{assets.length === 0 ? <div className="text-xs text-slate-400 text-center py-4">No assets registered.</div> : assets.map(asset => (
				  <div key={asset.id} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
					<div className="overflow-hidden w-2/3">
					  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{asset.asset_name}</div>
					  <div className="text-[9px] text-slate-500 uppercase font-black tracking-wider mt-0.5">{asset.category}</div>
					</div>
					<div className="font-mono font-black text-sm text-purple-600 dark:text-purple-400">${parseFloat(asset.purchase_value).toLocaleString()}</div>
				  </div>
				))}
			  </div>
			</div>
		  </div>

		</div>
	  </div>
	</div>
  );
}