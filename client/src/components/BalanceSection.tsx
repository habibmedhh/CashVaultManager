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
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold uppercase tracking-wide">
              Versement Banque
            </h3>
            <Button
              size="sm"
              onClick={() => onAddTransaction("versement")}
              data-testid="button-add-versement"
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </div>
          <table className="border-collapse border w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="border px-2 py-2 text-xs font-semibold uppercase text-left">
                  Libellé
                </th>
                <th className="border px-2 py-2 text-xs font-semibold uppercase text-right w-32">
                  Montant
                </th>
                <th className="border px-2 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {versements.map((t) => (
                <tr key={t.id}>
                  <td className="border p-0">
                    <input
                      type="text"
                      value={t.label}
                      onChange={(e) =>
                        onTransactionChange(t.id, "label", e.target.value)
                      }
                      className="h-10 px-2 w-full bg-editable hover-elevate active-elevate-2 focus:ring-2 focus:ring-primary focus:outline-none"
                      data-testid={`input-versement-label-${t.id}`}
                    />
                  </td>
                  <td className="border p-0">
                    <EditableCell
                      value={t.amount}
                      onChange={(val) => onTransactionChange(t.id, "amount", val)}
                      allowFormula={true}
                      className="border-0 w-full"
                      dataTestId={`input-versement-amount-${t.id}`}
                    />
                  </td>
                  <td className="border p-1 text-center">
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

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold uppercase tracking-wide">
              Retrait Banque
            </h3>
            <Button
              size="sm"
              onClick={() => onAddTransaction("retrait")}
              data-testid="button-add-retrait"
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </div>
          <table className="border-collapse border w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="border px-2 py-2 text-xs font-semibold uppercase text-left">
                  Libellé
                </th>
                <th className="border px-2 py-2 text-xs font-semibold uppercase text-right w-32">
                  Montant
                </th>
                <th className="border px-2 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {retraits.map((t) => (
                <tr key={t.id}>
                  <td className="border p-0">
                    <input
                      type="text"
                      value={t.label}
                      onChange={(e) =>
                        onTransactionChange(t.id, "label", e.target.value)
                      }
                      className="h-10 px-2 w-full bg-editable hover-elevate active-elevate-2 focus:ring-2 focus:ring-primary focus:outline-none"
                      data-testid={`input-retrait-label-${t.id}`}
                    />
                  </td>
                  <td className="border p-0">
                    <EditableCell
                      value={t.amount}
                      onChange={(val) => onTransactionChange(t.id, "amount", val)}
                      allowFormula={true}
                      className="border-0 w-full"
                      dataTestId={`input-retrait-amount-${t.id}`}
                    />
                  </td>
                  <td className="border p-1 text-center">
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

      <div>
        <h3 className="text-lg font-semibold mb-2 uppercase tracking-wide">
          Soldes et Écart
        </h3>
        <table className="border-collapse border w-full">
          <tbody>
            <tr>
              <td className="border px-2 py-2 text-sm font-medium">
                Total sans remise
              </td>
              <td
                className="border px-2 py-2 text-right font-mono tabular-nums bg-muted/30"
                data-testid="text-total-sans-remise"
              >
                {formatNumber(totalSansRemise)}
              </td>
            </tr>
            <tr>
              <td className="border px-2 py-2 text-sm font-medium">
                Total avo remise
              </td>
              <td className="border p-0">
                <div className="text-right font-mono tabular-nums bg-muted/30 h-10 px-2 flex items-center justify-end">
                  {formatNumber(0)}
                </div>
              </td>
            </tr>
            <tr>
              <td className="border px-2 py-2 text-sm font-medium">
                Solde départ
              </td>
              <td className="border p-0">
                <EditableCell
                  value={soldeDepart}
                  onChange={onSoldeChange}
                  allowFormula={true}
                  className="border-0 w-full"
                  dataTestId="input-solde-depart"
                />
              </td>
            </tr>
            <tr>
              <td className="border px-2 py-2 text-sm font-medium">
                Versement banque
              </td>
              <td
                className="border px-2 py-2 text-right font-mono tabular-nums bg-muted/30"
                data-testid="text-versement-banque"
              >
                {formatNumber(versementBanque)}
              </td>
            </tr>
            <tr>
              <td className="border px-2 py-2 text-sm font-medium">
                Retrait STET
              </td>
              <td
                className="border px-2 py-2 text-right font-mono tabular-nums bg-muted/30"
                data-testid="text-retrait-banque"
              >
                {formatNumber(retraitBanque)}
              </td>
            </tr>
            <tr className="font-bold border-t-2">
              <td className="border px-2 py-2 text-base">Solde final</td>
              <td
                className="border px-2 py-2 text-right font-mono text-base tabular-nums bg-accent/30"
                data-testid="text-solde-final"
              >
                {formatNumber(soldeFinal)}
              </td>
            </tr>
            <tr className="font-bold">
              <td className="border px-2 py-2 text-base">Écart de la caisse</td>
              <td
                className="border px-2 py-2 text-right font-mono text-lg tabular-nums bg-warning-light"
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
