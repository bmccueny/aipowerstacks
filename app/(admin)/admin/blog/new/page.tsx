import { BlogPostForm } from '@/components/blog/BlogPostForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'New Post — AIPowerStacks Admin' }

export default function NewBlogPostPage() {
  return <BlogPostForm />
}
