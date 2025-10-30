import { useState } from "react";
import CashCountTable from "../CashCountTable";

export default function CashCountTableExample() {
  const [bills, setBills] = useState([
    { value: 200, quantity: 1 },
    { value: 100, quantity: 0 },
    { value: 50, quantity: 0 },
    { value: 20, quantity: 1 },
    { value: 10, quantity: 0 },
    { value: 5, quantity: 0 },
  ]);

  const handleQuantityChange = (index: number, quantity: number) => {
    const newBills = [...bills];
    newBills[index].quantity = quantity;
    setBills(newBills);
  };

  return (
    <div className="p-4 max-w-md">
      <CashCountTable
        title="Billets"
        denominations={bills}
        onQuantityChange={handleQuantityChange}
        dataTestIdPrefix="bills"
      />
    </div>
  );
}
