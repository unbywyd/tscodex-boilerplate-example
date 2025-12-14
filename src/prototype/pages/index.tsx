// Prototype Pages Index
// Main entry point for the prototype - routes to different apps

import { useLocation } from 'react-router-dom'
import ElderCarePreview from './ElderCarePreview'
import ClientApp from './client/ClientApp'
import SpecialistApp from './specialist/SpecialistApp'
import AdminApp from './admin/AdminApp'
import { MobileToastProvider } from '@/components/ui'
import { NotificationToast } from '@prototype/components'

// Standalone app wrapper - fullscreen without desktop frame
// Screen component uses absolute positioning, so we need a relative container with fixed height
function StandaloneWrapper({ children, app }: { children: React.ReactNode, app: 'client' | 'specialist' | 'admin' }) {
  return (
    <MobileToastProvider position="bottom" offset={80}>
      <NotificationToast app={app} />
      <div className="fixed inset-0 bg-background">
        {children}
      </div>
    </MobileToastProvider>
  )
}

export default function PrototypeRouter() {
  const location = useLocation()
  const path = location.pathname

  // Standalone app routes (both /app/* and /prototype/*)
  if (path === '/app/client' || path.startsWith('/app/client/') ||
      path === '/prototype/client' || path.startsWith('/prototype/client/')) {
    return (
      <StandaloneWrapper app="client">
        <ClientApp />
      </StandaloneWrapper>
    )
  }

  if (path === '/app/specialist' || path.startsWith('/app/specialist/') ||
      path === '/prototype/specialist' || path.startsWith('/prototype/specialist/')) {
    return (
      <StandaloneWrapper app="specialist">
        <SpecialistApp />
      </StandaloneWrapper>
    )
  }

  if (path === '/app/admin' || path.startsWith('/app/admin/') ||
      path === '/prototype/admin' || path.startsWith('/prototype/admin/')) {
    return (
      <StandaloneWrapper app="admin">
        <AdminApp />
      </StandaloneWrapper>
    )
  }

  // Default: show preview with all three apps
  return <ElderCarePreview />
}
