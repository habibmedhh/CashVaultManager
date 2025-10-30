import EditableCell from "./EditableCell";

interface Denomination {
  value: number;
  quantity: number;
}

interface CashCountTableProps {
  title: string;
  denominations: Denomination[];
  onQuantityChange: (index: number, quantity: number) => void;
  dataTestIdPrefix: string;
}

export default function CashCountTable({
  title,
  denominations,
  onQuantityChange,
  dataTestIdPrefix,
}: CashCountTableProps) {
  const calculateAmount = (value: number, quantity: number) => value * quantity;

  const total = denominations.reduce(
    (sum, denom) => sum + calculateAmount(denom.value, denom.quantity),
    0
  );

  const formatNumber = (num: number) => {
    return num.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="flex flex-col">
      <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide">
        {title}
      </h3>
      <table className="border-collapse border">
        <thead>
          <tr className="bg-muted/50">
            <th className="border px-2 py-2 text-xs font-semibold uppercase text-left">
              Billets
            </th>
            <th className="border px-2 py-2 text-xs font-semibold uppercase text-center w-24">
              Nombre
            </th>
            <th className="border px-2 py-2 text-xs font-semibold uppercase text-right w-32">
              Montant
            </th>
          </tr>
        </thead>
        <tbody>
          {denominations.map((denom, index) => (
            <tr key={index}>
              <td className="border px-2 py-1 text-sm font-medium">
                {formatNumber(denom.value)}
              </td>
              <td className="border p-0">
                <EditableCell
                  value={denom.quantity}
                  onChange={(qty) => onQuantityChange(index, qty)}
                  className="border-0 w-full"
                  dataTestId={`${dataTestIdPrefix}-quantity-${index}`}
                />
              </td>
              <td className="border px-2 py-1 text-right font-mono text-sm tabular-nums bg-muted/30">
                {formatNumber(calculateAmount(denom.value, denom.quantity))}
              </td>
            </tr>
          ))}
          <tr className="font-bold border-t-2">
            <td className="border px-2 py-2 text-sm" colSpan={2}>
              Total
            </td>
            <td
              className="border px-2 py-2 text-right font-mono text-base tabular-nums bg-accent/30"
              data-testid={`${dataTestIdPrefix}-total`}
            >
              {formatNumber(total)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
