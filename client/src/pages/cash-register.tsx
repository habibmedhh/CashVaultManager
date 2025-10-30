import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, Printer, Save } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import IntegratedCashTable from "@/components/IntegratedCashTable";
import OperationsTable, { type Operation } from "@/components/OperationsTable";
import BalanceSection, { type Transaction } from "@/components/BalanceSection";
import { useToast } from "@/hooks/use-toast";

interface Denomination {
  value: number;
  caisseQty: number;
  coffreQty: number;
}

export default function CashRegister() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());

  const [bills, setBills] = useState<Denomination[]>([
    { value: 200, caisseQty: 1, coffreQty: 0 },
    { value: 100, caisseQty: 2, coffreQty: 1 },
    { value: 50, caisseQty: 0, coffreQty: 0 },
    { value: 20, caisseQty: 1, coffreQty: 0 },
    { value: 10, caisseQty: 0, coffreQty: 0 },
    { value: 5, caisseQty: 0, coffreQty: 0 },
    { value: 2, caisseQty: 1, coffreQty: 0 },
  ]);

  const [coins, setCoins] = useState<Denomination[]>([
    { value: 2, caisseQty: 0, coffreQty: 0 },
    { value: 1, caisseQty: 0, coffreQty: 0 },
    { value: 0.5, caisseQty: 0, coffreQty: 0 },
    { value: 0.2, caisseQty: 1, coffreQty: 3 },
    { value: 0.1, caisseQty: 3, coffreQty: 0 },
    { value: 0.05, caisseQty: 0, coffreQty: 0 },
    { value: 0.02, caisseQty: 0, coffreQty: 0 },
    { value: 0.01, caisseQty: 1, coffreQty: 0 },
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
    { id: "14", name: "ASSURANCE AXA SAHAM", number: 0, amount: 0 },
    { id: "15", name: "MIZAT MALL PAY EXPRESSE", number: 0, amount: 0 },
    { id: "16", name: "RECHARGE DETAILLANT", number: 0, amount: 100 },
    { id: "17", name: "RECHARGE COMPTE", number: 0, amount: 0 },
    { id: "18", name: "RETRAIT COMPTE", number: 0, amount: 0 },
    { id: "19", name: "Factures IAM ORANGE IAVI", number: 75, amount: -6662.61 },
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: "1", type: "versement", label: "Versement banque", amount: 0 },
    { id: "2", type: "retrait", label: "Retrait STET", amount: 0 },
  ]);

  const [soldeDepart, setSoldeDepart] = useState(11366.75);

  const handleBillChange = (
    index: number,
    field: "caisseQty" | "coffreQty",
    value: number
  ) => {
    const newBills = [...bills];
    newBills[index][field] = value;
    setBills(newBills);
  };

  const handleCoinChange = (
    index: number,
    field: "caisseQty" | "coffreQty",
    value: number
  ) => {
    const newCoins = [...coins];
    newCoins[index][field] = value;
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

  const calculateTotal = (items: Denomination[], field: "caisseQty" | "coffreQty") => {
    return items.reduce((sum, item) => sum + item.value * item[field], 0);
  };

  const totalBillsCaisse = calculateTotal(bills, "caisseQty");
  const totalCoinsCaisse = calculateTotal(coins, "caisseQty");
  const totalCaisse = totalBillsCaisse + totalCoinsCaisse;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 border-b-2 border-primary/20 shadow-sm print:hidden rounded-md px-4 pt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                PV D'ARRÊTÉ DE CAISSE
              </h1>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 border-2"
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
              <Button onClick={handleSave} data-testid="button-save" className="shadow-md">
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadExcel}
                data-testid="button-download-excel"
                className="border-2"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                data-testid="button-download-pdf"
                className="border-2"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                data-testid="button-print"
                className="border-2"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimer
              </Button>
            </div>
          </div>
        </div>

        <IntegratedCashTable
          bills={bills}
          coins={coins}
          onBillChange={handleBillChange}
          onCoinChange={handleCoinChange}
        />

        <div className="border-2 border-border rounded-md overflow-hidden shadow-sm">
          <OperationsTable
            operations={operations}
            onOperationChange={handleOperationChange}
            onAddOperation={handleAddOperation}
            onRemoveOperation={handleRemoveOperation}
          />
        </div>

        <div className="border-2 border-border rounded-md p-4 shadow-sm bg-card">
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
    </div>
  );
}
