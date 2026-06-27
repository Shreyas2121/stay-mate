import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layouts/Header'
import { HomeHero } from '@/features/home/components/HomeHero'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <HomeHero />
      </main>
    </div>
  )
}
