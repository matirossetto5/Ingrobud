import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LoginPage } from '@/routes/LoginPage'
import { DashboardPage } from '@/routes/DashboardPage'
import { PlaceholderPage } from '@/routes/PlaceholderPage'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route
            path="/clientes"
            element={<PlaceholderPage title="Clientes" description="Alta, edición e historial de clientes." />}
          />
          <Route
            path="/presupuestos"
            element={<PlaceholderPage title="Presupuestos" description="Creación, envío y seguimiento de presupuestos." />}
          />
          <Route
            path="/cobros"
            element={<PlaceholderPage title="Cobros" description="Registro de pagos y saldos pendientes." />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
