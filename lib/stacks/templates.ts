export type StackTemplate = {
  id: string
  name: string
  icon: string
  description: string
  roleSlots: { name: string; hint: string }[]
}

export const STACK_TEMPLATES: StackTemplate[] = [
  {
    id: 'content-creator',
    name: 'Content Creator Pipeline',
    icon: '✍️',
    description: 'End-to-end workflow for writing, editing, and publishing content.',
    roleSlots: [
      { name: 'Writing Assistant', hint: 'AI that drafts and edits long-form text' },
      { name: 'Image Generation', hint: 'Creates visuals for your content' },
      { name: 'SEO & Research', hint: 'Keyword research and content briefs' },
      { name: 'Publishing / CMS', hint: 'AI-assisted publishing tool' },
    ],
  },
  {
    id: 'solo-dev',
    name: 'Solo Developer Toolkit',
    icon: '⚡',
    description: 'Ship faster with AI across your entire dev workflow.',
    roleSlots: [
      { name: 'Code Assistant', hint: 'Autocomplete and code generation' },
      { name: 'Documentation', hint: 'Auto-generates docs and comments' },
      { name: 'Testing', hint: 'Generates and runs test cases' },
      { name: 'Deployment / DevOps', hint: 'AI-assisted CI/CD and monitoring' },
    ],
  },
  {
    id: 'marketing-ops',
    name: 'Marketing Ops Stack',
    icon: '📣',
    description: 'Automate campaigns, copy, and analytics.',
    roleSlots: [
      { name: 'Copywriting', hint: 'Ad copy and email generation' },
      { name: 'Design', hint: 'Image and social asset creation' },
      { name: 'Analytics', hint: 'AI-driven data interpretation' },
      { name: 'Scheduling / Distribution', hint: 'Social posting and automation' },
    ],
  },
]
