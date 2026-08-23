import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LoginPage } from '@/routes/LoginPage'
import { DashboardPage } from '@/routes/DashboardPage'
import { ClientesPage } from '@/routes/ClientesPage'
import { PresupuestosPage } from '@/routes/PresupuestosPage'
import { PresupuestoFormPage } from '@/routes/PresupuestoFormPage'
import { PresupuestoDetailPage } from '@/routes/PresupuestoDetailPage'
import { CobrosPage } from '@/routes/CobrosPage'
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
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/presupuestos" element={<PresupuestosPage />} />
          <Route path="/presupuestos/nuevo" element={<PresupuestoFormPage />} />
          <Route path="/presupuestos/:id" element={<PresupuestoDetailPage />} />
          <Route path="/presupuestos/:id/editar" element={<PresupuestoFormPage />} />
          <Route path="/cobros" element={<CobrosPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
