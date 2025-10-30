import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, Printer, Save } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import CashCountTable from "@/components/CashCountTable";
import OperationsTable, { type Operation } from "@/components/OperationsTable";
import BalanceSection, { type Transaction } from "@/components/BalanceSection";
import { useToast } from "@/hooks/use-toast";

interface Denomination {
  value: number;
  quantity: number;
}

export default function CashRegister() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());

  const [bills, setBills] = useState<Denomination[]>([
    { value: 200, quantity: 1 },
    { value: 100, quantity: 2 },
    { value: 50, quantity: 0 },
    { value: 20, quantity: 1 },
    { value: 10, quantity: 0 },
    { value: 5, quantity: 0 },
    { value: 2, quantity: 1 },
  ]);

  const [coins, setCoins] = useState<Denomination[]>([
    { value: 2, quantity: 0 },
    { value: 1, quantity: 0 },
    { value: 0.5, quantity: 0 },
    { value: 0.2, quantity: 1 },
    { value: 0.1, quantity: 3 },
    { value: 0.05, quantity: 0 },
    { value: 0.02, quantity: 0 },
    { value: 0.01, quantity: 1 },
  ]);

  const [operations, setOperations] = useState<Operation[]>([
    { id: "1", name: "WESTERN UNION", number: 0, amount: 0 },
    { id: "2", name: "MONEY GRAM", number: 0, amount: 10475.7 },
    { id: "3", name: "remis/Invest/mony", number: 0, amount: 500 },
    { id: "4", name: "l'adaptapenda-smallworld set", number: 0, amount: 0 },
    { id: "5", name: "RIA-zoombbql danse", number: 0, amount: 4000 },
    { id: "6", name: "PAIEMENT GAZ", number: 0, amount: 0 },
    { id: "7", name: "money l-chtene zerowword remis", number: 0, amount: 0 },
    { id: "8", name: "EXPISSION CASHPLUS", number: 0, amount: 1373.69 },
    { id: "9", name: "RECHARGE IAMM/orange/IAVI", number: 0, amount: 0 },
    { id: "10", name: "BECHARGE IAMM/orange/IAVI", number: 0, amount: 0 },
    { id: "11", name: "ENVOI MG + VU", number: 0, amount: 0 },
    { id: "12", name: "PAIEMENT MARCHAND", number: 0, amount: -23012 },
    { id: "13", name: "TAXES / IMPOTS", number: 0, amount: 0 },
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: "1", type: "versement", label: "Versement banque", amount: 0 },
    { id: "2", type: "retrait", label: "Retrait STET", amount: 0 },
  ]);

  const [soldeDepart, setSoldeDepart] = useState(11366.75);

  const handleBillQuantityChange = (index: number, quantity: number) => {
    const newBills = [...bills];
    newBills[index].quantity = quantity;
    setBills(newBills);
  };

  const handleCoinQuantityChange = (index: number, quantity: number) => {
    const newCoins = [...coins];
    newCoins[index].quantity = quantity;
    setCoins(newCoins);
  };

  const handleOperationChange = (
    id: string,
    field: keyof Operation,
    value: string | number
  ) => {
    setOperations((ops) =>
      ops.map((op) => (op.id === id ? { ...op, [field]: value } : op))
    );
  };

  const handleAddOperation = () => {
    const newOp: Operation = {
      id: Date.now().toString(),
      name: "",
      number: 0,
      amount: 0,
    };
    setOperations([...operations, newOp]);
  };

  const handleRemoveOperation = (id: string) => {
    setOperations(operations.filter((op) => op.id !== id));
  };

  const handleTransactionChange = (
    id: string,
    field: keyof Transaction,
    value: string | number
  ) => {
    setTransactions((trans) =>
      trans.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleAddTransaction = (type: "versement" | "retrait") => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type,
      label: "",
      amount: 0,
    };
    setTransactions([...transactions, newTransaction]);
  };

  const handleRemoveTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const totalBills = bills.reduce(
    (sum, b) => sum + b.value * b.quantity,
    0
  );
  const totalCoins = coins.reduce(
    (sum, c) => sum + c.value * c.quantity,
    0
  );
  const totalCaisse = totalBills + totalCoins;
  const totalOperations = operations.reduce((sum, op) => sum + op.amount, 0);

  const handleSave = () => {
    console.log("Saving cash register data...", {
      date,
      bills,
      coins,
      operations,
      transactions,
      soldeDepart,
    });
    toast({
      title: "Enregistré",
      description: "Les données ont été enregistrées avec succès.",
    });
  };

  const handleDownloadExcel = () => {
    console.log("Downloading Excel...");
    toast({
      title: "Téléchargement Excel",
      description: "Le fichier Excel sera téléchargé prochainement.",
    });
  };

  const handleDownloadPDF = () => {
    console.log("Downloading PDF...");
    toast({
      title: "Téléchargement PDF",
      description: "Le fichier PDF sera téléchargé prochainement.",
    });
  };

  const handlePrint = () => {
    console.log("Printing...");
    window.print();
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="sticky top-0 z-10 bg-background pb-4 border-b print:hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold">PV D'ARRÊTÉ DE CAISSE</h1>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2"
                    data-testid="button-date-picker"
                  >
                    <CalendarIcon className="w-4 h-4" />
                    {format(date, "dd/MM/yyyy", { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSave} data-testid="button-save">
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadExcel}
                data-testid="button-download-excel"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                data-testid="button-download-pdf"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                data-testid="button-print"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimer
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CashCountTable
            title="Billets"
            denominations={bills}
            onQuantityChange={handleBillQuantityChange}
            dataTestIdPrefix="bills"
          />
          <div>
            <CashCountTable
              title="Pièces"
              denominations={coins}
              onQuantityChange={handleCoinQuantityChange}
              dataTestIdPrefix="coins"
            />
            <div className="mt-4 border p-4 space-y-2 bg-card">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Caisse:</span>
                <span className="font-mono tabular-nums" data-testid="text-total-caisse">
                  {formatNumber(totalCaisse)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Coffre:</span>
                <span className="font-mono tabular-nums" data-testid="text-total-coffre">
                  {formatNumber(0)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t font-bold text-lg">
                <span>Total:</span>
                <span className="font-mono tabular-nums" data-testid="text-grand-total">
                  {formatNumber(totalCaisse)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <OperationsTable
          operations={operations}
          onOperationChange={handleOperationChange}
          onAddOperation={handleAddOperation}
          onRemoveOperation={handleRemoveOperation}
        />

        <BalanceSection
          transactions={transactions}
          onTransactionChange={handleTransactionChange}
          onAddTransaction={handleAddTransaction}
          onRemoveTransaction={handleRemoveTransaction}
          soldeDepart={soldeDepart}
          onSoldeChange={setSoldeDepart}
          totalCaisse={totalCaisse}
          totalOperations={totalOperations}
        />
      </div>
    </div>
  );
}
