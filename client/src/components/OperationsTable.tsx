import { useState } from "react";
import EditableCell from "./EditableCell";
import { Plus, X, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import OperationDetailsDialog, { type DetailedOperation } from "./OperationDetailsDialog";
import AddOperationDialog from "./AddOperationDialog";

export interface Operation {
  id: string;
  name: string;
  number: number;
  amount: number;
  details?: DetailedOperation[];
  isNew?: boolean;
  type?: "IN" | "OUT";
}

interface OperationsTableProps {
  operations: Operation[];
  onOperationChange: (id: string, field: keyof Operation, value: string | number) => void;
  onAddOperation: (label: string, type: "IN" | "OUT") => void;
  onRemoveOperation: (id: string) => void;
  onClearOperations: () => void;
  date: Date;
  hideZeroRows?: boolean;
  editable?: boolean;
}

export default function OperationsTable({
  operations,
  onOperationChange,
  onAddOperation,
  onRemoveOperation,
  onClearOperations,
  date,
  hideZeroRows = false,
  editable = true,
}: OperationsTableProps) {
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const filteredOperations = hideZeroRows
    ? operations.filter(op => op.number !== 0 || op.amount !== 0)
    : operations;

  // Total des opérations = IN - OUT
  const total = operations.reduce((sum, op) => {
    if (op.type === "OUT") {
      return sum - op.amount;
    }
    // Pour IN ou opérations sans type (compatibilité avec anciennes données)
    return sum + op.amount;
  }, 0);
  const totalNumber = operations.reduce((sum, op) => sum + op.number, 0);

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

  const handleAddOperationClick = () => {
    setAddDialogOpen(true);
  };

  const handleAddFromDialog = (label: string, type: "IN" | "OUT") => {
    onAddOperation(label, type);
  };

  const handleClearClick = () => {
    setClearDialogOpen(true);
  };

  const handleConfirmClear = () => {
    onClearOperations();
    setClearDialogOpen(false);
  };

  const selectedOperation = operations.find(op => op.id === selectedOperationId);

  return (
    <>
      <div className="flex flex-col pl-[20px] pr-[20px]">
        <div className="flex items-center justify-between mb-2 px-3 pt-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
            Opérations
          </h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearClick}
              data-testid="button-clear-operations"
              className="shadow-sm h-7 text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
              disabled={!editable}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Vider
            </Button>
          </div>
        </div>
        <table className="border-collapse w-full">
          <thead>
            <tr className="bg-gradient-to-r from-slate-700 to-slate-600">
              <th className="border-r border-slate-500 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white bg-[#ff9d05] text-center">Opérations</th>
              <th className="border-r border-slate-500 px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-center w-12 text-white bg-[#ff9d05]">
                Nombre
              </th>
              <th className="border-r border-slate-500 px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider w-24 text-white bg-[#ff9d05] text-center">
                Montant
              </th>
              <th className="px-1 py-1.5 w-14 text-white bg-[#ff9d05] font-semibold text-[12px] pt-[0px] pb-[0px] pl-[8px] pr-[8px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOperations.map((op, index) => (
              <tr key={op.id} className={`hover:bg-slate-50/50 transition-colors border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                <td className="border-r border-slate-200 p-0">
                  <div className="flex items-center gap-1 h-7 px-1.5">
                    {op.type && (
                      <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                        op.type === "IN" 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-rose-100 text-rose-700"
                      }`}>
                        {op.type}
                      </span>
                    )}
                    <input
                      type="text"
                      value={op.name}
                      onChange={(e) => onOperationChange(op.id, "name", e.target.value)}
                      className="flex-1 bg-transparent hover-elevate active-elevate-2 focus:ring-1 focus:ring-primary focus:outline-none text-[11px] border-0 p-0"
                      data-testid={`input-operation-name-${op.id}`}
                      disabled={!editable || (op.name !== "" && !op.isNew)}
                      style={!editable || (op.name !== "" && !op.isNew) ? { cursor: 'not-allowed', opacity: 0.8 } : {}}
                    />
                  </div>
                </td>
                <td className="border-r border-slate-200 p-0">
                  <div className="flex items-center h-7">
                    <EditableCell
                      value={op.number}
                      onChange={(val) => onOperationChange(op.id, "number", val)}
                      className="border-0 rounded-none text-center h-7 text-[11px]"
                      dataTestId={`input-operation-number-${op.id}`}
                      editable={editable && (!op.details || op.details.length === 0)}
                    />
                    {op.details && op.details.length > 0 && (
                      <div className="px-0.5 flex-shrink-0">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" title="Calculé à partir de l'historique" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="border-r border-slate-200 p-0">
                  <div className="flex items-center h-7">
                    <EditableCell
                      value={op.amount}
                      onChange={(val) => onOperationChange(op.id, "amount", val)}
                      allowFormula={true}
                      className="border-0 rounded-none h-7 text-[11px]"
                      dataTestId={`input-operation-amount-${op.id}`}
                      editable={editable && (!op.details || op.details.length === 0)}
                    />
                    {op.details && op.details.length > 0 && (
                      <div className="px-0.5 flex-shrink-0">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" title="Calculé à partir des détails" />
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
                      disabled={!editable}
                    >
                      <FileText className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemoveOperation(op.id)}
                      className="h-6 w-6"
                      data-testid={`button-remove-operation-${op.id}`}
                      disabled={!editable}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            <tr className="font-semibold border-t-2 border-slate-300 bg-gradient-to-r from-blue-50 to-blue-50/50">
              <td className="border-r border-slate-300 px-1.5 py-1.5 text-[11px] bg-[#19a89a] text-[#ffffff]">
                TOTAL
              </td>
              <td
                className="border-r border-slate-300 px-0.5 py-1.5 text-center font-mono text-[11px] tabular-nums bg-[#19a89a] text-[#ffffff]"
                data-testid="text-operations-total-number"
              >
                {totalNumber}
              </td>
              <td
                className="border-r border-slate-300 px-0.5 py-1.5 text-right font-mono text-[11px] tabular-nums whitespace-nowrap bg-[#19a89a] text-[#ffffff]"
                data-testid="text-operations-total"
              >
                {formatNumber(total)} DH
              </td>
              <td className="bg-[#19a89a] text-[#ffffff]"></td>
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
      <AddOperationDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddFromDialog}
      />
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vider les données des opérations</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer toutes les opérations ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-clear">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClear}
              data-testid="button-confirm-clear"
              className="bg-rose-600 hover:bg-rose-700"
            >
              Vider
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
