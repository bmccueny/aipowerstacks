import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CompareTray } from '@/components/tools/CompareTray'
import { CompareProvider } from '@/lib/context/CompareContext'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <CompareProvider>
      <Navbar />
      <main className="min-h-screen pt-20">
        {children}
      </main>
      <Footer />
      <CompareTray />
    </CompareProvider>
  )
}
