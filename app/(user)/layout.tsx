import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen max-w-7xl mx-auto px-4 py-12">
        {children}
      </main>
      <Footer />
    </>
  )
}
