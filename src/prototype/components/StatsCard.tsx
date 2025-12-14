// StatsCard - Metric display card
// Used in: AdminDashboard, SpecialistHome

import {
  Card,
  CardContent,
  Badge,
  Doc,
} from '@/components/ui'
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'

export interface StatsCardProps {
  label: string
  value: number | string
  icon?: LucideIcon
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  badge?: string
  variant?: 'default' | 'gradient'
  color?: 'cyan' | 'teal' | 'amber' | 'green' | 'purple'
}

const colorClasses = {
  cyan: {
    gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
    icon: 'text-cyan-600',
    badge: 'bg-white/20 text-white',
    text: 'text-cyan-100',
  },
  teal: {
    gradient: 'bg-gradient-to-br from-teal-500 to-teal-600',
    icon: 'text-teal-600',
    badge: 'bg-white/20 text-white',
    text: 'text-teal-100',
  },
  amber: {
    gradient: 'bg-gradient-to-br from-amber-500 to-amber-600',
    icon: 'text-amber-600',
    badge: 'bg-white/20 text-white',
    text: 'text-amber-100',
  },
  green: {
    gradient: 'bg-gradient-to-br from-green-500 to-green-600',
    icon: 'text-green-600',
    badge: 'bg-white/20 text-white',
    text: 'text-green-100',
  },
  purple: {
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-600',
    icon: 'text-purple-600',
    badge: 'bg-white/20 text-white',
    text: 'text-purple-100',
  },
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  trend,
  badge,
  variant = 'default',
  color = 'cyan'
}: StatsCardProps) {
  const colors = colorClasses[color]
  const isGradient = variant === 'gradient'

  return (
    <Doc of="components.stats-card">
      <Card className={`border-0 ${isGradient ? colors.gradient + ' text-white' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            {Icon && (
              <Icon className={`h-5 w-5 ${isGradient ? 'opacity-80' : colors.icon}`} />
            )}
            {badge && (
              <Badge className={isGradient ? colors.badge : 'bg-muted'}>
                {badge}
              </Badge>
            )}
          </div>

          <p className={`text-3xl font-bold ${isGradient ? '' : ''}`}>
            {value}
          </p>

          <div className="flex items-center justify-between mt-1">
            <p className={`text-sm ${isGradient ? colors.text : 'text-muted-foreground'}`}>
              {label}
            </p>

            {trend && (
              <div className={`flex items-center gap-1 text-xs ${
                trend.direction === 'up' ? 'text-green-500' : 'text-red-500'
              }`}>
                {trend.direction === 'up'
                  ? <TrendingUp className="h-3 w-3" />
                  : <TrendingDown className="h-3 w-3" />
                }
                <span>{trend.value}%</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Doc>
  )
}

export default StatsCard
