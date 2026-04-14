import { useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  TriangleAlert,
  ReceiptText,
  User,
  Settings as SettingsIcon,
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import logo from "../assets/vite.svg"
export function AppSidebar() {
  const navigate = useNavigate()
  return (
    <Sidebar>
      <SidebarContent className="pt-8 bg-white/50 backdrop-blur-lg border-r border-white/30 shadow-lg">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-4 text-2xl font-bold text-foreground">
            <div className="inline-flex items-center">
              <img
                src={logo}
                alt="Logo"
                className="h-12 w-12"
              />
              Helloo
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
              UA
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">My Account</div>
              <div className="truncate text-xs text-gray-600">user@example.com</div>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="right" align="start" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 focus:text-red-700">
              <LogOut className="mr-2 h-4 w-4" />
              <span className="ml-2">Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
