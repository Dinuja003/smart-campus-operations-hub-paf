import { AppSidebar } from "./components/AppSidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import BookingPage from "./features/booking/bookingPage"

function App() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="p-6">
        <div className="mb-4">
          <SidebarTrigger />
        </div>
        <BookingPage />
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
