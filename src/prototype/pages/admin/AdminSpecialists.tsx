// Admin Specialists Screen
// Manage care specialists

import { useState } from 'react'
import { LayoutDashboard, ClipboardList, Users, Plus, Search, Phone, Mail, MapPin, Check, Trash2, Pencil } from 'lucide-react'
import {
  Screen, ScreenHeader, ScreenBody, ScreenFooter,
  TopBar, BottomNav, Card, CardContent, Button, Badge, Input,
  Avatar, Switch, useToast, EmptyState,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Doc, type BottomNavItem
} from '@/components/ui'
import { useRepo } from '@/hooks/useRepo'
import { dispatchEvent } from '@/lib/events'
import { SERVICES, ISRAELI_CITIES, type SpecialistEntity } from '@prototype/factories'

interface AdminSpecialistsProps {
  onBack?: () => void
  onNavigate?: (screen: string, data?: any) => void
}

const navItems: BottomNavItem[] = [
  { value: 'dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard' },
  { value: 'orders', icon: <ClipboardList className="h-5 w-5" />, label: 'Orders' },
  { value: 'specialists', icon: <Users className="h-5 w-5" />, label: 'Specialists' },
]

export default function AdminSpecialists({ onBack, onNavigate }: AdminSpecialistsProps) {
  const { show } = useToast()
  const specialists = useRepo<SpecialistEntity>('specialists')
  const [activeNav, setActiveNav] = useState('specialists')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newSpecialist, setNewSpecialist] = useState({
    name: '',
    phone: '',
    email: '',
    serviceTypes: [] as string[],
    cities: [] as string[]
  })
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingSpecialist, setEditingSpecialist] = useState<SpecialistEntity | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    serviceTypes: [] as string[],
    cities: [] as string[]
  })

  const handleNavChange = (id: string) => {
    setActiveNav(id)
    if (onNavigate) {
      if (id === 'dashboard') onNavigate('dashboard')
      if (id === 'orders') onNavigate('orders')
    }
  }

  const filteredSpecialists = specialists.data.filter(s => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return s.name.toLowerCase().includes(query) ||
           s.phone.includes(query) ||
           s.email?.toLowerCase().includes(query) ||
           s.cities.some(c => c.toLowerCase().includes(query))
  })

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    specialists.update(id, { isActive: !currentStatus })
    dispatchEvent('specialist.toggled', {
      specialistId: id,
      isActive: !currentStatus
    })
    show({ message: currentStatus ? 'Specialist deactivated' : 'Specialist activated', type: 'success' })
  }

  const handleDelete = (id: string) => {
    specialists.delete(id)
    show({ message: 'Specialist removed', type: 'success' })
  }

  const handleServiceToggle = (serviceId: string) => {
    setNewSpecialist(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(serviceId)
        ? prev.serviceTypes.filter(s => s !== serviceId)
        : [...prev.serviceTypes, serviceId]
    }))
  }

  const handleCityToggle = (city: string) => {
    setNewSpecialist(prev => ({
      ...prev,
      cities: prev.cities.includes(city)
        ? prev.cities.filter(c => c !== city)
        : [...prev.cities, city]
    }))
  }

  const handleAddSpecialist = () => {
    if (!newSpecialist.name || !newSpecialist.phone || newSpecialist.serviceTypes.length === 0) {
      show({ message: 'Please fill in all required fields', type: 'error' })
      return
    }

    const created = specialists.create({
      ...newSpecialist,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newSpecialist.name}`,
      isActive: true
    })

    dispatchEvent('specialist.added', {
      specialistId: created.id,
      name: newSpecialist.name,
      phone: newSpecialist.phone
    })

    setShowAddDialog(false)
    setNewSpecialist({ name: '', phone: '', email: '', serviceTypes: [], cities: [] })
    show({ message: 'Specialist added!', type: 'success' })
  }

  const handleOpenEdit = (specialist: SpecialistEntity) => {
    setEditingSpecialist(specialist)
    setEditForm({
      name: specialist.name,
      phone: specialist.phone,
      email: specialist.email || '',
      serviceTypes: [...specialist.serviceTypes],
      cities: [...specialist.cities]
    })
    setShowEditDialog(true)
  }

  const handleEditServiceToggle = (serviceId: string) => {
    setEditForm(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(serviceId)
        ? prev.serviceTypes.filter(s => s !== serviceId)
        : [...prev.serviceTypes, serviceId]
    }))
  }

  const handleEditCityToggle = (city: string) => {
    setEditForm(prev => ({
      ...prev,
      cities: prev.cities.includes(city)
        ? prev.cities.filter(c => c !== city)
        : [...prev.cities, city]
    }))
  }

  const handleSaveEdit = () => {
    if (!editingSpecialist) return
    if (!editForm.name || !editForm.phone || editForm.serviceTypes.length === 0) {
      show({ message: 'Please fill in all required fields', type: 'error' })
      return
    }

    specialists.update(editingSpecialist.id, {
      name: editForm.name,
      phone: editForm.phone,
      email: editForm.email,
      serviceTypes: editForm.serviceTypes,
      cities: editForm.cities
    })

    dispatchEvent('specialist.updated', {
      specialistId: editingSpecialist.id,
      name: editForm.name
    })

    setShowEditDialog(false)
    setEditingSpecialist(null)
    show({ message: 'Specialist updated!', type: 'success' })
  }

  return (
    <Screen className="bg-slate-50">
      <Doc of="routes.admin-specialists" floating position="bottom-left" />
      <ScreenHeader>
        <TopBar
          title="Specialists"
          back={onBack}
          rightAction={
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          }
        />
      </ScreenHeader>

      <ScreenBody padding="md">
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search specialists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-cyan-600">{specialists.data.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {specialists.data.filter(s => s.isActive).length}
              </p>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
        </div>

        {/* Specialists List */}
        {filteredSpecialists.length === 0 ? (
          <EmptyState
            preset="no-data"
            title="No Specialists"
            description="Add your first specialist to get started."
            action={{
              label: "Add Specialist",
              onClick: () => setShowAddDialog(true)
            }}
          />
        ) : (
          <div className="space-y-3">
            {filteredSpecialists.map((specialist) => (
              <Card key={specialist.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar src={specialist.avatar} alt={specialist.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{specialist.name}</h4>
                        <Badge className={specialist.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                          {specialist.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{specialist.phone}</span>
                        </div>
                        {specialist.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{specialist.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{specialist.cities.slice(0, 3).join(', ')}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {specialist.serviceTypes.map((type) => (
                          <Badge key={type} variant="outline" className="text-xs capitalize">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Active</span>
                      <Switch
                        checked={specialist.isActive}
                        onCheckedChange={() => handleToggleActive(specialist.id, specialist.isActive)}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        onClick={() => handleOpenEdit(specialist)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(specialist.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScreenBody>

      <ScreenFooter>
        <BottomNav
          items={navItems}
          value={activeNav}
          onValueChange={handleNavChange}
        />
      </ScreenFooter>

      {/* Add Specialist Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent inline className="max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Add Specialist</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name *</label>
              <Input
                placeholder="Full name"
                value={newSpecialist.name}
                onChange={(e) => setNewSpecialist(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Phone *</label>
              <Input
                placeholder="050-XXX-XXXX"
                value={newSpecialist.phone}
                onChange={(e) => setNewSpecialist(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={newSpecialist.email}
                onChange={(e) => setNewSpecialist(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Services *</label>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map((service) => (
                  <Badge
                    key={service.id}
                    variant={newSpecialist.serviceTypes.includes(service.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleServiceToggle(service.id)}
                  >
                    {newSpecialist.serviceTypes.includes(service.id) && <Check className="h-3 w-3 mr-1" />}
                    {service.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Cities *</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-auto">
                {ISRAELI_CITIES.map((city) => (
                  <Badge
                    key={city}
                    variant={newSpecialist.cities.includes(city) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleCityToggle(city)}
                  >
                    {newSpecialist.cities.includes(city) && <Check className="h-3 w-3 mr-1" />}
                    {city}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSpecialist}>
              Add Specialist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Specialist Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent inline className="max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Specialist</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name *</label>
              <Input
                placeholder="Full name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Phone *</label>
              <Input
                placeholder="050-XXX-XXXX"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Services *</label>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map((service) => (
                  <Badge
                    key={service.id}
                    variant={editForm.serviceTypes.includes(service.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleEditServiceToggle(service.id)}
                  >
                    {editForm.serviceTypes.includes(service.id) && <Check className="h-3 w-3 mr-1" />}
                    {service.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Cities *</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-auto">
                {ISRAELI_CITIES.map((city) => (
                  <Badge
                    key={city}
                    variant={editForm.cities.includes(city) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleEditCityToggle(city)}
                  >
                    {editForm.cities.includes(city) && <Check className="h-3 w-3 mr-1" />}
                    {city}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Screen>
  )
}
