import type React from "react"
import { Routes, Route } from "react-router-dom"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { ProtectedRoute, AdminRoute } from "@/components/auth/ProtectedRoute"
import { DashboardOverview } from "@/pages/DashboardOverview"
import { ManufacturingOrders } from "@/pages/ManufacturingOrders"
import { WorkOrders } from "@/pages/WorkOrders"
import { WorkCenters } from "@/pages/WorkCenters"
import { StockLedger } from "@/pages/StockLedger"
import { BillOfMaterials } from "@/pages/BillOfMaterials"
import { Profile } from "@/pages/Profile"
import { Reports } from "@/pages/Reports"

export const Dashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardOverview />} />
        <Route
          path="/manufacturing-orders"
          element={
            <ProtectedRoute requiredRole="manager">
              <ManufacturingOrders />
            </ProtectedRoute>
          }
        />
        <Route path="/work-orders" element={<WorkOrders />} />
        <Route
          path="/work-centers"
          element={
            <ProtectedRoute requiredRole="manager">
              <WorkCenters />
            </ProtectedRoute>
          }
        />
        <Route path="/stock-ledger" element={<StockLedger />} />
        <Route
          path="/bom"
          element={
            <ProtectedRoute requiredRole="manager">
              <BillOfMaterials />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <AdminRoute>
              <Reports />
            </AdminRoute>
          }
        />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </DashboardLayout>
  )
}
