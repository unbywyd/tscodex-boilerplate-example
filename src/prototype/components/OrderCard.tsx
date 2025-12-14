// OrderCard - Reusable order card component
// Used in: Client orders, Admin orders, Specialist orders

import {
  Card,
  CardContent,
  Badge,
  Button,
  Doc,
} from '@/components/ui'
import { MapPin, Calendar, Clock, Phone, User, ClipboardList } from 'lucide-react'
import type { CareOrderEntity } from '@prototype/factories'

export interface OrderCardProps {
  order: CareOrderEntity
  onSelect?: (order: CareOrderEntity) => void
  onAssign?: (order: CareOrderEntity) => void
  showActions?: boolean
  variant?: 'compact' | 'detailed'
}

const statusColors: Record<string, string> = {
  created: 'bg-gray-100 text-gray-700',
  reviewing: 'bg-blue-100 text-blue-700',
  assigned: 'bg-purple-100 text-purple-700',
  on_way: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-cyan-100 text-cyan-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const formatStatus = (status: string) => status.replace('_', ' ')

export function OrderCard({
  order,
  onSelect,
  onAssign,
  showActions = false,
  variant = 'compact'
}: OrderCardProps) {
  return (
    <Doc of="components.order-card" entityId={order.id}>
      <Card
        className={`hover:border-cyan-300 transition-colors ${onSelect ? 'cursor-pointer' : ''}`}
        onClick={() => onSelect?.(order)}
      >
        <CardContent className={variant === 'compact' ? 'p-3' : 'p-4'}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-cyan-100 p-1.5">
                <ClipboardList className="h-4 w-4 text-cyan-600" />
              </div>
              <div>
                <h4 className="font-medium capitalize text-sm">{order.serviceType}</h4>
                {order.clientName && (
                  <p className="text-xs text-muted-foreground">{order.clientName}</p>
                )}
              </div>
            </div>
            <Badge className={statusColors[order.status]}>
              {formatStatus(order.status)}
            </Badge>
          </div>

          <div className="space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{order.city}</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {order.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {order.startTime}
              </span>
            </div>

            {variant === 'detailed' && (
              <>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{order.phone}</span>
                </div>
                {order.specialistName && (
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    <span>{order.specialistName}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {showActions && onAssign && ['created', 'reviewing'].includes(order.status) && (
            <Button
              size="sm"
              className="w-full mt-3"
              onClick={(e) => {
                e.stopPropagation()
                onAssign(order)
              }}
            >
              Assign Specialist
            </Button>
          )}
        </CardContent>
      </Card>
    </Doc>
  )
}

export default OrderCard
