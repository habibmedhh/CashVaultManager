import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, ChevronRight, Calendar, User, ArrowLeft, Filter, Plus, Trash2, Edit, Tag, Users, Settings } from "lucide-react";
import { type Agency, type CashRegister, type User as UserType, type TransactionCategory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface CashItem {
  value: number;
  caisseAmount: number;
  coffreAmount: number;
  color: string;
  icon: string;
  type: "billet" | "piece";
}

interface Operation {
  id: string;
  name: string;
  number: number;
  amount: number;
  type?: "IN" | "OUT";
}

interface Transaction {
  id: string;
  type: "versement" | "retrait";
  label: string;
  description?: string;
  amount: number;
}

interface DailyAggregate {
  date: string;
  soldeDepart: number;
  totalOperations: number;
  versements: number;
  retraits: number;
  soldeFinal: number;
  totalCaisse: number;
  totalCoffre: number;
  ecartCaisse: number;
  userCount: number;
}

const agencySchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  code: z.string().min(1, "Le code est requis"),
});

const userSchema = z.object({
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  password: z.string().min(4, "Le mot de passe doit contenir au moins 4 caractères"),
  fullName: z.string().optional(),
  role: z.string().default("agent"),
  agencyId: z.string(),
});

const transactionCategorySchema = z.object({
  type: z.string().min(1, "Le type est requis"),
  label: z.string().min(1, "Le libellé est requis"),
  description: z.string().optional(),
});

