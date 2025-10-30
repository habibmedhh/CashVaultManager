import { useState } from "react";
import IntegratedCashTable from "../IntegratedCashTable";

export default function IntegratedCashTableExample() {
  const [items, setItems] = useState([
    { value: 200, caisseAmount: 200, coffreAmount: 0, color: "#3B82F6", icon: "💵", type: "billet" as const },
    { value: 100, caisseAmount: 200, coffreAmount: 100, color: "#92400E", icon: "💵", type: "billet" as const },
    { value: 50, caisseAmount: 0, coffreAmount: 0, color: "#059669", icon: "💵", type: "billet" as const },
    { value: 20, caisseAmount: 20, coffreAmount: 0, color: "#7C3AED", icon: "💵", type: "billet" as const },
    { value: 10, caisseAmount: 0, coffreAmount: 0, color: "#DC2626", icon: "💵", type: "billet" as const },
    { value: 5, caisseAmount: 0, coffreAmount: 0, color: "#EA580C", icon: "💵", type: "billet" as const },
    { value: 2, caisseAmount: 2, coffreAmount: 0, color: "#64748B", icon: "🪙", type: "piece" as const },
    { value: 1, caisseAmount: 0, coffreAmount: 0, color: "#71717A", icon: "🪙", type: "piece" as const },
    { value: 0.5, caisseAmount: 0, coffreAmount: 0, color: "#A8A29E", icon: "🪙", type: "piece" as const },
    { value: 0.2, caisseAmount: 0.2, coffreAmount: 0.6, color: "#D4D4D8", icon: "🪙", type: "piece" as const },
    { value: 0.1, caisseAmount: 0.3, coffreAmount: 0, color: "#E5E5E5", icon: "🪙", type: "piece" as const },
  ]);

  const handleItemChange = (
    index: number,
    field: "caisseAmount" | "coffreAmount",
    value: number
  ) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  return (
    <div className="p-4 max-w-md">
      <IntegratedCashTable items={items} onItemChange={handleItemChange} />
    </div>
  );
}
