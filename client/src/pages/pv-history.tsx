import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Filter, FileText, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
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

export default function PVHistory() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [showAllPVs, setShowAllPVs] = useState(false);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");

  const { data: allPVs, isLoading } = useQuery<CashRegister[]>({
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

  const calculatePVTotals = (pv: CashRegister) => {
    try {
      const billsData: CashItem[] = JSON.parse(pv.billsData);
      const coinsData: CashItem[] = JSON.parse(pv.coinsData);
      const operations: Operation[] = JSON.parse(pv.operationsData);

      const totalCash = [...billsData, ...coinsData].reduce(
        (sum, item) => sum + item.caisseAmount + item.coffreAmount,
        0
      );

      const totalOperations = operations.reduce((sum, op) => {
        if (op.type === "OUT") {
          return sum - op.amount;
        }
        return sum + op.amount;
      }, 0);

      const ecartCaisse = totalCash - (pv.soldeDepart + totalOperations);

      return { totalCash, totalOperations, ecartCaisse };
    } catch (e) {
      return { totalCash: 0, totalOperations: 0, ecartCaisse: 0 };
    }
  };

  const calculateConsolidatedTotals = (pvs: CashRegister[]) => {
    let totalCash = 0;
    let totalOperations = 0;
    let soldeDepart = 0;

    pvs.forEach((pv) => {
      try {
        const billsData: CashItem[] = JSON.parse(pv.billsData);
        const coinsData: CashItem[] = JSON.parse(pv.coinsData);
        const operations: Operation[] = JSON.parse(pv.operationsData);

        totalCash += [...billsData, ...coinsData].reduce(
          (sum, item) => sum + item.caisseAmount + item.coffreAmount,
          0
        );

        totalOperations += operations.reduce((sum, op) => {
          if (op.type === "OUT") {
            return sum - op.amount;
          }
          return sum + op.amount;
        }, 0);

        soldeDepart += pv.soldeDepart;
      } catch (e) {
        console.error("Error calculating consolidated totals:", e);
      }
    });

    const ecartCaisse = totalCash - (soldeDepart + totalOperations);

    return { totalCash, totalOperations, ecartCaisse, soldeDepart };
  };

  const filteredPVs = allPVs?.filter((pv) => {
    if (!startDate && !endDate) {
      const dateMatch = true;
    } else {
      const pvDate = parseISO(pv.date);
      
      if (startDate && endDate) {
        if (pvDate < startDate || pvDate > endDate) return false;
      } else if (startDate) {
        if (pvDate < startDate) return false;
      } else if (endDate) {
        if (pvDate > endDate) return false;
      }
    }

    if (selectedAgencyId !== "all" && pv.agencyId !== selectedAgencyId) {
      return false;
    }

    if (selectedUserId !== "all" && pv.userId !== selectedUserId) {
      return false;
    }
    
    return true;
  });

  // Group PVs by date and potentially by agency if "All agents" is selected
  const groupedByDate = filteredPVs?.reduce((acc, pv) => {
    const dateKey = pv.date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(pv);
    return acc;
  }, {} as Record<string, CashRegister[]>);

  // If "All agents" is selected, further group by agency within each date
  const groupedByDateAndAgency = groupedByDate
    ? Object.entries(groupedByDate).reduce((acc, [date, pvs]) => {
        if (selectedUserId === "all") {
          // Group by agency
          const byAgency: Record<string, CashRegister[]> = {};
          pvs.forEach(pv => {
            const agencyKey = pv.agencyId || "no-agency";
            if (!byAgency[agencyKey]) {
              byAgency[agencyKey] = [];
            }
            byAgency[agencyKey].push(pv);
          });
          acc[date] = byAgency;
        } else {
          // Single group for specific user
          acc[date] = { "single": pvs };
        }
        return acc;
      }, {} as Record<string, Record<string, CashRegister[]>>)
    : {};

  const sortedDates = groupedByDateAndAgency
    ? Object.keys(groupedByDateAndAgency).sort((a, b) => b.localeCompare(a))
    : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">
              Historique des PVs
            </h1>
            <p className="text-muted-foreground mt-1">
              Consultez l'historique de tous les procès-verbaux
            </p>
          </div>
          <Link href="/" data-testid="link-back-home">
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Retour au PV
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Date de début</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[200px] justify-start"
                      data-testid="button-start-date"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP", { locale: fr }) : "Sélectionner"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      locale={fr}
                      data-testid="calendar-start-date"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Date de fin</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[200px] justify-start"
                      data-testid="button-end-date"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP", { locale: fr }) : "Sélectionner"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      locale={fr}
                      data-testid="calendar-end-date"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Agence</label>
                <Select value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
                  <SelectTrigger className="w-[200px]" data-testid="select-agency-filter">
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

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Agent</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="w-[200px]" data-testid="select-user-filter">
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

              {(startDate || endDate || selectedAgencyId !== "all" || selectedUserId !== "all") && (
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setStartDate(undefined);
                      setEndDate(undefined);
                      setSelectedAgencyId("all");
                      setSelectedUserId("all");
                    }}
                    data-testid="button-clear-filters"
                  >
                    Effacer les filtres
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2 border-t">
              <Switch
                id="show-all-pvs"
                checked={showAllPVs}
                onCheckedChange={setShowAllPVs}
                data-testid="switch-show-all-pvs"
              />
              <Label htmlFor="show-all-pvs" className="cursor-pointer">
                Afficher tous les PVs (y compris les anciennes versions)
              </Label>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="text-muted-foreground">Chargement...</div>
          </div>
        )}

        {!isLoading && sortedDates.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Aucun PV trouvé pour cette période
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {sortedDates.map((dateKey) => {
            const agencyGroups = groupedByDateAndAgency![dateKey];
            const isConsolidatedView = selectedUserId === "all";

            return (
              <Card key={dateKey}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span data-testid={`text-date-${dateKey}`}>
                      {format(parseISO(dateKey), "EEEE d MMMM yyyy", { locale: fr })}
                    </span>
                    {!isConsolidatedView && (
                      <Badge variant="secondary" data-testid={`badge-count-${dateKey}`}>
                        {showAllPVs ? `${agencyGroups.single.length} PV${agencyGroups.single.length > 1 ? "s" : ""}` : `1/${agencyGroups.single.length} PV`}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {isConsolidatedView ? (
                      // Display consolidated PVs by agency
                      Object.entries(agencyGroups).map(([agencyKey, agencyPvs]) => {
                        // Group PVs by userId to get the latest PV per agent
                        const pvsByUser: Record<string, CashRegister[]> = {};
                        agencyPvs.forEach(pv => {
                          const userKey = pv.userId || 'no-user';
                          if (!pvsByUser[userKey]) {
                            pvsByUser[userKey] = [];
                          }
                          pvsByUser[userKey].push(pv);
                        });

                        // Get the latest PV for each agent
                        const latestPvsPerAgent = Object.values(pvsByUser).map(userPvs => {
                          return userPvs.sort((a, b) => {
                            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                            return timeB - timeA;
                          })[0];
                        });

                        console.log(`[DEBUG] Agency ${agencyKey} - Date ${dateKey}:`, {
                          totalPVs: agencyPvs.length,
                          uniqueUsers: Object.keys(pvsByUser).length,
                          latestPvsPerAgent: latestPvsPerAgent.map(pv => ({
                            userId: pv.userId,
                            createdAt: pv.createdAt,
                            soldeDepart: pv.soldeDepart
                          }))
                        });

                        // If showAllPVs is true, include all versions
                        const latestPvs = showAllPVs ? agencyPvs : latestPvsPerAgent;

                        const consolidatedTotals = calculateConsolidatedTotals(latestPvsPerAgent);
                        
                        console.log(`[DEBUG] Consolidated totals for ${agencyKey}:`, consolidatedTotals);
                        const pvAgency = agencies.find(a => a.id === agencyKey);

                        return (
                          <Link
                            key={agencyKey}
                            href={`/pv-agence?date=${dateKey}&agencyId=${agencyKey}`}
                            data-testid={`link-pv-agency-${agencyKey}`}
                          >
                            <Card className="hover-elevate active-elevate-2 transition-all cursor-pointer">
                              <CardContent className="py-4">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-4 flex-1">
                                    <Badge variant="default" className="text-xs">
                                      PV Agence
                                    </Badge>
                                    {pvAgency && (
                                      <Badge variant="outline" className="text-xs">
                                        {pvAgency.name}
                                      </Badge>
                                    )}
                                    <span className="text-sm text-muted-foreground">
                                      {latestPvs.length} agent{latestPvs.length > 1 ? "s" : ""}
                                    </span>
                                  </div>

                                  <div className="flex gap-4 items-center flex-wrap">
                                    <div className="text-right">
                                      <div className="text-xs text-muted-foreground mb-1">
                                        Solde Départ
                                      </div>
                                      <div className="font-mono font-semibold" data-testid={`text-solde-${agencyKey}`}>
                                        {formatNumber(consolidatedTotals.soldeDepart)} MAD
                                      </div>
                                    </div>

                                    <div className="text-right">
                                      <div className="text-xs text-muted-foreground mb-1">
                                        Total Caisse
                                      </div>
                                      <div className="font-mono font-semibold" data-testid={`text-total-cash-${agencyKey}`}>
                                        {formatNumber(consolidatedTotals.totalCash)} MAD
                                      </div>
                                    </div>

                                    <div className="text-right">
                                      <div className="text-xs text-muted-foreground mb-1">
                                        Opérations
                                      </div>
                                      <div
                                        className={`font-mono font-semibold ${
                                          consolidatedTotals.totalOperations >= 0 ? "text-emerald-600" : "text-rose-600"
                                        }`}
                                        data-testid={`text-operations-${agencyKey}`}
                                      >
                                        {formatNumber(consolidatedTotals.totalOperations)} MAD
                                      </div>
                                    </div>

                                    <div className="text-right min-w-[120px]">
                                      <div className="text-xs text-muted-foreground mb-1">
                                        Écart Caisse
                                      </div>
                                      <div
                                        className={`font-mono font-bold ${
                                          consolidatedTotals.ecartCaisse > 0
                                            ? "text-emerald-600"
                                            : consolidatedTotals.ecartCaisse < 0
                                            ? "text-rose-600"
                                            : "text-foreground"
                                        }`}
                                        data-testid={`text-ecart-${agencyKey}`}
                                      >
                                        {consolidatedTotals.ecartCaisse >= 0 ? "+" : ""}
                                        {formatNumber(consolidatedTotals.ecartCaisse)} MAD
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })
                    ) : (
                      // Display individual PVs
                      (() => {
                        const allPvsForDate = agencyGroups.single.sort((a, b) => {
                          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                          return timeB - timeA;
                        });

                        const pvs = showAllPVs ? allPvsForDate : [allPvsForDate[0]];

                        return pvs.map((pv, index) => {
                      const { totalCash, totalOperations, ecartCaisse } = calculatePVTotals(pv);
                      const createdTime = pv.createdAt
                        ? format(new Date(pv.createdAt), "HH:mm:ss")
                        : "N/A";
                      
                      const pvUser = allUsers.find(u => u.id === pv.userId);
                      const pvAgency = agencies.find(a => a.id === pv.agencyId);

                      return (
                        <Link
                          key={pv.id}
                          href={`/?date=${pv.date}&pvId=${pv.id}`}
                          data-testid={`link-pv-${pv.id}`}
                        >
                          <Card className="hover-elevate active-elevate-2 transition-all cursor-pointer">
                            <CardContent className="py-4">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="flex items-center gap-2 text-muted-foreground min-w-[100px]">
                                    <Clock className="w-4 h-4" />
                                    <span className="font-mono text-sm" data-testid={`text-time-${pv.id}`}>
                                      {createdTime}
                                    </span>
                                  </div>
                                  
                                  {pvUser && (
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm font-medium" data-testid={`text-agent-${pv.id}`}>
                                        {pvUser.fullName || pvUser.username}
                                      </span>
                                    </div>
                                  )}

                                  {pvAgency && (
                                    <Badge variant="outline" className="text-xs">
                                      {pvAgency.name}
                                    </Badge>
                                  )}
                                  
                                  {index === 0 && (
                                    <Badge variant="default" className="text-xs">
                                      Dernier
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex gap-4 items-center flex-wrap">
                                  <div className="text-right">
                                    <div className="text-xs text-muted-foreground mb-1">
                                      Total Caisse
                                    </div>
                                    <div className="font-mono font-semibold" data-testid={`text-total-cash-${pv.id}`}>
                                      {formatNumber(totalCash)} MAD
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <div className="text-xs text-muted-foreground mb-1">
                                      Opérations
                                    </div>
                                    <div
                                      className={`font-mono font-semibold ${
                                        totalOperations >= 0 ? "text-emerald-600" : "text-rose-600"
                                      }`}
                                      data-testid={`text-operations-${pv.id}`}
                                    >
                                      {formatNumber(totalOperations)} MAD
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <div className="text-xs text-muted-foreground mb-1">
                                      Solde Départ
                                    </div>
                                    <div className="font-mono font-semibold" data-testid={`text-solde-${pv.id}`}>
                                      {formatNumber(pv.soldeDepart)} MAD
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <div className="text-xs text-muted-foreground mb-1">
                                      Écart Caisse
                                    </div>
                                    <div
                                      className={`font-mono font-semibold ${
                                        Math.abs(ecartCaisse) < 0.01
                                          ? "text-foreground"
                                          : ecartCaisse > 0
                                          ? "text-emerald-600"
                                          : "text-rose-600"
                                      }`}
                                      data-testid={`text-ecart-${pv.id}`}
                                    >
                                      {ecartCaisse >= 0 ? "+" : ""}
                                      {formatNumber(ecartCaisse)} MAD
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                        });
                      })()
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
