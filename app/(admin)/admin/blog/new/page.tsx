import { BlogPostForm } from '@/components/blog/BlogPostForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'New Post' }

export default function NewBlogPostPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">New Blog Post</h1>
      <BlogPostForm />
    </div>
  )
}
