import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "versement" | "retrait";
  onAdd: (label: string, amount: number) => void;
}

export default function TransactionDialog({
  open,
  onOpenChange,
  type,
  onAdd,
}: TransactionDialogProps) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");

  const title = type === "versement" ? "Versement Banque" : "Retrait Banque";
  const color = type === "versement" ? "emerald" : "rose";

  const handleAdd = () => {
    if (!label.trim() || !amount) return;

    const numAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(numAmount)) return;

    onAdd(label.trim(), numAmount);
    setLabel("");
    setAmount("");
    onOpenChange(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className={`text-lg font-bold ${type === "versement" ? "text-emerald-700" : "text-rose-700"}`}>
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="transaction-label" className="text-sm font-semibold">
              Libellé *
            </Label>
            <Input
              id="transaction-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Description du versement/retrait"
              className="h-9 text-sm"
              data-testid="input-transaction-label"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-amount" className="text-sm font-semibold">
              Montant (DH) *
            </Label>
            <Input
              id="transaction-amount"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="0.00"
              className="h-9 text-sm font-mono"
              data-testid="input-transaction-amount"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-transaction"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!label.trim() || !amount}
              className={`${
                type === "versement"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
              data-testid="button-add-transaction"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
