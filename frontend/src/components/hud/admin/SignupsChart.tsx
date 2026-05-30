import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SignupPoint } from '@/lib/admin'

/** Signups-per-day area chart, themed with the shadcn --primary token. */
export default function SignupsChart({ data }: { data: SignupPoint[] }) {
  const { t } = useTranslation()
  const tickFmt = (d: string) => d.slice(5) // MM-DD

  return (
    <div className="rounded-lg border bg-card/50 p-3">
      <div className="mb-2 text-xs font-medium text-muted-foreground">
        {t('admin.chart.title')}
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="signups" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={tickFmt}
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(label) => tickFmt(String(label))}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--primary)"
            fill="url(#signups)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
