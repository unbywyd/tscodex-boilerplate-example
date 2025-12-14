// Prototype navigation config
// Add custom nav links and home page override here

import type { ComponentType } from 'react'

// Custom navigation links to add to the main nav
// These will appear before the default links (Prototype, Interview, Docs, Schema)
export const customNavLinks: Array<{
  path: string
  label: string
  icon: ComponentType<{ className?: string }>
}> = []

// Custom home page component (optional)
// Set to a React component to replace the default home page
// Example: export const CustomHomePage = MyCustomHomePage
export const CustomHomePage: ComponentType | null = null
