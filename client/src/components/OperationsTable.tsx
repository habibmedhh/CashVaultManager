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
  isNew?: boolean;
}

interface OperationsTableProps {
  operations: Operation[];
  onOperationChange: (id: string, field: keyof Operation, value: string | number) => void;
  onAddOperation: () => void;
  onRemoveOperation: (id: string) => void;
  date: Date;
  hideZeroRows?: boolean;
}

export default function OperationsTable({
  operations,
  onOperationChange,
  onAddOperation,
  onRemoveOperation,
  date,
  hideZeroRows = false,
}: OperationsTableProps) {
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredOperations = hideZeroRows
    ? operations.filter(op => op.number !== 0 || op.amount !== 0)
    : operations;

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
    
    // Update amount, number, and details
    onOperationChange(selectedOperationId, "amount", total);
    onOperationChange(selectedOperationId, "number", details.length);
    onOperationChange(selectedOperationId, "details", details as any);
  };

  const selectedOperation = operations.find(op => op.id === selectedOperationId);

  return (
    <>
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2 px-3 pt-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
            Opérations
          </h3>
          <Button
            size="sm"
            onClick={onAddOperation}
            data-testid="button-add-operation"
            className="shadow-sm h-7 text-xs bg-primary hover:bg-primary/90"
          >
            <Plus className="w-3 h-3 mr-1" />
            Ajouter
          </Button>
        </div>
        <table className="border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-slate-700 to-slate-600">
              <th className="border-r border-slate-500 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-left w-40 text-white">
                Opération
              </th>
              <th className="border-r border-slate-500 px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-center w-16 text-white">
                Nombre
              </th>
              <th className="border-r border-slate-500 px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-right w-24 text-white">
                Montant
              </th>
              <th className="px-1 py-1.5 w-16 text-white"></th>
            </tr>
          </thead>
          <tbody>
            {filteredOperations.map((op, index) => (
              <tr key={op.id} className={`hover:bg-slate-50/50 transition-colors border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                <td className="border-r border-slate-200 p-0">
                  <input
                    type="text"
                    value={op.name}
                    onChange={(e) => onOperationChange(op.id, "name", e.target.value)}
                    className="h-7 px-1.5 w-full bg-transparent hover-elevate active-elevate-2 focus:ring-1 focus:ring-primary focus:outline-none text-[11px]"
                    data-testid={`input-operation-name-${op.id}`}
                    disabled={op.name !== "" && !op.isNew}
                    style={op.name !== "" && !op.isNew ? { cursor: 'not-allowed', opacity: 0.8 } : {}}
                  />
                </td>
                <td className="border-r border-slate-200 p-0">
                  <div className="flex items-center">
                    <EditableCell
                      value={op.number}
                      onChange={(val) => onOperationChange(op.id, "number", val)}
                      className="border-0 flex-1 rounded-none text-center h-7 text-[11px] px-0.5"
                      dataTestId={`input-operation-number-${op.id}`}
                      editable={!op.details || op.details.length === 0}
                    />
                    {op.details && op.details.length > 0 && (
                      <div className="px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Calculé à partir de l'historique" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="border-r border-slate-200 p-0">
                  <div className="flex items-center">
                    <EditableCell
                      value={op.amount}
                      onChange={(val) => onOperationChange(op.id, "amount", val)}
                      allowFormula={true}
                      className="border-0 flex-1 rounded-none h-7 text-[11px] px-0.5"
                      dataTestId={`input-operation-amount-${op.id}`}
                      editable={!op.details || op.details.length === 0}
                    />
                    {op.details && op.details.length > 0 && (
                      <div className="px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Calculé à partir des détails" />
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
                      className="h-6 w-6"
                      title="Opérations détaillées"
                      data-testid={`button-details-${op.id}`}
                    >
                      <FileText className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemoveOperation(op.id)}
                      className="h-6 w-6"
                      data-testid={`button-remove-operation-${op.id}`}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            <tr className="font-semibold border-t-2 border-slate-300 bg-gradient-to-r from-blue-50 to-blue-50/50">
              <td className="border-r border-slate-300 px-2 py-1.5 text-[11px] text-slate-700" colSpan={2}>
                TOTAL
              </td>
              <td
                className="border-r border-slate-300 px-1 py-1.5 text-right font-mono text-sm tabular-nums text-slate-900"
                data-testid="text-operations-total"
              >
                {formatNumber(total)} DH
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
