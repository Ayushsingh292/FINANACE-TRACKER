"use client";

import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import MonthlyBarChart from "../components/MonthlyBarChart";
import CategoryPieChart from "../components/CategoryPieChart";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";


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
      .then((data) => {
        setTransactions(data);
        setLoading(false);

        const monthlyTotals = data.reduce((acc: Record<string, number>, txn: Transaction) => {
          const month = new Date(txn.date).toLocaleString("default", { month: "short", year: "numeric" });
          acc[month] = (acc[month] || 0) + txn.amount;
          return acc;
        }, {} as Record<string, number>);

        const monthlyChartData: ChartData[] = Object.entries(monthlyTotals).map(([month, total]) => ({
          month,
          total: total as number,
        }));
        setChartData(monthlyChartData);

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
    const overspentCategories = categoryChartData.filter(
      (cat) => cat.total > cat.budget && cat.budget !== 0
    );

    if (overspentCategories.length > 0) {
      alert(
        `Budget exceeded in: ${overspentCategories.map((c) => c.category).join(", ")}`
      );
    }
  }, [categoryChartData]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/transactions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setTransactions((prev) => prev.filter((txn) => txn._id !== id));
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
        headers: {
          "Content-Type": "application/json",
        },
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

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">All Transactions</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 border rounded">
          <h3>Total Expenses</h3>
          <p>₹{transactions.reduce((acc, txn) => acc + txn.amount, 0)}</p>
        </div>
        <div className="p-4 border rounded">
          <h3>Category Breakdown</h3>
          {categoryChartData.length > 0 && <CategoryPieChart data={categoryChartData} />}
          <div className="mt-4 space-y-2">
            {categoryChartData.map((cat) => (
              <div key={cat.category} className="p-2 border rounded bg-gray-50">
                <p className="font-semibold">{cat.category}</p>
                <p>Spent: ₹{cat.total}</p>
                <p>Budget: ₹{cat.budget}</p>
                <p>Remaining: ₹{cat.budget - cat.total}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border rounded">
          <h3>Most Recent Transactions</h3>
          <ul>
            {transactions.slice(0, 5).map((txn) => (
              <li key={txn._id}>
                {txn.description} - ₹{txn.amount} ({txn.date})
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <Label>Set Monthly Budget</Label>
          <input
            type="number"
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(Number(e.target.value))}
            placeholder="Enter monthly budget"
            className="input"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Amount</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input"
            placeholder="Enter amount"
          />
        </div>

        <div>
          <Label>Description</Label>
          <Input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
            placeholder="Enter description"
          />
        </div>

        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <Label>Category</Label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
          >
            <option value="">Select category</option>
            <option value="Food">Food</option>
            <option value="Rent">Rent</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Transport">Transport</option>
            <option value="Utilities">Utilities</option>
          </select>
        </div>

        <Button onClick={handleAddTransaction} variant="primary">
          Add Transaction
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <ul className="space-y-4 mt-6">
          {transactions.map((txn) => (
            <li key={txn._id} className="p-4 border rounded">
              <p>{txn.description}</p>
              <p>{txn.date}</p>
              <p>₹{txn.amount}</p>
              <p>{txn.category}</p>
              <Button onClick={() => handleDelete(txn._id)} variant="destructive">
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}

      {chartData.length > 0 && <MonthlyBarChart data={chartData} />}
    </main>
  );
}
