import EditableCell from "./EditableCell";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Operation {
  id: string;
  name: string;
  number: number;
  amount: number;
}

interface OperationsTableProps {
  operations: Operation[];
  onOperationChange: (id: string, field: keyof Operation, value: string | number) => void;
  onAddOperation: () => void;
  onRemoveOperation: (id: string) => void;
}

export default function OperationsTable({
  operations,
  onOperationChange,
  onAddOperation,
  onRemoveOperation,
}: OperationsTableProps) {
  const total = operations.reduce((sum, op) => sum + op.amount, 0);

  const formatNumber = (num: number) => {
    return num.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold uppercase tracking-wide">
          Opérations
        </h3>
        <Button
          size="sm"
          onClick={onAddOperation}
          data-testid="button-add-operation"
        >
          <Plus className="w-4 h-4 mr-1" />
          Ajouter
        </Button>
      </div>
      <table className="border-collapse border">
        <thead>
          <tr className="bg-muted/50">
            <th className="border px-2 py-2 text-xs font-semibold uppercase text-left">
              Opération
            </th>
            <th className="border px-2 py-2 text-xs font-semibold uppercase text-center w-32">
              Nombre
            </th>
            <th className="border px-2 py-2 text-xs font-semibold uppercase text-right w-32">
              Montant
            </th>
            <th className="border px-2 py-2 w-12"></th>
          </tr>
        </thead>
        <tbody>
          {operations.map((op) => (
            <tr key={op.id}>
              <td className="border p-0">
                <input
                  type="text"
                  value={op.name}
                  onChange={(e) => onOperationChange(op.id, "name", e.target.value)}
                  className="h-10 px-2 w-full bg-editable hover-elevate active-elevate-2 focus:ring-2 focus:ring-primary focus:outline-none"
                  data-testid={`input-operation-name-${op.id}`}
                />
              </td>
              <td className="border p-0">
                <EditableCell
                  value={op.number}
                  onChange={(val) => onOperationChange(op.id, "number", val)}
                  className="border-0 w-full"
                  dataTestId={`input-operation-number-${op.id}`}
                />
              </td>
              <td className="border p-0">
                <EditableCell
                  value={op.amount}
                  onChange={(val) => onOperationChange(op.id, "amount", val)}
                  allowFormula={true}
                  className="border-0 w-full"
                  dataTestId={`input-operation-amount-${op.id}`}
                />
              </td>
              <td className="border p-1 text-center">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemoveOperation(op.id)}
                  className="h-8 w-8"
                  data-testid={`button-remove-operation-${op.id}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          ))}
          <tr className="font-bold border-t-2">
            <td className="border px-2 py-2 text-sm" colSpan={2}>
              TOTAL
            </td>
            <td
              className="border px-2 py-2 text-right font-mono text-base tabular-nums bg-accent/30"
              data-testid="text-operations-total"
            >
              {formatNumber(total)}
            </td>
            <td className="border"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
