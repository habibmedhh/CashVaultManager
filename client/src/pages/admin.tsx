import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronRight, Calendar, User, ArrowLeft } from "lucide-react";
import { type Agency, type CashRegister, type User as UserType } from "@shared/schema";

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

export default function Admin() {
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: agencies = [], isLoading: loadingAgencies } = useQuery<Agency[]>({
    queryKey: ["/api/agencies"],
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users/all"],
  });

  const { data: cashRegisters = [], isLoading: loadingRegisters } = useQuery<CashRegister[]>({
    queryKey: ["/api/cash-registers"],
  });

  const selectedAgency = agencies.find(a => a.id === selectedAgencyId);

  const agencyDailyData = useMemo(() => {
    if (!selectedAgencyId || !cashRegisters.length) return [];

    const agencyPVs = cashRegisters.filter(cr => cr.agencyId === selectedAgencyId);
    
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
            totalCaisseAmount += item.caisseAmount * item.value;
            totalCoffreAmount += item.coffreAmount * item.value;
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
  }, [selectedAgencyId, cashRegisters]);

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

      return {
        userId,
        user,
        pv,
        soldeDepart: pv.soldeDepart,
        totalOperations,
        totalVersements,
        totalRetraits,
        soldeFinal,
        totalCaisse,
        totalCoffre,
        ecart: (totalCaisse + totalCoffre) - soldeFinal,
      };
    });
  }, [selectedAgencyId, selectedDate, cashRegisters, users]);

  const formatNumber = (num: number) => {
    return num.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  if (loadingAgencies) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!selectedAgencyId) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-admin-title">
            Administration
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestion et suivi de toutes les agences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agencies.map(agency => {
            const agencyUsers = users.filter(u => u.agencyId === agency.id);
            const agencyCR = cashRegisters.filter(cr => cr.agencyId === agency.id);
            const uniqueDates = new Set(agencyCR.map(cr => cr.date)).size;

            return (
              <Card
                key={agency.id}
                className="p-6 hover-elevate cursor-pointer"
                onClick={() => setSelectedAgencyId(agency.id)}
                data-testid={`card-agency-${agency.code}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg" data-testid={`text-agency-name-${agency.code}`}>
                        {agency.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Code: {agency.code}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Agents</span>
                    <Badge variant="secondary">{agencyUsers.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">PVs enregistrés</span>
                    <Badge variant="secondary">{agencyCR.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Jours avec PV</span>
                    <Badge variant="secondary">{uniqueDates}</Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {agencies.length === 0 && (
          <Card className="p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucune agence</h3>
            <p className="text-muted-foreground">
              Aucune agence n'a été créée pour le moment.
            </p>
          </Card>
        )}
      </div>
    );
  }

  if (selectedAgencyId && !selectedDate) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedAgencyId(null)}
            data-testid="button-back-to-agencies"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-agency-title">
              {selectedAgency?.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Suivi journal - Code: {selectedAgency?.code}
            </p>
          </div>
        </div>

        {loadingRegisters ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-muted-foreground">Chargement des données...</div>
          </div>
        ) : agencyDailyData.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun PV</h3>
            <p className="text-muted-foreground">
              Aucun PV n'a été enregistré pour cette agence.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {agencyDailyData.map(day => (
              <Card
                key={day.date}
                className="p-4 hover-elevate cursor-pointer"
                onClick={() => setSelectedDate(day.date)}
                data-testid={`card-date-${day.date}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg">{formatDate(day.date)}</h3>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Solde départ</span>
                    <span className="font-semibold">{formatNumber(day.soldeDepart)} DH</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total opérations</span>
                    <span className={day.totalOperations !== 0 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : ""}>
                      {formatNumber(day.totalOperations)} DH
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Versements</span>
                    <span className={day.versements !== 0 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : ""}>
                      +{formatNumber(day.versements)} DH
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Retraits</span>
                    <span className={day.retraits !== 0 ? "text-red-600 dark:text-red-400 font-semibold" : ""}>
                      -{formatNumber(day.retraits)} DH
                    </span>
                  </div>
                  
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Solde final</span>
                    <span className="font-bold text-primary">
                      {formatNumber(day.soldeFinal)} DH
                    </span>
                  </div>

                  <div className={`flex justify-between items-center py-2 px-2 rounded mt-2 ${
                    day.ecartCaisse > 0 ? 'bg-emerald-100 dark:bg-emerald-950/30' :
                    day.ecartCaisse < 0 ? 'bg-red-100 dark:bg-red-950/30' :
                    'bg-muted/50'
                  }`}>
                    <span className="font-semibold text-xs">Écart Caisse</span>
                    <span className={`font-bold text-sm ${
                      day.ecartCaisse > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                      day.ecartCaisse < 0 ? 'text-red-600 dark:text-red-400' :
                      ''
                    }`}>
                      {day.ecartCaisse >= 0 ? '+' : ''}{formatNumber(day.ecartCaisse)} DH
                    </span>
                  </div>

                  <div className="flex justify-between pt-1">
                    <span className="text-muted-foreground text-xs">Agents</span>
                    <Badge variant="outline" className="text-xs">{day.userCount}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (selectedAgencyId && selectedDate && selectedDateData) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedDate(null)}
            data-testid="button-back-to-dates"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-date-title">
              {selectedAgency?.name} - {formatDate(selectedDate)}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              PVs des agents pour cette date
            </p>
          </div>
        </div>

        {selectedDateData.length === 0 ? (
          <Card className="p-12 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun agent</h3>
            <p className="text-muted-foreground">
              Aucun PV d'agent trouvé pour cette date.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {selectedDateData.map(({ userId, user, pv, soldeDepart, totalOperations, totalVersements, totalRetraits, soldeFinal, totalCaisse, totalCoffre, ecart }) => (
              <Card key={userId} className="p-6" data-testid={`card-agent-${userId}`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" data-testid={`text-agent-name-${userId}`}>
                      {user?.fullName || user?.username || 'Agent inconnu'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {user?.username}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm text-muted-foreground">Solde de départ</span>
                    <span className="font-semibold">{formatNumber(soldeDepart)} DH</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm text-muted-foreground">Total opérations</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatNumber(totalOperations)} DH
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm text-muted-foreground">Versements</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      +{formatNumber(totalVersements)} DH
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm text-muted-foreground">Retraits</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      -{formatNumber(totalRetraits)} DH
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 bg-muted/50 px-3 rounded">
                    <span className="font-semibold">Solde final théorique</span>
                    <span className="font-bold">{formatNumber(soldeFinal)} DH</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded">
                      <div className="text-xs text-muted-foreground mb-1">Caisse</div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(totalCaisse)} DH</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                      <div className="text-xs text-muted-foreground mb-1">Coffre</div>
                      <div className="font-bold text-blue-600 dark:text-blue-400">{formatNumber(totalCoffre)} DH</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-2 bg-muted/50 px-3 rounded">
                    <span className="font-semibold">Total cash réel</span>
                    <span className="font-bold">{formatNumber(totalCaisse + totalCoffre)} DH</span>
                  </div>

                  <div className={`flex justify-between items-center py-3 px-3 rounded ${
                    ecart > 0 ? 'bg-emerald-100 dark:bg-emerald-950/30' :
                    ecart < 0 ? 'bg-red-100 dark:bg-red-950/30' :
                    'bg-muted/50'
                  }`}>
                    <span className="font-bold">Écart Caisse</span>
                    <span className={`font-bold text-lg ${
                      ecart > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                      ecart < 0 ? 'text-red-600 dark:text-red-400' :
                      ''
                    }`}>
                      {ecart >= 0 ? '+' : ''}{formatNumber(ecart)} DH
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
