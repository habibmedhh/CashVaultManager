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

interface CashItem {
  value: number;
  caisseAmount: number;
  coffreAmount: number;
  color: string;
  icon: string;
  type: "billet" | "piece";
}

export default function CashRegister() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());

  const [items, setItems] = useState<CashItem[]>([
    { value: 200, caisseAmount: 200, coffreAmount: 0, color: "#3B82F6", icon: "💵", type: "billet" },
    { value: 100, caisseAmount: 200, coffreAmount: 100, color: "#92400E", icon: "💵", type: "billet" },
    { value: 50, caisseAmount: 0, coffreAmount: 0, color: "#059669", icon: "💵", type: "billet" },
    { value: 20, caisseAmount: 20, coffreAmount: 0, color: "#7C3AED", icon: "💵", type: "billet" },
    { value: 10, caisseAmount: 0, coffreAmount: 0, color: "#DC2626", icon: "💵", type: "billet" },
    { value: 5, caisseAmount: 0, coffreAmount: 0, color: "#EA580C", icon: "💵", type: "billet" },
    { value: 2, caisseAmount: 2, coffreAmount: 0, color: "#64748B", icon: "🪙", type: "piece" },
    { value: 1, caisseAmount: 0, coffreAmount: 0, color: "#71717A", icon: "🪙", type: "piece" },
    { value: 0.5, caisseAmount: 0, coffreAmount: 0, color: "#A8A29E", icon: "🪙", type: "piece" },
    { value: 0.2, caisseAmount: 0.2, coffreAmount: 0.6, color: "#D4D4D8", icon: "🪙", type: "piece" },
    { value: 0.1, caisseAmount: 0.3, coffreAmount: 0, color: "#E5E5E5", icon: "🪙", type: "piece" },
    { value: 0.01, caisseAmount: 0.01, coffreAmount: 0, color: "#FEFEFE", icon: "🪙", type: "piece" },
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

  const handleItemChange = (
    index: number,
    field: "caisseAmount" | "coffreAmount",
    value: number
  ) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleOperationChange = (
    id: string,
    field: keyof Operation,
    value: string | number | any
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

  const totalCaisse = items.reduce((sum, item) => sum + item.caisseAmount, 0);
  const totalOperations = operations.reduce((sum, op) => sum + op.amount, 0);

  const handleSave = () => {
    console.log("Saving cash register data...", {
      date,
      items,
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
    <div className="min-h-screen bg-slate-50 p-3">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-800 to-slate-700 shadow-lg print:hidden rounded-lg px-4 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold tracking-tight text-white">
                PV D'ARRÊTÉ DE CAISSE
              </h1>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-slate-600 border-slate-500 hover:bg-slate-500 text-white"
                    data-testid="button-date-picker"
                  >
                    <CalendarIcon className="w-3 h-3" />
                    <span className="text-xs">{format(date, "dd/MM/yyyy", { locale: fr })}</span>
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
              <Button onClick={handleSave} size="sm" data-testid="button-save" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                <Save className="w-3 h-3 mr-1" />
                <span className="text-xs font-medium">Enregistrer</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadExcel}
                data-testid="button-download-excel"
                className="bg-white/10 border-slate-500 hover:bg-white/20 text-white"
              >
                <Download className="w-3 h-3 mr-1" />
                <span className="text-xs">Excel</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                data-testid="button-download-pdf"
                className="bg-white/10 border-slate-500 hover:bg-white/20 text-white"
              >
                <Download className="w-3 h-3 mr-1" />
                <span className="text-xs">PDF</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                data-testid="button-print"
                className="bg-white/10 border-slate-500 hover:bg-white/20 text-white"
              >
                <Printer className="w-3 h-3 mr-1" />
                <span className="text-xs">Imprimer</span>
              </Button>
            </div>
          </div>
        </div>

        <IntegratedCashTable
          items={items}
          onItemChange={handleItemChange}
        />

        <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-card">
          <OperationsTable
            operations={operations}
            onOperationChange={handleOperationChange}
            onAddOperation={handleAddOperation}
            onRemoveOperation={handleRemoveOperation}
            date={date}
          />
        </div>

        <div className="border border-border rounded-lg p-3 shadow-sm bg-card">
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
