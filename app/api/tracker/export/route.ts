import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('monthly_cost, billing_cycle, created_at, tools:tool_id(name, slug, pricing_model, categories:category_id(name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  type Row = {
    monthly_cost: number
    billing_cycle: string | null
    created_at: string
    tools: { name: string; slug: string; pricing_model: string; categories: { name: string } | null } | null
  }

  const rows = (data ?? []) as unknown as Row[]

  const csvLines = [
    'Tool,Category,Monthly Cost,Billing Cycle,Pricing Model,Added Date',
    ...rows.map(r => {
      const tool = r.tools
      const name = (tool?.name ?? '').replace(/,/g, ' ')
      const category = (tool?.categories?.name ?? '').replace(/,/g, ' ')
      const cost = r.monthly_cost.toFixed(2)
      const cycle = r.billing_cycle ?? 'monthly'
      const model = tool?.pricing_model ?? 'unknown'
      const date = new Date(r.created_at).toLocaleDateString('en-US')
      return `"${name}","${category}",${cost},${cycle},${model},${date}`
    }),
  ]

  const csv = csvLines.join('\n')
  const totalMonthly = rows.reduce((sum, r) => sum + r.monthly_cost, 0)
  const finalLine = `\n\nTotal Monthly,$${totalMonthly.toFixed(2)}\nTotal Annual,$${(totalMonthly * 12).toFixed(2)}\nExported,${new Date().toLocaleDateString('en-US')}`

  return new NextResponse(csv + finalLine, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="aipowerstacks-subscriptions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
