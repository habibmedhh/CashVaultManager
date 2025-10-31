import { FileText, History, ListChecks, Home, Building2, Shield, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "PV du Jour",
    url: "/",
    icon: FileText,
  },
  {
    title: "PV Agence",
    url: "/pv-agence",
    icon: Building2,
  },
  {
    title: "Historique des PVs",
    url: "/historique",
    icon: History,
  },
  {
    title: "Détails des Opérations",
    url: "/operations",
    icon: ListChecks,
  },
  {
    title: "Administration",
    url: "/admin",
    icon: Shield,
  },
  {
    title: "Configuration PV",
    url: "/configuration",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild data-active={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.url.replace("/", "") || "home"}`}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
