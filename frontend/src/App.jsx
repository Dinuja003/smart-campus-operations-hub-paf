import { AppSidebar } from "./components/AppSidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

function App() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="p-6">
        <div className="mb-4">
          <SidebarTrigger />
        </div>
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Main content area
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
