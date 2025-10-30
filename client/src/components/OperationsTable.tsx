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
      <div className="flex items-center justify-between mb-3 px-4 pt-4">
        <h3 className="text-lg font-bold uppercase tracking-wide bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Opérations
        </h3>
        <Button
          size="sm"
          onClick={onAddOperation}
          data-testid="button-add-operation"
          className="shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Ajouter
        </Button>
      </div>
      <table className="border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-primary/10 to-primary/5 border-y-2 border-border">
            <th className="border-r border-border px-3 py-3 text-xs font-bold uppercase text-left">
              Opération
            </th>
            <th className="border-r border-border px-3 py-3 text-xs font-bold uppercase text-center w-32">
              Nombre
            </th>
            <th className="border-r border-border px-3 py-3 text-xs font-bold uppercase text-right w-36">
              Montant
            </th>
            <th className="px-2 py-3 w-12"></th>
          </tr>
        </thead>
        <tbody>
          {operations.map((op, index) => (
            <tr key={op.id} className={`hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-muted/5' : ''}`}>
              <td className="border-r border-border p-0">
                <input
                  type="text"
                  value={op.name}
                  onChange={(e) => onOperationChange(op.id, "name", e.target.value)}
                  className="h-10 px-3 w-full bg-editable hover-elevate active-elevate-2 focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                  data-testid={`input-operation-name-${op.id}`}
                />
              </td>
              <td className="border-r border-border p-0">
                <EditableCell
                  value={op.number}
                  onChange={(val) => onOperationChange(op.id, "number", val)}
                  className="border-0 w-full rounded-none text-center"
                  dataTestId={`input-operation-number-${op.id}`}
                />
              </td>
              <td className="border-r border-border p-0">
                <EditableCell
                  value={op.amount}
                  onChange={(val) => onOperationChange(op.id, "amount", val)}
                  allowFormula={true}
                  className="border-0 w-full rounded-none"
                  dataTestId={`input-operation-amount-${op.id}`}
                />
              </td>
              <td className="p-1 text-center">
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
          <tr className="font-bold border-t-2 border-primary/30 bg-gradient-to-r from-accent/40 to-accent/20">
            <td className="border-r border-border px-3 py-3 text-base" colSpan={2}>
              TOTAL
            </td>
            <td
              className="border-r border-border px-3 py-3 text-right font-mono text-lg tabular-nums bg-accent/50"
              data-testid="text-operations-total"
            >
              {formatNumber(total)}
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
