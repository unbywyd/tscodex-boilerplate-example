// Prototype Routes Config
// Custom routes for the prototype pages

import type { ComponentType } from 'react'

export interface PrototypeRoute {
  path: string
  title: string
  description?: string
  component?: ComponentType
}

// Custom prototype routes (shown on prototype home page)
export const prototypeRoutes: PrototypeRoute[] = [
  {
    path: '/prototype/eldercare',
    title: 'ElderCare',
    description: 'Elderly Care Services Platform - 3 mobile apps',
  },
]
