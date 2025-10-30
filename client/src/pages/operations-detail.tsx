import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Filter, FileText, TrendingUp, TrendingDown, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CashRegister } from "@shared/schema";

interface Operation {
  id: string;
  name: string;
  number: number;
  amount: number;
  type?: "IN" | "OUT";
  details?: DetailedOperation[];
}

interface DetailedOperation {
  id: string;
  label: string;
  amount: number;
}

interface Transaction {
  id: string;
  type: "versement" | "retrait";
  label: string;
  description?: string;
  amount: number;
}

interface OperationRow {
  pvId: string;
  date: string;
  time: string;
  operationName: string;
  operationType: "operation" | "transaction";
  transactionType?: "versement" | "retrait";
  amount: number;
  number: number;
  detailLabel?: string;
  isDetailRow?: boolean;
}

export default function OperationsDetail() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [amountFilter, setAmountFilter] = useState<string>("all");

  const { data: allPVs, isLoading } = useQuery<CashRegister[]>({
    queryKey: ["/api/cash-registers"],
  });

  const formatNumber = (num: number) => {
    return num.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const allOperations = useMemo(() => {
    if (!allPVs) return [];

    const rows: OperationRow[] = [];

    allPVs.forEach((pv) => {
      try {
        const operations: Operation[] = JSON.parse(pv.operationsData);
        const transactions: Transaction[] = JSON.parse(pv.transactionsData);
        const time = pv.createdAt ? format(new Date(pv.createdAt), "HH:mm:ss") : "N/A";

        operations.forEach((op) => {
          if (op.details && op.details.length > 0) {
            op.details.forEach((detail) => {
              if (detail.amount !== 0) {
                rows.push({
                  pvId: pv.id,
                  date: pv.date,
                  time,
                  operationName: op.name,
                  operationType: "operation",
                  amount: op.type === "OUT" ? -detail.amount : detail.amount,
                  number: 1,
                  detailLabel: detail.label,
                  isDetailRow: true,
                });
              }
            });
          } else if (op.amount !== 0 || op.number !== 0) {
            rows.push({
              pvId: pv.id,
              date: pv.date,
              time,
              operationName: op.name,
              operationType: "operation",
              amount: op.type === "OUT" ? -op.amount : op.amount,
              number: op.number,
              isDetailRow: false,
            });
          }
        });

        transactions.forEach((trans) => {
          if (trans.amount !== 0) {
            rows.push({
              pvId: pv.id,
              date: pv.date,
              time,
              operationName: trans.label + (trans.description ? ` - ${trans.description}` : ""),
              operationType: "transaction",
              transactionType: trans.type,
              amount: trans.type === "versement" ? trans.amount : -trans.amount,
              number: 1,
              isDetailRow: false,
            });
          }
        });
      } catch (e) {
        console.error("Error parsing PV data:", e);
      }
    });

    return rows.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.time.localeCompare(a.time);
    });
  }, [allPVs]);

  const filteredOperations = useMemo(() => {
    return allOperations.filter((row) => {
      if (startDate || endDate) {
        const rowDate = parseISO(row.date);
        if (startDate && endDate) {
          if (rowDate < startDate || rowDate > endDate) return false;
        } else if (startDate) {
          if (rowDate < startDate) return false;
        } else if (endDate) {
          if (rowDate > endDate) return false;
        }
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!row.operationName.toLowerCase().includes(query)) {
          return false;
        }
      }

      if (typeFilter !== "all") {
        if (typeFilter === "operation" && row.operationType !== "operation") return false;
        if (typeFilter === "versement" && row.transactionType !== "versement") return false;
        if (typeFilter === "retrait" && row.transactionType !== "retrait") return false;
      }

      if (amountFilter !== "all") {
        if (amountFilter === "positive" && row.amount <= 0) return false;
        if (amountFilter === "negative" && row.amount >= 0) return false;
      }

      return true;
    });
  }, [allOperations, startDate, endDate, searchQuery, typeFilter, amountFilter]);

  const totalAmount = filteredOperations.reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">
              Détails des Opérations
            </h1>
            <p className="text-muted-foreground mt-1">
              Vue détaillée de toutes les opérations et transactions
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
                      {startDate ? format(startDate, "P", { locale: fr }) : "Sélectionner"}
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
                      {endDate ? format(endDate, "P", { locale: fr }) : "Sélectionner"}
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
                <label className="text-sm font-medium">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[200px]" data-testid="select-type-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="operation">Opérations</SelectItem>
                    <SelectItem value="versement">Versements</SelectItem>
                    <SelectItem value="retrait">Retraits</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Montant</label>
                <Select value={amountFilter} onValueChange={setAmountFilter}>
                  <SelectTrigger className="w-[200px]" data-testid="select-amount-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="positive">Positif</SelectItem>
                    <SelectItem value="negative">Négatif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4 flex-wrap items-end">
              <div className="flex-1 min-w-[300px]">
                <label className="text-sm font-medium mb-2 block">Rechercher</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Nom de l'opération..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
              </div>

              {(startDate || endDate || searchQuery || typeFilter !== "all" || amountFilter !== "all") && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStartDate(undefined);
                    setEndDate(undefined);
                    setSearchQuery("");
                    setTypeFilter("all");
                    setAmountFilter("all");
                  }}
                  data-testid="button-clear-filters"
                >
                  Effacer les filtres
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Résumé</span>
              <div className="flex items-center gap-4">
                <div className="text-sm font-normal text-muted-foreground">
                  {filteredOperations.length} opération{filteredOperations.length > 1 ? "s" : ""}
                </div>
                <div className={`font-mono ${totalAmount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  Total: {formatNumber(totalAmount)} MAD
                </div>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="text-muted-foreground">Chargement...</div>
          </div>
        )}

        {!isLoading && filteredOperations.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Aucune opération trouvée
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && filteredOperations.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Heure</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Opération</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Nombre</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredOperations.map((row, index) => (
                      <tr
                        key={`${row.pvId}-${row.operationName}-${index}`}
                        className="hover-elevate"
                        data-testid={`row-operation-${index}`}
                      >
                        <td className="px-4 py-3 text-sm" data-testid={`text-date-${index}`}>
                          {format(parseISO(row.date), "dd/MM/yyyy", { locale: fr })}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono" data-testid={`text-time-${index}`}>
                          {row.time}
                        </td>
                        <td className="px-4 py-3 text-sm" data-testid={`text-name-${index}`}>
                          {row.operationName}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground" data-testid={`text-detail-${index}`}>
                          {row.detailLabel || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {row.operationType === "operation" ? (
                            <Badge variant="secondary" data-testid={`badge-type-${index}`}>
                              Opération
                            </Badge>
                          ) : row.transactionType === "versement" ? (
                            <Badge variant="default" className="bg-emerald-600" data-testid={`badge-type-${index}`}>
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Versement
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-rose-600" data-testid={`badge-type-${index}`}>
                              <TrendingDown className="w-3 h-3 mr-1" />
                              Retrait
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono" data-testid={`text-number-${index}`}>
                          {row.number}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm text-right font-mono font-semibold ${
                            row.amount >= 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                          data-testid={`text-amount-${index}`}
                        >
                          {row.amount >= 0 ? "+" : ""}
                          {formatNumber(row.amount)} MAD
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
