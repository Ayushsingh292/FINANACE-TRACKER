'use client';

import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import MonthlyBarChart from "../components/MonthlyBarChart";
import CategoryPieChart from "../components/CategoryPieChart";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { motion } from "framer-motion";
import { Utensils, Film, Plug } from "lucide-react";

interface Transaction {
  _id: string;
  amount: number;
  description: string;
  date: string;
  category: string;
}

interface ChartData {
  month: string;
  total: number;
}

interface CategoryChartData {
  category: string;
  total: number;
  budget: number;
}

const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case "Food":
      return <Utensils className="w-4 h-4 inline mr-1 text-red-500" />;
    case "Entertainment":
      return <Film className="w-4 h-4 inline mr-1 text-purple-500" />;
    case "Utilities":
      return <Plug className="w-4 h-4 inline mr-1 text-yellow-500" />;
    case "Rent":
      return <span className="inline mr-1 text-green-500">🏡</span>;
    case "Transport":
      return <span className="inline mr-1 text-blue-500">🚕</span>;
    default:
      return null;
  }
};

export default function Page() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [categoryChartData, setCategoryChartData] = useState<CategoryChartData[]>([]);
  const [category, setCategory] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);

  const categories = ["Food", "Rent", "Entertainment", "Transport", "Utilities"];

  const categoryBudgets: Record<string, number> = {
    Food: 5000,
    Rent: 15000,
    Entertainment: 3000,
    Transport: 2000,
    Utilities: 2500,
  };

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data: Transaction[]) => {
        setTransactions(data);
        setLoading(false);

        const monthlyTotals = data.reduce((acc: Record<string, number>, txn: Transaction) => {
          const month = new Date(txn.date).toLocaleString("default", { month: "short", year: "numeric" });
          acc[month] = (acc[month] || 0) + txn.amount;
          return acc;
        }, {});

        setChartData(Object.entries(monthlyTotals).map(([month, total]) => ({ month, total: total as number })));

        const budgetVsActual = data.reduce((acc: Record<string, number>, txn: Transaction) => {
          acc[txn.category] = (acc[txn.category] || 0) + txn.amount;
          return acc;
        }, {});

        const categoryChart: CategoryChartData[] = Object.entries(budgetVsActual).map(([category, total]) => ({
          category,
          total: total as number,
          budget: categoryBudgets[category] || 0,
        }));

        setCategoryChartData(categoryChart);
      });
  }, []);

  useEffect(() => {
    const overspent = categoryChartData.filter(cat => cat.total > cat.budget && cat.budget !== 0);
    if (overspent.length > 0) {
      alert(`Budget exceeded in: ${overspent.map(c => c.category).join(", ")}`);
    }
  }, [categoryChartData]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/transactions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setTransactions(prev => prev.filter(txn => txn._id !== id));
      } else {
        alert("Failed to delete the transaction.");
      }
    } catch (err) {
      console.error("Error deleting transaction:", err);
      alert("Server error while deleting the transaction.");
    }
  };

  const handleAddTransaction = async () => {
    if (!amount || !description || !date || !category) {
      alert("Please fill in all fields.");
      return;
    }

    const newTransaction = { amount: parseFloat(amount), description, date, category };

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTransaction),
      });

      if (res.ok) {
        alert("Transaction added successfully!");
        const updated = await fetch("/api/transactions").then((res) => res.json());
        setTransactions(updated);
        setAmount("");
        setDescription("");
        setDate("");
        setCategory("");
      } else {
        alert("Error adding transaction.");
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("An error occurred while submitting the transaction.");
    }
  };

  const totalExpenses = transactions.reduce((acc, txn) => acc + txn.amount, 0);

  return (
    <main className="p-6 min-h-screen bg-blue-50 text-gray-900">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-6">
        <h1 className="text-4xl font-bold mb-2 text-blue-600">💰 Personal Finance Visualizer</h1>
        <p className="text-gray-700">Track your spending, monitor budgets, and visualize financial habits.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <motion.div className="p-6 bg-white shadow-lg rounded-lg border" whileHover={{ scale: 1.02 }}>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-600">₹{totalExpenses}</p>
        </motion.div>

        <motion.div className="p-6 bg-white shadow-lg rounded-lg border" whileHover={{ scale: 1.02 }}>
          <h3 className="text-xl font-semibold text-green-700 mb-4">Category Breakdown</h3>
          {categoryChartData.length > 0 && <CategoryPieChart data={categoryChartData} />}
        </motion.div>

        <motion.div className="p-6 bg-white shadow-lg rounded-lg border" whileHover={{ scale: 1.02 }}>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Most Recent Transactions</h3>
          <ul className="text-sm text-gray-700">
            {transactions.slice(0, 5).map((txn: Transaction) => (
              <li key={txn._id} className="mb-1">
                <strong>{txn.description}</strong> - ₹{txn.amount} ({txn.date})
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {categoryChartData.map((cat) => (
          <motion.div
            key={cat.category}
            className="bg-gray-100 p-4 rounded-lg shadow border"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h4 className="font-semibold text-lg flex items-center gap-1 text-blue-700">
              <CategoryIcon category={cat.category} /> {cat.category}
            </h4>
            <p>Spent: ₹{cat.total}</p>
            <p>Budget: ₹{cat.budget}</p>
            <p className={cat.total > cat.budget ? "text-red-500" : "text-green-600"}>
              Remaining: ₹{cat.budget - cat.total}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mb-6">
        <Label>Set Monthly Budget</Label>
        <Input
          type="number"
          value={monthlyBudget}
          onChange={(e) => setMonthlyBudget(Number(e.target.value))}
          placeholder="Enter monthly budget"
          className="input mt-2 bg-blue-50 border border-blue-300 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div>
          <Label>Amount</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" className="bg-gray-50 border border-blue-300" />
        </div>
        <div>
          <Label>Description</Label>
          <Input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter description" className="bg-gray-50 border border-blue-300" />
        </div>
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-gray-50 border border-blue-300" />
        </div>
        <div>
          <Label>Category</Label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full bg-gray-50 border rounded px-2 py-1">
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {category && (
            <div className="flex items-center mt-2 text-sm text-gray-600">
              <CategoryIcon category={category} />
              <span>{category}</span>
            </div>
          )}
        </div>
      </div>

      <motion.div whileTap={{ scale: 0.95 }}>
        <Button onClick={handleAddTransaction} variant="default" className="mb-6 bg-blue-600 text-white hover:bg-blue-700">
          ➕ Add Transaction
        </Button>
      </motion.div>

      {loading ? (
        <p>Loading...</p>
      ) : transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <ul className="space-y-4">
          {transactions.map((txn: Transaction) => (
            <motion.li
              key={txn._id}
              className="p-4 bg-white border rounded shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{txn.description}</p>
                  <p>{txn.date}</p>
                  <p>₹{txn.amount}</p>
                  <p>{txn.category}</p>
                </div>
                <Button onClick={() => handleDelete(txn._id)} variant="destructive" className="bg-red-600 text-white">
                  Delete
                </Button>
              </div>
            </motion.li>
          ))}
        </ul>
      )}

      {chartData.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-10">
          <MonthlyBarChart data={chartData} />
        </motion.div>
      )}
    </main>
  );
}
