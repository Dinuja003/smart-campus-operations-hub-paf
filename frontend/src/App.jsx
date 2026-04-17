/*import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { SidebarProvider } from "./components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import MyBookingsPage from "./features/booking/pages/MyBookingsPage";
import AdminBookingsPage from "./features/booking/pages/AdminBookingsPage";*/
import AdminResourcesInterface from "./features/resources/AdminResourcesInterface.jsx";

// function Dashboard() {
//   const navigate = useNavigate();

//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
//       <div>
//         <h2 style={{ margin: 0, fontSize: "24px" }}>Dashboard</h2>
//         <p style={{ marginTop: "8px", color: "#64748b" }}>
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginTop: "16px",
        }}
      >
        <button
          onClick={() => navigate("/my-bookings")}
          style={{
            padding: "20px 24px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "background 0.2s",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#1d4ed8")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#2563eb")}
        >
          📅 My Bookings
        </button>

        <button
          onClick={() => navigate("/admin/bookings")}
          style={{
            padding: "20px 24px",
            background: "#7c3aed",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "background 0.2s",
            boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#6d28d9")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#7c3aed")}
        >
          ⚙️ Admin Bookings
        </button>

        <button
          onClick={() => navigate("/resources")}
          style={{
            padding: "20px 24px",
            background: "#0f766e",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "background 0.2s",
            boxShadow: "0 4px 12px rgba(15, 118, 110, 0.3)",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#115e59")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#0f766e")}
        >
          🏫 Resources
        </button>
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
  );
}

function ComingSoon({ title }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
      <h2 className="mb-2 text-2xl font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500">Coming soon...</p>
    </div>
  );
}

function AppShell() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            width: "100%",
            background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
            color: "#0f172a",
          }}
        >
          <AppSidebar />

          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <header
              style={{
                padding: "24px 32px",
                borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
                background: "rgba(255, 255, 255, 0.75)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#64748b",
                }}
              >
                UniSlot
              </div>
              <h1 style={{ margin: "8px 0 0", fontSize: "32px", lineHeight: 1.1 }}>
                Smart Campus Operations Hub
              </h1>
            </header>

            <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
              <div
                style={{
                  maxWidth: "1120px",
                  margin: "0 auto",
                  display: "grid",
                  gap: "24px",
                }}
              >
                <section
                  style={{
                    borderRadius: "20px",
                    background: "#ffffff",
                    border: "1px solid rgba(15, 23, 42, 0.08)",
                    padding: "24px",
                    boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
                  }}
                >
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/my-bookings" element={<MyBookingsPage />} />
                    <Route path="/admin/bookings" element={<AdminBookingsPage />} />
                    <Route path="/resources" element={<AdminResourcesInterface />} />
                    <Route path="/tickets" element={<ComingSoon title="My Tickets" />} />
                    <Route path="/notifications" element={<ComingSoon title="Notifications" />} />
                    <Route path="/profile" element={<ComingSoon title="My Profile" />} />
                    <Route path="/invoices" element={<ComingSoon title="Invoices" />} />
                  </Routes>
                </section>
              </div>
            </main>
          </div>
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
  );
}

export default App
