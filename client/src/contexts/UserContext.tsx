import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface UserContextType {
  selectedUserId: string | null;
  setSelectedUserId: (userId: string | null) => void;
  loggedInUserId: string | null;
  setLoggedInUserId: (userId: string | null) => void;
  loggedInUser: User | null;
  selectedUser: User | null;
  isAgent: boolean;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [selectedUserId, setSelectedUserIdState] = useState<string | null>(() => {
    return localStorage.getItem("selectedUserId");
  });

  const [loggedInUserId, setLoggedInUserIdState] = useState<string | null>(() => {
    return localStorage.getItem("loggedInUserId");
  });

  // Fetch the logged-in user (the one who is authenticated)
  const { data: loggedInUser } = useQuery<User>({
    queryKey: ["/api/users/loggedIn", loggedInUserId],
    enabled: !!loggedInUserId,
    queryFn: async () => {
      const response = await fetch(`/api/users/${loggedInUserId}`);
      if (!response.ok) throw new Error("Failed to load logged in user");
      return response.json();
    },
  });

  // Fetch the selected user (the one for whom we're entering data)
  const { data: selectedUser } = useQuery<User>({
    queryKey: ["/api/users/selected", selectedUserId],
    enabled: !!selectedUserId,
    queryFn: async () => {
      const response = await fetch(`/api/users/${selectedUserId}`);
      if (!response.ok) throw new Error("Failed to load selected user");
      return response.json();
    },
  });

  const setSelectedUserId = (userId: string | null) => {
    setSelectedUserIdState(userId);
    if (userId) {
      localStorage.setItem("selectedUserId", userId);
      // Si loggedInUserId n'est pas défini, le définir automatiquement
      if (!loggedInUserId) {
        setLoggedInUserId(userId);
      }
    } else {
      localStorage.removeItem("selectedUserId");
    }
  };

  const setLoggedInUserId = (userId: string | null) => {
    setLoggedInUserIdState(userId);
    if (userId) {
      localStorage.setItem("loggedInUserId", userId);
      // Par défaut, l'utilisateur sélectionné est l'utilisateur connecté
      if (!selectedUserId) {
        setSelectedUserId(userId);
      }
    } else {
      localStorage.removeItem("loggedInUserId");
    }
  };

  // Role checks are based on the logged-in user, NOT the selected user
  const isAgent = loggedInUser?.role === "agent";
  const isAdmin = loggedInUser?.role === "admin";

  return (
    <UserContext.Provider value={{ 
      selectedUserId, 
      setSelectedUserId,
      loggedInUserId,
      setLoggedInUserId,
      loggedInUser: loggedInUser || null,
      selectedUser: selectedUser || null,
      isAgent,
      isAdmin
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
