// ServiceCard - Selectable care service card
// Used in: ClientHome, OrderForm

import {
  Card,
  CardContent,
  Doc,
} from '@/components/ui'
import { Heart, Stethoscope, Home, ShoppingBag, Users, Ambulance, type LucideIcon } from 'lucide-react'

export interface ServiceCardProps {
  service: {
    id: string
    name: string
    description: string
    icon: string
  }
  onSelect?: (service: ServiceCardProps['service']) => void
  selected?: boolean
}

const iconMap: Record<string, LucideIcon> = {
  Heart,
  Stethoscope,
  Home,
  ShoppingBag,
  Users,
  Ambulance,
}

export function ServiceCard({ service, onSelect, selected = false }: ServiceCardProps) {
  const Icon = iconMap[service.icon] || Heart

  return (
    <Doc of="components.service-card" entityId={service.id}>
      <Card
        className={`cursor-pointer transition-colors ${
          selected
            ? 'border-cyan-500 bg-cyan-50'
            : 'hover:border-cyan-300'
        }`}
        onClick={() => onSelect?.(service)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`rounded-lg p-2 ${selected ? 'bg-cyan-200' : 'bg-cyan-100'}`}>
              <Icon className="h-5 w-5 text-cyan-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm">{service.name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {service.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Doc>
  )
}

export default ServiceCard
