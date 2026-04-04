import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BookmarkMerger } from '@/components/bookmarks/BookmarkMerger'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <BookmarkMerger />
      <main className="min-h-screen pt-20 page-shell">
        {children}
      </main>
      <Footer />
    </>
  )
}
