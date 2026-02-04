import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ProfileProvider } from './context/ProfileContext'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ClientInput from './pages/ClientInput'
import NutritionPlan from './pages/NutritionPlan'
import NutritionPlanDetail from './pages/NutritionPlanDetail'
import NutritionPlanWeek from './pages/NutritionPlanWeek'
import TrainingPlan from './pages/TrainingPlan'
import TrainingPlanDetail from './pages/TrainingPlanDetail'
import TrainingPlanWeek from './pages/TrainingPlanWeek'
import PlanChoice from './pages/PlanChoice'
import Settings from './pages/Settings'
import AdminAccounts from './pages/admin/AdminAccounts'
import AdminAccountDetail from './pages/admin/AdminAccountDetail'
import AdminReporting from './pages/admin/AdminReporting'
import AdminSettings from './pages/admin/AdminSettings'
import AdminMedewerkers from './pages/admin/AdminMedewerkers'
import AdminMeals from './pages/admin/AdminMeals'
import AdminTrainingTypes from './pages/admin/AdminTrainingTypes'
import AdminPlanPrices from './pages/admin/AdminPlanPrices'
import MaintenanceGate from './components/MaintenanceGate'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">Laden…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ProfileProvider>
              <MaintenanceGate>
                <Layout />
              </MaintenanceGate>
            </ProfileProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="input" element={<ClientInput />} />
        <Route path="voeding" element={<NutritionPlan />} />
        <Route path="voeding/:id" element={<NutritionPlanDetail />} />
        <Route path="voeding/:id/week/:weekNum" element={<NutritionPlanWeek />} />
        <Route path="training" element={<TrainingPlan />} />
        <Route path="training/:id" element={<TrainingPlanDetail />} />
        <Route path="training/:id/week/:weekNum" element={<TrainingPlanWeek />} />
        <Route path="plan" element={<PlanChoice />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard/admin/accounts" replace />} />
          <Route path="accounts" element={<AdminAccounts />} />
          <Route path="accounts/:userId" element={<AdminAccountDetail />} />
          <Route path="reporting" element={<AdminReporting />} />
          <Route path="medewerkers" element={<AdminMedewerkers />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="meals" element={<AdminMeals />} />
          <Route path="training-types" element={<AdminTrainingTypes />} />
          <Route path="plan-prices" element={<AdminPlanPrices />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
