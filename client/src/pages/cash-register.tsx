import { useState, useEffect, useRef } from "react";
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
import { type User, type PVConfiguration } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { exportToPDF } from "@/lib/exportPDF";
import { exportToExcel } from "@/lib/exportExcel";
import { useLocation } from "wouter";

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
  const [, setLocation] = useLocation();
  const [date, setDate] = useState<Date>(new Date());
  const [hideZeroRows, setHideZeroRows] = useState(false);
  const [showCashTable, setShowCashTable] = useState(true);

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
    { value: 200, caisseAmount: 0, coffreAmount: 0, color: "#3B82F6", icon: "", type: "billet" },
    { value: 100, caisseAmount: 0, coffreAmount: 0, color: "#92400E", icon: "", type: "billet" },
    { value: 50, caisseAmount: 0, coffreAmount: 0, color: "#059669", icon: "", type: "billet" },
    { value: 20, caisseAmount: 0, coffreAmount: 0, color: "#7C3AED", icon: "", type: "billet" },
    { value: 10, caisseAmount: 0, coffreAmount: 0, color: "#DC2626", icon: "", type: "billet" },
    { value: 5, caisseAmount: 0, coffreAmount: 0, color: "#EA580C", icon: "", type: "billet" },
    { value: 2, caisseAmount: 0, coffreAmount: 0, color: "#64748B", icon: "", type: "piece" },
    { value: 1, caisseAmount: 0, coffreAmount: 0, color: "#71717A", icon: "", type: "piece" },
    { value: 0.5, caisseAmount: 0, coffreAmount: 0, color: "#A8A29E", icon: "", type: "piece" },
    { value: 0.2, caisseAmount: 0, coffreAmount: 0, color: "#D4D4D8", icon: "", type: "piece" },
    { value: 0.1, caisseAmount: 0, coffreAmount: 0, color: "#E5E5E5", icon: "", type: "piece" },
    { value: 0.01, caisseAmount: 0, coffreAmount: 0, color: "#FEFEFE", icon: "", type: "piece" },
  ]);

  const [operations, setOperations] = useState<Operation[]>([]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [soldeDepart, setSoldeDepart] = useState(0);

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

  // Charger la configuration PV pour initialiser les opérations
  const { data: pvConfig } = useQuery<PVConfiguration>({
    queryKey: ["/api/pv-configuration"],
  });

  // Charger le solde final du jour précédent pour cet agent
  const { data: previousSoldeData } = useQuery<{ soldeFinal: number }>({
    queryKey: ["/api/previous-solde-final/date", dateKey, "user", selectedUserId],
    enabled: !!selectedUserId,
  });

  // Flag pour savoir si on a déjà initialisé les opérations depuis la config
  const operationsInitialized = useRef(false);

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
        operationsInitialized.current = true;
      } catch (e) {
        console.error("Erreur lors du chargement des données:", e);
      }
    } else if (!isLoading && previousSoldeData) {
      // Si pas de données sauvegardées, utiliser le solde final du jour précédent
      setSoldeDepart(previousSoldeData.soldeFinal);
    }
  }, [savedData, isLoading, previousSoldeData]);

  // Initialiser les opérations depuis la configuration si pas de données sauvegardées
  useEffect(() => {
    if (!isLoading && !savedData && pvConfig && !operationsInitialized.current) {
      try {
        interface OperationConfig {
          name: string;
          defaultNumber: number;
        }
        
        const opsIn = JSON.parse(pvConfig.operationsInData) as OperationConfig[];
        const opsOut = JSON.parse(pvConfig.operationsOutData) as OperationConfig[];
        
        const initialOperations: Operation[] = [
          ...opsIn.map((op, idx) => ({
            id: `in-${idx}`,
            name: op.name,
            number: op.defaultNumber,
            amount: 0,
            type: "IN" as const,
          })),
          ...opsOut.map((op, idx) => ({
            id: `out-${idx}`,
            name: op.name,
            number: op.defaultNumber,
            amount: 0,
            type: "OUT" as const,
          })),
        ];
        
        setOperations(initialOperations);
        operationsInitialized.current = true;
      } catch (e) {
        console.error("Erreur lors de l'initialisation des opérations:", e);
      }
    }
  }, [pvConfig, savedData, isLoading]);

  // Invalider le cache quand la date change pour recharger les données
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: [`/api/cash-register/${dateKey}/user/${selectedUserId}`] });
    // Réinitialiser le flag quand on change de date pour permettre une nouvelle initialisation
    operationsInitialized.current = false;
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

  const handleDownloadExcel = async () => {
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
      
      await exportToExcel(exportData);
      
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
    try {
      const billsData = items.filter(item => item.type === "billet");
      const coinsData = items.filter(item => item.type === "piece");
      
      const printData = {
        date: format(date, "dd/MM/yyyy", { locale: fr }),
        billsData,
        coinsData,
        operationsData: operations,
        transactionsData: transactions,
        soldeDepart,
        userName: currentUser?.fullName || currentUser?.username,
        agencyName: currentUser?.agencyId || undefined,
      };
      
      // Encoder les données en base64 pour les passer via l'URL
      const encodedData = btoa(encodeURIComponent(JSON.stringify(printData)));
      
      // Ouvrir la page d'impression avec les données encodées dans l'URL
      const printWindow = window.open(`/imprimer-pv?data=${encodedData}`, '_blank');
      
      // Si le popup est bloqué
      if (!printWindow) {
        toast({
          title: "Popup bloqué",
          description: "Veuillez autoriser les popups pour cette page.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[ERROR] handlePrint:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir la page d'impression.",
        variant: "destructive",
      });
    }
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
        <div className="sticky top-0 z-10 bg-white shadow-md print:hidden rounded-lg px-4 py-2 border-b">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-slate-800">
                💼 PV de Caisse
              </h1>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 h-8 text-xs"
                    data-testid="button-date-picker"
                    title="Sélectionner la date"
                  >
                    📅 {format(date, "dd/MM/yyyy", { locale: fr })}
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
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 cursor-pointer" title="Masquer les lignes à zéro">
                <input
                  type="checkbox"
                  checked={hideZeroRows}
                  onChange={(e) => setHideZeroRows(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-400 text-emerald-600 cursor-pointer"
                  data-testid="checkbox-hide-zero"
                />
                <span className="text-xs">🚫0</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer" title="Afficher Caisse & Coffre">
                <input
                  type="checkbox"
                  checked={showCashTable}
                  onChange={(e) => setShowCashTable(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-400 text-emerald-600 cursor-pointer"
                  data-testid="checkbox-show-cash-table"
                />
                <span className="text-xs">💰</span>
              </label>
              <Button onClick={handleSave} size="sm" data-testid="button-save" className="h-8 px-3" title="Enregistrer">
                💾
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadExcel}
                data-testid="button-download-excel"
                className="h-8 px-3"
                title="Télécharger Excel"
              >
                📊
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                data-testid="button-download-pdf"
                className="h-8 px-3"
                title="Télécharger PDF"
              >
                📄
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                data-testid="button-print"
                className="h-8 px-3"
                title="Imprimer"
              >
                🖨️
              </Button>
            </div>
          </div>
        </div>

        {showCashTable && (
          <div className="flex justify-center">
            <IntegratedCashTable
              items={items}
              onItemChange={handleItemChange}
              hideZeroRows={hideZeroRows}
            />
          </div>
        )}

        <div className="flex justify-center">
          <div className="w-full lg:max-w-md border border-border rounded-lg overflow-hidden shadow-sm bg-card">
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

        <div className="border border-border rounded-lg p-3 shadow-sm bg-card pl-[120px] pr-[120px] pt-[0px] pb-[0px]">
          <BalanceSection
            transactions={transactions}
            onTransactionChange={handleTransactionChange}
            onAddTransaction={handleAddTransaction}
            onRemoveTransaction={handleRemoveTransaction}
            soldeDepart={soldeDepart}
            totalCaisse={totalCaisse}
            totalCoffre={totalCoffre}
            totalOperations={totalOperations}
          />
        </div>
      </div>
    </div>
  );
}
