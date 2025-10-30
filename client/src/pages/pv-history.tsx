import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Filter, FileText, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import type { CashRegister } from "@shared/schema";

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

  const { data: allPVs, isLoading } = useQuery<CashRegister[]>({
    queryKey: ["/api/cash-registers"],
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

  const filteredPVs = allPVs?.filter((pv) => {
    if (!startDate && !endDate) return true;
    
    const pvDate = parseISO(pv.date);
    
    if (startDate && endDate) {
      return pvDate >= startDate && pvDate <= endDate;
    }
    
    if (startDate) {
      return pvDate >= startDate;
    }
    
    if (endDate) {
      return pvDate <= endDate;
    }
    
    return true;
  });

  const groupedByDate = filteredPVs?.reduce((acc, pv) => {
    const dateKey = pv.date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(pv);
    return acc;
  }, {} as Record<string, CashRegister[]>);

  const sortedDates = groupedByDate
    ? Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a))
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
                      className="w-[240px] justify-start"
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
                      className="w-[240px] justify-start"
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

              {(startDate || endDate) && (
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setStartDate(undefined);
                      setEndDate(undefined);
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
            const allPvsForDate = groupedByDate![dateKey].sort((a, b) => {
              const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return timeB - timeA;
            });

            const pvs = showAllPVs ? allPvsForDate : [allPvsForDate[0]];

            return (
              <Card key={dateKey}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span data-testid={`text-date-${dateKey}`}>
                      {format(parseISO(dateKey), "EEEE d MMMM yyyy", { locale: fr })}
                    </span>
                    <Badge variant="secondary" data-testid={`badge-count-${dateKey}`}>
                      {showAllPVs ? `${pvs.length} PV${pvs.length > 1 ? "s" : ""}` : `1/${allPvsForDate.length} PV`}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pvs.map((pv, index) => {
                      const { totalCash, totalOperations, ecartCaisse } = calculatePVTotals(pv);
                      const createdTime = pv.createdAt
                        ? format(new Date(pv.createdAt), "HH:mm:ss")
                        : "N/A";

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
                    })}
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
