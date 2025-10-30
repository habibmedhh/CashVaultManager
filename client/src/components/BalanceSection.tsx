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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-card">
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 border-b border-emerald-700">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Versement Banque
            </h3>
            <Button
              size="sm"
              onClick={() => onAddTransaction("versement")}
              data-testid="button-add-versement"
              className="shadow-sm h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Plus className="w-3 h-3 mr-1" />
              Ajouter
            </Button>
          </div>
          <table className="border-collapse w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="border-r border-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-left text-slate-700">
                  Libellé
                </th>
                <th className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-right w-24 text-slate-700">
                  Montant
                </th>
                <th className="px-1 py-1 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {versements.map((t, index) => (
                <tr key={t.id} className={`hover:bg-emerald-50/30 transition-colors border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                  <td className="border-r border-slate-200 p-0">
                    <input
                      type="text"
                      value={t.label}
                      onChange={(e) =>
                        onTransactionChange(t.id, "label", e.target.value)
                      }
                      className="h-7 px-1.5 w-full bg-transparent hover-elevate active-elevate-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-[11px]"
                      data-testid={`input-versement-label-${t.id}`}
                    />
                  </td>
                  <td className="border-r border-slate-200 p-0">
                    <EditableCell
                      value={t.amount}
                      onChange={(val) => onTransactionChange(t.id, "amount", val)}
                      allowFormula={true}
                      className="border-0 w-full rounded-none h-7 text-[11px] px-0.5"
                      dataTestId={`input-versement-amount-${t.id}`}
                    />
                  </td>
                  <td className="p-0 text-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemoveTransaction(t.id)}
                      className="h-6 w-6"
                      data-testid={`button-remove-versement-${t.id}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-card">
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-rose-600 to-rose-500 border-b border-rose-700">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Retrait Banque
            </h3>
            <Button
              size="sm"
              onClick={() => onAddTransaction("retrait")}
              data-testid="button-add-retrait"
              className="shadow-sm h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Plus className="w-3 h-3 mr-1" />
              Ajouter
            </Button>
          </div>
          <table className="border-collapse w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="border-r border-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-left text-slate-700">
                  Libellé
                </th>
                <th className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-right w-24 text-slate-700">
                  Montant
                </th>
                <th className="px-1 py-1 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {retraits.map((t, index) => (
                <tr key={t.id} className={`hover:bg-rose-50/30 transition-colors border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                  <td className="border-r border-slate-200 p-0">
                    <input
                      type="text"
                      value={t.label}
                      onChange={(e) =>
                        onTransactionChange(t.id, "label", e.target.value)
                      }
                      className="h-7 px-1.5 w-full bg-transparent hover-elevate active-elevate-2 focus:ring-1 focus:ring-rose-500 focus:outline-none text-[11px]"
                      data-testid={`input-retrait-label-${t.id}`}
                    />
                  </td>
                  <td className="border-r border-slate-200 p-0">
                    <EditableCell
                      value={t.amount}
                      onChange={(val) => onTransactionChange(t.id, "amount", val)}
                      allowFormula={true}
                      className="border-0 w-full rounded-none h-7 text-[11px] px-0.5"
                      dataTestId={`input-retrait-amount-${t.id}`}
                    />
                  </td>
                  <td className="p-0 text-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemoveTransaction(t.id)}
                      className="h-6 w-6"
                      data-testid={`button-remove-retrait-${t.id}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-card">
        <div className="px-3 py-2 bg-gradient-to-r from-slate-700 to-slate-600 border-b border-slate-500">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Soldes et Écart
          </h3>
        </div>
        <table className="border-collapse w-full">
          <tbody>
            <tr className="hover:bg-slate-50/50 border-b border-slate-100">
              <td className="border-r border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700">
                Solde départ
              </td>
              <td className="p-0">
                <EditableCell
                  value={soldeDepart}
                  onChange={onSoldeChange}
                  allowFormula={true}
                  className="border-0 w-full rounded-none h-7 text-[11px] px-0.5"
                  dataTestId="input-solde-depart"
                />
              </td>
            </tr>
            <tr className="hover:bg-slate-50/50 border-b border-slate-100">
              <td className="border-r border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700">
                Versement banque
              </td>
              <td
                className="px-2 py-1 text-right font-mono text-[11px] tabular-nums text-emerald-700 bg-emerald-50/30"
                data-testid="text-versement-banque"
              >
                {formatNumber(versementBanque)}
              </td>
            </tr>
            <tr className="hover:bg-slate-50/50 border-b border-slate-100">
              <td className="border-r border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700">
                Retrait STET
              </td>
              <td
                className="px-2 py-1 text-right font-mono text-[11px] tabular-nums text-rose-700 bg-rose-50/30"
                data-testid="text-retrait-banque"
              >
                {formatNumber(retraitBanque)}
              </td>
            </tr>
            <tr className="font-semibold border-t-2 border-slate-300 bg-gradient-to-r from-blue-50 to-blue-50/50">
              <td className="border-r border-slate-300 px-2 py-2 text-sm text-slate-700">Solde final</td>
              <td
                className="px-2 py-2 text-right font-mono text-sm tabular-nums text-slate-900"
                data-testid="text-solde-final"
              >
                {formatNumber(soldeFinal)} DH
              </td>
            </tr>
            <tr className="font-bold bg-gradient-to-r from-amber-100 to-amber-50">
              <td className="border-r border-amber-300 px-2 py-2 text-sm text-amber-900">Écart de la caisse</td>
              <td
                className="px-2 py-2 text-right font-mono text-lg tabular-nums text-amber-900"
                data-testid="text-ecart-caisse"
              >
                {formatNumber(ecartCaisse)} DH
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
