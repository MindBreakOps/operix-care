import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../config/supabaseClient';
import { 
  TrendingUp, TrendingDown, PlusCircle, CreditCard, 
  Activity, ArrowRightLeft, RefreshCcw, DollarSign, Wallet
} from 'lucide-react';

// Hardcoded exchange rates relative to USD for real-time conversion
const EXCHANGE_RATES = {
  USD: 1,
  SAR: 3.75,
  SDG: 1500 // Approximate, adjust as needed
};

export default function FinanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState('SAR');
  
  const [rawMetrics, setRawMetrics] = useState({ revenue: 0, operatingExpenses: 0, payrollExpenses: 0 });
  const [transactions, setTransactions] = useState([]);
  
  const [transForm, setTransForm] = useState({ type: 'expense', category: 'General', amount: '', description: '', currency: 'SAR' });

  const fetchFinanceData = async (isManual = false) => {
	if (isManual) setIsRefreshing(true);
	else setLoading(true);

	try {
	  // 1. Clinical Revenue (Assume recorded in SAR base for this example)
	  const { data: tickets } = await supabase.from('tickets').select('total_bill, currency');
	  let ticketRev = 0;
	  if (tickets) {
		tickets.forEach(t => {
		  const amt = parseFloat(t.total_bill) || 0;
		  const rate = EXCHANGE_RATES[t.currency || 'SAR'] || 1;
		  ticketRev += (amt / rate); // Convert to base USD first
		});
	  }

	  // 2. Real Payroll (Base + Allowances from new HR schema)
	  const { data: employees } = await supabase.from('employee_records').select('base_salary, housing_allowance, transport_allowance, salary_currency');
	  let payrollExp = 0;
	  if (employees) {
		employees.forEach(emp => {
		  const gross = (parseFloat(emp.base_salary) || 0) + (parseFloat(emp.housing_allowance) || 0) + (parseFloat(emp.transport_allowance) || 0);
		  const rate = EXCHANGE_RATES[emp.salary_currency || 'SAR'] || 1;
		  payrollExp += (gross / rate); // Convert to base USD
		});
	  }

	  // 3. Transactions
	  const { data: transData } = await supabase.from('transactions').select('*').order('transaction_date', { ascending: false });
	  let manualRev = 0; let opExp = 0; 
	  
	  if (transData) {
		transData.forEach(t => {
		  const amt = parseFloat(t.amount) || 0;
		  // Assume old transactions without currency are SAR
		  const rate = EXCHANGE_RATES[t.currency || 'SAR'] || 1; 
		  const convertedAmt = amt / rate;

		  if (t.type === 'income') manualRev += convertedAmt;
		  else if (t.type === 'expense') opExp += convertedAmt;
		});
	  }

	  setRawMetrics({ 
		revenue: ticketRev + manualRev, 
		operatingExpenses: opExp, 
		payrollExpenses: payrollExp
	  });
	  
	  setTransactions(transData || []);

	} catch (err) {
	  console.error("Finance Error: ", err);
	} finally {
	  setLoading(false);
	  setIsRefreshing(false);
	}
  };

  useEffect(() => { fetchFinanceData(); }, []);

  const handleRegisterTransaction = async (e) => {
	e.preventDefault();
	setLoading(true);
	await supabase.from('transactions').insert([{ 
	  type: transForm.type, 
	  category: transForm.category, 
	  amount: parseFloat(transForm.amount), 
	  description: transForm.description,
	  currency: transForm.currency // Save the currency it was logged in
	}]);
	setTransForm({ type: 'expense', category: 'General', amount: '', description: '', currency: displayCurrency });
	fetchFinanceData();
  };

  // Convert raw USD metrics to the user's selected display currency
  const metrics = useMemo(() => {
	const rate = EXCHANGE_RATES[displayCurrency];
	return {
	  revenue: rawMetrics.revenue * rate,
	  operatingExpenses: rawMetrics.operatingExpenses * rate,
	  payrollExpenses: rawMetrics.payrollExpenses * rate,
	  netProfit: (rawMetrics.revenue - rawMetrics.operatingExpenses - rawMetrics.payrollExpenses) * rate
	};
  }, [rawMetrics, displayCurrency]);

  const formatCurrency = (val) => {
	return new Intl.NumberFormat('en-US', { style: 'currency', currency: displayCurrency }).format(val);
  };

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans min-h-screen overflow-hidden">
	  <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

	  {/* HEADER & CURRENCY TOGGLE */}
	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Financial Ledger</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Corporate Treasury</h1>
		</div>
		
		<div className="flex items-center gap-4 w-full md:w-auto">
		  <div className="bg-slate-200/50 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl flex border border-slate-300/50 dark:border-slate-700">
			{['SAR', 'USD', 'SDG'].map(cur => (
			  <button 
				key={cur}
				onClick={() => setDisplayCurrency(cur)}
				className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${displayCurrency === cur ? 'bg-white dark:bg-slate-800 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
			  >
				{cur}
			  </button>
			))}
		  </div>
		  <button onClick={() => fetchFinanceData(true)} disabled={loading || isRefreshing} className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition-all hover:shadow-md disabled:opacity-50">
			<RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
		  </button>
		</div>
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
			<div className="bg-white/80 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl hover:-translate-y-1 transition-transform">
			  <div className="flex items-center gap-2 mb-4"><div className="bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-lg"><TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400"/></div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Revenue</div></div>
			  <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white truncate">{formatCurrency(metrics.revenue)}</div>
			</div>

			<div className="bg-white/80 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl hover:-translate-y-1 transition-transform">
			  <div className="flex items-center gap-2 mb-4"><div className="bg-amber-50 dark:bg-amber-900/30 p-2 rounded-lg"><Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400"/></div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Payroll</div></div>
			  <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white truncate">{formatCurrency(metrics.payrollExpenses)}</div>
			</div>

			<div className="bg-white/80 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl hover:-translate-y-1 transition-transform">
			  <div className="flex items-center gap-2 mb-4"><div className="bg-red-50 dark:bg-red-900/30 p-2 rounded-lg"><TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400"/></div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operating Exp</div></div>
			  <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white truncate">{formatCurrency(metrics.operatingExpenses)}</div>
			</div>

			<div className={`p-6 rounded-3xl shadow-lg backdrop-blur-xl border hover:-translate-y-1 transition-transform ${metrics.netProfit >= 0 ? 'bg-slate-900 dark:bg-black border-emerald-500/30' : 'bg-red-950 border-red-500/30'}`}>
			  <div className="flex items-center gap-2 mb-4"><div className="bg-white/10 p-2 rounded-lg"><DollarSign className="w-4 h-4 text-white"/></div><div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Net Income (P&L)</div></div>
			  <div className={`text-2xl lg:text-3xl font-black truncate ${metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(metrics.netProfit)}</div>
			</div>
		  </div>

		  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
			
			{/* LOG TRANSACTION */}
			<div className="lg:col-span-1 space-y-6 md:space-y-8">
			  <div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl p-6">
				<h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800"><PlusCircle className="w-5 h-5 text-emerald-500"/> Log Transaction</h2>
				<form onSubmit={handleRegisterTransaction} className="space-y-5">
				  <div className="grid grid-cols-2 gap-3">
					<div>
					  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Type</label>
					  <select value={transForm.type} onChange={e=>setTransForm({...transForm, type: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50">
						<option value="expense">Liability / Exp</option><option value="income">Revenue</option>
					  </select>
					</div>
					<div>
					  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Currency</label>
					  <select value={transForm.currency} onChange={e=>setTransForm({...transForm, currency: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50">
						<option value="SAR">SAR</option><option value="USD">USD</option><option value="SDG">SDG</option>
					  </select>
					</div>
				  </div>
				  <div>
					<label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Amount</label>
					<input required type="number" step="0.01" value={transForm.amount} onChange={e=>setTransForm({...transForm, amount: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="0.00"/>
				  </div>
				  <div>
					<label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Category & Memo</label>
					<div className="space-y-2">
						<input required type="text" value={transForm.category} onChange={e=>setTransForm({...transForm, category: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Category (e.g. IT, Legal)"/>
						<input required type="text" value={transForm.description} onChange={e=>setTransForm({...transForm, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Memo Description"/>
					</div>
				  </div>
				  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20">POST TO LEDGER</button>
				</form>
			  </div>
			</div>

			{/* MASTER LEDGER */}
			<div className="lg:col-span-2 space-y-6 md:space-y-8">
			  <div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl overflow-hidden flex flex-col h-[600px]">
				<div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
				  <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-slate-500"/> Master Ledger</h2>
				  <span className="text-xs font-bold text-slate-500 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">{transactions.length} Records</span>
				</div>
				<div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar">
				  {transactions.map(t => {
					// Convert historical transactions to display currency
					const originalRate = EXCHANGE_RATES[t.currency || 'SAR'] || 1;
					const baseUsd = parseFloat(t.amount) / originalRate;
					const displayAmt = baseUsd * EXCHANGE_RATES[displayCurrency];

					return (
					<div key={t.id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl hover:shadow-md transition-all group">
					  <div className="flex items-center gap-4">
						<div className={`p-3 rounded-xl ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-red-50 text-red-600 dark:bg-red-500/10'}`}>
						  {t.type === 'income' ? <TrendingUp className="w-5 h-5"/> : <TrendingDown className="w-5 h-5"/>}
						</div>
						<div>
						  <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">{t.description}</div>
						  <div className="flex gap-2 items-center mt-1.5">
							<span className="text-[9px] font-black text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{t.category}</span>
							<span className="text-[10px] text-slate-400 font-mono flex items-center gap-1"><CreditCard className="w-3 h-3"/> Original: {t.currency || 'SAR'} {parseFloat(t.amount).toLocaleString()}</span>
						  </div>
						</div>
					  </div>
					  <div className="text-right">
						<div className={`font-mono font-black text-lg ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
							{t.type === 'income' ? '+' : '-'}{formatCurrency(displayAmt)}
						</div>
						<div className="text-[10px] text-slate-400 font-mono mt-1">{new Date(t.transaction_date).toLocaleDateString()}</div>
					  </div>
					</div>
				  )})}
				  {transactions.length === 0 && (
					  <div className="text-center py-20 text-slate-400 font-bold text-sm">No transactions logged.</div>
				  )}
				</div>
			  </div>
			</div>

		  </div>
		</div>
	  )}
	</div>
  );
}