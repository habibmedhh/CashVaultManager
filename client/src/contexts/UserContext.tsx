import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface UserContextType {
  selectedUserId: string | null;
  setSelectedUserId: (userId: string | null) => void;
  currentUser: User | null;
  isAgent: boolean;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [selectedUserId, setSelectedUserIdState] = useState<string | null>(() => {
    return localStorage.getItem("selectedUserId");
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/users", selectedUserId],
    enabled: !!selectedUserId,
    queryFn: async () => {
      const response = await fetch(`/api/users/${selectedUserId}`);
      if (!response.ok) throw new Error("Failed to load user");
      return response.json();
    },
  });

  const setSelectedUserId = (userId: string | null) => {
    setSelectedUserIdState(userId);
    if (userId) {
      localStorage.setItem("selectedUserId", userId);
    } else {
      localStorage.removeItem("selectedUserId");
    }
  };

  const isAgent = currentUser?.role === "agent";
  const isAdmin = currentUser?.role === "admin";

  return (
    <UserContext.Provider value={{ 
      selectedUserId, 
      setSelectedUserId,
      currentUser: currentUser || null,
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
