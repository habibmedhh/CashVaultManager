import { useState } from "react";
import BalanceSection, { type Transaction } from "../BalanceSection";

export default function BalanceSectionExample() {
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: "1", type: "versement", label: "Versement banque", amount: 0 },
    { id: "2", type: "retrait", label: "Retrait STET", amount: 0 },
  ]);
  const [soldeDepart, setSoldeDepart] = useState(11366.75);

  const handleTransactionChange = (
    id: string,
    field: keyof Transaction,
    value: string | number
  ) => {
    setTransactions((trans) =>
      trans.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleAddTransaction = (type: "versement" | "retrait") => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type,
      label: "",
      amount: 0,
    };
    setTransactions([...transactions, newTransaction]);
  };

  const handleRemoveTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  return (
    <div className="p-4">
      <BalanceSection
        transactions={transactions}
        onTransactionChange={handleTransactionChange}
        onAddTransaction={handleAddTransaction}
        onRemoveTransaction={handleRemoveTransaction}
        soldeDepart={soldeDepart}
        onSoldeChange={setSoldeDepart}
        totalCaisse={3255.6}
        totalOperations={-6662.61}
      />
    </div>
  );
}
