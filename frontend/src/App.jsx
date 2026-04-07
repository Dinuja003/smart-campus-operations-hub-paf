import { AppSidebar } from "./components/AppSidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import MyBookingsPage from "./features/booking/pages/MyBookingsPage"
import AdminBookingsPage from "./features/booking/pages/AdminBookingsPage"

function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="p-6">
          <div className="mb-4">
            <SidebarTrigger />
          </div>

          {/* ── Routes go here, replacing the placeholder div ── */}
          <div className="rounded-lg border bg-card p-6">
            <Routes>
              <Route path="/" element={<div className="text-sm text-muted-foreground">Dashboard</div>} />
              <Route path="/my-bookings" element={<MyBookingsPage />} />
              <Route path="/admin/bookings" element={<AdminBookingsPage />} />
            </Routes>
          </div>

        </SidebarInset>
      </SidebarProvider>
    </BrowserRouter>
  )
}

export default App