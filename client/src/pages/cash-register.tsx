import { useState, useEffect } from "react";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import { type User } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { exportToPDF } from "@/lib/exportPDF";
import { exportToExcel } from "@/lib/exportExcel";

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
  const { selectedUserId } = useUser();
  const [date, setDate] = useState<Date>(new Date());
  const [hideZeroRows, setHideZeroRows] = useState(false);

  // Get the selected user's info
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/users", selectedUserId],
    enabled: !!selectedUserId,
    queryFn: async () => {
      const response = await fetch(`/api/users/${selectedUserId}`);
      if (!response.ok) throw new Error("Failed to load user");
      return response.json();
    },
  });

  const [items, setItems] = useState<CashItem[]>([
    { value: 200, caisseAmount: 200, coffreAmount: 0, color: "#3B82F6", icon: "", type: "billet" },
    { value: 100, caisseAmount: 200, coffreAmount: 100, color: "#92400E", icon: "", type: "billet" },
    { value: 50, caisseAmount: 0, coffreAmount: 0, color: "#059669", icon: "", type: "billet" },
    { value: 20, caisseAmount: 20, coffreAmount: 0, color: "#7C3AED", icon: "", type: "billet" },
    { value: 10, caisseAmount: 0, coffreAmount: 0, color: "#DC2626", icon: "", type: "billet" },
    { value: 5, caisseAmount: 0, coffreAmount: 0, color: "#EA580C", icon: "", type: "billet" },
    { value: 2, caisseAmount: 2, coffreAmount: 0, color: "#64748B", icon: "", type: "piece" },
    { value: 1, caisseAmount: 0, coffreAmount: 0, color: "#71717A", icon: "", type: "piece" },
    { value: 0.5, caisseAmount: 0, coffreAmount: 0, color: "#A8A29E", icon: "", type: "piece" },
    { value: 0.2, caisseAmount: 0.2, coffreAmount: 0.6, color: "#D4D4D8", icon: "", type: "piece" },
    { value: 0.1, caisseAmount: 0.3, coffreAmount: 0, color: "#E5E5E5", icon: "", type: "piece" },
    { value: 0.01, caisseAmount: 0.01, coffreAmount: 0, color: "#FEFEFE", icon: "", type: "piece" },
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
      ops.map((op) => {
        if (op.id === id) {
          const updated: any = { ...op, [field]: value };
          // Si le nom est rempli, ce n'est plus une nouvelle opération
          if (field === "name" && value !== "") {
            updated.isNew = false;
          }
          return updated;
        }
        return op;
      })
    );
  };

  const handleAddOperation = (label: string, type: "IN" | "OUT") => {
    const newOp: Operation = {
      id: Date.now().toString(),
      name: label,
      number: 0,
      amount: 0,
      type: type,
      isNew: false,
    };
    setOperations([...operations, newOp]);
  };

  const handleRemoveOperation = (id: string) => {
    setOperations(operations.filter((op) => op.id !== id));
  };

  const handleClearOperations = () => {
    // Remettre tous les montants à zéro sans supprimer les lignes
    setOperations(operations.map(op => ({ ...op, amount: 0 })));
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

  const handleAddTransaction = (type: "versement" | "retrait", label: string, description: string, amount: number) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type,
      label,
      description,
      amount,
    };
    setTransactions([...transactions, newTransaction]);
  };

  const handleRemoveTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const totalCaisse = items.reduce((sum, item) => sum + item.caisseAmount, 0);
  const totalCoffre = items.reduce((sum, item) => sum + item.coffreAmount, 0);
  // Total des opérations = IN - OUT
  const totalOperations = operations.reduce((sum, op) => {
    if (op.type === "OUT") {
      return sum - op.amount;
    }
    // Pour IN ou opérations sans type (compatibilité avec anciennes données)
    return sum + op.amount;
  }, 0);

  const dateKey = format(date, "yyyy-MM-dd");

  // Charger les données pour la date sélectionnée
  const { data: savedData, isLoading } = useQuery<{
    id: string;
    date: string;
    billsData: string;
    coinsData: string;
    operationsData: string;
    transactionsData: string;
    soldeDepart: number;
  }>({
    queryKey: [`/api/cash-register/${dateKey}/user/${selectedUserId}`],
    enabled: !!selectedUserId,
  });

  // Mettre à jour l'état quand les données sont chargées
  useEffect(() => {
    if (savedData) {
      try {
        const billsData = JSON.parse(savedData.billsData);
        const coinsData = JSON.parse(savedData.coinsData);
        const combinedItems = [...billsData, ...coinsData];
        setItems(combinedItems);
        
        setOperations(JSON.parse(savedData.operationsData));
        setTransactions(JSON.parse(savedData.transactionsData));
        setSoldeDepart(savedData.soldeDepart);
      } catch (e) {
        console.error("Erreur lors du chargement des données:", e);
      }
    }
  }, [savedData]);

  // Invalider le cache quand la date change pour recharger les données
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: [`/api/cash-register/${dateKey}/user/${selectedUserId}`] });
  }, [dateKey, selectedUserId]);

  const handleSave = async () => {
    if (!selectedUserId || !currentUser?.agencyId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un agent avant d'enregistrer.",
        variant: "destructive",
      });
      return;
    }

    try {
      const billsData = items.filter(item => item.type === "billet");
      const coinsData = items.filter(item => item.type === "piece");

      console.log("[DEBUG] handleSave - operations before save:", operations.slice(0, 3));

      const data = {
        userId: selectedUserId,
        agencyId: currentUser.agencyId,
        date: dateKey,
        billsData: JSON.stringify(billsData),
        coinsData: JSON.stringify(coinsData),
        operationsData: JSON.stringify(operations),
        transactionsData: JSON.stringify(transactions),
        soldeDepart,
      };

      const response = await fetch("/api/cash-register", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'enregistrement");
      }

      const savedResult = await response.json();
      console.log("[DEBUG] handleSave - savedResult operations:", JSON.parse(savedResult.operationsData).slice(0, 3));

      // Mettre à jour le cache avec les données sauvegardées
      queryClient.setQueryData([`/api/cash-register/${dateKey}/user/${selectedUserId}`], savedResult);

      toast({
        title: "Enregistré",
        description: "Les données ont été enregistrées avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les données.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadExcel = () => {
    try {
      const billsData = items.filter(item => item.type === "billet");
      const coinsData = items.filter(item => item.type === "piece");
      
      const exportData = {
        date: format(date, "dd/MM/yyyy", { locale: fr }),
        billsData: JSON.stringify(billsData),
        coinsData: JSON.stringify(coinsData),
        operationsData: JSON.stringify(operations),
        transactionsData: JSON.stringify(transactions),
        soldeDepart,
        userName: currentUser?.fullName || currentUser?.username,
        agencyName: currentUser?.agencyId || undefined,
      };
      
      exportToExcel(exportData);
      
      toast({
        title: "Exportation Excel",
        description: "Le fichier Excel a été téléchargé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter le fichier Excel.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = () => {
    try {
      const billsData = items.filter(item => item.type === "billet");
      const coinsData = items.filter(item => item.type === "piece");
      
      const exportData = {
        date: format(date, "dd/MM/yyyy", { locale: fr }),
        billsData: JSON.stringify(billsData),
        coinsData: JSON.stringify(coinsData),
        operationsData: JSON.stringify(operations),
        transactionsData: JSON.stringify(transactions),
        soldeDepart,
        userName: currentUser?.fullName || currentUser?.username,
        agencyName: currentUser?.agencyId || undefined,
      };
      
      exportToPDF(exportData);
      
      toast({
        title: "Exportation PDF",
        description: "Le fichier PDF a été téléchargé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter le fichier PDF.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    console.log("Printing...");
    window.print();
  };

  if (!selectedUserId) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Aucun agent sélectionné</h2>
          <p className="text-slate-600">
            Veuillez sélectionner un agent dans le menu en haut de la page pour commencer à saisir un PV.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-800 to-slate-700 shadow-lg print:hidden rounded-lg px-4 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
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
              <label className="flex items-center gap-2 cursor-pointer bg-slate-600 px-3 py-1.5 rounded-md border border-slate-500 hover:bg-slate-500 transition-colors">
                <input
                  type="checkbox"
                  checked={hideZeroRows}
                  onChange={(e) => setHideZeroRows(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-400 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                  data-testid="checkbox-hide-zero"
                />
                <span className="text-xs text-white font-medium">Masquer les lignes à zéro</span>
              </label>
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

        <div className="flex flex-col lg:flex-row gap-4 items-start justify-center">
          <IntegratedCashTable
            items={items}
            onItemChange={handleItemChange}
            hideZeroRows={hideZeroRows}
          />

          <div className="w-full lg:max-w-md mx-auto border border-border rounded-lg overflow-hidden shadow-sm bg-card">
            <OperationsTable
              operations={operations}
              onOperationChange={handleOperationChange}
              onAddOperation={handleAddOperation}
              onRemoveOperation={handleRemoveOperation}
              onClearOperations={handleClearOperations}
              date={date}
              hideZeroRows={hideZeroRows}
            />
          </div>
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
            totalCoffre={totalCoffre}
            totalOperations={totalOperations}
          />
        </div>
      </div>
    </div>
  );
}
