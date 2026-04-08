import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom"
import MyBookingsPage from "./features/booking/pages/MyBookingsPage"
import AdminBookingsPage from "./features/booking/pages/AdminBookingsPage"

function Dashboard() {
  const navigate = useNavigate()
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '24px' }}>Dashboard</h2>
        <p style={{ marginTop: '8px', color: '#64748b' }}>Welcome to UniSlot. Select a section below to get started.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '16px' }}>
        <button 
          onClick={() => navigate('/my-bookings')}
          style={{
            padding: '20px 24px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
          }}
          onMouseOver={(e) => e.target.style.background = '#1d4ed8'}
          onMouseOut={(e) => e.target.style.background = '#2563eb'}
        >
          📅 My Bookings
        </button>
        <button 
          onClick={() => navigate('/admin/bookings')}
          style={{
            padding: '20px 24px',
            background: '#7c3aed',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
          }}
          onMouseOver={(e) => e.target.style.background = '#6d28d9'}
          onMouseOut={(e) => e.target.style.background = '#7c3aed'}
        >
          ⚙️ Admin Bookings
        </button>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', width: '100%', background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)', color: '#0f172a' }}>
        <header style={{ padding: '24px 32px', borderBottom: '1px solid rgba(15, 23, 42, 0.08)', background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(12px)' }}>
          <div style={{ fontSize: '14px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#64748b' }}>
            UniSlot
          </div>
          <h1 style={{ margin: '8px 0 0', fontSize: '32px', lineHeight: 1.1 }}>Smart Campus Operations Hub</h1>
        </header>

        <main style={{ padding: '32px' }}>
          <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'grid', gap: '24px' }}>
            <section style={{ borderRadius: '20px', background: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.08)', padding: '24px', boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)' }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/my-bookings" element={<MyBookingsPage />} />
                <Route path="/admin/bookings" element={<AdminBookingsPage />} />
              </Routes>
            </section>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App