import type { ReactNode } from 'react'
import { Home, ShieldCheck, Lock } from 'lucide-react'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex h-screen overflow-hidden">
      {/* Left Side – Hero Image (Desktop Only) */}
      <section className="relative hidden overflow-hidden lg:flex lg:w-1/2">
        <img
          src="/login-hero.png"
          alt="Luxury villa interior"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c30]/70 via-[#0b1c30]/20 to-transparent" />
        <div className="relative z-10 mt-auto p-12 text-white">
          <h1 className="text-display-lg mb-4">Travel with confidence.</h1>
          <p className="text-body-lg max-w-md text-[#d3e4fe]">
            Access high-fidelity rental properties curated for professional
            standards and discerning tastes.
          </p>
          <div className="mt-8 flex gap-4">
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
              <ShieldCheck className="size-4" />
              <span className="text-label-sm text-white">Verified Hosts</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
              <Lock className="size-4" />
              <span className="text-label-sm text-white">Secure Booking</span>
            </div>
          </div>
        </div>
      </section>

      {/* Right Side – Auth Form */}
      <section className="flex h-full w-full flex-col bg-white lg:w-1/2">
        {/* Brand */}
        <div className="shrink-0 px-8 pt-8 lg:px-16">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
              <Home className="size-[18px]" />
            </div>
            <span className="text-xl font-bold text-primary">StayMate</span>
          </div>
        </div>

        {/* Form – vertically centered */}
        <div className="flex flex-1 items-center justify-center overflow-y-auto px-8 lg:px-16 xl:px-28">
          <div className="w-full max-w-md py-8">{children}</div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-8 pb-6 lg:px-16">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-sm">© 2025 StayMate</span>
            <div className="flex gap-4">
              <a href="#" className="text-label-sm hover:text-primary">
                Support
              </a>
              <a href="#" className="text-label-sm hover:text-primary">
                Contact
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
