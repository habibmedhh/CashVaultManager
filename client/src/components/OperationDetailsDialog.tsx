import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Calculator } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface DetailedOperation {
  id: string;
  label: string;
  amount: number;
}

interface OperationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operationName: string;
  date: Date;
  details: DetailedOperation[];
  onDetailsChange: (details: DetailedOperation[]) => void;
}

export default function OperationDetailsDialog({
  open,
  onOpenChange,
  operationName,
  date,
  details,
  onDetailsChange,
}: OperationDetailsDialogProps) {
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const total = details.reduce((sum, detail) => sum + detail.amount, 0);

  const formatNumber = (num: number) => {
    return num.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleAdd = () => {
    if (!newLabel.trim() || !newAmount) return;

    const amount = parseFloat(newAmount.replace(",", "."));
    if (isNaN(amount)) return;

    const newDetail: DetailedOperation = {
      id: Date.now().toString(),
      label: newLabel.trim(),
      amount,
    };

    onDetailsChange([...details, newDetail]);
    setNewLabel("");
    setNewAmount("");
  };

  const handleRemove = (id: string) => {
    onDetailsChange(details.filter((d) => d.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Opérations détaillées - {operationName}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Date: {format(date, "dd/MM/yyyy", { locale: fr })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Formulaire d'ajout */}
          <div className="border-2 border-primary/20 rounded-md p-3 bg-card">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Ajouter une opération
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="detail-label" className="text-xs">
                  Libellé
                </Label>
                <Input
                  id="detail-label"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Description de l'opération"
                  className="h-8 text-xs"
                  data-testid="input-detail-label"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="detail-amount" className="text-xs">
                  Montant (DH)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="detail-amount"
                    type="text"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="0.00"
                    className="h-8 text-xs font-mono"
                    data-testid="input-detail-amount"
                  />
                  <Button
                    onClick={handleAdd}
                    size="sm"
                    className="h-8"
                    data-testid="button-add-detail"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Historique */}
          <div className="flex-1 overflow-hidden flex flex-col border-2 border-border rounded-md">
            <div className="px-3 py-2 bg-gradient-to-r from-primary/10 to-primary/5 border-b-2 border-border">
              <h3 className="text-sm font-bold uppercase tracking-wide flex items-center justify-between">
                <span>Historique</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {details.length} opération(s)
                </span>
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {details.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Aucune opération détaillée pour le moment
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-muted/30 border-b border-border">
                    <tr>
                      <th className="border-r border-border px-2 py-1 text-xs font-semibold uppercase text-left">
                        Libellé
                      </th>
                      <th className="border-r border-border px-2 py-1 text-xs font-semibold uppercase text-right w-28">
                        Montant
                      </th>
                      <th className="px-1 py-1 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.map((detail, index) => (
                      <tr
                        key={detail.id}
                        className={`hover:bg-muted/30 transition-colors ${
                          index % 2 === 0 ? "bg-muted/5" : ""
                        }`}
                      >
                        <td className="border-r border-border px-2 py-1 text-xs">
                          {detail.label}
                        </td>
                        <td className="border-r border-border px-2 py-1 text-right font-mono text-xs tabular-nums">
                          {formatNumber(detail.amount)}
                        </td>
                        <td className="p-0 text-center">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemove(detail.id)}
                            className="h-7 w-7"
                            data-testid={`button-remove-detail-${detail.id}`}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="border-2 border-primary/40 rounded-md bg-gradient-to-r from-accent/40 to-accent/20 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                <span className="text-base font-bold">TOTAL</span>
              </div>
              <span
                className="text-xl font-bold font-mono tabular-nums text-primary"
                data-testid="text-detail-total"
              >
                {formatNumber(total)} DH
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
