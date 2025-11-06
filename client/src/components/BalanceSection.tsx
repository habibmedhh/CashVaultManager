import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddTransactionDialog from "./AddTransactionDialog";

export interface Transaction {
  id: string;
  type: "versement" | "retrait";
  label: string;
  description?: string;
  amount: number;
}

interface BalanceSectionProps {
  transactions: Transaction[];
  onTransactionChange: (id: string, field: keyof Transaction, value: string | number) => void;
  onAddTransaction: (type: "versement" | "retrait", label: string, description: string, amount: number) => void;
  onRemoveTransaction: (id: string) => void;
  soldeDepart: number;
  totalCaisse: number;
  totalCoffre: number;
  totalOperations: number;
}

export default function BalanceSection({
  transactions,
  onTransactionChange,
  onAddTransaction,
  onRemoveTransaction,
  soldeDepart,
  totalCaisse,
  totalCoffre,
  totalOperations,
}: BalanceSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"versement" | "retrait">("versement");
  const versements = transactions.filter((t) => t.type === "versement");
  const retraits = transactions.filter((t) => t.type === "retrait");

  const totalVersements = versements.reduce((sum, t) => sum + t.amount, 0);
  const totalRetraits = retraits.reduce((sum, t) => sum + t.amount, 0);

  const totalSansRemise = totalOperations;
  const versementBanque = totalVersements;
  const retraitBanque = totalRetraits;

  const soldeFinal = soldeDepart + totalSansRemise + versementBanque - retraitBanque;
  // Écart caisse = Total caisse + coffre - solde final
  const ecartCaisse = (totalCaisse + totalCoffre) - soldeFinal;
  // Écart logique si entre -20 et +20
  const isEcartLogique = ecartCaisse >= -20 && ecartCaisse <= 20;

  const formatNumber = (num: number) => {
    return num.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleOpenDialog = (type: "versement" | "retrait") => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleAddFromDialog = (category: string, description: string, amount: number) => {
    onAddTransaction(dialogType, category, description, amount);
  };

  return (
    <>
      <AddTransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={dialogType}
        onAdd={handleAddFromDialog}
      />
      <div className="flex flex-col items-center gap-4 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full max-w-5xl">
        <div>
        <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-card">
          <div className="flex items-center justify-between mb-2 px-3 pt-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">VersementS</h3>
            <Button
              size="sm"
              onClick={() => handleOpenDialog("versement")}
              data-testid="button-add-versement"
              className="shadow-sm h-7 text-xs hover:bg-primary/90 bg-[#ffffffe6] text-[#19a89a] font-bold"
            >
              <Plus className="w-3 h-3 mr-1" />
              Ajouter
            </Button>
          </div>
          <table className="border-collapse w-full">
            <thead>
              <tr className="bg-gradient-to-r from-slate-700 to-slate-600">
                <th className="border-r border-slate-500 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-left text-white bg-[#fc9b05]">
                  Libellé
                </th>
                <th className="border-r border-slate-500 px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-right w-24 text-white bg-[#fc9b05]">
                  Montant
                </th>
                <th className="px-1 py-1.5 w-12 text-white bg-[#fc9b05]"></th>
              </tr>
            </thead>
            <tbody>
              {versements.map((t, index) => (
                <tr key={t.id} className={`hover:bg-slate-50/50 transition-colors border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                  <td className="border-r border-slate-200 px-2 py-0.5 text-[11px] text-slate-700">
                    <div className="font-medium">{t.label}</div>
                    {t.description && (
                      <div className="text-[10px] text-slate-500 mt-0.5">{t.description}</div>
                    )}
                  </td>
                  <td className="border-r border-slate-200 px-1 py-0.5 text-right font-mono text-[11px] tabular-nums text-emerald-600" data-testid={`text-versement-amount-${t.id}`}>
                    {formatNumber(t.amount)}
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
              <tr className="font-semibold border-t-2 border-slate-300 bg-gradient-to-r from-blue-50 to-blue-50/50">
                <td className="border-r border-slate-300 px-1.5 py-1.5 text-[11px] text-slate-700 bg-[#d5eff4]">
                  TOTAL
                </td>
                <td
                  className="border-r border-slate-300 px-0.5 py-1.5 text-right font-mono text-[11px] tabular-nums text-emerald-700 whitespace-nowrap bg-[#d5eff4]"
                  data-testid="text-versement-total"
                >
                  {formatNumber(totalVersements)} DH
                </td>
                <td className="bg-[#d5eff4]"></td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>
        
        <div>
        <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-card">
          <div className="flex items-center justify-between mb-2 px-3 pt-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">RETRAITS</h3>
            <Button
              size="sm"
              onClick={() => handleOpenDialog("retrait")}
              data-testid="button-add-retrait"
              className="shadow-sm h-7 text-xs hover:bg-primary/90 bg-[#ffffffe6] text-[#19a89a] font-bold"
            >
              <Plus className="w-3 h-3 mr-1" />
              Ajouter
            </Button>
          </div>
          <table className="border-collapse w-full">
            <thead>
              <tr className="bg-gradient-to-r from-slate-700 to-slate-600">
                <th className="border-r border-slate-500 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-left text-white bg-[#fc9b05]">
                  Libellé
                </th>
                <th className="border-r border-slate-500 px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-right w-24 text-white bg-[#fc9b05]">
                  Montant
                </th>
                <th className="px-1 py-1.5 w-12 text-white bg-[#fc9b05]"></th>
              </tr>
            </thead>
            <tbody>
              {retraits.map((t, index) => (
                <tr key={t.id} className={`hover:bg-slate-50/50 transition-colors border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                  <td className="border-r border-slate-200 px-2 py-0.5 text-[11px] text-slate-700">
                    <div className="font-medium">{t.label}</div>
                    {t.description && (
                      <div className="text-[10px] text-slate-500 mt-0.5">{t.description}</div>
                    )}
                  </td>
                  <td className="border-r border-slate-200 px-1 py-0.5 text-right font-mono text-[11px] tabular-nums text-rose-600" data-testid={`text-retrait-amount-${t.id}`}>
                    {formatNumber(t.amount)}
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
              <tr className="font-semibold border-t-2 border-slate-300 bg-gradient-to-r from-blue-50 to-blue-50/50">
                <td className="border-r border-slate-300 px-1.5 py-1.5 text-[11px] text-slate-700 bg-[#d5eff4]">
                  TOTAL
                </td>
                <td
                  className="border-r border-slate-300 px-0.5 py-1.5 text-right font-mono text-[11px] tabular-nums text-rose-700 whitespace-nowrap bg-[#d5eff4]"
                  data-testid="text-retrait-total"
                >
                  {formatNumber(totalRetraits)} DH
                </td>
                <td className="bg-[#d5eff4]"></td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-card w-full max-w-5xl">
        <div className="px-3 py-2 bg-[#fc9b05] border-b border-slate-500">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#000000]">
            Soldes et Écart
          </h3>
        </div>
        <table className="border-collapse w-full">
          <tbody>
            <tr className="hover:bg-slate-50/50 border-b border-slate-100">
              <td className="border-r border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700">
                Solde départ
              </td>
              <td
                className="px-2 py-1 text-right font-mono text-[11px] tabular-nums text-slate-900 bg-slate-50/30"
                data-testid="text-solde-depart"
              >
                {formatNumber(soldeDepart)} DH
              </td>
            </tr>
            <tr className="hover:bg-slate-50/50 border-b border-slate-100">
              <td className="border-r border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700">Versements</td>
              <td
                className="px-2 py-1 text-right font-mono text-[11px] tabular-nums text-emerald-700 bg-emerald-50/30"
                data-testid="text-versement-banque"
              >
                {formatNumber(versementBanque)}
              </td>
            </tr>
            <tr className="hover:bg-slate-50/50 border-b border-slate-100">
              <td className="border-r border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700">Retraits</td>
              <td
                className="px-2 py-1 text-right font-mono text-[11px] tabular-nums text-rose-700 bg-rose-50/30"
                data-testid="text-retrait-banque"
              >
                {formatNumber(retraitBanque)}
              </td>
            </tr>
            <tr className="font-semibold border-t-2 border-slate-300 bg-gradient-to-r from-blue-50 to-blue-50/50">
              <td className="border-r border-slate-300 px-2 py-2 text-sm text-slate-700 bg-[#d5eff4]">Solde final</td>
              <td
                className="px-2 py-2 text-right font-mono text-sm tabular-nums text-slate-900 bg-[#d5eff4]"
                data-testid="text-solde-final"
              >
                {formatNumber(soldeFinal)} DH
              </td>
            </tr>
            <tr className={`font-bold ${isEcartLogique ? 'bg-gradient-to-r from-emerald-100 to-emerald-50' : 'bg-gradient-to-r from-amber-100 to-amber-50'}`}>
              <td className={`px-2 py-2 text-sm ${isEcartLogique ? 'border-r border-emerald-300 text-emerald-900' : 'border-r border-amber-300 text-amber-900'}`}>Écart de la caisse</td>
              <td
                className={`px-2 py-2 text-right font-mono text-lg tabular-nums ${isEcartLogique ? 'text-emerald-900' : 'text-amber-900'}`}
                data-testid="text-ecart-caisse"
              >
                {formatNumber(ecartCaisse)} DH
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </>
  );
}
