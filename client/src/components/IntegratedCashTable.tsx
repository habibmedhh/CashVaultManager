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
}

export default function IntegratedCashTable({
  items,
  onItemChange,
}: IntegratedCashTableProps) {
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
    <div className="border-2 border-border rounded-md overflow-hidden shadow-md">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-primary/15 to-primary/8">
            <th className="border-r border-border px-2 py-2 text-xs font-bold uppercase text-left w-20">
              
            </th>
            <th className="border-r border-border px-2 py-2 text-xs font-bold text-center bg-editable/40" colSpan={1}>
              Caisse
            </th>
            <th className="px-2 py-2 text-xs font-bold text-center bg-blue-100/60" colSpan={1}>
              Coffre
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="hover:bg-muted/20 transition-colors">
              <td className="border-r border-border px-2 py-1 text-center bg-muted/10">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-base" style={{ color: item.color }}>
                    {item.icon}
                  </span>
                  <span className="text-xs font-semibold">
                    {formatNumber(item.value)}
                  </span>
                </div>
              </td>
              <td className="border-r border-border p-0">
                <EditableCell
                  value={item.caisseAmount}
                  onChange={(val) => onItemChange(index, "caisseAmount", val)}
                  className="border-0 w-full rounded-none h-8 text-xs px-1"
                  dataTestId={`input-item-caisse-${index}`}
                />
              </td>
              <td className="p-0">
                <EditableCell
                  value={item.coffreAmount}
                  onChange={(val) => onItemChange(index, "coffreAmount", val)}
                  className="border-0 w-full rounded-none h-8 text-xs px-1 bg-blue-50/50"
                  dataTestId={`input-item-coffre-${index}`}
                />
              </td>
            </tr>
          ))}
          
          <tr className="border-t-2 border-border bg-gradient-to-r from-accent/40 to-accent/20 font-bold">
            <td className="border-r border-border px-2 py-2 text-sm">
              Total
            </td>
            <td
              className="border-r border-border px-2 py-2 text-right font-mono text-sm tabular-nums bg-editable/50"
              data-testid="text-total-caisse"
            >
              {formatNumber(totalCaisse)}
            </td>
            <td
              className="px-2 py-2 text-right font-mono text-sm tabular-nums bg-blue-100/70"
              data-testid="text-total-coffre"
            >
              {formatNumber(totalCoffre)}
            </td>
          </tr>
          
          <tr className="border-t-2 border-primary/40 bg-gradient-to-r from-primary/15 to-primary/8 font-bold">
            <td className="px-2 py-2 text-base">
              Total
            </td>
            <td
              className="px-2 py-2 text-right font-mono text-base tabular-nums bg-primary/25"
              colSpan={2}
              data-testid="text-grand-total"
            >
              {formatNumber(grandTotal)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