export default function Admin() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [openAgencyDialog, setOpenAgencyDialog] = useState(false);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TransactionCategory | null>(null);

  const { data: agencies = [], isLoading: loadingAgencies } = useQuery<Agency[]>({
    queryKey: ["/api/agencies"],
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users/all"],
  });

  const { data: cashRegisters = [], isLoading: loadingRegisters } = useQuery<CashRegister[]>({
    queryKey: ["/api/cash-registers"],
  });

  const { data: transactionCategories = [] } = useQuery<TransactionCategory[]>({
    queryKey: ["/api/transaction-categories"],
  });

  const selectedAgency = agencies.find(a => a.id === selectedAgencyId);

  const agencyForm = useForm<z.infer<typeof agencySchema>>({
    resolver: zodResolver(agencySchema),
    defaultValues: {
      name: "",
      code: "",
    },
  });

  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      role: "agent",
      agencyId: "none",
    },
  });

  const categoryForm = useForm<z.infer<typeof transactionCategorySchema>>({
    resolver: zodResolver(transactionCategorySchema),
    defaultValues: {
      type: "versement",
      label: "",
      description: "",
    },
  });

  const createAgencyMutation = useMutation({
    mutationFn: (data: z.infer<typeof agencySchema>) =>
      apiRequest("POST", "/api/agencies", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agencies"] });
      toast({
        title: "Agence créée",
        description: "L'agence a été créée avec succès.",
      });
      setOpenAgencyDialog(false);
      agencyForm.reset();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'agence.",
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: z.infer<typeof userSchema>) => {
      const userData = {
        ...data,
        agencyId: data.agencyId === "none" ? undefined : data.agencyId,
      };
      return apiRequest("POST", "/api/users", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/all"] });
      toast({
        title: "Agent créé",
        description: "L'agent a été créé avec succès.",
      });
      setOpenUserDialog(false);
      userForm.reset();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'agent.",
        variant: "destructive",
      });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: z.infer<typeof transactionCategorySchema>) =>
      apiRequest("POST", "/api/transaction-categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transaction-categories"] });
      toast({
        title: "Catégorie créée",
        description: "La catégorie a été créée avec succès.",
      });
      setOpenCategoryDialog(false);
      setEditingCategory(null);
      categoryForm.reset();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la catégorie.",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<z.infer<typeof transactionCategorySchema>> }) =>
      apiRequest("PATCH", `/api/transaction-categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transaction-categories"] });
      toast({
        title: "Catégorie mise à jour",
        description: "La catégorie a été mise à jour avec succès.",
      });
      setOpenCategoryDialog(false);
      setEditingCategory(null);
      categoryForm.reset();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la catégorie.",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/transaction-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transaction-categories"] });
      toast({
        title: "Catégorie supprimée",
        description: "La catégorie a été supprimée avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la catégorie.",
        variant: "destructive",
      });
    },
  });

  const agencyDailyData = useMemo(() => {
    if (!selectedAgencyId || !cashRegisters.length) return [];

    const agencyPVs = cashRegisters.filter(cr => {
      if (cr.agencyId !== selectedAgencyId) return false;
      
      const [year, month, day] = cr.date.split('-');
      const pvMonth = parseInt(month) - 1;
      const pvYear = parseInt(year);
      
      return pvMonth === parseInt(selectedMonth) && pvYear === parseInt(selectedYear);
    });
    
    const dateGroups = new Map<string, CashRegister[]>();
    agencyPVs.forEach(pv => {
      const existing = dateGroups.get(pv.date) || [];
      existing.push(pv);
      dateGroups.set(pv.date, existing);
    });

    const dailyAggregates: DailyAggregate[] = Array.from(dateGroups.entries()).map(([date, pvs]) => {
      const latestPVsByUser = new Map<string, CashRegister>();
      pvs.forEach(pv => {
        if (!pv.userId) return;
        const existing = latestPVsByUser.get(pv.userId);
        if (!existing || new Date(pv.createdAt) > new Date(existing.createdAt)) {
          latestPVsByUser.set(pv.userId, pv);
        }
      });

      const userPVs = Array.from(latestPVsByUser.values());

      let totalSoldeDepart = 0;
      let totalOperationsAmount = 0;
      let totalVersements = 0;
      let totalRetraits = 0;
      let totalCaisseAmount = 0;
      let totalCoffreAmount = 0;

      userPVs.forEach(pv => {
        totalSoldeDepart += pv.soldeDepart;

        try {
          const operations: Operation[] = JSON.parse(pv.operationsData);
          totalOperationsAmount += operations.reduce((sum, op) => sum + (op.amount || 0), 0);

          const transactions: Transaction[] = JSON.parse(pv.transactionsData);
          totalVersements += transactions
            .filter(t => t.type === 'versement')
            .reduce((sum, t) => sum + t.amount, 0);
          totalRetraits += transactions
            .filter(t => t.type === 'retrait')
            .reduce((sum, t) => sum + t.amount, 0);

          const bills: CashItem[] = JSON.parse(pv.billsData);
          const coins: CashItem[] = JSON.parse(pv.coinsData);
          
          [...bills, ...coins].forEach(item => {
            totalCaisseAmount += item.caisseAmount;
            totalCoffreAmount += item.coffreAmount;
          });
        } catch (e) {
          console.error('Error parsing PV data:', e);
        }
      });

      const soldeFinalTheorique = totalSoldeDepart + totalOperationsAmount + totalVersements - totalRetraits;
      const totalCashReel = totalCaisseAmount + totalCoffreAmount;
      const ecartCaisse = totalCashReel - soldeFinalTheorique;

      return {
        date,
        soldeDepart: totalSoldeDepart,
        totalOperations: totalOperationsAmount,
        versements: totalVersements,
        retraits: totalRetraits,
        soldeFinal: soldeFinalTheorique,
        totalCaisse: totalCaisseAmount,
        totalCoffre: totalCoffreAmount,
        ecartCaisse,
        userCount: userPVs.length,
      };
    });

    return dailyAggregates.sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedAgencyId, cashRegisters, selectedMonth, selectedYear]);

  const selectedDateData = useMemo(() => {
    if (!selectedAgencyId || !selectedDate || !cashRegisters.length) return null;

    const datePVs = cashRegisters.filter(
      cr => cr.agencyId === selectedAgencyId && cr.date === selectedDate
    );

    const latestPVsByUser = new Map<string, CashRegister>();
    datePVs.forEach(pv => {
      if (!pv.userId) return;
      const existing = latestPVsByUser.get(pv.userId);
      if (!existing || new Date(pv.createdAt) > new Date(existing.createdAt)) {
        latestPVsByUser.set(pv.userId, pv);
      }
    });

    return Array.from(latestPVsByUser.entries()).map(([userId, pv]) => {
      const user = users.find(u => u.id === userId);
      
      let totalOperations = 0;
      let totalVersements = 0;
      let totalRetraits = 0;
      let totalCaisse = 0;
      let totalCoffre = 0;

      try {
        const operations: Operation[] = JSON.parse(pv.operationsData);
        totalOperations = operations.reduce((sum, op) => sum + (op.amount || 0), 0);

        const transactions: Transaction[] = JSON.parse(pv.transactionsData);
        totalVersements = transactions
          .filter(t => t.type === 'versement')
          .reduce((sum, t) => sum + t.amount, 0);
        totalRetraits = transactions
          .filter(t => t.type === 'retrait')
          .reduce((sum, t) => sum + t.amount, 0);

        const bills: CashItem[] = JSON.parse(pv.billsData);
        const coins: CashItem[] = JSON.parse(pv.coinsData);
        
        [...bills, ...coins].forEach(item => {
          totalCaisse += item.caisseAmount;
          totalCoffre += item.coffreAmount;
        });
      } catch (e) {
        console.error('Error parsing PV data:', e);
      }

      const soldeFinal = pv.soldeDepart + totalOperations + totalVersements - totalRetraits;
      const totalCashReel = totalCaisse + totalCoffre;
      const ecart = totalCashReel - soldeFinal;

      return {
        userId,
        userName: user?.fullName || user?.username || "Inconnu",
        soldeDepart: pv.soldeDepart,
        operations: totalOperations,
        versements: totalVersements,
        retraits: totalRetraits,
        soldeFinal,
        caisse: totalCaisse,
        coffre: totalCoffre,
        ecart,
      };
    });
  }, [selectedAgencyId, selectedDate, cashRegisters, users]);

  const handleEditCategory = (category: TransactionCategory) => {
    setEditingCategory(category);
    categoryForm.reset({
      type: category.type,
      label: category.label,
      description: category.description || "",
    });
    setOpenCategoryDialog(true);
  };

  const handleSaveCategory = (data: z.infer<typeof transactionCategorySchema>) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const versementCategories = transactionCategories.filter(c => c.type === "versement");
  const retraitCategories = transactionCategories.filter(c => c.type === "retrait");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="text-admin-title">
          <Settings className="w-8 h-8 text-primary" />
          Administration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gérer les agences, agents, catégories de transactions et consulter les tableaux de bord
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">
            <Building2 className="w-4 h-4 mr-2" />
            Tableau de bord
          </TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">
            <Tag className="w-4 h-4 mr-2" />
            Catégories
          </TabsTrigger>
          <TabsTrigger value="agencies" data-testid="tab-agencies">
            <Building2 className="w-4 h-4 mr-2" />
            Agences
          </TabsTrigger>
          <TabsTrigger value="agents" data-testid="tab-agents">
            <Users className="w-4 h-4 mr-2" />
            Agents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6 space-y-6">
          {!selectedAgencyId ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Sélectionnez une agence</h2>
              {loadingAgencies ? (
                <div className="text-muted-foreground">Chargement...</div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {agencies.map((agency) => {
                    const agencyUsers = users.filter(u => u.agencyId === agency.id);
                    const agencyPVs = cashRegisters.filter(cr => cr.agencyId === agency.id);
                    
                    const currentMonth = new Date().getMonth();
                    const currentYear = new Date().getFullYear();
                    const monthPVs = agencyPVs.filter(pv => {
                      const [year, month] = pv.date.split('-');
                      return parseInt(year) === currentYear && parseInt(month) - 1 === currentMonth;
                    });
                    
                    const uniqueUsers = new Set(monthPVs.map(pv => pv.userId).filter(Boolean));
                    const activeAgents = uniqueUsers.size;
                    
                    const totalSoldeFinal = monthPVs.reduce((sum, pv) => {
                      try {
                        const operations: Operation[] = JSON.parse(pv.operationsData);
                        const transactions: Transaction[] = JSON.parse(pv.transactionsData);
                        const totalOps = operations.reduce((s, op) => s + (op.amount || 0), 0);
                        const totalVers = transactions.filter(t => t.type === 'versement').reduce((s, t) => s + t.amount, 0);
                        const totalRetr = transactions.filter(t => t.type === 'retrait').reduce((s, t) => s + t.amount, 0);
                        return sum + (pv.soldeDepart + totalOps + totalVers - totalRetr);
                      } catch {
                        return sum;
                      }
                    }, 0);

                    return (
                      <Card
                        key={agency.id}
                        className="overflow-hidden cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary"
                        onClick={() => setSelectedAgencyId(agency.id)}
                        data-testid={`card-agency-${agency.id}`}
                      >
                        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-primary/20 rounded-xl">
                                <Building2 className="w-7 h-7 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-bold text-xl">{agency.name}</h3>
                                <p className="text-sm text-muted-foreground font-medium">{agency.code}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                        
                        <div className="p-5 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Total Agents</div>
                              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{agencyUsers.length}</div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                              <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Agents Actifs</div>
                              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{activeAgents}</div>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg">
                              <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">PVs Ce Mois</div>
                              <div className="flex items-baseline justify-between">
                                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{monthPVs.length}</div>
                                <div className="text-sm text-muted-foreground">Total: {agencyPVs.length}</div>
                              </div>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                              <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">Solde Final Moyen</div>
                              <div className="text-lg font-bold text-amber-700 dark:text-amber-300">
                                {monthPVs.length > 0 ? (totalSoldeFinal / monthPVs.length).toFixed(2) : '0.00'} DH
                              </div>
                            </div>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            className="w-full mt-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAgencyId(agency.id);
                            }}
                          >
                            Voir les détails
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ) : !selectedDate ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedAgencyId(null)}
                  data-testid="button-back-to-agencies"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour aux agences
                </Button>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[140px]" data-testid="select-month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {new Date(2024, i).toLocaleDateString('fr-FR', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[100px]" data-testid="select-year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025].map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-2">{selectedAgency?.name}</h2>
                <p className="text-muted-foreground">{selectedAgency?.code}</p>
              </Card>

              {loadingRegisters ? (
                <div className="text-muted-foreground">Chargement...</div>
              ) : agencyDailyData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Aucun PV pour cette période
                </div>
              ) : (
                <div className="grid gap-6">
                  {agencyDailyData.map((day) => (
                    <Card
                      key={day.date}
                      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary"
                      onClick={() => setSelectedDate(day.date)}
                      data-testid={`card-date-${day.date}`}
                    >
                      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-5 border-b">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-4 bg-indigo-500/20 rounded-xl">
                              <Calendar className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                              <h3 className="font-bold text-xl">
                                {new Date(day.date).toLocaleDateString('fr-FR', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  <Users className="w-3 h-3 mr-1" />
                                  {day.userCount} agents actifs
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Solde Départ</div>
                            <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{day.soldeDepart.toFixed(2)} DH</div>
                          </div>
                          
                          <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-lg">
                            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">Versements</div>
                            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                              +{day.versements.toFixed(2)} DH
                            </div>
                          </div>
                          
                          <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-lg">
                            <div className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1">Retraits</div>
                            <div className="text-xl font-bold text-rose-700 dark:text-rose-300">
                              -{day.retraits.toFixed(2)} DH
                            </div>
                          </div>
                          
                          <div className="bg-violet-50 dark:bg-violet-950/20 p-4 rounded-lg">
                            <div className="text-xs text-violet-600 dark:text-violet-400 font-medium mb-1">Solde Final</div>
                            <div className="text-xl font-bold text-violet-700 dark:text-violet-300">
                              {day.soldeFinal.toFixed(2)} DH
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div className="bg-slate-50 dark:bg-slate-900/20 p-3 rounded-lg">
                            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Caisse</div>
                            <div className="text-lg font-bold text-slate-700 dark:text-slate-300">{day.totalCaisse.toFixed(2)} DH</div>
                          </div>
                          
                          <div className="bg-slate-50 dark:bg-slate-900/20 p-3 rounded-lg">
                            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Coffre</div>
                            <div className="text-lg font-bold text-slate-700 dark:text-slate-300">{day.totalCoffre.toFixed(2)} DH</div>
                          </div>
                          
                          <div className={`p-3 rounded-lg ${Math.abs(day.ecartCaisse) < 0.01 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-orange-50 dark:bg-orange-950/20'}`}>
                            <div className={`text-xs font-medium mb-1 ${Math.abs(day.ecartCaisse) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                              Écart Caisse
                            </div>
                            <div className={`text-lg font-bold ${Math.abs(day.ecartCaisse) < 0.01 ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'}`}>
                              {day.ecartCaisse >= 0 ? '+' : ''}{day.ecartCaisse.toFixed(2)} DH
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          className="w-full mt-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(day.date);
                          }}
                        >
                          Voir les PVs des agents
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedDate(null)}
                  data-testid="button-back-to-dates"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour aux dates
                </Button>
              </div>

              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-2">{selectedAgency?.name}</h2>
                <p className="text-muted-foreground">
                  {new Date(selectedDate).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </Card>

              {selectedDateData && selectedDateData.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {selectedDateData.map((userData) => (
                    <Card 
                      key={userData.userId} 
                      className="overflow-hidden border-2 hover:border-primary/50 transition-all"
                      data-testid={`card-user-${userData.userId}`}
                    >
                      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-4 border-b">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-cyan-500/20 rounded-xl">
                            <User className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{userData.userName}</h3>
                            <p className="text-xs text-muted-foreground">PV Final de l'Agent</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-sky-50 dark:bg-sky-950/20 p-3 rounded-lg">
                            <div className="text-xs text-sky-600 dark:text-sky-400 font-medium mb-1">Solde Départ</div>
                            <div className="text-lg font-bold text-sky-700 dark:text-sky-300">{userData.soldeDepart.toFixed(2)} DH</div>
                          </div>
                          
                          <div className="bg-teal-50 dark:bg-teal-950/20 p-3 rounded-lg">
                            <div className="text-xs text-teal-600 dark:text-teal-400 font-medium mb-1">Opérations</div>
                            <div className="text-lg font-bold text-teal-700 dark:text-teal-300">
                              {userData.operations >= 0 ? '+' : ''}{userData.operations.toFixed(2)} DH
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-lg">
                            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">Versements</div>
                            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                              +{userData.versements.toFixed(2)} DH
                            </div>
                          </div>
                          
                          <div className="bg-rose-50 dark:bg-rose-950/20 p-3 rounded-lg">
                            <div className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1">Retraits</div>
                            <div className="text-lg font-bold text-rose-700 dark:text-rose-300">
                              -{userData.retraits.toFixed(2)} DH
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-lg border-2 border-indigo-200 dark:border-indigo-800">
                          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">Solde Final Théorique</div>
                          <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{userData.soldeFinal.toFixed(2)} DH</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-50 dark:bg-slate-900/20 p-3 rounded-lg">
                            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Total Caisse</div>
                            <div className="text-lg font-bold text-slate-700 dark:text-slate-300">{userData.caisse.toFixed(2)} DH</div>
                          </div>
                          
                          <div className="bg-slate-50 dark:bg-slate-900/20 p-3 rounded-lg">
                            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Total Coffre</div>
                            <div className="text-lg font-bold text-slate-700 dark:text-slate-300">{userData.coffre.toFixed(2)} DH</div>
                          </div>
                        </div>
                        
                        <div className={`p-4 rounded-lg border-2 ${Math.abs(userData.ecart) < 0.01 ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className={`text-xs font-medium mb-1 ${Math.abs(userData.ecart) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                Écart (Réel - Théorique)
                              </div>
                              <div className={`text-2xl font-bold ${Math.abs(userData.ecart) < 0.01 ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'}`}>
                                {userData.ecart >= 0 ? '+' : ''}{userData.ecart.toFixed(2)} DH
                              </div>
                            </div>
                            {Math.abs(userData.ecart) < 0.01 ? (
                              <Badge className="bg-green-600 text-white">✓ OK</Badge>
                            ) : (
                              <Badge variant="destructive">⚠ Écart</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Aucun PV pour cette date
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Catégories de transactions</h2>
              <p className="text-sm text-muted-foreground">
                Gérer les types et catégories des versements et retraits
              </p>
            </div>
            <Dialog open={openCategoryDialog} onOpenChange={(open) => {
              setOpenCategoryDialog(open);
              if (!open) {
                setEditingCategory(null);
                categoryForm.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-category">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle catégorie
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-category">
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
                  </DialogTitle>
                  <DialogDescription>
                    Définissez le type et le libellé de la catégorie de transaction
                  </DialogDescription>
                </DialogHeader>
                <Form {...categoryForm}>
                  <form onSubmit={categoryForm.handleSubmit(handleSaveCategory)} className="space-y-4">
                    <FormField
                      control={categoryForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de transaction</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category-type">
                                <SelectValue placeholder="Sélectionnez un type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="versement">Versement</SelectItem>
                              <SelectItem value="retrait">Retrait</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={categoryForm.control}
                      name="label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Libellé</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Dépôt espèces" data-testid="input-category-label" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={categoryForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (optionnel)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Description de la catégorie" data-testid="input-category-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                        data-testid="button-save-category"
                      >
                        {editingCategory ? "Mettre à jour" : "Créer"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                Versements ({versementCategories.length})
              </h3>
              <div className="space-y-2">
                {versementCategories.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    Aucune catégorie de versement
                  </div>
                ) : (
                  versementCategories.map(category => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      data-testid={`category-item-${category.id}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{category.label}</div>
                        {category.description && (
                          <div className="text-sm text-muted-foreground">{category.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                          data-testid={`button-edit-category-${category.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCategoryMutation.mutate(category.id)}
                          data-testid={`button-delete-category-${category.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                Retraits ({retraitCategories.length})
              </h3>
              <div className="space-y-2">
                {retraitCategories.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    Aucune catégorie de retrait
                  </div>
                ) : (
                  retraitCategories.map(category => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      data-testid={`category-item-${category.id}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{category.label}</div>
                        {category.description && (
                          <div className="text-sm text-muted-foreground">{category.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                          data-testid={`button-edit-category-${category.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCategoryMutation.mutate(category.id)}
                          data-testid={`button-delete-category-${category.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agencies" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Gestion des agences</h2>
              <p className="text-sm text-muted-foreground">
                Créer et gérer les agences de l'entreprise
              </p>
            </div>
            <Dialog open={openAgencyDialog} onOpenChange={setOpenAgencyDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-agency">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle agence
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-agency">
                <DialogHeader>
                  <DialogTitle>Nouvelle agence</DialogTitle>
                  <DialogDescription>
                    Créez une nouvelle agence pour votre entreprise
                  </DialogDescription>
                </DialogHeader>
                <Form {...agencyForm}>
                  <form onSubmit={agencyForm.handleSubmit((data) => createAgencyMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={agencyForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de l'agence</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Agence Casablanca Centre" data-testid="input-agency-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={agencyForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code de l'agence</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: CASA-01" data-testid="input-agency-code" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={createAgencyMutation.isPending} data-testid="button-save-agency">
                        Créer l'agence
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agencies.map((agency) => {
              const agencyUsers = users.filter(u => u.agencyId === agency.id);
              const agencyPVs = cashRegisters.filter(cr => cr.agencyId === agency.id);

              return (
                <Card key={agency.id} className="p-6" data-testid={`agency-card-${agency.id}`}>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{agency.name}</h3>
                      <p className="text-sm text-muted-foreground">{agency.code}</p>
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Agents:</span>
                          <Badge variant="secondary">{agencyUsers.length}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">PVs:</span>
                          <Badge variant="secondary">{agencyPVs.length}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="agents" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Gestion des agents</h2>
              <p className="text-sm text-muted-foreground">
                Créer et gérer les agents et les assigner aux agences
              </p>
            </div>
            <Dialog open={openUserDialog} onOpenChange={setOpenUserDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-agent">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvel agent
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-agent">
                <DialogHeader>
                  <DialogTitle>Nouvel agent</DialogTitle>
                  <DialogDescription>
                    Créez un nouvel agent et assignez-le à une agence
                  </DialogDescription>
                </DialogHeader>
                <Form {...userForm}>
                  <form onSubmit={userForm.handleSubmit((data) => createUserMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={userForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom d'utilisateur</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: agent4" data-testid="input-username" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mot de passe</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="Mot de passe" data-testid="input-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom complet (optionnel)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Ahmed El Mansouri" data-testid="input-fullname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rôle</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-role">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="agent">Agent</SelectItem>
                              <SelectItem value="admin">Administrateur</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="agencyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agence</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-agency">
                                <SelectValue placeholder="Sélectionnez une agence" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Aucune (Admin)</SelectItem>
                              {agencies.map(agency => (
                                <SelectItem key={agency.id} value={agency.id}>
                                  {agency.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={createUserMutation.isPending} data-testid="button-save-agent">
                        Créer l'agent
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => {
              const userAgency = agencies.find(a => a.id === user.agencyId);
              const userPVs = cashRegisters.filter(cr => cr.userId === user.id);

              return (
                <Card key={user.id} className="p-6" data-testid={`agent-card-${user.id}`}>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{user.fullName || user.username}</h3>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Rôle:</span>
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Agence:</span>
                          <span className="text-sm font-medium">
                            {userAgency?.code || "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">PVs:</span>
                          <Badge variant="secondary">{userPVs.length}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
