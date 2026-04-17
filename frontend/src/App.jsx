import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom"
import { SidebarProvider } from "./components/ui/sidebar"
import { AppSidebar } from "./components/AppSidebar"
import MyBookingsPage from "./features/booking/pages/MyBookingsPage"
import AdminBookingsPage from "./features/booking/pages/AdminBookingsPage"
import LoginPage from "./features/auth/pages/LoginPage"
import SignupPage from "./features/auth/pages/SignupPage"
import OAuth2CallbackPage from "./features/auth/pages/OAuth2CallbackPage"
import ProtectedRoute from "./features/auth/components/ProtectedRoute"

const quickActions = [
  {
    label: "My Bookings",
    icon: "📅",
    path: "/my-bookings",
    className:
      "from-blue-600 to-blue-500 shadow-[0_12px_30px_-16px_rgba(37,99,235,0.7)] hover:from-blue-500 hover:to-blue-400",
  },
  {
    label: "Admin Bookings",
    icon: "⚙️",
    path: "/admin/bookings",
    className:
      "from-slate-800 to-slate-700 shadow-[0_12px_30px_-16px_rgba(15,23,42,0.7)] hover:from-slate-700 hover:to-slate-600",
  },
]
import CreateTicketPage from "./features/ticket/pages/CreateTicketPage"


function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="m-0 text-2xl font-semibold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500">
          Welcome to UniSlot. Select a section below to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {quickActions.map((action) => (
          <button
            key={action.path}
            type="button"
            onClick={() => navigate(action.path)}
            className={`inline-flex items-center gap-3 rounded-xl bg-gradient-to-r px-5 py-4 text-left text-white transition-colors ${action.className}`}
          >
            <span aria-hidden="true" className="text-lg">
              {action.icon}
            </span>
            <span className="text-sm font-semibold tracking-wide">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ComingSoon({ title }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
      <h2 className="mb-2 text-2xl font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500">Coming soon...</p>
    </div>
  )
}

function AppShell() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-b from-slate-50 to-indigo-50 ">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="border-b border-slate-200/80 bg-white/80 px-6 py-5 backdrop-blur-sm sm:px-8">
            <div className="text-xs tracking-[0.16em] text-black uppercase">
              UniSlot
            </div>
            <h1 className="mt-2 text-3xl leading-tight font-semibold text-black ">
              Smart Campus Operations Hub
            </h1>
          </header>

          <main className="flex-1 overflow-y-auto p-6 sm:p-8">
            <div className="mx-auto grid w-full max-w-6xl gap-6">
              <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_50px_-24px_rgba(15,23,42,0.22)] sm:p-7">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/my-bookings" element={<MyBookingsPage />} />
                  <Route path="/admin/bookings" element={<AdminBookingsPage />} />
                  <Route path="/resources" element={<ComingSoon title="Resources" />} />
                  <Route path="/tickets" element={<ComingSoon title="My Tickets" />} />
                  <Route path="/notifications" element={<ComingSoon title="Notifications" />} />
                  <Route path="/profile" element={<ComingSoon title="My Profile" />} />
                  <Route path="/invoices" element={<ComingSoon title="Invoices" />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </section>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

function App() {
  const token = localStorage.getItem("token")

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/signup" element={token ? <Navigate to="/" replace /> : <SignupPage />} />
        <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute allowedRoles={["USER", "ADMIN", "TECHNICIAN"]}>
              <AppShell />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
