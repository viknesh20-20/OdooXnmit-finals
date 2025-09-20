import type React from "react"
import { Routes, Route } from "react-router-dom"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
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
        <Route path="/manufacturing-orders" element={<ManufacturingOrders />} />
        <Route path="/work-orders" element={<WorkOrders />} />
        <Route path="/work-centers" element={<WorkCenters />} />
        <Route path="/stock-ledger" element={<StockLedger />} />
        <Route path="/bom" element={<BillOfMaterials />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </DashboardLayout>
  )
}
