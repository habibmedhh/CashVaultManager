import { useState } from "react";
import IntegratedCashTable from "../IntegratedCashTable";

export default function IntegratedCashTableExample() {
  const [bills, setBills] = useState([
    { value: 200, caisseQty: 1, coffreQty: 0 },
    { value: 100, caisseQty: 2, coffreQty: 1 },
    { value: 50, caisseQty: 0, coffreQty: 0 },
    { value: 20, caisseQty: 1, coffreQty: 0 },
    { value: 10, caisseQty: 0, coffreQty: 0 },
    { value: 5, caisseQty: 0, coffreQty: 0 },
  ]);

  const [coins, setCoins] = useState([
    { value: 2, caisseQty: 0, coffreQty: 0 },
    { value: 1, caisseQty: 0, coffreQty: 0 },
    { value: 0.5, caisseQty: 0, coffreQty: 0 },
    { value: 0.2, caisseQty: 1, coffreQty: 0 },
    { value: 0.1, caisseQty: 3, coffreQty: 0 },
  ]);

  const handleBillChange = (
    index: number,
    field: "caisseQty" | "coffreQty",
    value: number
  ) => {
    const newBills = [...bills];
    newBills[index][field] = value;
    setBills(newBills);
  };

  const handleCoinChange = (
    index: number,
    field: "caisseQty" | "coffreQty",
    value: number
  ) => {
    const newCoins = [...coins];
    newCoins[index][field] = value;
    setCoins(newCoins);
  };

  return (
    <div className="p-4">
      <IntegratedCashTable
        bills={bills}
        coins={coins}
        onBillChange={handleBillChange}
        onCoinChange={handleCoinChange}
      />
    </div>
  );
}
