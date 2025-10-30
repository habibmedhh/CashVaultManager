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
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

interface AddOperationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (label: string, type: "IN" | "OUT") => void;
}

export default function AddOperationDialog({
  open,
  onOpenChange,
  onAdd,
}: AddOperationDialogProps) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<"IN" | "OUT">("IN");

  const handleAdd = () => {
    if (!label.trim()) return;

    onAdd(label.trim(), type);
    setLabel("");
    setType("IN");
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
            Nouvelle Opération
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="operation-label" className="text-sm font-semibold">
              Libellé *
            </Label>
            <Input
              id="operation-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nom de l'opération"
              className="h-9 text-sm"
              data-testid="input-operation-label"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="operation-type" className="text-sm font-semibold">
              Type d'opération *
            </Label>
            <Select value={type} onValueChange={(val) => setType(val as "IN" | "OUT")}>
              <SelectTrigger className="h-9" data-testid="select-operation-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN" data-testid="select-option-in">
                  <div className="flex items-center gap-2">
                    <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
                    <span>IN (Entrée)</span>
                  </div>
                </SelectItem>
                <SelectItem value="OUT" data-testid="select-option-out">
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle className="w-4 h-4 text-rose-600" />
                    <span>OUT (Sortie)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-operation"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!label.trim()}
              data-testid="button-confirm-operation"
            >
              Ajouter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
