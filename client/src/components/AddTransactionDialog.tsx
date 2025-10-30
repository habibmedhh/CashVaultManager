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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "versement" | "retrait";
  onAdd: (category: string, amount: number) => void;
}

const VERSEMENT_CATEGORIES = [
  "Versement CIH",
  "Versement Attijariwafa Bank",
  "Versement BMCE",
  "Versement Banque Populaire",
  "Alimentation banque",
  "Dépôt espèces",
];

const RETRAIT_CATEGORIES = [
  "Retrait vers CIH",
  "Retrait vers Attijariwafa Bank",
  "Retrait vers BMCE",
  "Retrait vers Banque Populaire",
  "Charges agence",
  "Frais bancaires",
  "Salaires",
  "Fournitures",
];

export default function AddTransactionDialog({
  open,
  onOpenChange,
  type,
  onAdd,
}: AddTransactionDialogProps) {
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");

  const categories = type === "versement" ? VERSEMENT_CATEGORIES : RETRAIT_CATEGORIES;

  const handleAdd = () => {
    if (!category || !amount.trim()) return;
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return;

    onAdd(category, numAmount);
    setCategory("");
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
          <DialogTitle className="text-lg font-bold text-slate-700">
            {type === "versement" ? "Nouveau Versement" : "Nouveau Retrait"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="transaction-category" className="text-sm font-semibold">
              Catégorie *
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9" data-testid="select-transaction-category">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} data-testid={`select-category-${cat}`}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-amount" className="text-sm font-semibold">
              Montant (DH) *
            </Label>
            <Input
              id="transaction-amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="0.00"
              className="h-9 text-sm"
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
              disabled={!category || !amount.trim()}
              data-testid="button-confirm-transaction"
              className={type === "versement" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}
            >
              Ajouter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
