import { useState } from "react";
import EditableCell from "./EditableCell";
import { Plus, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import OperationDetailsDialog, { type DetailedOperation } from "./OperationDetailsDialog";

export interface Operation {
  id: string;
  name: string;
  number: number;
  amount: number;
  details?: DetailedOperation[];
}

interface OperationsTableProps {
  operations: Operation[];
  onOperationChange: (id: string, field: keyof Operation, value: string | number) => void;
  onAddOperation: () => void;
  onRemoveOperation: (id: string) => void;
  date: Date;
}

export default function OperationsTable({
  operations,
  onOperationChange,
  onAddOperation,
  onRemoveOperation,
  date,
}: OperationsTableProps) {
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const total = operations.reduce((sum, op) => sum + op.amount, 0);

  const formatNumber = (num: number) => {
    return num.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleOpenDetails = (operationId: string) => {
    setSelectedOperationId(operationId);
    setDialogOpen(true);
  };

  const handleDetailsChange = (details: DetailedOperation[]) => {
    if (!selectedOperationId) return;
    
    const total = details.reduce((sum, d) => sum + d.amount, 0);
    
    // Update both amount and details
    onOperationChange(selectedOperationId, "amount", total);
    onOperationChange(selectedOperationId, "details", details as any);
  };

  const selectedOperation = operations.find(op => op.id === selectedOperationId);

  return (
    <>
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2 px-3 pt-3">
          <h3 className="text-base font-bold uppercase tracking-wide bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Opérations
          </h3>
          <Button
            size="sm"
            onClick={onAddOperation}
            data-testid="button-add-operation"
            className="shadow-sm h-7 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Ajouter
          </Button>
        </div>
        <table className="border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-primary/10 to-primary/5 border-y-2 border-border">
              <th className="border-r border-border px-2 py-2 text-xs font-bold uppercase text-left w-48">
                Opération
              </th>
              <th className="border-r border-border px-2 py-2 text-xs font-bold uppercase text-center w-20">
                Nombre
              </th>
              <th className="border-r border-border px-2 py-2 text-xs font-bold uppercase text-right w-28">
                Montant
              </th>
              <th className="px-1 py-2 w-20"></th>
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
                    className="h-8 px-2 w-full bg-editable hover-elevate active-elevate-2 focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                    data-testid={`input-operation-name-${op.id}`}
                  />
                </td>
                <td className="border-r border-border p-0">
                  <EditableCell
                    value={op.number}
                    onChange={(val) => onOperationChange(op.id, "number", val)}
                    className="border-0 w-full rounded-none text-center h-8 text-xs px-1"
                    dataTestId={`input-operation-number-${op.id}`}
                  />
                </td>
                <td className="border-r border-border p-0">
                  <div className="flex items-center">
                    <EditableCell
                      value={op.amount}
                      onChange={(val) => onOperationChange(op.id, "amount", val)}
                      allowFormula={true}
                      className="border-0 flex-1 rounded-none h-8 text-xs px-1"
                      dataTestId={`input-operation-amount-${op.id}`}
                      editable={!op.details || op.details.length === 0}
                    />
                    {op.details && op.details.length > 0 && (
                      <div className="px-1">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" title="Calculé à partir des détails" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-0">
                  <div className="flex items-center justify-center gap-0.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleOpenDetails(op.id)}
                      className="h-7 w-7"
                      title="Opérations détaillées"
                      data-testid={`button-details-${op.id}`}
                    >
                      <FileText className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemoveOperation(op.id)}
                      className="h-7 w-7"
                      data-testid={`button-remove-operation-${op.id}`}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            <tr className="font-bold border-t-2 border-primary/30 bg-gradient-to-r from-accent/40 to-accent/20">
              <td className="border-r border-border px-2 py-2 text-sm" colSpan={2}>
                TOTAL
              </td>
              <td
                className="border-r border-border px-2 py-2 text-right font-mono text-sm tabular-nums bg-accent/50"
                data-testid="text-operations-total"
              >
                {formatNumber(total)}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {selectedOperation && (
        <OperationDetailsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          operationName={selectedOperation.name}
          date={date}
          details={selectedOperation.details || []}
          onDetailsChange={handleDetailsChange}
        />
      )}
    </>
  );
}
