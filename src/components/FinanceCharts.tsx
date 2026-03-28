import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

interface FinanceChartsProps {
  transactions: Transaction[];
}

export const FinanceCharts: React.FC<FinanceChartsProps> = ({ transactions }) => {
  // Process data for monthly bar chart
  const monthlyData = transactions.reduce((acc: any[], t) => {
    const date = new Date(t.date);
    const month = date.toLocaleString('pt-BR', { month: 'short' });
    const year = date.getFullYear();
    const key = `${month}/${year}`;
    
    let existing = acc.find(item => item.name === key);
    if (!existing) {
      existing = { name: key, income: 0, expense: 0 };
      acc.push(existing);
    }
    
    if (t.type === 'income') {
      existing.income += t.amount;
    } else {
      existing.expense += t.amount;
    }
    
    return acc;
  }, []).reverse().slice(0, 6); // Last 6 months

  // Process data for category pie chart (Income)
  const incomeByCategory = transactions
    .filter(t => t.type === 'income')
    .reduce((acc: any[], t) => {
      let existing = acc.find(item => item.name === t.category);
      if (!existing) {
        existing = { name: t.category, value: 0 };
        acc.push(existing);
      }
      existing.value += t.amount;
      return acc;
    }, []);

  // Process data for category pie chart (Expense)
  const expenseByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: any[], t) => {
      let existing = acc.find(item => item.name === t.category);
      if (!existing) {
        existing = { name: t.category, value: 0 };
        acc.push(existing);
      }
      existing.value += t.amount;
      return acc;
    }, []);

  const COLORS = ['#8b5cf6', '#a78bfa', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Fluxo de Caixa (Mensal)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => `R$ ${value}`}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
              <Bar name="Entradas" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar name="Saídas" dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Distribuição por Categoria</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-[250px]">
            <p className="text-center text-sm font-medium text-slate-500 mb-2">Entradas</p>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomeByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {incomeByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[250px]">
            <p className="text-center text-sm font-medium text-slate-500 mb-2">Saídas</p>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
