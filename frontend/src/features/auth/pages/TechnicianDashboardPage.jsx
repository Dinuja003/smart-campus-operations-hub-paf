export default function TechnicianDashboardPage() {
  // Authorization: technician-only dashboard shell reached through protected routing.
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">TECHNICIAN · DASHBOARD</p>
      <h1 className="text-[2rem] font-bold leading-tight text-navy">Maintenance queue snapshot.</h1>
      <p className="text-sm text-[#5a6b98]">Track active tasks, ticket flow, and technical operations status in real time.</p>
    </div>
  )
}
