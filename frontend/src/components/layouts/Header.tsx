import { Link } from '@tanstack/react-router'
import { Home as HomeIcon, LogOut, RefreshCw } from 'lucide-react'
import { useCurrentUser, useSwitchRole } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/features/notifications'

export function Header() {
  const { user, isAuthenticated, logout } = useCurrentUser()
  const switchRoleMutation = useSwitchRole()

  const handleSwitchRole = () => {
    if (!user) return
    const nextRole = user.activeRole === 'guest' ? 'host' : 'guest'
    switchRoleMutation.mutate(nextRole)
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-card/85 backdrop-blur-xl">
      <div className="container-app">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-95 transition-opacity">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <HomeIcon className="size-[18px]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              StayMate
            </span>
          </Link>

          {/* Auth state */}
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <div className="hidden md:flex items-center gap-3">
                  {user.role === 'admin' && (
                    <Link
                      to="/admin/host-approvals"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 px-3 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all animate-in fade-in"
                    >
                      Admin Portal
                    </Link>
                  )}

                  {user.activeRole === 'guest' && user.role !== 'admin' && (
                    <Link
                      to="/guest/trips"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 px-3 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all animate-in fade-in"
                    >
                      My Trips
                    </Link>
                  )}

                  {(user.role === 'host' || user.role === 'admin') && (
                    <Button
                      onClick={handleSwitchRole}
                      disabled={switchRoleMutation.isPending}
                      variant="outline"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      {switchRoleMutation.isPending ? (
                        <RefreshCw className="size-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="size-3.5" />
                      )}
                      {user.activeRole === 'guest'
                        ? 'Switch to Host Mode'
                        : 'Switch to Guest Mode'}
                    </Button>
                  )}

                  {user.activeRole === 'host' && (
                    <Link
                      to="/host/listings"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 px-3 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all"
                    >
                      Host Dashboard
                    </Link>
                  )}

                  {user.role === 'guest' && (
                    <Link
                      to="/become-host"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 px-3 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all"
                    >
                      Become a Host
                    </Link>
                  )}
                </div>
                <div className="hidden md:block w-px h-6 bg-border" />

                <div className="flex items-center gap-3">
                  <NotificationBell />
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-sm font-semibold text-foreground">
                      {user.name ?? 'User'}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {user.activeRole} Mode
                    </span>
                  </div>
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary text-label-md">
                    {(user.name ?? user.email)[0].toUpperCase()}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => logout()}
                    className="text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-all"
                    title="Logout"
                    aria-label="Sign out"
                  >
                    <LogOut className="size-5" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-foreground hover:text-primary px-3 py-2 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/80 px-4 py-2.5 rounded-lg transition-all shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
