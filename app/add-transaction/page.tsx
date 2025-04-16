import TransactionForm from "@/components/TransactionForm";

export default function Page() {
  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">Add Transaction</h1>
      <TransactionForm />
    </main>
  );
}
