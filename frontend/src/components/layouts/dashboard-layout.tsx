import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, X, Home as HomeIcon, LogOut } from 'lucide-react'
import { useCurrentUser } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/features/notifications'

export interface SidebarItem {
  label: string
  to: string
  icon: React.ReactNode
  badge?: string | number
}

interface DashboardLayoutProps {
  title: string
  sidebarItems: SidebarItem[]
  children: React.ReactNode
}

export function DashboardLayout({
  title,
  sidebarItems,
  children,
}: DashboardLayoutProps) {
  const { user, logout } = useCurrentUser()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* â”€â”€â”€ Desktop Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 md:flex">
        {/* Sidebar Header */}
        <Link to="/" className="h-16 flex items-center gap-2.5 px-6 border-b border-sidebar-border bg-sidebar hover:opacity-95 transition-opacity">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <HomeIcon className="size-4" />
          </div>
          <span className="text-md font-bold tracking-tight text-sidebar-foreground">
            StayMate Portal
          </span>
        </Link>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{
                className:
                  'bg-sidebar-accent text-sidebar-accent-foreground font-semibold',
              }}
              inactiveProps={{
                className:
                  'text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
              }}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <span className="shrink-0 group-hover:scale-105 transition-transform duration-200">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-sidebar-border bg-sidebar">
          {user && (
            <div className="flex items-center gap-3 p-2 rounded-xl mb-4 bg-sidebar-accent/20">
              <div className="flex size-10 items-center justify-center rounded-full bg-sidebar-primary/10 text-sidebar-primary font-bold shrink-0">
                {(user.name ?? user.email)[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate text-sidebar-foreground">
                  {user.name ?? 'User'}
                </p>
                <p className="text-xs text-sidebar-foreground/60 capitalize truncate">
                  {user.role} Portal
                </p>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full justify-start gap-2 border-sidebar-border hover:bg-destructive/10 hover:text-destructive text-sidebar-foreground"
          >
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* â”€â”€â”€ Mobile Sidebar Drawer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer Panel */}
          <aside className="relative flex h-full w-72 max-w-xs flex-col border-r border-sidebar-border bg-sidebar animate-in slide-in-from-left duration-300">
            <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
              <Link to="/" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-2.5 hover:opacity-95 transition-opacity">
                <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <HomeIcon className="size-4" />
                </div>
                <span className="text-md font-bold tracking-tight text-sidebar-foreground">
                  StayMate Portal
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileOpen(false)}
                className="h-8 w-8 text-sidebar-foreground/70 hover:bg-sidebar-accent rounded-lg"
              >
                <X className="size-5" />
              </Button>
            </div>

            <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
              {sidebarItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileOpen(false)}
                  activeProps={{
                    className:
                      'bg-sidebar-accent text-sidebar-accent-foreground font-semibold',
                  }}
                  inactiveProps={{
                    className:
                      'text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                  }}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-sidebar-border bg-sidebar">
              {user && (
                <div className="flex items-center gap-3 p-2 rounded-xl mb-4 bg-sidebar-accent/20">
                  <div className="flex size-10 items-center justify-center rounded-full bg-sidebar-primary/10 text-sidebar-primary font-bold shrink-0">
                    {(user.name ?? user.email)[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-sidebar-foreground">
                      {user.name ?? 'User'}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 capitalize truncate">
                      {user.role} Portal
                    </p>
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full justify-start gap-2 border-sidebar-border hover:bg-destructive/10 hover:text-destructive text-sidebar-foreground"
              >
                <LogOut className="size-4" />
                Logout
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* â”€â”€â”€ Main Content Shell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header Bar */}
        <header className="z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/60 bg-card/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(true)}
              className="h-9 w-9 md:hidden text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
              aria-label="Open sidebar"
            >
              <Menu className="size-5" />
            </Button>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg border border-border transition-all"
            >
              <Link to="/">Back to Marketplace</Link>
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
