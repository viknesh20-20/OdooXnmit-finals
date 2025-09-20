"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import {
  Factory,
  ClipboardList,
  Wrench,
  Building2,
  Package,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  BarChart3,
  PieChart,
} from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const menuItems = [
    { icon: PieChart, label: "Dashboard", path: "/dashboard/" },
    { icon: ClipboardList, label: "Manufacturing Orders", path: "/dashboard/manufacturing-orders" },
    { icon: Wrench, label: "Work Orders", path: "/dashboard/work-orders" },
    { icon: Building2, label: "Work Centers", path: "/dashboard/work-centers" },
    { icon: Package, label: "Stock Ledger", path: "/dashboard/stock-ledger" },
    { icon: FileText, label: "Bills of Material", path: "/dashboard/bom" },
    { icon: BarChart3, label: "Reports", path: "/dashboard/reports" },
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <Factory className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">ManufactureFlow</span>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">Production Control Center</h1>
            </div>

            <div className="relative">
              <Button
                variant="ghost"
                className="flex items-center space-x-2"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <User className="h-5 w-5" />
                <span>{user?.name}</span>
              </Button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-muted-foreground border-b border-border">{user?.email}</div>
                    <a
                      href="/dashboard/profile"
                      className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile Settings
                    </a>
                    <button
                      onClick={logout}
                      className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
