import { useState } from "react";
import OperationsTable, { type Operation } from "../OperationsTable";

export default function OperationsTableExample() {
  const [operations, setOperations] = useState<Operation[]>([
    { id: "1", name: "WESTERN UNION", number: 0, amount: 0 },
    { id: "2", name: "MONEY GRAM", number: 0, amount: 10475.7 },
    { id: "3", name: "remis/Invest/mony", number: 0, amount: 500 },
  ]);

  const handleOperationChange = (
    id: string,
    field: keyof Operation,
    value: string | number
  ) => {
    setOperations((ops) =>
      ops.map((op) => (op.id === id ? { ...op, [field]: value } : op))
    );
  };

  const handleAddOperation = () => {
    const newOp: Operation = {
      id: Date.now().toString(),
      name: "",
      number: 0,
      amount: 0,
    };
    setOperations([...operations, newOp]);
  };

  const handleRemoveOperation = (id: string) => {
    setOperations(operations.filter((op) => op.id !== id));
  };

  return (
    <div className="p-4 max-w-3xl">
      <OperationsTable
        operations={operations}
        onOperationChange={handleOperationChange}
        onAddOperation={handleAddOperation}
        onRemoveOperation={handleRemoveOperation}
      />
    </div>
  );
}
