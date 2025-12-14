// Prototype Data Factories
// Register fake data generators for each entity type
//
// These factories are used by useRepo().populate() to generate test data

import { registerFactory, faker } from '@/lib/data-factory'
import type { BaseEntity } from '@/lib/repository'

// ============================================
// Demo Entity (for Users demo page)
// ============================================

export interface UserEntity extends BaseEntity {
  name: string
  email: string
  role: string
  avatar: string
}

// ============================================
// Auth User Types for each app
// ============================================

export interface ClientUser {
  id: string
  phone: string
  name: string
  city?: string
  address?: string
  role: 'client'
}

export interface SpecialistUser {
  id: string
  phone: string
  name: string
  email: string
  avatar: string
  role: 'specialist'
}

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'admin'
}

// ============================================
// ElderCare Entity Interfaces
// ============================================

export interface CareOrderEntity extends BaseEntity {
  phone: string
  clientName: string
  serviceType: 'caregiver' | 'nurse' | 'household' | 'shopping' | 'escort' | 'medical'
  address: string
  city: string
  date: string
  startTime: string
  duration: number | null
  notes: string
  status: 'created' | 'reviewing' | 'assigned' | 'on_way' | 'in_progress' | 'completed' | 'paid' | 'cancelled'
  specialistId: string | null
  specialistName?: string
  specialistPhone?: string
  actualStart: string | null
  actualEnd: string | null
  // Payment info (filled by admin after completion)
  paidAmount: number | null
  paidAt: string | null
  paymentNotes: string | null
  createdAt: string
  updatedAt: string  // Updated on every status change for sorting
}

export interface SpecialistEntity extends BaseEntity {
  name: string
  phone: string
  email: string
  avatar: string
  serviceTypes: string[]
  cities: string[]
  isActive: boolean
  createdAt: string
}

export interface ServiceEntity extends BaseEntity {
  name: string
  description: string
  category: 'care' | 'medical' | 'household' | 'transport'
  icon: string
}

export interface AvailabilityEntity extends BaseEntity {
  specialistId: string
  date: string
  startTime: string
  endTime: string
  isBooked: boolean
}

export interface ReviewEntity extends BaseEntity {
  orderId: string
  rating: number
  comment: string
  createdAt: string
}

// ============================================
// Israeli Data Helpers
// ============================================

// Main cities where specialists work - used for both specialists and orders
const mainCities = [
  'Tel Aviv', 'Jerusalem', 'Haifa', 'Rishon LeZion', 'Ramat Gan'
]

// All cities (for forms and additional options)
const israeliCities = [
  'Tel Aviv', 'Jerusalem', 'Haifa', 'Rishon LeZion', 'Petah Tikva',
  'Ashdod', 'Netanya', 'Beer Sheva', 'Holon', 'Ramat Gan',
  'Herzliya', 'Kfar Saba', 'Raanana', 'Bat Yam', 'Rehovot'
]

const serviceTypes = ['caregiver', 'nurse', 'household', 'shopping', 'escort', 'medical'] as const

const orderStatuses = ['created', 'reviewing', 'assigned', 'on_way', 'in_progress', 'completed', 'paid'] as const

function generateIsraeliPhone(): string {
  const prefixes = ['050', '052', '053', '054', '055', '058']
  const prefix = faker.helpers.arrayElement(prefixes)
  const number = faker.string.numeric(7)
  return `${prefix}-${number.slice(0, 3)}-${number.slice(3)}`
}

function generateTimeSlot(): string {
  const hours = faker.number.int({ min: 7, max: 20 })
  const minutes = faker.helpers.arrayElement(['00', '30'])
  return `${hours.toString().padStart(2, '0')}:${minutes}`
}

// ============================================
// Factory Registration
// ============================================

// Demo Users factory
registerFactory<UserEntity>('users', () => ({
  name: faker.person.fullName(),
  email: faker.internet.email(),
  role: faker.helpers.arrayElement(['admin', 'user', 'moderator']),
  avatar: faker.image.avatar(),
}))

