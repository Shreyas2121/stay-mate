import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuthStore, getMeFn, loginFn, authKeys } from '@/features/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  User as UserIcon,
  RefreshCw,
  LogOut,
  Key,
  ArrowLeft,
  Home,
  Terminal,
  Lock,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/auth')({ component: AuthSandbox })

function AuthSandbox() {
  const token = useAuthStore((s) => s.token)
  const isAuthenticated = !!token
  const queryClient = useQueryClient()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Query to fetch user details (this uses the Axios client which injects token automatically)
  const {
    data: userProfile,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: authKeys.me,
    queryFn: getMeFn,
    enabled: isAuthenticated,
    retry: false,
  })

  // Quick fill login mutation
  const loginMutation = useMutation({
    mutationFn: loginFn,
    onSuccess: async (data) => {
      setSuccessMsg('Quick login successful!')
      setErrorMsg(null)
      // Save token
      useAuthStore.getState().setToken(data.access_token)
      // Fetch profile and seed into query cache
      try {
        await queryClient.fetchQuery({
          queryKey: authKeys.me,
          queryFn: getMeFn,
        })
      } catch (err: any) {
        console.error('Failed to load profile after quick login:', err)
        setErrorMsg('Logged in, but failed to fetch profile.')
      }
    },
    onError: (err: any) => {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Failed to log in.',
      )
      setSuccessMsg(null)
    },
  })

  const handleQuickLogin = (email: string, pass: string) => {
    loginMutation.mutate({ email, password: pass })
  }

  const handleLogout = () => {
    useAuthStore.getState().clearToken()
    queryClient.clear()
    setSuccessMsg('Logged out successfully.')
    setErrorMsg(null)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 sm:p-12 selection:bg-primary/30">
      {/* Top Navigation / Breadcrumb */}
      <div className="mx-auto max-w-5xl mb-8 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to Home
        </Link>
        <div className="flex gap-4">
          <Link
            to="/"
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-all"
          >
            <Home className="size-5" />
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-10 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/30">
              <Terminal className="size-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                API Authentication Sandbox
              </h1>
              <p className="mt-2 text-slate-400 max-w-2xl text-sm sm:text-base">
                An interactive diagnostics page to verify the backend NestJS
                auth endpoint integration, Zustand store persistence, and
                TanStack Query state-sync behavior.
              </p>
            </div>
          </div>
        </header>

        {/* Dynamic Alerts */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Check className="size-4 shrink-0" /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Lock className="size-4 shrink-0" /> {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Actions and Testing */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Auth status card */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/60 p-6 backdrop-blur-md">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Auth Status
              </h2>
              <div className="flex items-center gap-3 mb-6">
                <span className={`relative flex h-3 w-3`}>
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isAuthenticated ? 'bg-emerald-400' : 'bg-amber-400'}`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${isAuthenticated ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  ></span>
                </span>
                <span className="text-lg font-bold">
                  {isAuthenticated ? 'Session Active' : 'Guest Mode'}
                </span>
              </div>

              {isAuthenticated ? (
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full h-11 border-red-500/30 hover:border-red-500/80 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <LogOut className="size-4" /> End Session (Logout)
                </Button>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    to="/login"
                    className="w-full h-11 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center shadow-lg shadow-primary/20"
                  >
                    Go to Login Form
                  </Link>
                  <Link
                    to="/register"
                    className="w-full h-11 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all duration-200 flex items-center justify-center"
                  >
                    Go to Register Form
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Fill Test Accounts */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/60 p-6 backdrop-blur-md">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Quick Sign-In (Mock)
              </h2>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Trigger manual API request using the pre-seeded admin user
                details. Highly convenient for hot reload validation.
              </p>

              <Button
                onClick={() =>
                  handleQuickLogin('admin@staymate.com', 'admin123')
                }
                disabled={loginMutation.isPending}
                variant="outline"
                className="w-full h-12 bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white font-medium text-xs transition-all duration-200 flex items-center justify-start gap-3 px-4"
              >
                <div className="flex size-7 items-center justify-center rounded bg-primary/20 text-primary shrink-0">
                  <Key className="size-3.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-[13px] leading-tight">
                    {loginMutation.isPending
                      ? 'Logging in...'
                      : 'Login as Admin'}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    admin@staymate.com / admin123
                  </span>
                </div>
              </Button>

              <Button
                onClick={() =>
                  handleQuickLogin('newuser@test.com', 'User12345')
                }
                disabled={loginMutation.isPending}
                variant="outline"
                className="w-full mt-3 h-12 bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white font-medium text-xs transition-all duration-200 flex items-center justify-start gap-3 px-4"
              >
                <div className="flex size-7 items-center justify-center rounded bg-emerald-500/20 text-emerald-400 shrink-0">
                  <UserIcon className="size-3.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-[13px] leading-tight">
                    {loginMutation.isPending
                      ? 'Logging in...'
                      : 'Login as Test Guest'}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    newuser@test.com / User12345
                  </span>
                </div>
              </Button>
            </div>
          </div>

          {/* Right Column: State inspection & Live queries */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Live profile cache via TanStack Query */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/60 p-6 backdrop-blur-md flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Live Query State: `['auth', 'me']`
                </h2>
                {isAuthenticated && (
                  <Button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    variant="ghost"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-dark hover:bg-primary/10 font-medium transition-colors h-8 px-2"
                  >
                    <RefreshCw
                      className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`}
                    />{' '}
                    Force Refetch
                  </Button>
                )}
              </div>

              {!isAuthenticated ? (
                <div className="h-60 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col items-center justify-center text-slate-500 text-sm">
                  <Lock className="size-8 mb-2 text-slate-600" />
                  <span>Authenticate to load query data</span>
                </div>
              ) : (
                <div className="relative">
                  {isFetching && (
                    <div className="absolute top-2 right-2 bg-primary/20 text-primary rounded-full px-2 py-0.5 text-[10px] flex items-center gap-1 font-semibold">
                      <RefreshCw className="size-2.5 animate-spin" /> Fetching
                    </div>
                  )}
                  <pre className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono overflow-auto h-60 max-h-60 text-indigo-300">
                    {JSON.stringify(
                      userProfile || { status: 'loading profile...' },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              )}
            </div>

            {/* Zustand State Inspector */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/60 p-6 backdrop-blur-md">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Persistent Zustand Store State
              </h2>
              <pre className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono overflow-auto max-h-64 text-emerald-400">
                {JSON.stringify(
                  {
                    token: token
                      ? `${token.substring(0, 15)}... [length: ${token.length}]`
                      : null,
                    user: userProfile,
                    isAuthenticated,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
