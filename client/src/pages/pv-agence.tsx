import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { type CashRegister, type User, type Agency } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

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

export default function PVAgence() {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("");

  const { data: agencies = [] } = useQuery<Agency[]>({
    queryKey: ["/api/agencies"],
  });

  const { data: agencyUsers = [] } = useQuery<User[]>({
    queryKey: [`/api/users/agency/${selectedAgencyId}`],
    enabled: !!selectedAgencyId,
  });

  const { data: agencyCashRegisters = [] } = useQuery<CashRegister[]>({
    queryKey: [`/api/cash-registers/agency/${selectedAgencyId}`],
    enabled: !!selectedAgencyId,
  });

  const selectedAgency = agencies.find((a) => a.id === selectedAgencyId);

  const consolidatedData = useMemo(() => {
    if (!agencyCashRegisters.length) {
      return {
        totalCaisse: 0,
        totalCoffre: 0,
        totalOperations: 0,
        soldeDepart: 0,
        ecartCaisse: 0,
        items: [] as CashItem[],
        operations: [] as Operation[],
        transactions: [] as Transaction[],
      };
    }

    const dateStr = format(date, "yyyy-MM-dd");
    const dailyPVs = agencyCashRegisters.filter((pv) => pv.date === dateStr);

    if (!dailyPVs.length) {
      return {
        totalCaisse: 0,
        totalCoffre: 0,
        totalOperations: 0,
        soldeDepart: 0,
        ecartCaisse: 0,
        items: [] as CashItem[],
        operations: [] as Operation[],
        transactions: [] as Transaction[],
      };
    }

    // Group by user and get latest PV for each user
    const latestPVsByUser = new Map<string, CashRegister>();
    dailyPVs.forEach((pv) => {
      if (!pv.userId) return;
      const existing = latestPVsByUser.get(pv.userId);
      if (!existing || new Date(pv.createdAt) > new Date(existing.createdAt)) {
        latestPVsByUser.set(pv.userId, pv);
      }
    });

    const pvs = Array.from(latestPVsByUser.values());

    // Initialize consolidated items
    const denominationMap = new Map<number, CashItem>();

    // Aggregate all cash items
    pvs.forEach((pv) => {
      try {
        const billsData: CashItem[] = JSON.parse(pv.billsData);
        const coinsData: CashItem[] = JSON.parse(pv.coinsData);
        const allItems = [...billsData, ...coinsData];

        allItems.forEach((item) => {
          const existing = denominationMap.get(item.value);
          if (existing) {
            existing.caisseAmount += item.caisseAmount;
            existing.coffreAmount += item.coffreAmount;
          } else {
            denominationMap.set(item.value, {
              value: item.value,
              caisseAmount: item.caisseAmount,
              coffreAmount: item.coffreAmount,
              color: item.color,
              icon: item.icon,
              type: item.type,
            });
          }
        });
      } catch (e) {
        console.error("Error parsing bills/coins data:", e);
      }
    });

    const items = Array.from(denominationMap.values()).sort(
      (a: CashItem, b: CashItem) => b.value - a.value
    );

    // Aggregate operations
    const operationsMap = new Map<string, Operation>();
    pvs.forEach((pv: CashRegister) => {
      try {
        const ops: Operation[] = JSON.parse(pv.operationsData);
        ops.forEach((op) => {
          const existing = operationsMap.get(op.name);
          if (existing) {
            existing.number += op.number;
            existing.amount += op.amount;
          } else {
            operationsMap.set(op.name, { ...op });
          }
        });
      } catch (e) {
        console.error("Error parsing operations data:", e);
      }
    });

    const operations = Array.from(operationsMap.values());

    // Collect all transactions (not aggregated, to show each line)
    const allTransactions: Transaction[] = [];
    pvs.forEach((pv: CashRegister) => {
      try {
        const trans: Transaction[] = JSON.parse(pv.transactionsData);
        allTransactions.push(...trans);
      } catch (e) {
        console.error("Error parsing transactions data:", e);
      }
    });

    const transactions = allTransactions;

    // Calculate totals
    const totalCaisse = items.reduce((sum, item) => sum + item.caisseAmount, 0);
    const totalCoffre = items.reduce((sum, item) => sum + item.coffreAmount, 0);
    const totalOperations = operations.reduce((sum, op) => sum + op.amount, 0);
    const soldeDepart = pvs.reduce((sum, pv) => sum + pv.soldeDepart, 0);

    const totalVersements = transactions
      .filter((t) => t.type === "versement")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalRetraits = transactions
      .filter((t) => t.type === "retrait")
      .reduce((sum, t) => sum + t.amount, 0);

    const soldeFinal = soldeDepart + totalOperations + totalVersements - totalRetraits;
    const ecartCaisse = totalCaisse + totalCoffre - soldeFinal;

    return {
      totalCaisse,
      totalCoffre,
      totalOperations,
      soldeDepart,
      soldeFinal,
      totalVersements,
      totalRetraits,
      ecartCaisse,
      items,
      operations,
      transactions,
      userCount: pvs.length,
    };
  }, [agencyCashRegisters, date]);

  const formatNumber = (num: number) => {
    return num.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Export logic here
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800" data-testid="text-page-title">
            PV Agence - Consolidé
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Vue globalisée des caisses, coffres et opérations de l'agence
          </p>
        </div>

        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" data-testid="button-select-date">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "dd MMMM yyyy", { locale: fr })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                locale={fr}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            onClick={handlePrint}
            data-testid="button-print"
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>

          <Button
            variant="outline"
            onClick={handleExport}
            data-testid="button-export"
          >
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <label className="text-sm font-semibold text-slate-700">
          Sélectionner l'agence :
        </label>
        <Select value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
          <SelectTrigger className="w-64" data-testid="select-agency">
            <SelectValue placeholder="Choisir une agence" />
          </SelectTrigger>
          <SelectContent>
            {agencies.map((agency: Agency) => (
              <SelectItem key={agency.id} value={agency.id} data-testid={`select-agency-${agency.code}`}>
                {agency.name} ({agency.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedAgency && (
          <div className="text-sm text-slate-600" data-testid="text-agency-info">
            {agencyUsers.length} agent(s) · {consolidatedData.userCount || 0} PV(s) pour cette date
          </div>
        )}
      </div>

      {!selectedAgencyId && (
        <Card className="p-8 text-center">
          <p className="text-slate-500">
            Veuillez sélectionner une agence pour voir le PV consolidé
          </p>
        </Card>
      )}

      {selectedAgencyId && (consolidatedData.userCount || 0) === 0 && (
        <Card className="p-8 text-center">
          <p className="text-slate-500">
            Aucun PV trouvé pour cette agence à la date sélectionnée
          </p>
        </Card>
      )}

      {selectedAgencyId && (consolidatedData.userCount || 0) > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-sm font-semibold text-slate-600 mb-1">Total Caisse</div>
              <div className="text-2xl font-bold text-emerald-600" data-testid="text-total-caisse">
                {formatNumber(consolidatedData.totalCaisse || 0)} DH
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-sm font-semibold text-slate-600 mb-1">Total Coffre</div>
              <div className="text-2xl font-bold text-blue-600" data-testid="text-total-coffre">
                {formatNumber(consolidatedData.totalCoffre || 0)} DH
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-sm font-semibold text-slate-600 mb-1">Total Cash</div>
              <div className="text-2xl font-bold text-slate-800" data-testid="text-total-cash">
                {formatNumber((consolidatedData.totalCaisse || 0) + (consolidatedData.totalCoffre || 0))} DH
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Détail des Billets et Pièces</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b">
                    <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                      Valeur
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700">
                      Caisse
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700">
                      Coffre
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {consolidatedData.items
                    .filter((item) => item.caisseAmount !== 0 || item.coffreAmount !== 0)
                    .map((item, index) => (
                      <tr key={index} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-2 font-semibold text-slate-700">
                          {formatNumber(item.value)} DH
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          {formatNumber(item.caisseAmount)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          {formatNumber(item.coffreAmount)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono font-semibold">
                          {formatNumber(item.caisseAmount + item.coffreAmount)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Opérations Consolidées</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b">
                    <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                      Opération
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700">
                      Nombre
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700">
                      Montant
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {consolidatedData.operations
                    .filter((op) => op.amount !== 0 || op.number !== 0)
                    .map((op) => (
                      <tr key={op.id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-2 text-slate-700">{op.name}</td>
                        <td className="px-4 py-2 text-right font-mono">{op.number}</td>
                        <td
                          className={`px-4 py-2 text-right font-mono font-semibold ${
                            op.amount >= 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {formatNumber(op.amount)} DH
                        </td>
                      </tr>
                    ))}
                  <tr className="bg-slate-100 font-bold">
                    <td className="px-4 py-2">TOTAL OPÉRATIONS</td>
                    <td className="px-4 py-2"></td>
                    <td className="px-4 py-2 text-right font-mono" data-testid="text-total-operations">
                      {formatNumber(consolidatedData.totalOperations)} DH
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Versements et Retraits</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b">
                    <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">
                      Description
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700">
                      Montant
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {consolidatedData.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-slate-500">
                        Aucun versement ou retrait
                      </td>
                    </tr>
                  ) : (
                    <>
                      {consolidatedData.transactions
                        .filter((t) => t.type === "versement" && t.amount !== 0)
                        .map((t, idx) => (
                          <tr key={`v-${idx}`} className="border-b hover:bg-slate-50">
                            <td className="px-4 py-2">
                              <Badge variant="default" className="bg-emerald-600">
                                Versement
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-slate-700">
                              {t.label}
                              {t.description && (
                                <span className="text-sm text-slate-500 ml-2">
                                  - {t.description}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right font-mono font-semibold text-emerald-600">
                              +{formatNumber(t.amount)} DH
                            </td>
                          </tr>
                        ))}
                      {consolidatedData.transactions
                        .filter((t) => t.type === "retrait" && t.amount !== 0)
                        .map((t, idx) => (
                          <tr key={`r-${idx}`} className="border-b hover:bg-slate-50">
                            <td className="px-4 py-2">
                              <Badge variant="default" className="bg-red-600">
                                Retrait
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-slate-700">
                              {t.label}
                              {t.description && (
                                <span className="text-sm text-slate-500 ml-2">
                                  - {t.description}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right font-mono font-semibold text-red-600">
                              -{formatNumber(t.amount)} DH
                            </td>
                          </tr>
                        ))}
                      <tr className="bg-slate-100 font-bold">
                        <td className="px-4 py-2" colSpan={2}>TOTAL VERSEMENTS</td>
                        <td className="px-4 py-2 text-right font-mono text-emerald-600">
                          +{formatNumber(consolidatedData.totalVersements || 0)} DH
                        </td>
                      </tr>
                      <tr className="bg-slate-100 font-bold">
                        <td className="px-4 py-2" colSpan={2}>TOTAL RETRAITS</td>
                        <td className="px-4 py-2 text-right font-mono text-red-600">
                          -{formatNumber(consolidatedData.totalRetraits || 0)} DH
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Bilan Consolidé</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-semibold text-slate-700">Solde de départ</span>
                <span className="font-mono" data-testid="text-solde-depart">
                  {formatNumber(consolidatedData.soldeDepart)} DH
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-semibold text-slate-700">Total opérations</span>
                <span className="font-mono">{formatNumber(consolidatedData.totalOperations)} DH</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-semibold text-slate-700">Total versements</span>
                <span className="font-mono text-emerald-600">
                  {formatNumber(consolidatedData.totalVersements || 0)} DH
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-semibold text-slate-700">Total retraits</span>
                <span className="font-mono text-red-600">
                  -{formatNumber(consolidatedData.totalRetraits || 0)} DH
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b bg-slate-50">
                <span className="font-bold text-slate-800">Solde final théorique</span>
                <span className="font-mono font-bold" data-testid="text-solde-final">
                  {formatNumber(consolidatedData.soldeFinal || 0)} DH
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b bg-slate-50">
                <span className="font-bold text-slate-800">Total cash réel (Caisse + Coffre)</span>
                <span className="font-mono font-bold">
                  {formatNumber(consolidatedData.totalCaisse + consolidatedData.totalCoffre)} DH
                </span>
              </div>
              <div className="flex justify-between items-center py-3 bg-slate-100 rounded-lg px-4">
                <span className="font-bold text-lg text-slate-800">Écart Caisse</span>
                <span
                  className={`font-mono font-bold text-lg ${
                    consolidatedData.ecartCaisse > 0
                      ? "text-emerald-600"
                      : consolidatedData.ecartCaisse < 0
                      ? "text-red-600"
                      : "text-slate-800"
                  }`}
                  data-testid="text-ecart-caisse"
                >
                  {consolidatedData.ecartCaisse >= 0 ? "+" : ""}
                  {formatNumber(consolidatedData.ecartCaisse)} DH
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
