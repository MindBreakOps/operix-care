import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { 
  TrendingUp, TrendingDown, PackageOpen, PlusCircle, 
  CreditCard, Activity, PieChart, ArrowRightLeft, RefreshCcw 
} from 'lucide-react';

export default function FinanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [metrics, setMetrics] = useState({ 
	revenue: 0, operatingExpenses: 0, payrollExpenses: 0, assetValue: 0 
  });
  
  const [transactions, setTransactions] = useState([]);
  const [assets, setAssets] = useState([]);
  const [expensesByCategory, setExpensesByCategory] = useState({});
  
  const [assetForm, setAssetForm] = useState({ name: '', category: 'Medical Equipment', value: '' });
  const [transForm, setTransForm] = useState({ type: 'expense', category: 'General', amount: '', description: '' });

  const fetchFinanceData = async (isManual = false) => {
	if (isManual) setIsRefreshing(true);
	else setLoading(true);

	try {
	  // 1. Clinical Revenue (Safe Fetch)
	  const { data: tickets } = await supabase.from('tickets').select('total_bill');
	  const ticketRev = tickets ? tickets.reduce((sum, t) => sum + (parseFloat(t.total_bill) || 0), 0) : 0;

	  // 2. Attendance & Payroll Join
	  // This assumes employee_records has the 'hourly_rate' column
	  const { data: attendanceData } = await supabase.from('attendance').select(`
		hours_worked,
		employee_records (hourly_rate)
	  `);
	  
	  let payrollExp = 0;
	  if (attendanceData) {
		attendanceData.forEach(entry => {
		  const rate = entry.employee_records?.hourly_rate || 0;
		  const hours = entry.hours_worked || 0;
		  payrollExp += (rate * hours);
		});
	  }

	  // 3. Transactions (Safe Fetch)
	  const { data: transData } = await supabase.from('transactions').select('*').order('transaction_date', { ascending: false });
	  let manualRev = 0; let opExp = 0; let categoryMap = {};

	  if (transData) {
		transData.forEach(t => {
		  const amt = parseFloat(t.amount);
		  if (t.type === 'income') manualRev += amt;
		  else if (t.type === 'expense') {
			opExp += amt;
			categoryMap[t.category] = (categoryMap[t.category] || 0) + amt;
		  }
		});
	  }

	  // 4. Capital Assets (Safe Fetch)
	  const { data: assetData } = await supabase.from('assets').select('*').order('purchase_date', { ascending: false });
	  const totalAssetVal = assetData ? assetData.reduce((sum, a) => sum + parseFloat(a.purchase_value), 0) : 0;

	  // Set State
	  setMetrics({ 
		revenue: ticketRev + manualRev, 
		operatingExpenses: opExp, 
		payrollExpenses: payrollExp, 
		assetValue: totalAssetVal 
	  });
	  
	  setTransactions(transData || []);
	  setAssets(assetData || []);
	  setExpensesByCategory(categoryMap);

	} catch (err) {
	  console.error("Finance Error: ", err);
	} finally {
	  setLoading(false);
	  setIsRefreshing(false);
	}
  };

  useEffect(() => { fetchFinanceData(); }, []);

  const handleRegisterAsset = async (e) => {
	e.preventDefault();
	setLoading(true);
	await supabase.from('assets').insert([{ 
	  asset_name: assetForm.name, category: assetForm.category, purchase_value: parseFloat(assetForm.value) 
	}]);
	setAssetForm({ name: '', category: 'Medical Equipment', value: '' });
	fetchFinanceData();
  };

  const handleRegisterTransaction = async (e) => {
	e.preventDefault();
	setLoading(true);
	await supabase.from('transactions').insert([{ 
	  type: transForm.type, category: transForm.category, amount: parseFloat(transForm.amount), description: transForm.description 
	}]);
	setTransForm({ type: 'expense', category: 'General', amount: '', description: '' });
	fetchFinanceData();
  };

  const totalExpenses = metrics.operatingExpenses + metrics.payrollExpenses;
  const netProfit = metrics.revenue - totalExpenses;

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans min-h-screen overflow-hidden">
	  
	  <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Financial Ledger</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Corporate Treasury</h1>
		</div>
		<button onClick={() => fetchFinanceData(true)} disabled={loading || isRefreshing} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition-all hover:shadow-md disabled:opacity-50">
		  <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} /> Audit Ledger
		</button>
	  </div>

	  {loading ? (
		<div className="flex flex-col items-center justify-center h-64 gap-4">
		  <Activity className="w-10 h-10 text-emerald-500/50 animate-bounce" />
		  <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">Compiling Records...</p>
		</div>
	  ) : (
		<div className="space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
		  
		  {/* KPI ROW */}
		  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
			<div className="bg-white/80 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl">
			  <div className="flex items-center gap-2 mb-4"><div className="bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-lg"><TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400"/></div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Revenue</div></div>
			  <div className="text-3xl font-black text-slate-900 dark:text-white">${metrics.revenue.toLocaleString()}</div>
			</div>

			<div className="bg-white/80 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl">
			  <div className="flex items-center gap-2 mb-4"><div className="bg-amber-50 dark:bg-amber-900/30 p-2 rounded-lg"><CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400"/></div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payroll Bleed</div></div>
			  <div className="text-3xl font-black text-slate-900 dark:text-white">${metrics.payrollExpenses.toLocaleString()}</div>
			</div>

			<div className="bg-white/80 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl">
			  <div className="flex items-center gap-2 mb-4"><div className="bg-red-50 dark:bg-red-900/30 p-2 rounded-lg"><TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400"/></div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operating Exp</div></div>
			  <div className="text-3xl font-black text-slate-900 dark:text-white">${metrics.operatingExpenses.toLocaleString()}</div>
			</div>

			<div className={`p-6 rounded-3xl shadow-lg backdrop-blur-xl border ${netProfit >= 0 ? 'bg-slate-900 dark:bg-black border-emerald-500/30' : 'bg-red-950 border-red-500/30'}`}>
			  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Net Income (P&L)</div>
			  <div className={`text-3xl font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>${netProfit.toLocaleString()}</div>
			</div>
		  </div>

		  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
			
			<div className="lg:col-span-1 space-y-6 md:space-y-8">
			  {/* LOG TRANSACTION */}
			  <div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl p-6">
				<h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-5"><PlusCircle className="w-4 h-4 text-emerald-500"/> Log Transaction</h2>
				<form onSubmit={handleRegisterTransaction} className="space-y-4">
				  <div className="grid grid-cols-2 gap-3">
					<div>
					  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</label>
					  <select value={transForm.type} onChange={e=>setTransForm({...transForm, type: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-sm font-bold dark:text-white">
						<option value="expense">Liability</option><option value="income">Revenue</option>
					  </select>
					</div>
					<div>
					  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount ($)</label>
					  <input required type="number" step="0.01" value={transForm.amount} onChange={e=>setTransForm({...transForm, amount: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-sm font-bold dark:text-white" placeholder="0.00"/>
					</div>
				  </div>
				  <input required type="text" value={transForm.description} onChange={e=>setTransForm({...transForm, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-sm dark:text-white" placeholder="Memo (e.g. Server Hosting)"/>
				  <input required type="text" value={transForm.category} onChange={e=>setTransForm({...transForm, category: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-sm dark:text-white" placeholder="Category (e.g. IT)"/>
				  <button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-xl active:scale-95 uppercase text-[10px] tracking-widest shadow-md">Post to Ledger</button>
				</form>
			  </div>
			</div>

			<div className="lg:col-span-2 space-y-6 md:space-y-8">
			  {/* MASTER LEDGER */}
			  <div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl overflow-hidden flex flex-col h-[400px]">
				<div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
				  <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-slate-500"/> General Ledger</h2>
				  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{transactions.length} Records</span>
				</div>
				<div className="overflow-y-auto flex-1 p-3 space-y-2">
				  {transactions.map(t => (
					<div key={t.id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:shadow-md transition-all">
					  <div className="flex items-center gap-4">
						<div className={`p-2.5 rounded-xl ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-red-50 text-red-600 dark:bg-red-500/10'}`}>
						  {t.type === 'income' ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
						</div>
						<div>
						  <div className="text-sm font-bold text-slate-900 dark:text-white">{t.description}</div>
						  <div className="flex gap-2 items-center mt-1">
							<span className="text-[9px] font-black text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{t.category}</span>
							<span className="text-[10px] text-slate-400 font-mono">{new Date(t.transaction_date).toLocaleDateString()}</span>
						  </div>
						</div>
					  </div>
					  <div className={`font-mono font-black text-lg ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
						{t.type === 'income' ? '+' : '-'}${parseFloat(t.amount).toLocaleString()}
					  </div>
					</div>
				  ))}
				</div>
			  </div>
			</div>

		  </div>
		</div>
	  )}
	</div>
  );
}