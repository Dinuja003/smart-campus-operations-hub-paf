import { useNavigate, useLocation } from "react-router-dom"
import { useNotifications } from "@/features/notification/context/NotificationContext"
import {
  BarChart3,
  Bell,
  Building2,
  CalendarCheck2,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Ticket,
  User,
  Users,
  Wrench,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
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
import { useUserProfile } from "@/features/users/context/UserProfileContext"

const navSectionsByRole = {
  USER: [
    {
      section: "MAIN MENU",
      items: [
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { label: "My Bookings", path: "/my-bookings", icon: CalendarCheck2 },
      ],
    },
    {
      section: "WORKSPACE",
      items: [
        { label: "My Tickets", path: "/tickets", icon: Ticket },
        { label: "Notifications", path: "/notifications", icon: Bell },
        { label: "My Profile", path: "/profile", icon: User },
      ],
    },
  ],
  ADMIN: [
    {
      section: "MAIN MENU",
      items: [
        { label: "Dashboard",    path: "/dashboard",      icon: LayoutDashboard },
        { label: "All Bookings", path: "/admin/bookings", icon: ShieldCheck     },
        { label: "Analytics",    path: "/analytics",      icon: BarChart3       },
        { label: "Resources",    path: "/resources",      icon: Wrench          },
        { label: "Users",        path: "/admin/users",    icon: Users           },
      ],
    },
    {
      section: "WORKSPACE",
      items: [
        { label: "Tickets", path: "/admin/tickets", icon: Ticket },
        { label: "Notifications", path: "/notifications", icon: Bell },
        { label: "My Profile", path: "/profile", icon: User },
      ],
    },
  ],
  TECHNICIAN: [
    {
      section: "MAIN MENU",
      items: [
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { label: "Resources", path: "/resources", icon: Wrench },
      ],
    },
    {
      section: "WORKSPACE",
      items: [
        { label: "Tickets", path: "/admin/tickets", icon: Ticket },
        { label: "Notifications", path: "/notifications", icon: Bell },
        { label: "My Profile", path: "/profile", icon: User },
      ],
    },
  ],
}

function deriveDisplayName(email) {
  if (!email) return "My Account"
  const local = email.split("@")[0] || ""
  return (
    local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || "My Account"
  )
}

function deriveInitials(displayName) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "UA"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = sessionStorage.getItem("email") || ""
  const role = (sessionStorage.getItem("role") || "USER").toUpperCase()
  const displayName = deriveDisplayName(email)
  const initials = deriveInitials(displayName)
  const navSections = navSectionsByRole[role] || navSectionsByRole.USER
  const { unreadCount } = useNotifications()
  const { profile, setProfile } = useUserProfile()

  return (
    <Sidebar>
      {/* Azul Brant dark navy */}
      <SidebarContent className="bg-[#001d45] border-r border-white/10">

        {/* Brand */}
        <div className="px-4 pt-6 pb-5">
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="flex items-center gap-2.5 w-full"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand shadow-[0_6px_16px_rgba(244,94,43,0.40)]">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none text-white">UniSlot</p>
              <p className="mt-0.5 text-[10px] font-medium tracking-widest text-white/45 uppercase">Smart Campus</p>
            </div>
          </button>
        </div>

        {/* Divider */}
        <div className="mx-4 mb-2 h-px bg-white/10" />

        {/* Nav sections */}
        {navSections.map(({ section, items }) => (
          <SidebarGroup key={section} className="mb-1 px-3">
            <p className="mb-1 px-3 text-[9px] font-bold tracking-widest text-white/35 uppercase">
              {section}
            </p>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        onClick={() => navigate(item.path)}
                        className={`w-full cursor-pointer rounded-xl px-3 py-2.5 transition-all
                          ${isActive
                            ? "bg-brand text-white shadow-[0_4px_12px_rgba(244,94,43,0.25)] hover:bg-brand hover:text-white"
                            : "text-white/55 hover:bg-white/10 hover:text-white"
                          }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="text-sm font-medium flex-1">{item.label}</span>
                        {item.path === "/notifications" && unreadCount > 0 && (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 bg-[#001030] p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left outline-none transition-colors hover:bg-white/10">
            <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden shadow-sm">
              {profile?.profileImage ? (
                <img src={profile.profileImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#f45e2b] to-[#f45e2b]/60 text-sm font-bold text-white">
                  {initials}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">{displayName}</div>
              <div className="truncate text-xs text-white/50">{email || role}</div>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="top"
            align="start"
            className="min-w-48 w-auto bg-white border border-slate-200 text-slate-700 shadow-xl"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-sm font-semibold text-navy">My Account</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-slate-200" />
            <DropdownMenuItem
              className="text-brand focus:bg-brand/8 focus:text-brand cursor-pointer"
              onClick={() => navigate("/profile")}
            >
              <User className="h-4 w-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-200" />
            <DropdownMenuItem
              className="text-red-500 focus:bg-red-50 focus:text-red-500 cursor-pointer"
              onClick={() => {
                clearAuth()
                setProfile(null)
                navigate("/", { replace: true })
              }}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
