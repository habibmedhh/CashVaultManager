import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Filter, Building2, User, ChevronDown, ChevronRight, Download, Printer, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CashRegister, User as UserType, Agency } from "@shared/schema";

interface Operation {
  id: string;
  name: string;
  number: number;
  amount: number;
  type?: "IN" | "OUT";
}

interface CashItem {
  value: number;
  caisseAmount: number;
  coffreAmount: number;
  type: "billet" | "piece";
}

interface Transaction {
  id: string;
  type: "versement" | "retrait";
  label: string;
  description?: string;
  amount: number;
}

export default function PVConsolidated() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const { data: allPVs = [], isLoading } = useQuery<CashRegister[]>({
    queryKey: ["/api/cash-registers"],
  });

  const { data: agencies = [] } = useQuery<Agency[]>({
    queryKey: ["/api/agencies"],
  });

  const { data: allUsers = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users/all"],
  });

  const formatNumber = (num: number) => {
    return num.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const filteredPVs = useMemo(() => {
    return allPVs.filter((pv) => {
      if (selectedAgencyId !== "all" && pv.agencyId !== selectedAgencyId) {
        return false;
      }
      if (selectedUserId !== "all" && pv.userId !== selectedUserId) {
        return false;
      }
      if (startDate) {
        const pvDate = parseISO(pv.date);
        if (pvDate < startDate) return false;
      }
      if (endDate) {
        const pvDate = parseISO(pv.date);
        if (pvDate > endDate) return false;
      }
      return true;
    });
  }, [allPVs, selectedAgencyId, selectedUserId, startDate, endDate]);

  const groupedByDate = useMemo(() => {
    const groups = new Map<string, CashRegister[]>();
    filteredPVs.forEach((pv) => {
      const existing = groups.get(pv.date) || [];
      existing.push(pv);
      groups.set(pv.date, existing);
    });

    return Array.from(groups.entries())
      .map(([date, pvs]) => {
        const latestPVsByUser = new Map<string, CashRegister>();
        pvs.forEach((pv) => {
          if (!pv.userId) return;
          const existing = latestPVsByUser.get(pv.userId);
          if (!existing || new Date(pv.createdAt) > new Date(existing.createdAt)) {
            latestPVsByUser.set(pv.userId, pv);
          }
        });

        const userPVs = Array.from(latestPVsByUser.values());

        let totalSoldeDepart = 0;
        let totalOperations = 0;
        let totalVersements = 0;
        let totalRetraits = 0;
        let totalCaisse = 0;
        let totalCoffre = 0;

        userPVs.forEach((pv) => {
          totalSoldeDepart += pv.soldeDepart;
          try {
            const operations: Operation[] = JSON.parse(pv.operationsData);
            totalOperations += operations.reduce((sum, op) => sum + (op.amount || 0), 0);

            const transactions: Transaction[] = JSON.parse(pv.transactionsData || "[]");
            totalVersements += transactions
              .filter((t) => t.type === "versement")
              .reduce((sum, t) => sum + t.amount, 0);
            totalRetraits += transactions
              .filter((t) => t.type === "retrait")
              .reduce((sum, t) => sum + t.amount, 0);

            const bills: CashItem[] = JSON.parse(pv.billsData);
            const coins: CashItem[] = JSON.parse(pv.coinsData);
            [...bills, ...coins].forEach((item) => {
              totalCaisse += item.caisseAmount;
              totalCoffre += item.coffreAmount;
            });
          } catch (e) {
            console.error("Error parsing PV data:", e);
          }
        });

        const soldeFinalTheorique = totalSoldeDepart + totalOperations + totalVersements - totalRetraits;
        const totalReel = totalCaisse + totalCoffre;
        const ecartCaisse = totalReel - soldeFinalTheorique;

        return {
          date,
          pvs: userPVs,
          totalSoldeDepart,
          totalOperations,
          totalVersements,
          totalRetraits,
          soldeFinalTheorique,
          totalCaisse,
          totalCoffre,
          totalReel,
          ecartCaisse,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredPVs]);

  const consolidatedData = useMemo(() => {
    if (selectedAgencyId === "all" || !filteredPVs.length) {
      return null;
    }

    const agencyPVs = filteredPVs.filter(pv => pv.agencyId === selectedAgencyId);
    
    const latestPVsByUserAndDate = new Map<string, CashRegister>();
    agencyPVs.forEach((pv) => {
      if (!pv.userId) return;
      const key = `${pv.userId}-${pv.date}`;
      const existing = latestPVsByUserAndDate.get(key);
      if (!existing || new Date(pv.createdAt) > new Date(existing.createdAt)) {
        latestPVsByUserAndDate.set(key, pv);
      }
    });

    const pvs = Array.from(latestPVsByUserAndDate.values());

    let totalSoldeDepart = 0;
    let totalOperations = 0;
    let totalVersements = 0;
    let totalRetraits = 0;
    let totalCaisse = 0;
    let totalCoffre = 0;

    pvs.forEach((pv) => {
      totalSoldeDepart += pv.soldeDepart;
      try {
        const operations: Operation[] = JSON.parse(pv.operationsData);
        totalOperations += operations.reduce((sum, op) => sum + (op.amount || 0), 0);

        const transactions: Transaction[] = JSON.parse(pv.transactionsData || "[]");
        totalVersements += transactions
          .filter((t) => t.type === "versement")
          .reduce((sum, t) => sum + t.amount, 0);
        totalRetraits += transactions
          .filter((t) => t.type === "retrait")
          .reduce((sum, t) => sum + t.amount, 0);

        const bills: CashItem[] = JSON.parse(pv.billsData);
        const coins: CashItem[] = JSON.parse(pv.coinsData);
        [...bills, ...coins].forEach((item) => {
          totalCaisse += item.caisseAmount;
          totalCoffre += item.coffreAmount;
        });
      } catch (e) {
        console.error("Error parsing PV data:", e);
      }
    });

    const soldeFinalTheorique = totalSoldeDepart + totalOperations + totalVersements - totalRetraits;
    const totalReel = totalCaisse + totalCoffre;
    const ecartCaisse = totalReel - soldeFinalTheorique;

    return {
      totalSoldeDepart,
      totalOperations,
      totalVersements,
      totalRetraits,
      soldeFinalTheorique,
      totalCaisse,
      totalCoffre,
      totalReel,
      ecartCaisse,
      pvCount: pvs.length,
    };
  }, [selectedAgencyId, filteredPVs]);

  const toggleDateExpansion = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const selectedAgency = agencies.find(a => a.id === selectedAgencyId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Historique & Consolidation PV</h1>
        <p className="text-muted-foreground mt-1">
          Consultez l'historique des PVs et les données consolidées par agence
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Agence</label>
            <Select value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
              <SelectTrigger data-testid="select-agency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les agences</SelectItem>
                {agencies.map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Agent</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger data-testid="select-user">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les agents</SelectItem>
                {allUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.fullName || user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Date de début</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  data-testid="button-start-date"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy", { locale: fr }) : "Sélectionner"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Date de fin</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  data-testid="button-end-date"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy", { locale: fr }) : "Sélectionner"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history" data-testid="tab-history">
            Historique
          </TabsTrigger>
          <TabsTrigger value="consolidated" data-testid="tab-consolidated" disabled={selectedAgencyId === "all"}>
            Vue Consolidée Agence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-6 space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Chargement...</div>
          ) : groupedByDate.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucun PV trouvé pour les critères sélectionnés
            </div>
          ) : (
            groupedByDate.map((day) => {
              const isExpanded = expandedDates.has(day.date);
              return (
                <Card key={day.date} className="overflow-hidden" data-testid={`card-date-${day.date}`}>
                  <div
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => toggleDateExpansion(day.date)}
                    data-testid={`button-toggle-date-${day.date}`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-primary" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          )}
                          <div>
                            <CardTitle className="text-xl" data-testid={`text-date-${day.date}`}>
                              {format(parseISO(day.date), "EEEE d MMMM yyyy", { locale: fr })}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1" data-testid={`text-pv-count-${day.date}`}>
                              {day.pvs.length} PV{day.pvs.length > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <Badge variant={Math.abs(day.ecartCaisse) < 0.01 ? "default" : "destructive"} data-testid={`badge-ecart-${day.date}`}>
                          Écart: {day.ecartCaisse >= 0 ? "+" : ""}{formatNumber(day.ecartCaisse)} DH
                        </Badge>
                      </div>
                    </CardHeader>
                  </div>

                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                          Solde Départ
                        </div>
                        <div className="text-lg font-bold text-blue-700 dark:text-blue-300" data-testid={`text-solde-depart-${day.date}`}>
                          {formatNumber(day.totalSoldeDepart)} DH
                        </div>
                      </div>

                      <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-lg">
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                          Opérations
                        </div>
                        <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300" data-testid={`text-operations-${day.date}`}>
                          {formatNumber(day.totalOperations)} DH
                        </div>
                      </div>

                      <div className="bg-teal-50 dark:bg-teal-950/20 p-4 rounded-lg">
                        <div className="text-xs text-teal-600 dark:text-teal-400 font-medium mb-1 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Versements
                        </div>
                        <div className="text-lg font-bold text-teal-700 dark:text-teal-300" data-testid={`text-versements-${day.date}`}>
                          +{formatNumber(day.totalVersements)} DH
                        </div>
                      </div>

                      <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-lg">
                        <div className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          Retraits
                        </div>
                        <div className="text-lg font-bold text-rose-700 dark:text-rose-300" data-testid={`text-retraits-${day.date}`}>
                          -{formatNumber(day.totalRetraits)} DH
                        </div>
                      </div>

                      <div className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-lg">
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">
                          Solde Final Théorique
                        </div>
                        <div className="text-lg font-bold text-indigo-700 dark:text-indigo-300" data-testid={`text-solde-final-${day.date}`}>
                          {formatNumber(day.soldeFinalTheorique)} DH
                        </div>
                      </div>

                      <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                        <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
                          Total Caisse
                        </div>
                        <div className="text-lg font-bold text-purple-700 dark:text-purple-300" data-testid={`text-caisse-${day.date}`}>
                          {formatNumber(day.totalCaisse)} DH
                        </div>
                      </div>

                      <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg">
                        <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">
                          Total Coffre
                        </div>
                        <div className="text-lg font-bold text-amber-700 dark:text-amber-300" data-testid={`text-coffre-${day.date}`}>
                          {formatNumber(day.totalCoffre)} DH
                        </div>
                      </div>

                      <div className={`p-4 rounded-lg ${Math.abs(day.ecartCaisse) < 0.01 ? "bg-green-50 dark:bg-green-950/20" : "bg-orange-50 dark:bg-orange-950/20"}`}>
                        <div className={`text-xs font-medium mb-1 ${Math.abs(day.ecartCaisse) < 0.01 ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}`}>
                          Écart Caisse
                        </div>
                        <div className={`text-lg font-bold ${Math.abs(day.ecartCaisse) < 0.01 ? "text-green-700 dark:text-green-300" : "text-orange-700 dark:text-orange-300"}`} data-testid={`text-ecart-${day.date}`}>
                          {day.ecartCaisse >= 0 ? "+" : ""}{formatNumber(day.ecartCaisse)} DH
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-6 space-y-3">
                        <h4 className="font-semibold text-sm">Détails par agent:</h4>
                        {day.pvs.map((pv) => {
                          const user = allUsers.find((u) => u.id === pv.userId);
                          const agency = agencies.find((a) => a.id === pv.agencyId);
                          
                          let pvSoldeDepart = pv.soldeDepart;
                          let pvOperations = 0;
                          let pvVersements = 0;
                          let pvRetraits = 0;
                          let pvCaisse = 0;
                          let pvCoffre = 0;

                          try {
                            const operations: Operation[] = JSON.parse(pv.operationsData);
                            pvOperations = operations.reduce((sum, op) => sum + (op.amount || 0), 0);

                            const transactions: Transaction[] = JSON.parse(pv.transactionsData || "[]");
                            pvVersements = transactions
                              .filter((t) => t.type === "versement")
                              .reduce((sum, t) => sum + t.amount, 0);
                            pvRetraits = transactions
                              .filter((t) => t.type === "retrait")
                              .reduce((sum, t) => sum + t.amount, 0);

                            const bills: CashItem[] = JSON.parse(pv.billsData);
                            const coins: CashItem[] = JSON.parse(pv.coinsData);
                            [...bills, ...coins].forEach((item) => {
                              pvCaisse += item.caisseAmount;
                              pvCoffre += item.coffreAmount;
                            });
                          } catch (e) {
                            console.error("Error parsing PV data:", e);
                          }

                          const pvSoldeFinal = pvSoldeDepart + pvOperations + pvVersements - pvRetraits;
                          const pvReel = pvCaisse + pvCoffre;
                          const pvEcart = pvReel - pvSoldeFinal;

                          return (
                            <Card key={pv.id} className="p-4 bg-muted/30" data-testid={`card-pv-detail-${pv.id}`}>
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <div className="font-semibold flex items-center gap-2" data-testid={`text-user-${pv.id}`}>
                                    <User className="w-4 h-4" />
                                    {user?.fullName || user?.username || "Inconnu"}
                                  </div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1" data-testid={`text-agency-${pv.id}`}>
                                    <Building2 className="w-3 h-3" />
                                    {agency?.name || "Agence inconnue"}
                                  </div>
                                </div>
                                <Badge variant={Math.abs(pvEcart) < 0.01 ? "default" : "destructive"} data-testid={`badge-ecart-pv-${pv.id}`}>
                                  {pvEcart >= 0 ? "+" : ""}{formatNumber(pvEcart)} DH
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <div className="text-xs text-muted-foreground">Solde Départ</div>
                                  <div className="font-semibold" data-testid={`text-solde-depart-pv-${pv.id}`}>{formatNumber(pvSoldeDepart)} DH</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Opérations</div>
                                  <div className="font-semibold" data-testid={`text-operations-pv-${pv.id}`}>{formatNumber(pvOperations)} DH</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Caisse + Coffre</div>
                                  <div className="font-semibold" data-testid={`text-reel-pv-${pv.id}`}>{formatNumber(pvReel)} DH</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Solde Final</div>
                                  <div className="font-semibold" data-testid={`text-solde-final-pv-${pv.id}`}>{formatNumber(pvSoldeFinal)} DH</div>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="consolidated" className="mt-6">
          {selectedAgencyId === "all" ? (
            <div className="text-center py-12 text-muted-foreground">
              Veuillez sélectionner une agence pour voir les données consolidées
            </div>
          ) : !consolidatedData || consolidatedData.pvCount === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucune donnée disponible pour cette agence
            </div>
          ) : (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedAgency?.name}</h2>
                    <p className="text-muted-foreground">{selectedAgency?.code}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" data-testid="button-print">
                      <Printer className="w-4 h-4 mr-2" />
                      Imprimer
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-export">
                      <Download className="w-4 h-4 mr-2" />
                      Exporter
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                      Nombre de PVs
                    </div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300" data-testid="text-consolidated-pv-count">
                      {consolidatedData.pvCount}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/20 p-4 rounded-lg">
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">
                      Solde Départ Total
                    </div>
                    <div className="text-2xl font-bold text-slate-700 dark:text-slate-300" data-testid="text-consolidated-solde-depart">
                      {formatNumber(consolidatedData.totalSoldeDepart)} DH
                    </div>
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-lg">
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                      Total Opérations
                    </div>
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300" data-testid="text-consolidated-operations">
                      {formatNumber(consolidatedData.totalOperations)} DH
                    </div>
                  </div>

                  <div className="bg-teal-50 dark:bg-teal-950/20 p-4 rounded-lg">
                    <div className="text-xs text-teal-600 dark:text-teal-400 font-medium mb-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Versements
                    </div>
                    <div className="text-2xl font-bold text-teal-700 dark:text-teal-300" data-testid="text-consolidated-versements">
                      +{formatNumber(consolidatedData.totalVersements)} DH
                    </div>
                  </div>

                  <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-lg">
                    <div className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      Retraits
                    </div>
                    <div className="text-2xl font-bold text-rose-700 dark:text-rose-300" data-testid="text-consolidated-retraits">
                      -{formatNumber(consolidatedData.totalRetraits)} DH
                    </div>
                  </div>

                  <div className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-lg">
                    <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">
                      Solde Final Théorique
                    </div>
                    <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300" data-testid="text-consolidated-solde-final">
                      {formatNumber(consolidatedData.soldeFinalTheorique)} DH
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
                      Total Caisse
                    </div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300" data-testid="text-consolidated-caisse">
                      {formatNumber(consolidatedData.totalCaisse)} DH
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg">
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">
                      Total Coffre
                    </div>
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-300" data-testid="text-consolidated-coffre">
                      {formatNumber(consolidatedData.totalCoffre)} DH
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg col-span-2 md:col-span-1 ${Math.abs(consolidatedData.ecartCaisse) < 0.01 ? "bg-green-50 dark:bg-green-950/20" : "bg-orange-50 dark:bg-orange-950/20"}`}>
                    <div className={`text-xs font-medium mb-1 ${Math.abs(consolidatedData.ecartCaisse) < 0.01 ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}`}>
                      Écart Total
                    </div>
                    <div className={`text-2xl font-bold ${Math.abs(consolidatedData.ecartCaisse) < 0.01 ? "text-green-700 dark:text-green-300" : "text-orange-700 dark:text-orange-300"}`} data-testid="text-consolidated-ecart">
                      {consolidatedData.ecartCaisse >= 0 ? "+" : ""}{formatNumber(consolidatedData.ecartCaisse)} DH
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
