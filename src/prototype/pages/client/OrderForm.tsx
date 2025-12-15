// Order Form Screen
// Create a new care service order

import { useState } from 'react'
import { Heart, Stethoscope, Home, ShoppingBag, Users, Ambulance, Calendar, MapPin, FileText, Check } from 'lucide-react'
import {
  Screen, ScreenHeader, ScreenBody, ScreenFooter,
  TopBar, Card, CardContent, Button, Input,
  MobilePicker, DatePicker, TimePicker,
  Doc, useToast
} from '@/components/ui'
import { useRepo } from '@/hooks/useRepo'
import { useAuth } from '@/hooks/useAuth'
import { dispatchEvent } from '@/lib/events'
import { notifyApp } from '@prototype/stores/notificationStore'
import { SERVICES, ISRAELI_CITIES, type CareOrderEntity, type ClientUser } from '@prototype/factories'

interface OrderFormProps {
  onBack?: () => void
  onSuccess?: (orderId: string) => void
}

const serviceIcons: Record<string, React.ElementType> = {
  Heart, Stethoscope, Home, ShoppingBag, Users, Ambulance
}

type FormStep = 'service' | 'details' | 'confirm'

export default function OrderForm({ onBack, onSuccess }: OrderFormProps) {
  const { show } = useToast()
  const { user } = useAuth<ClientUser>({ namespace: 'client' })
  const orders = useRepo<CareOrderEntity>('orders')
  const [step, setStep] = useState<FormStep>('service')
  // Pre-fill from user profile if available
  const [formData, setFormData] = useState({
    serviceType: '',
    phone: user?.phone || '',
    clientName: user?.name || '',
    city: user?.city || '',
    address: user?.address || '',
    date: '',
    startTime: '',
    notes: ''
  })

  const selectedService = SERVICES.find(s => s.id === formData.serviceType)

  const handleServiceSelect = (serviceId: string) => {
    setFormData(prev => ({ ...prev, serviceType: serviceId }))
    setStep('details')
  }

  const handleSubmit = () => {
    const newOrder = orders.create({
      ...formData,
      serviceType: formData.serviceType as CareOrderEntity['serviceType'],
      duration: null,
      status: 'created',
      specialistId: null,
      actualStart: null,
      actualEnd: null,
      paidAmount: null,
      paidAt: null,
      paymentNotes: null
    })

    dispatchEvent('order.created', {
      orderId: newOrder.id,
      serviceType: formData.serviceType,
      city: formData.city,
      date: formData.date
    })

    // Notify admin about new order
    notifyApp(
      'admin',
      'New Order',
      `${selectedService?.name || formData.serviceType} service in ${formData.city}`,
      'order',
      { orderId: newOrder.id }
    )

    show({ message: 'Order created successfully!', type: 'success' })
    onSuccess?.(newOrder.id)
  }

  const canProceed = () => {
    if (step === 'details') {
      // Only date and time are required - address/city pre-filled from profile or can be added
      return formData.date && formData.startTime
    }
    return true
  }

  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IL', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <Screen className="bg-slate-50">
      <Doc of="routes.client-order-form" floating position="bottom-left" />
      <ScreenHeader>
        <TopBar
          title={step === 'service' ? 'Select Service' : step === 'details' ? 'Order Details' : 'Confirm Order'}
          back={step === 'service' ? onBack : () => setStep(step === 'confirm' ? 'details' : 'service')}
        />
      </ScreenHeader>

      <ScreenBody padding="md" className="space-y-4">
        {/* Step: Service Selection */}
        {step === 'service' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              What type of care do you need?
            </p>
            {SERVICES.map((service) => {
              const Icon = serviceIcons[service.icon] || Heart
              const isSelected = formData.serviceType === service.id
              return (
                <Card
                  key={service.id}
                  className={`cursor-pointer transition-all ${isSelected ? 'border-cyan-500 bg-cyan-50' : 'hover:border-cyan-300'}`}
                  onClick={() => handleServiceSelect(service.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`rounded-lg p-3 ${isSelected ? 'bg-cyan-600' : 'bg-cyan-100'}`}>
                        <Icon className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-cyan-600'}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{service.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="rounded-full bg-cyan-600 p-1">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Step: Order Details */}
        {step === 'details' && (
          <div className="space-y-4">
            {selectedService && (
              <Card className="bg-cyan-50 border-cyan-200">
                <CardContent className="p-3 flex items-center gap-3">
                  {(() => {
                    const Icon = serviceIcons[selectedService.icon] || Heart
                    return <Icon className="h-5 w-5 text-cyan-600" />
                  })()}
                  <span className="font-medium text-cyan-800">{selectedService.name}</span>
                  <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => setStep('service')}>
                    Change
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {/* Date and Time - Required */}
              <div className="grid grid-cols-2 gap-3">
                <DatePicker
                  label="Date *"
                  placeholder="Select date"
                  value={formData.date ? new Date(formData.date) : undefined}
                  onChange={(date) => setFormData(prev => ({
                    ...prev,
                    date: date ? date.toISOString().split('T')[0] : ''
                  }))}
                  dateFormat="dd/MM/yyyy"
                />
                <TimePicker
                  label="Start Time *"
                  placeholder="Select time"
                  value={formData.startTime}
                  onChange={(time) => setFormData(prev => ({
                    ...prev,
                    startTime: time || ''
                  }))}
                  minuteStep={15}
                />
              </div>

              {/* Address - Pre-filled from profile */}
              <MobilePicker
                label="City"
                placeholder="Select city"
                value={formData.city}
                onChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                options={ISRAELI_CITIES}
              />

              <div>
                <label className="text-sm font-medium mb-1.5 block">Address</label>
                <Input
                  placeholder="Street address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              {/* Contact info - Pre-filled from profile */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Phone Number</label>
                <Input
                  placeholder="050-XXX-XXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Your Name</label>
                <Input
                  placeholder="How should we call you?"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Notes (optional)</label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                  placeholder="Any special requirements or instructions..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step: Confirmation */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold">Order Summary</h3>

                <div className="flex items-center gap-3 py-2 border-b">
                  {selectedService && (() => {
                    const Icon = serviceIcons[selectedService.icon] || Heart
                    return (
                      <>
                        <Icon className="h-5 w-5 text-cyan-600" />
                        <span className="font-medium">{selectedService.name}</span>
                      </>
                    )
                  })()}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{formData.address}, {formData.city}</span>
                  </div>
                  <div className="flex gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{formatDisplayDate(formData.date)} at {formData.startTime}</span>
                  </div>
                  {formData.notes && (
                    <div className="flex gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{formData.notes}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <p className="text-sm text-amber-800">
                  You will receive an SMS confirmation at <strong>{formData.phone}</strong> once your order is processed.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </ScreenBody>

      <ScreenFooter className="p-4 bg-white border-t">
        {step === 'details' && (
          <Button
            className="w-full"
            size="lg"
            disabled={!canProceed()}
            onClick={() => setStep('confirm')}
          >
            Review Order
          </Button>
        )}
        {step === 'confirm' && (
          <Button
            className="w-full bg-cyan-600 hover:bg-cyan-700"
            size="lg"
            onClick={handleSubmit}
          >
            Confirm Order
          </Button>
        )}
      </ScreenFooter>
    </Screen>
  )
}
