import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { 
  TrendingUp, TrendingDown, Building, PackageOpen, 
  PlusCircle, CreditCard, Activity, PieChart, ArrowRightLeft, RefreshCcw 
} from 'lucide-react';

export default function FinanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [metrics, setMetrics] = useState({ 
	revenue: 0, 
	operatingExpenses: 0, 
	payrollExpenses: 0, 
	assetValue: 0 
  });
  
  const [transactions, setTransactions] = useState([]);
  const [assets, setAssets] = useState([]);
  const [expensesByCategory, setExpensesByCategory] = useState({});
  
  
  const [assetForm, setAssetForm] = useState({ name: '', category: 'Medical Equipment', value: '' });
  const [transForm, setTransForm] = useState({ type: 'expense', category: 'General', amount: '', description: '' });

const fetchFinanceData = async (isManual = false) => {
	  if (isManual) setIsRefreshing(true);
	  else setLoading(true);
  
	  // 1. Fetch Attendance JOINED with Employee Records to get rates
	  const { data: attendanceData } = await supabase
		.from('attendance')
		.select(`
		  hours_worked,
		  staff_id,
		  employee_records(hourly_rate),
		  profiles(full_name)
		`);
  
	  // Calculate dynamic payroll based on hours worked
	  let payrollExp = 0;
	  if (attendanceData) {
		attendanceData.forEach(entry => {
		  const rate = entry.employee_records?.hourly_rate || 0;
		  const hours = entry.hours_worked || 0;
		  payrollExp += (rate * hours);
		});
	  }
  
	  // 2. Fetch Transactions (Existing logic...)
	  const { data: transData } = await supabase.from('tickets').select('*');
	  let opExp = 0;
	  transData?.forEach(t => { if (t.type === 'expense') opExp += parseFloat(t.amount); });
  
	  // 3. Clinical Revenue (Existing logic...)
	  const { data: tickets } = await supabase.from('tickets').select('total_bill');
	  const revenue = tickets ? tickets.reduce((sum, t) => sum + (parseFloat(t.total_bill) || 0), 0) : 0;
  
	  setMetrics({ 
		revenue: revenue, 
		operatingExpenses: opExp, 
		payrollExpenses: payrollExp,
		assetValue: 0 
	  });
	  
	  setLoading(false);
	  setIsRefreshing(false);
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
	<div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans">
	  
	  {/* HEADER SECTION */}
	  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Financial Ledger</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
			 Corporate Treasury
		  </h1>
		  <p className="text-sm text-slate-500 font-medium mt-1">Cross-departmental P&L, payroll bleed, and asset tracking.</p>
		</div>
		<button 
		  onClick={() => fetchFinanceData(true)} 
		  disabled={loading || isRefreshing}
		  className="group flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-50"
		>
		  <RefreshCcw className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
		  Audit Ledger
		</button>
	  </div>

	  {loading ? (
		<div className="flex flex-col items-center justify-center h-64 gap-4">
		  <Activity className="w-10 h-10 text-emerald-500/50 animate-bounce" />
		  <p className="text-sm font-medium text-slate-500 animate-pulse">Compiling financial records...</p>
		</div>
	  ) : (
		<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
		  
		  {/* KPI METRICS ROW */}
		  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
			
			<div className="relative overflow-hidden bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm backdrop-blur-xl group hover:shadow-lg transition-all duration-300">
			  <div className="absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
			  <div className="relative z-10">
				<div className="flex items-center gap-2 mb-4">
				  <div className="bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-lg"><TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400"/></div>
				  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Revenue</div>
				</div>
				<div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">${metrics.revenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
			  </div>
			</div>

			<div className="relative overflow-hidden bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-amber-100 dark:border-amber-900/30 shadow-sm backdrop-blur-xl group hover:shadow-lg transition-all duration-300">
			  <div className="absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
			  <div className="relative z-10">
				<div className="flex items-center gap-2 mb-4">
				  <div className="bg-amber-50 dark:bg-amber-900/30 p-2 rounded-lg"><CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400"/></div>
				  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payroll Bleed</div>
				</div>
				<div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">${metrics.payrollExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
			  </div>
			</div>

			<div className="relative overflow-hidden bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-red-100 dark:border-red-900/30 shadow-sm backdrop-blur-xl group hover:shadow-lg transition-all duration-300">
			  <div className="absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
			  <div className="relative z-10">
				<div className="flex items-center gap-2 mb-4">
				  <div className="bg-red-50 dark:bg-red-900/30 p-2 rounded-lg"><TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400"/></div>
				  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operating Exp</div>
				</div>
				<div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">${metrics.operatingExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
			  </div>
			</div>

			<div className={`relative overflow-hidden p-6 rounded-3xl shadow-lg backdrop-blur-xl transition-all duration-300 ${netProfit >= 0 ? 'bg-slate-900 dark:bg-black border border-emerald-500/30' : 'bg-red-950 border border-red-500/30'}`}>
			  <div className={`absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br to-transparent rounded-full blur-2xl opacity-50 ${netProfit >= 0 ? 'from-emerald-500/40' : 'from-red-500/40'}`}></div>
			  <div className="relative z-10">
				<div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Net Income (P&L)</div>
				<div className={`text-3xl font-black tracking-tighter ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
				  ${netProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}
				</div>
			  </div>
			</div>
		  </div>

		  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
			
			{/* LEFT COLUMN */}
			<div className="lg:col-span-1 space-y-6 md:space-y-8">
			  
			  {/* BUDGET BURN CHART */}
			  <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-md p-6">
				<h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
				  <PieChart className="w-4 h-4 text-blue-500"/> Capital Burn by Category
				</h2>
				<div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
				  {Object.keys(expensesByCategory).length === 0 ? (
					<div className="text-xs text-slate-400 text-center py-8">No liabilities recorded.</div>
				  ) : Object.entries(expensesByCategory)
					  .sort((a, b) => b[1] - a[1]) 
					  .map(([category, amount]) => (
					<div key={category} className="group">
					  <div className="flex justify-between text-[11px] font-black mb-1.5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
						<span className="uppercase tracking-wider">{category}</span>
						<span>${amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
					  </div>
					  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
						<div className="bg-gradient-to-r from-blue-500 to-indigo-400 h-full rounded-full" style={{ width: `${Math.min((amount / totalExpenses) * 100, 100)}%` }}></div>
					  </div>
					</div>
				  ))}
				</div>
			  </div>

			  {/* LOG TRANSACTION */}
			  <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-md p-6">
				<h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-5">
				  <PlusCircle className="w-4 h-4 text-emerald-500"/> Log Transaction
				</h2>
				<form onSubmit={handleRegisterTransaction} className="space-y-4">
				  <div className="grid grid-cols-2 gap-3">
					<div className="space-y-1">
					  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
					  <select value={transForm.type} onChange={e=>setTransForm({...transForm, type: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 p-2.5 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-900 dark:text-white">
						<option value="expense">Liability</option>
						<option value="income">Asset/Revenue</option>
					  </select>
					</div>
					<div className="space-y-1">
					  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount ($)</label>
					  <input required type="number" step="0.01" value={transForm.amount} onChange={e=>setTransForm({...transForm, amount: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 p-2.5 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-900 dark:text-white" placeholder="0.00"/>
					</div>
				  </div>
				  <div className="grid grid-cols-3 gap-3">
					<div className="col-span-2 space-y-1">
					  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Memo</label>
					  <input required type="text" value={transForm.description} onChange={e=>setTransForm({...transForm, description: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-900 dark:text-white" placeholder="e.g. Server Hosting"/>
					</div>
					<div className="col-span-1 space-y-1">
					  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
					  <input required type="text" value={transForm.category} onChange={e=>setTransForm({...transForm, category: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-900 dark:text-white" placeholder="IT"/>
					</div>
				  </div>
				  <button type="submit" className="w-full bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold py-3 rounded-xl transition-all active:scale-[0.98] text-xs uppercase tracking-widest mt-2 shadow-md">Post to Ledger</button>
				</form>
			  </div>
			</div>

			{/* RIGHT COLUMN */}
			<div className="lg:col-span-2 space-y-6 md:space-y-8">
			  
			  {/* MASTER LEDGER */}
			  <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-md overflow-hidden flex flex-col h-[400px]">
				<div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
				  <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
					<ArrowRightLeft className="w-4 h-4 text-slate-500"/> General Ledger
				  </h2>
				  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{transactions.length} Records</span>
				</div>
				
				<div className="overflow-y-auto flex-1 p-3 space-y-2">
				  {transactions.length === 0 ? (
					<div className="h-full flex flex-col justify-center items-center text-center p-8 text-slate-400 text-sm">
					  <ArrowRightLeft className="w-8 h-8 opacity-20 mb-2"/>
					  Ledger is clean.
					</div>
				  ) : transactions.map(t => (
					<div key={t.id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl hover:shadow-md transition-all group">
					  <div className="flex items-center gap-4">
						<div className={`p-2.5 rounded-xl ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
						  {t.type === 'income' ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
						</div>
						<div>
						  <div className="text-sm font-bold text-slate-900 dark:text-white">{t.description}</div>
						  <div className="flex gap-2 items-center mt-1">
							<span className="text-[9px] font-black text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{t.category}</span>
							<span className="text-[10px] text-slate-400 font-mono">{new Date(t.transaction_date).toLocaleString()}</span>
						  </div>
						</div>
					  </div>
					  <div className={`font-mono font-black text-lg tracking-tight ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
						{t.type === 'income' ? '+' : '-'}${parseFloat(t.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
					  </div>
					</div>
				  ))}
				</div>
			  </div>

			  {/* ASSET MANAGEMENT */}
			  <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-md p-6">
				<div className="flex justify-between items-end mb-6 border-b border-slate-100 dark:border-slate-800/80 pb-4">
				  <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
					<PackageOpen className="w-5 h-5 text-purple-500"/> Capitalized Assets
				  </h2>
				  <div className="text-right">
					<div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Valuation</div>
					<div className="text-xl font-black text-purple-600 dark:text-purple-400 tracking-tighter">${metrics.assetValue.toLocaleString()}</div>
				  </div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				  <form onSubmit={handleRegisterAsset} className="bg-slate-50/50 dark:bg-slate-950/30 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
					<input required type="text" value={assetForm.name} onChange={e=>setAssetForm({...assetForm, name: e.target.value})} placeholder="Asset Name (e.g. MRI Scanner)" className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-900 dark:text-white placeholder:text-slate-400"/>
					<div className="flex gap-3">
					  <input required type="text" value={assetForm.category} onChange={e=>setAssetForm({...assetForm, category: e.target.value})} placeholder="Category" className="w-1/2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-900 dark:text-white placeholder:text-slate-400"/>
					  <input required type="number" step="0.01" value={assetForm.value} onChange={e=>setAssetForm({...assetForm, value: e.target.value})} placeholder="Value ($)" className="w-1/2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-900 dark:text-white placeholder:text-slate-400"/>
					</div>
					<button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98] text-xs uppercase tracking-widest shadow-md">Capitalize Asset</button>
				  </form>

				  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
					{assets.length === 0 ? <div className="text-xs text-slate-400 text-center py-8">No assets registered.</div> : assets.map(asset => (
					  <div key={asset.id} className="flex justify-between items-center p-4 bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl hover:bg-white dark:hover:bg-slate-900 transition-colors">
						<div className="overflow-hidden w-2/3">
						  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{asset.asset_name}</div>
						  <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-0.5">{asset.category}</div>
						</div>
						<div className="font-mono font-black text-base tracking-tight text-purple-600 dark:text-purple-400">${parseFloat(asset.purchase_value).toLocaleString()}</div>
					  </div>
					))}
				  </div>
				</div>
			  </div>

			</div>
		  </div>
		</div>
	  )}
	</div>
  );
}