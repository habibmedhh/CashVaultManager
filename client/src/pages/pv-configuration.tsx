import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PVConfiguration } from "@shared/schema";

interface OperationConfig {
  name: string;
  defaultNumber: number;
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
        return apiRequest(`/api/pv-configuration/${config.id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return apiRequest("/api/pv-configuration", {
          method: "POST",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" },
        });
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
    setOperationsIN([...operationsIN, { name: "", defaultNumber: 0 }]);
  };

  const addOperationOUT = () => {
    setOperationsOUT([...operationsOUT, { name: "", defaultNumber: 0 }]);
  };

  const removeOperationIN = (index: number) => {
    setOperationsIN(operationsIN.filter((_, i) => i !== index));
  };

  const removeOperationOUT = (index: number) => {
    setOperationsOUT(operationsOUT.filter((_, i) => i !== index));
  };

  const updateOperationIN = (index: number, field: keyof OperationConfig, value: string | number) => {
    const updated = [...operationsIN];
    updated[index] = { ...updated[index], [field]: value };
    setOperationsIN(updated);
  };

  const updateOperationOUT = (index: number, field: keyof OperationConfig, value: string | number) => {
    const updated = [...operationsOUT];
    updated[index] = { ...updated[index], [field]: value };
    setOperationsOUT(updated);
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
            Paramétrer les opérations à afficher pour tous les agents
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

          <div className="space-y-4">
            {operationsIN.map((op, index) => (
              <div key={index} className="flex items-end gap-2">
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

          <div className="space-y-4">
            {operationsOUT.map((op, index) => (
              <div key={index} className="flex items-end gap-2">
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
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Information importante
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Ces opérations seront affichées pour tous les agents lors de la création ou modification d'un PV.
          Les modifications prendront effet immédiatement pour tous les utilisateurs.
        </p>
      </Card>
    </div>
  );
}
