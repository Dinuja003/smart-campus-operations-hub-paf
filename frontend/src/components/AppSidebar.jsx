import { useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  TriangleAlert,
  ReceiptText,
  User,
  LogOut,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { clearAuth } from "@/features/auth/services/authService"
import logo from "../assets/vite.svg"

function deriveDisplayName(email) {
  if (!email) return "My Account"
  const local = email.split("@")[0] || ""
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "My Account"
}

function deriveInitials(displayName) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "UA"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function AppSidebar() {
  const navigate = useNavigate()
  const email = localStorage.getItem("email") || ""
  const role = (localStorage.getItem("role") || "").toUpperCase()
  const displayName = deriveDisplayName(email)
  const initials = deriveInitials(displayName)
  const subtitle = email || role || "Signed in user"

  return (
    <Sidebar className="[--sidebar-accent:#e0f2fe] [--sidebar-accent-foreground:#0f172a]">
      <SidebarContent className="pt-8 bg-white/50 backdrop-blur-lg border-r border-white/30 shadow-lg">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-4 text-2xl font-bold text-foreground">
            <div className="inline-flex items-center">
              <img
                src={logo}
                alt="Logo"
                className="h-12 w-12"
              />
              UniSlot Smart Campus
            </div>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="mt-4 space-y-2">
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/")}>
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
  <SidebarMenuButton onClick={() => navigate("/resources")}>
    <LayoutDashboard />
    <span>Resources</span>
  </SidebarMenuButton>
</SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/my-bookings")}>
                  <LayoutDashboard />
                  <span>My Bookings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/admin/bookings")}>
                  <LayoutDashboard />
                  <span>All Bookings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/tickets")}>
                  <LayoutDashboard />
                  <span>My Tickets</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/notifications")}>
                  <LayoutDashboard />
                  <span>Notifications</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/profile")}>
                  <TriangleAlert />
                  <span>My Profile</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/invoices")}>
                  <ReceiptText />
                  <span>Invoices</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/20 bg-white/30 p-3 backdrop-blur-md">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-white/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 font-semibold text-white">
              {initials}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">{displayName}</div>
              <div className="truncate text-xs text-gray-600">{subtitle}</div>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="start" className="min-w-48 w-auto">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-sm font-semibold">My Account</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="focus:bg-sky-100 focus:text-slate-900"
              onClick={() => navigate("/profile")}>
              <User className="h-4 w-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:bg-sky-100 focus:text-red-700"
              onClick={() => {
                clearAuth()
                navigate("/login", { replace: true })
              }}>
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
