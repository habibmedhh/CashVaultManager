import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Plus, Trash2, Save, Percent, DollarSign, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PVConfiguration } from "@shared/schema";

interface CommissionTier {
  min: number;
  max: number;
  commission: number;
}

interface OperationConfig {
  name: string;
  defaultNumber: number;
  commissionType?: 'none' | 'fixed' | 'percentage' | 'tiered';
  commissionFixed?: number;
  commissionPercentage?: number;
  commissionTiers?: CommissionTier[];
}

export default function PVConfigurationPage() {
  const { toast } = useToast();
  const [operationsIN, setOperationsIN] = useState<OperationConfig[]>([]);
  const [operationsOUT, setOperationsOUT] = useState<OperationConfig[]>([]);

  const { data: config, isLoading } = useQuery<PVConfiguration>({
    queryKey: ["/api/pv-configuration"],
  });

  useEffect(() => {
    if (config) {
      try {
        const opsIn = JSON.parse(config.operationsInData) as OperationConfig[];
        const opsOut = JSON.parse(config.operationsOutData) as OperationConfig[];
        setOperationsIN(opsIn);
        setOperationsOUT(opsOut);
      } catch (e) {
        console.error("Error parsing configuration:", e);
      }
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        operationsInData: JSON.stringify(operationsIN),
        operationsOutData: JSON.stringify(operationsOUT),
      };

      if (config?.id) {
        return apiRequest("PATCH", `/api/pv-configuration/${config.id}`, data);
      } else {
        return apiRequest("POST", "/api/pv-configuration", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pv-configuration"] });
      toast({
        title: "Configuration sauvegardée",
        description: "Les opérations ont été mises à jour avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration.",
        variant: "destructive",
      });
    },
  });

  const addOperationIN = () => {
    setOperationsIN([...operationsIN, { name: "", defaultNumber: 0, commissionType: 'none' }]);
  };

  const addOperationOUT = () => {
    setOperationsOUT([...operationsOUT, { name: "", defaultNumber: 0, commissionType: 'none' }]);
  };

  const removeOperationIN = (index: number) => {
    setOperationsIN(operationsIN.filter((_, i) => i !== index));
  };

  const removeOperationOUT = (index: number) => {
    setOperationsOUT(operationsOUT.filter((_, i) => i !== index));
  };

  const updateOperationIN = (index: number, field: keyof OperationConfig, value: any) => {
    const updated = [...operationsIN];
    updated[index] = { ...updated[index], [field]: value };
    setOperationsIN(updated);
  };

  const updateOperationOUT = (index: number, field: keyof OperationConfig, value: any) => {
    const updated = [...operationsOUT];
    updated[index] = { ...updated[index], [field]: value };
    setOperationsOUT(updated);
  };

  const addTierIN = (index: number) => {
    const updated = [...operationsIN];
    const tiers = updated[index].commissionTiers || [];
    tiers.push({ min: 0, max: 0, commission: 0 });
    updated[index] = { ...updated[index], commissionTiers: tiers };
    setOperationsIN(updated);
  };

  const addTierOUT = (index: number) => {
    const updated = [...operationsOUT];
    const tiers = updated[index].commissionTiers || [];
    tiers.push({ min: 0, max: 0, commission: 0 });
    updated[index] = { ...updated[index], commissionTiers: tiers };
    setOperationsOUT(updated);
  };

  const removeTierIN = (opIndex: number, tierIndex: number) => {
    const updated = [...operationsIN];
    const tiers = (updated[opIndex].commissionTiers || []).filter((_, i) => i !== tierIndex);
    updated[opIndex] = { ...updated[opIndex], commissionTiers: tiers };
    setOperationsIN(updated);
  };

  const removeTierOUT = (opIndex: number, tierIndex: number) => {
    const updated = [...operationsOUT];
    const tiers = (updated[opIndex].commissionTiers || []).filter((_, i) => i !== tierIndex);
    updated[opIndex] = { ...updated[opIndex], commissionTiers: tiers };
    setOperationsOUT(updated);
  };

  const updateTierIN = (opIndex: number, tierIndex: number, field: keyof CommissionTier, value: number) => {
    const updated = [...operationsIN];
    const tiers = [...(updated[opIndex].commissionTiers || [])];
    tiers[tierIndex] = { ...tiers[tierIndex], [field]: value };
    updated[opIndex] = { ...updated[opIndex], commissionTiers: tiers };
    setOperationsIN(updated);
  };

  const updateTierOUT = (opIndex: number, tierIndex: number, field: keyof CommissionTier, value: number) => {
    const updated = [...operationsOUT];
    const tiers = [...(updated[opIndex].commissionTiers || [])];
    tiers[tierIndex] = { ...tiers[tierIndex], [field]: value };
    updated[opIndex] = { ...updated[opIndex], commissionTiers: tiers };
    setOperationsOUT(updated);
  };

  const renderCommissionFields = (
    op: OperationConfig,
    index: number,
    isIN: boolean
  ) => {
    const updateOp = isIN ? updateOperationIN : updateOperationOUT;
    const addTier = isIN ? addTierIN : addTierOUT;
    const removeTier = isIN ? removeTierIN : removeTierOUT;
    const updateTier = isIN ? updateTierIN : updateTierOUT;

    if (op.commissionType === 'fixed') {
      return (
        <div className="pl-4 border-l-2 border-blue-300 dark:border-blue-700">
          <Label className="text-xs text-muted-foreground">Montant fixe (DHS)</Label>
          <Input
            type="number"
            step="0.01"
            value={op.commissionFixed || 0}
            onChange={(e) => updateOp(index, "commissionFixed", parseFloat(e.target.value) || 0)}
            placeholder="Ex: 13.00"
            className="mt-1"
            data-testid={`input-commission-fixed-${isIN ? 'in' : 'out'}-${index}`}
          />
        </div>
      );
    }

    if (op.commissionType === 'percentage') {
      return (
        <div className="pl-4 border-l-2 border-blue-300 dark:border-blue-700">
          <Label className="text-xs text-muted-foreground">Pourcentage (%)</Label>
          <Input
            type="number"
            step="0.01"
            value={op.commissionPercentage || 0}
            onChange={(e) => updateOp(index, "commissionPercentage", parseFloat(e.target.value) || 0)}
            placeholder="Ex: 2.5"
            className="mt-1"
            data-testid={`input-commission-percentage-${isIN ? 'in' : 'out'}-${index}`}
          />
        </div>
      );
    }

    if (op.commissionType === 'tiered') {
      return (
        <div className="pl-4 border-l-2 border-blue-300 dark:border-blue-700 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Paliers de commission</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => addTier(index)}
              className="h-7 text-xs"
              data-testid={`button-add-tier-${isIN ? 'in' : 'out'}-${index}`}
            >
              <Plus className="w-3 h-3 mr-1" />
              Palier
            </Button>
          </div>
          
          {(op.commissionTiers || []).map((tier, tierIndex) => (
            <div key={tierIndex} className="flex items-end gap-2 bg-muted/30 p-2 rounded">
              <div className="flex-1">
                <Label className="text-xs">Min (DHS)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={tier.min}
                  onChange={(e) => updateTier(index, tierIndex, "min", parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm"
                  data-testid={`input-tier-min-${isIN ? 'in' : 'out'}-${index}-${tierIndex}`}
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Max (DHS)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={tier.max}
                  onChange={(e) => updateTier(index, tierIndex, "max", parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm"
                  data-testid={`input-tier-max-${isIN ? 'in' : 'out'}-${index}-${tierIndex}`}
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Commission (DHS)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={tier.commission}
                  onChange={(e) => updateTier(index, tierIndex, "commission", parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm"
                  data-testid={`input-tier-commission-${isIN ? 'in' : 'out'}-${index}-${tierIndex}`}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeTier(index, tierIndex)}
                className="h-8 w-8"
                data-testid={`button-remove-tier-${isIN ? 'in' : 'out'}-${index}-${tierIndex}`}
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          ))}
          
          {(!op.commissionTiers || op.commissionTiers.length === 0) && (
            <div className="text-xs text-muted-foreground text-center py-2">
              Aucun palier configuré
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="text-config-title">
            <Settings className="w-8 h-8 text-primary" />
            Configuration PV
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Paramétrer les opérations et leurs commissions pour tous les agents
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          data-testid="button-save-config"
        >
          <Save className="w-4 h-4 mr-2" />
          Sauvegarder
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operations IN */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              Opérations IN (Recettes)
            </h2>
            <Button
              onClick={addOperationIN}
              size="sm"
              variant="outline"
              data-testid="button-add-operation-in"
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </div>

          <div className="space-y-6">
            {operationsIN.map((op, index) => (
              <div key={index} className="p-4 bg-muted/20 rounded-lg border border-muted space-y-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label>Nom de l'opération</Label>
                    <Input
                      value={op.name}
                      onChange={(e) => updateOperationIN(index, "name", e.target.value)}
                      placeholder="Ex: Change, Recharge..."
                      data-testid={`input-operation-in-name-${index}`}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOperationIN(index)}
                    data-testid={`button-remove-operation-in-${index}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Type de commission
                  </Label>
                  <Select
                    value={op.commissionType || 'none'}
                    onValueChange={(value) => updateOperationIN(index, "commissionType", value)}
                  >
                    <SelectTrigger className="mt-1" data-testid={`select-commission-type-in-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune commission</SelectItem>
                      <SelectItem value="fixed">Montant fixe</SelectItem>
                      <SelectItem value="percentage">Pourcentage</SelectItem>
                      <SelectItem value="tiered">Par paliers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {renderCommissionFields(op, index, true)}
              </div>
            ))}
            {operationsIN.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucune opération IN configurée
              </div>
            )}
          </div>
        </Card>

        {/* Operations OUT */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
              Opérations OUT (Dépenses)
            </h2>
            <Button
              onClick={addOperationOUT}
              size="sm"
              variant="outline"
              data-testid="button-add-operation-out"
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </div>

          <div className="space-y-6">
            {operationsOUT.map((op, index) => (
              <div key={index} className="p-4 bg-muted/20 rounded-lg border border-muted space-y-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label>Nom de l'opération</Label>
                    <Input
                      value={op.name}
                      onChange={(e) => updateOperationOUT(index, "name", e.target.value)}
                      placeholder="Ex: Frais, Charges..."
                      data-testid={`input-operation-out-name-${index}`}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOperationOUT(index)}
                    data-testid={`button-remove-operation-out-${index}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Type de commission
                  </Label>
                  <Select
                    value={op.commissionType || 'none'}
                    onValueChange={(value) => updateOperationOUT(index, "commissionType", value)}
                  >
                    <SelectTrigger className="mt-1" data-testid={`select-commission-type-out-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune commission</SelectItem>
                      <SelectItem value="fixed">Montant fixe</SelectItem>
                      <SelectItem value="percentage">Pourcentage</SelectItem>
                      <SelectItem value="tiered">Par paliers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {renderCommissionFields(op, index, false)}
              </div>
            ))}
            {operationsOUT.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucune opération OUT configurée
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Information sur les commissions
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li><strong>Montant fixe :</strong> Commission identique pour chaque opération (ex: 13 DHS par transaction)</li>
          <li><strong>Pourcentage :</strong> Commission calculée en % du montant de l'opération (ex: 2.5%)</li>
          <li><strong>Par paliers :</strong> Commission variable selon le montant (ex: 0-500 DHS = 13 DHS, 501-1000 DHS = 18 DHS)</li>
        </ul>
      </Card>
    </div>
  );
}
