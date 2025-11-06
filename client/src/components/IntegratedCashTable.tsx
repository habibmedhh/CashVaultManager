import EditableCell from "./EditableCell";

interface CashItem {
  value: number;
  caisseAmount: number;
  coffreAmount: number;
  color: string;
  icon: string;
  type: "billet" | "piece";
}

interface IntegratedCashTableProps {
  items: CashItem[];
  onItemChange: (index: number, field: "caisseAmount" | "coffreAmount", value: number) => void;
  hideZeroRows?: boolean;
}

export default function IntegratedCashTable({
  items,
  onItemChange,
  hideZeroRows = false,
}: IntegratedCashTableProps) {
  const filteredItems = hideZeroRows
    ? items.filter(item => item.caisseAmount !== 0 || item.coffreAmount !== 0)
    : items;

  const totalCaisse = items.reduce((sum, item) => sum + item.caisseAmount, 0);
  const totalCoffre = items.reduce((sum, item) => sum + item.coffreAmount, 0);
  const grandTotal = totalCaisse + totalCoffre;

  const formatNumber = (num: number) => {
    return num.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden shadow-sm max-w-xs bg-card">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-slate-700 to-slate-600">
            <th className="border-r border-slate-500 px-1.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-left w-14 text-white bg-[#ff9d05]">
              
            </th>
            <th className="border-r border-slate-500 px-1.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-center w-16 text-white bg-[#ff9d05]">
              Caisse
            </th>
            <th className="px-1.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-center w-16 text-white bg-[#ff9d05]">
              Coffre
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((item, index) => {
            const originalIndex = items.findIndex(i => i.value === item.value);
            return (
            <tr key={index} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
              <td className="border-r border-slate-200 px-1 py-0.5 text-center bg-slate-50/30">
                <div className="flex items-center justify-center gap-0.5">
                  <span className="text-[10px] font-semibold text-slate-700">
                    {formatNumber(item.value)}
                  </span>
                </div>
              </td>
              <td className="border-r border-slate-200 p-0">
                <EditableCell
                  value={item.caisseAmount}
                  onChange={(val) => onItemChange(originalIndex, "caisseAmount", val)}
                  className="border-0 w-full rounded-none h-6 text-[11px] px-0.5"
                  dataTestId={`input-item-caisse-${originalIndex}`}
                />
              </td>
              <td className="p-0">
                <EditableCell
                  value={item.coffreAmount}
                  onChange={(val) => onItemChange(originalIndex, "coffreAmount", val)}
                  className="border-0 w-full rounded-none h-6 text-[11px] px-0.5"
                  dataTestId={`input-item-coffre-${originalIndex}`}
                />
              </td>
            </tr>
          );
          })}
          
          <tr className="border-t-2 border-slate-300 bg-gradient-to-r from-blue-50 to-blue-50/50 font-semibold">
            <td className="border-r border-slate-300 px-1 py-1 text-[10px] text-slate-700">
              Total
            </td>
            <td
              className="border-r border-slate-300 px-1 py-1 text-right font-mono text-[11px] tabular-nums text-slate-900"
              data-testid="text-total-caisse"
            >
              {formatNumber(totalCaisse)}
            </td>
            <td
              className="px-1 py-1 text-right font-mono text-[11px] tabular-nums text-slate-900"
              data-testid="text-total-coffre"
            >
              {formatNumber(totalCoffre)}
            </td>
          </tr>
          
          <tr className="border-t border-slate-300 bg-gradient-to-r from-primary/90 to-primary/80 font-bold">
            <td className="px-1 py-1.5 text-[11px] text-white bg-[#19a89a]">
              TOTAL
            </td>
            <td
              className="px-1 py-1.5 text-right font-mono text-sm tabular-nums text-white bg-[#19a89a]"
              colSpan={2}
              data-testid="text-grand-total"
            >
              {formatNumber(grandTotal)} DH
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
