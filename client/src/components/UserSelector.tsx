import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type User, type Agency } from "@shared/schema";
import { useUser } from "@/contexts/UserContext";

interface UserSelectorProps {
  selectedUserId: string | null;
  onUserChange: (userId: string) => void;
}

export function UserSelector({ selectedUserId, onUserChange }: UserSelectorProps) {
  const { currentUser, isAgent, isAdmin } = useUser();
  
  const { data: agencies = [] } = useQuery<Agency[]>({
    queryKey: ["/api/agencies"],
  });

  // Get all users from all agencies
  const agencyIds = agencies.map(a => a.id);
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users/all"],
    queryFn: async () => {
      const users: User[] = [];
      for (const agencyId of agencyIds) {
        const response = await fetch(`/api/users/agency/${agencyId}`);
        if (response.ok) {
          const agencyUsers = await response.json();
          users.push(...agencyUsers);
        }
      }
      return users;
    },
    enabled: agencyIds.length > 0,
  });

  // Si l'utilisateur est un agent, le fixer automatiquement sur son propre compte
  useEffect(() => {
    if (isAgent && currentUser && selectedUserId !== currentUser.id) {
      onUserChange(currentUser.id);
    }
  }, [isAgent, currentUser, selectedUserId, onUserChange]);

  const selectedUser = allUsers.find(u => u.id === selectedUserId);
  const selectedAgency = agencies.find(a => a.id === selectedUser?.agencyId);

  // Pour les agents, afficher juste leur nom (pas de sélecteur)
  if (isAgent && currentUser) {
    const agency = agencies.find(a => a.id === currentUser.agencyId);
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm text-slate-600">Agent:</div>
        <div className="px-3 py-2 text-sm font-medium bg-slate-100 rounded-md">
          {currentUser.fullName || currentUser.username} {agency && `(${agency.code})`}
        </div>
        {agency && (
          <div className="text-xs text-slate-500">
            {agency.name}
          </div>
        )}
      </div>
    );
  }

  // Pour les admins, afficher le sélecteur avec tous les utilisateurs
  return (
    <div className="flex items-center gap-2">
      <div className="text-sm text-slate-600">Agent:</div>
      <Select value={selectedUserId || ""} onValueChange={onUserChange}>
        <SelectTrigger className="w-56" data-testid="select-user">
          <SelectValue placeholder="Sélectionner un agent" />
        </SelectTrigger>
        <SelectContent>
          {allUsers.map((user: User) => {
            const agency = agencies.find(a => a.id === user.agencyId);
            return (
              <SelectItem key={user.id} value={user.id} data-testid={`select-user-${user.username}`}>
                {user.fullName || user.username} {agency && `(${agency.code})`}
                {user.role === "admin" && " (Admin)"}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {selectedAgency && (
        <div className="text-xs text-slate-500">
          {selectedAgency.name}
        </div>
      )}
    </div>
  );
}
