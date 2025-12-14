// SpecialistCard - Specialist profile card with actions
// Used in: AdminSpecialists, AssignDialog

import {
  Card,
  CardContent,
  Badge,
  Button,
  Switch,
  Doc,
} from '@/components/ui'
import { Phone, Mail, MapPin, Trash2 } from 'lucide-react'
import type { SpecialistEntity } from '@prototype/factories'

export interface SpecialistCardProps {
  specialist: SpecialistEntity
  onToggleActive?: (id: string, isActive: boolean) => void
  onDelete?: (id: string) => void
  onSelect?: (specialist: SpecialistEntity) => void
  selectable?: boolean
}

export function SpecialistCard({
  specialist,
  onToggleActive,
  onDelete,
  onSelect,
  selectable = false
}: SpecialistCardProps) {
  return (
    <Doc of="components.specialist-card" entityId={specialist.id}>
      <Card
        className={`transition-all ${
          !specialist.isActive ? 'opacity-60' : ''
        } ${selectable ? 'cursor-pointer hover:border-cyan-300' : 'hover:shadow-md'}`}
        onClick={() => selectable && onSelect?.(specialist)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <img
              src={specialist.avatar}
              alt={specialist.name}
              className="h-12 w-12 rounded-full border-2 border-border shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold truncate">{specialist.name}</h4>
                {onToggleActive && (
                  <Switch
                    checked={specialist.isActive}
                    onCheckedChange={(checked) => onToggleActive(specialist.id, checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>

              <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{specialist.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{specialist.email}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-3">
                {specialist.serviceTypes.slice(0, 3).map((service) => (
                  <Badge key={service} variant="secondary" className="text-xs">
                    {service}
                  </Badge>
                ))}
                {specialist.serviceTypes.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{specialist.serviceTypes.length - 3}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{specialist.cities.slice(0, 2).join(', ')}</span>
                {specialist.cities.length > 2 && (
                  <span>+{specialist.cities.length - 2}</span>
                )}
              </div>
            </div>
          </div>

          {onDelete && (
            <div className="flex justify-end mt-3 pt-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(specialist.id)
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Doc>
  )
}

export default SpecialistCard
