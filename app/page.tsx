import { BitcoinDashboard } from "@/components/bitcoin/bitcoin-dashboard"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <BitcoinDashboard />
      </div>
    </main>
  )
}
