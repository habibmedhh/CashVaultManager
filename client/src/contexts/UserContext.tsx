import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface UserContextType {
  selectedUserId: string | null;
  setSelectedUserId: (userId: string | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [selectedUserId, setSelectedUserIdState] = useState<string | null>(() => {
    return localStorage.getItem("selectedUserId");
  });

  const setSelectedUserId = (userId: string | null) => {
    setSelectedUserIdState(userId);
    if (userId) {
      localStorage.setItem("selectedUserId", userId);
    } else {
      localStorage.removeItem("selectedUserId");
    }
  };

  return (
    <UserContext.Provider value={{ selectedUserId, setSelectedUserId }}>
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
