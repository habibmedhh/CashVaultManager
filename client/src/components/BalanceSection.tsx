import EditableCell from "./EditableCell";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Transaction {
  id: string;
  type: "versement" | "retrait";
  label: string;
  amount: number;
}

interface BalanceSectionProps {
  transactions: Transaction[];
  onTransactionChange: (id: string, field: keyof Transaction, value: string | number) => void;
  onAddTransaction: (type: "versement" | "retrait") => void;
  onRemoveTransaction: (id: string) => void;
  soldeDepart: number;
  onSoldeChange: (value: number) => void;
  totalCaisse: number;
  totalOperations: number;
}

export default function BalanceSection({
  transactions,
  onTransactionChange,
  onAddTransaction,
  onRemoveTransaction,
  soldeDepart,
  onSoldeChange,
  totalCaisse,
  totalOperations,
}: BalanceSectionProps) {
  const versements = transactions.filter((t) => t.type === "versement");
  const retraits = transactions.filter((t) => t.type === "retrait");

  const totalVersements = versements.reduce((sum, t) => sum + t.amount, 0);
  const totalRetraits = retraits.reduce((sum, t) => sum + t.amount, 0);

  const totalSansRemise = totalOperations;
  const versementBanque = totalVersements;
  const retraitBanque = totalRetraits;

  const soldeFinal = soldeDepart + totalSansRemise + versementBanque - retraitBanque;
  const ecartCaisse = totalCaisse - soldeFinal;

  const formatNumber = (num: number) => {
    return num.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="border-2 border-border rounded-md overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border-b-2 border-border">
            <h3 className="text-base font-bold uppercase tracking-wide">
              Versement Banque
            </h3>
            <Button
              size="sm"
              onClick={() => onAddTransaction("versement")}
              data-testid="button-add-versement"
              className="shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </div>
          <table className="border-collapse w-full">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="border-r border-border px-3 py-2 text-xs font-semibold uppercase text-left">
                  Libellé
                </th>
                <th className="px-3 py-2 text-xs font-semibold uppercase text-right w-36">
                  Montant
                </th>
                <th className="px-2 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {versements.map((t, index) => (
                <tr key={t.id} className={`hover:bg-muted/20 ${index % 2 === 0 ? 'bg-muted/5' : ''}`}>
                  <td className="border-r border-border p-0">
                    <input
                      type="text"
                      value={t.label}
                      onChange={(e) =>
                        onTransactionChange(t.id, "label", e.target.value)
                      }
                      className="h-10 px-3 w-full bg-editable hover-elevate active-elevate-2 focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                      data-testid={`input-versement-label-${t.id}`}
                    />
                  </td>
                  <td className="border-r border-border p-0">
                    <EditableCell
                      value={t.amount}
                      onChange={(val) => onTransactionChange(t.id, "amount", val)}
                      allowFormula={true}
                      className="border-0 w-full rounded-none"
                      dataTestId={`input-versement-amount-${t.id}`}
                    />
                  </td>
                  <td className="p-1 text-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemoveTransaction(t.id)}
                      className="h-8 w-8"
                      data-testid={`button-remove-versement-${t.id}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-2 border-border rounded-md overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-destructive/10 to-destructive/5 border-b-2 border-border">
            <h3 className="text-base font-bold uppercase tracking-wide">
              Retrait Banque
            </h3>
            <Button
              size="sm"
              onClick={() => onAddTransaction("retrait")}
              data-testid="button-add-retrait"
              className="shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </div>
          <table className="border-collapse w-full">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="border-r border-border px-3 py-2 text-xs font-semibold uppercase text-left">
                  Libellé
                </th>
                <th className="px-3 py-2 text-xs font-semibold uppercase text-right w-36">
                  Montant
                </th>
                <th className="px-2 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {retraits.map((t, index) => (
                <tr key={t.id} className={`hover:bg-muted/20 ${index % 2 === 0 ? 'bg-muted/5' : ''}`}>
                  <td className="border-r border-border p-0">
                    <input
                      type="text"
                      value={t.label}
                      onChange={(e) =>
                        onTransactionChange(t.id, "label", e.target.value)
                      }
                      className="h-10 px-3 w-full bg-editable hover-elevate active-elevate-2 focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                      data-testid={`input-retrait-label-${t.id}`}
                    />
                  </td>
                  <td className="border-r border-border p-0">
                    <EditableCell
                      value={t.amount}
                      onChange={(val) => onTransactionChange(t.id, "amount", val)}
                      allowFormula={true}
                      className="border-0 w-full rounded-none"
                      dataTestId={`input-retrait-amount-${t.id}`}
                    />
                  </td>
                  <td className="p-1 text-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemoveTransaction(t.id)}
                      className="h-8 w-8"
                      data-testid={`button-remove-retrait-${t.id}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-2 border-border rounded-md overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border-b-2 border-border">
          <h3 className="text-base font-bold uppercase tracking-wide">
            Soldes et Écart
          </h3>
        </div>
        <table className="border-collapse w-full">
          <tbody>
            <tr className="hover:bg-muted/10">
              <td className="border-r border-b border-border px-3 py-2 text-sm font-medium">
                Total sans remise
              </td>
              <td
                className="border-b border-border px-3 py-2 text-right font-mono tabular-nums bg-muted/20"
                data-testid="text-total-sans-remise"
              >
                {formatNumber(totalSansRemise)}
              </td>
            </tr>
            <tr className="hover:bg-muted/10">
              <td className="border-r border-b border-border px-3 py-2 text-sm font-medium">
                Total avo remise
              </td>
              <td className="border-b border-border p-0">
                <div className="text-right font-mono tabular-nums bg-muted/20 h-10 px-3 flex items-center justify-end">
                  {formatNumber(0)}
                </div>
              </td>
            </tr>
            <tr className="hover:bg-muted/10">
              <td className="border-r border-b border-border px-3 py-2 text-sm font-medium">
                Solde départ
              </td>
              <td className="border-b border-border p-0">
                <EditableCell
                  value={soldeDepart}
                  onChange={onSoldeChange}
                  allowFormula={true}
                  className="border-0 w-full rounded-none"
                  dataTestId="input-solde-depart"
                />
              </td>
            </tr>
            <tr className="hover:bg-muted/10">
              <td className="border-r border-b border-border px-3 py-2 text-sm font-medium">
                Versement banque
              </td>
              <td
                className="border-b border-border px-3 py-2 text-right font-mono tabular-nums bg-muted/20"
                data-testid="text-versement-banque"
              >
                {formatNumber(versementBanque)}
              </td>
            </tr>
            <tr className="hover:bg-muted/10">
              <td className="border-r border-b border-border px-3 py-2 text-sm font-medium">
                Retrait STET
              </td>
              <td
                className="border-b border-border px-3 py-2 text-right font-mono tabular-nums bg-muted/20"
                data-testid="text-retrait-banque"
              >
                {formatNumber(retraitBanque)}
              </td>
            </tr>
            <tr className="font-bold border-b-2 border-primary/30 bg-gradient-to-r from-accent/40 to-accent/20">
              <td className="border-r border-border px-3 py-3 text-base">Solde final</td>
              <td
                className="px-3 py-3 text-right font-mono text-lg tabular-nums"
                data-testid="text-solde-final"
              >
                {formatNumber(soldeFinal)}
              </td>
            </tr>
            <tr className="font-bold bg-gradient-to-r from-warning-light/80 to-warning-light/60">
              <td className="border-r border-border px-3 py-4 text-lg">Écart de la caisse</td>
              <td
                className="px-3 py-4 text-right font-mono text-xl tabular-nums"
                data-testid="text-ecart-caisse"
              >
                {formatNumber(ecartCaisse)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
