import EditableCell from "./EditableCell";

interface Denomination {
  value: number;
  caisseQty: number;
  coffreQty: number;
}

interface IntegratedCashTableProps {
  bills: Denomination[];
  coins: Denomination[];
  onBillChange: (index: number, field: "caisseQty" | "coffreQty", value: number) => void;
  onCoinChange: (index: number, field: "caisseQty" | "coffreQty", value: number) => void;
}

export default function IntegratedCashTable({
  bills,
  coins,
  onBillChange,
  onCoinChange,
}: IntegratedCashTableProps) {
  const calculateTotal = (items: Denomination[], field: "caisseQty" | "coffreQty") => {
    return items.reduce((sum, item) => sum + item.value * item[field], 0);
  };

  const totalBillsCaisse = calculateTotal(bills, "caisseQty");
  const totalBillsCoffre = calculateTotal(bills, "coffreQty");
  const totalCoinsCaisse = calculateTotal(coins, "caisseQty");
  const totalCoinsCoffre = calculateTotal(coins, "coffreQty");
  const totalCaisse = totalBillsCaisse + totalCoinsCaisse;
  const totalCoffre = totalBillsCoffre + totalCoinsCoffre;
  const grandTotal = totalCaisse + totalCoffre;

  const formatNumber = (num: number) => {
    return num.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="border-2 border-border rounded-md overflow-hidden shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-primary/10 to-primary/5 border-b-2 border-border">
            <th className="border-r border-border px-3 py-3 text-sm font-bold text-left" rowSpan={2}>
              Billets
            </th>
            <th className="border-r border-border px-3 py-3 text-sm font-bold text-center bg-editable/30" colSpan={2}>
              Caisse
            </th>
            <th className="px-3 py-3 text-sm font-bold text-center bg-blue-50" colSpan={2}>
              Coffre
            </th>
          </tr>
          <tr className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
            <th className="border-r border-border px-2 py-2 text-xs font-semibold uppercase bg-editable/20 w-24">
              Nombre
            </th>
            <th className="border-r border-border px-2 py-2 text-xs font-semibold uppercase bg-editable/20 w-28">
              Montant
            </th>
            <th className="border-r border-border px-2 py-2 text-xs font-semibold uppercase bg-blue-50 w-24">
              Nombre
            </th>
            <th className="px-2 py-2 text-xs font-semibold uppercase bg-blue-50 w-28">
              Montant
            </th>
          </tr>
        </thead>
        <tbody>
          {bills.map((bill, index) => (
            <tr key={`bill-${index}`} className="hover:bg-muted/20 transition-colors">
              <td className="border-r border-border px-3 py-1 text-sm font-medium bg-muted/10">
                {formatNumber(bill.value)}
              </td>
              <td className="border-r border-border p-0">
                <EditableCell
                  value={bill.caisseQty}
                  onChange={(val) => onBillChange(index, "caisseQty", val)}
                  className="border-0 w-full rounded-none"
                  dataTestId={`input-bill-caisse-${index}`}
                />
              </td>
              <td className="border-r border-border px-2 py-1 text-right font-mono text-sm tabular-nums bg-muted/5">
                {formatNumber(bill.value * bill.caisseQty)}
              </td>
              <td className="border-r border-border p-0">
                <EditableCell
                  value={bill.coffreQty}
                  onChange={(val) => onBillChange(index, "coffreQty", val)}
                  className="border-0 w-full rounded-none bg-blue-50/50"
                  dataTestId={`input-bill-coffre-${index}`}
                />
              </td>
              <td className="px-2 py-1 text-right font-mono text-sm tabular-nums bg-blue-50/30">
                {formatNumber(bill.value * bill.coffreQty)}
              </td>
            </tr>
          ))}
          
          <tr className="border-t-2 border-border">
            <td className="border-r border-border px-3 py-2 text-sm font-bold bg-primary/5" colSpan={1}>
              Pièces
            </td>
            <td className="border-r border-border" colSpan={2}></td>
            <td colSpan={2}></td>
          </tr>
          
          {coins.map((coin, index) => (
            <tr key={`coin-${index}`} className="hover:bg-muted/20 transition-colors">
              <td className="border-r border-border px-3 py-1 text-sm font-medium bg-muted/10">
                {formatNumber(coin.value)}
              </td>
              <td className="border-r border-border p-0">
                <EditableCell
                  value={coin.caisseQty}
                  onChange={(val) => onCoinChange(index, "caisseQty", val)}
                  className="border-0 w-full rounded-none"
                  dataTestId={`input-coin-caisse-${index}`}
                />
              </td>
              <td className="border-r border-border px-2 py-1 text-right font-mono text-sm tabular-nums bg-muted/5">
                {formatNumber(coin.value * coin.caisseQty)}
              </td>
              <td className="border-r border-border p-0">
                <EditableCell
                  value={coin.coffreQty}
                  onChange={(val) => onCoinChange(index, "coffreQty", val)}
                  className="border-0 w-full rounded-none bg-blue-50/50"
                  dataTestId={`input-coin-coffre-${index}`}
                />
              </td>
              <td className="px-2 py-1 text-right font-mono text-sm tabular-nums bg-blue-50/30">
                {formatNumber(coin.value * coin.coffreQty)}
              </td>
            </tr>
          ))}
          
          <tr className="border-t-2 border-border bg-gradient-to-r from-accent/30 to-accent/20 font-bold">
            <td className="border-r border-border px-3 py-3 text-base">
              Total
            </td>
            <td className="border-r border-border" colSpan={1}></td>
            <td
              className="border-r border-border px-2 py-3 text-right font-mono text-base tabular-nums bg-editable/40"
              data-testid="text-total-caisse"
            >
              {formatNumber(totalCaisse)}
            </td>
            <td className="border-r border-border" colSpan={1}></td>
            <td
              className="px-2 py-3 text-right font-mono text-base tabular-nums bg-blue-100/60"
              data-testid="text-total-coffre"
            >
              {formatNumber(totalCoffre)}
            </td>
          </tr>
          
          <tr className="border-t-2 border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 font-bold">
            <td className="px-3 py-3 text-lg" colSpan={3}>
              Total Général
            </td>
            <td
              className="px-3 py-3 text-right font-mono text-lg tabular-nums bg-primary/20"
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
