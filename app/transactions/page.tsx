"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"; // Assuming you have a Button component in your UI library
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'; // Import Recharts components

interface Transaction {
  _id: string;
  amount: number;
  description: string;
  date: string;
}

export default function Page() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]); // State for chart data

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data);
        setLoading(false);

        // Calculate monthly totals
        const monthlyTotals = data.reduce((acc: Record<string, number>, txn: Transaction) => {
          const month = new Date(txn.date).toLocaleString("default", { month: "short", year: "numeric" });
          acc[month] = (acc[month] || 0) + txn.amount;
          return acc;
        }, {} as Record<string, number>);

        const chartData = Object.entries(monthlyTotals).map(([month, total]) => ({
          month,
          total,
        }));

        setChartData(chartData); // Set the chart data state
      });
  }, []);

  // Handle the delete operation
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
        // Remove the deleted transaction from the local state
        setTransactions((prev) => prev.filter((txn) => txn._id !== id));
      } else {
        alert("Failed to delete the transaction.");
      }
    } catch (err) {
      console.error("Error deleting transaction:", err);
      alert("Server error while deleting the transaction.");
    }
  };

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">All Transactions</h1>

      {loading ? (
        <p>Loading...</p>
      ) : transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <ul className="space-y-4">
          {transactions.map((txn) => (
            <li key={txn._id} className="p-4 border rounded">
              <p>{txn.description}</p>
              <p>{txn.date}</p>
              <p>₹{txn.amount}</p>
              {/* Add Delete Button */}
              <Button onClick={() => handleDelete(txn._id)} variant="destructive">
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Bar Chart for Monthly Expenses */}
      {chartData.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold">Monthly Expenses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </main>
  );
}