registerFactory<CareOrderEntity>('orders', () => {
  const status = faker.helpers.arrayElement(orderStatuses)
  const hasSpecialist = ['assigned', 'on_way', 'in_progress', 'completed', 'paid'].includes(status)
  const isInProgress = status === 'in_progress'
  const isCompleted = status === 'completed' || status === 'paid'
  const isPaid = status === 'paid'
  // Use main cities (80%) or all cities (20%) - ensures most orders match specialists
  const city = faker.helpers.maybe(
    () => faker.helpers.arrayElement(israeliCities),
    { probability: 0.2 }
  ) || faker.helpers.arrayElement(mainCities)
  const createdAt = faker.date.recent({ days: 3 }).toISOString()

  return {
    phone: generateIsraeliPhone(),
    clientName: faker.person.fullName(),
    serviceType: faker.helpers.arrayElement(serviceTypes),
    address: `${faker.location.streetAddress()}, ${city}`,
    city,
    date: faker.date.soon({ days: 7 }).toISOString().split('T')[0],
    startTime: generateTimeSlot(),
    duration: faker.helpers.arrayElement([2, 4, 6, 8, null]),
    notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }) || '',
    status,
    specialistId: hasSpecialist ? faker.string.uuid() : null,
    specialistName: hasSpecialist ? faker.person.fullName() : undefined,
    specialistPhone: hasSpecialist ? generateIsraeliPhone() : undefined,
    actualStart: (isInProgress || isCompleted) ? faker.date.recent().toISOString() : null,
    actualEnd: isCompleted ? faker.date.recent().toISOString() : null,
    paidAmount: isPaid ? faker.number.int({ min: 100, max: 500 }) : null,
    paidAt: isPaid ? faker.date.recent().toISOString() : null,
    paymentNotes: isPaid ? faker.helpers.maybe(() => 'Cash payment', { probability: 0.5 }) || null : null,
    createdAt,
    updatedAt: createdAt,  // Initially same as created
  }
})

registerFactory<SpecialistEntity>('specialists', () => ({
  name: faker.person.fullName(),
  phone: generateIsraeliPhone(),
  email: faker.internet.email(),
  avatar: faker.image.avatar(),
  serviceTypes: faker.helpers.arrayElements(serviceTypes, { min: 2, max: 4 }),
  // Always include main cities + some additional ones
  cities: [...mainCities, ...faker.helpers.arrayElements(israeliCities.filter(c => !mainCities.includes(c)), { min: 0, max: 3 })],
  isActive: faker.datatype.boolean({ probability: 0.9 }),
  createdAt: faker.date.past({ years: 1 }).toISOString(),
}))

registerFactory<AvailabilityEntity>('availabilities', () => {
  const startHour = faker.number.int({ min: 7, max: 16 })
  const endHour = startHour + faker.number.int({ min: 2, max: 8 })

  return {
    specialistId: faker.string.uuid(),
    date: faker.date.soon({ days: 7 }).toISOString().split('T')[0],
    startTime: `${startHour.toString().padStart(2, '0')}:00`,
    endTime: `${Math.min(endHour, 22).toString().padStart(2, '0')}:00`,
    isBooked: faker.datatype.boolean({ probability: 0.3 }),
  }
})

registerFactory<ReviewEntity>('reviews', () => ({
  orderId: faker.string.uuid(),
  rating: faker.number.int({ min: 3, max: 5 }),
  comment: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.6 }) || '',
  createdAt: faker.date.recent({ days: 14 }).toISOString(),
}))

// ============================================
// Static Services Data
// ============================================

export const SERVICES: ServiceEntity[] = [
  {
    id: 'caregiver',
    name: 'Caregiver',
    description: 'Personal care and daily assistance for elderly',
    category: 'care',
    icon: 'Heart',
  },
  {
    id: 'nurse',
    name: 'Nurse',
    description: 'Medical care and health monitoring',
    category: 'medical',
    icon: 'Stethoscope',
  },
  {
    id: 'household',
    name: 'Household Assistant',
    description: 'Help with cleaning, cooking, and home tasks',
    category: 'household',
    icon: 'Home',
  },
  {
    id: 'shopping',
    name: 'Shopping Assistant',
    description: 'Grocery shopping and errands',
    category: 'household',
    icon: 'ShoppingBag',
  },
  {
    id: 'escort',
    name: 'Escort Service',
    description: 'Accompaniment for outings and activities',
    category: 'transport',
    icon: 'Users',
  },
  {
    id: 'medical',
    name: 'Medical Escort',
    description: 'Accompaniment to medical appointments',
    category: 'transport',
    icon: 'Ambulance',
  },
]

// Export cities for use in forms
export const ISRAELI_CITIES = israeliCities
