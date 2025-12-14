// ElderCare Preview
// Shows all three mobile apps side by side with standalone links

import { ExternalLink, Smartphone, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { MobileFrame, Button } from '@/components/ui'
import ClientApp from './client/ClientApp'
import SpecialistApp from './specialist/SpecialistApp'
import AdminApp from './admin/AdminApp'

const apps = [
  {
    id: 'client',
    title: 'Client App',
    description: 'Order and track services',
    path: '/app/client',
    colorClass: 'bg-cyan-600 hover:bg-cyan-700',
    Component: ClientApp,
  },
  {
    id: 'specialist',
    title: 'Specialist App',
    description: 'Manage work and availability',
    path: '/app/specialist',
    colorClass: 'bg-green-600 hover:bg-green-700',
    Component: SpecialistApp,
  },
  {
    id: 'admin',
    title: 'Admin App',
    description: 'Manage orders and specialists',
    path: '/app/admin',
    colorClass: 'bg-violet-600 hover:bg-violet-700',
    Component: AdminApp,
  },
]

export default function ElderCarePreview() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const baseUrl = window.location.origin

  const handleOpenApp = (path: string) => {
    window.open(path, '_blank')
  }

  const handleCopyLink = async (id: string, path: string) => {
    await navigator.clipboard.writeText(`${baseUrl}${path}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">ElderCare</h1>
        <p className="text-slate-600">Elderly Care Services Platform - MVP Prototype</p>
        <p className="text-sm text-slate-500 mt-2 flex items-center justify-center gap-1">
          <Smartphone className="h-4 w-4" />
          Open any app on your phone by clicking "Open Standalone"
        </p>
      </div>

      {/* Three Apps Side by Side */}
      <div className="flex flex-wrap justify-center gap-8">
        {apps.map(({ id, title, description, path, Component }) => (
          <div key={id} className="flex flex-col items-center gap-3">
            <div className="text-center">
              <h2 className="font-semibold text-lg text-slate-700">{title}</h2>
              <p className="text-sm text-slate-500">{description}</p>
            </div>

            <MobileFrame device="iphone" size="md">
              <Component />
            </MobileFrame>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenApp(path)}
              >
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Open Standalone
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyLink(id, path)}
                title="Copy link for mobile"
              >
                {copiedId === id ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Direct Links Section */}
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-lg shadow-sm border p-6">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Direct Links for Mobile Testing
        </h3>
        <div className="space-y-3">
          {apps.map(({ id, title, path, colorClass }) => (
            <div key={id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <span className="font-medium text-slate-700">{title}</span>
                <code className="ml-2 text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                  {path}
                </code>
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyLink(id, path)}
                >
                  {copiedId === id ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleOpenApp(path)}
                  className={colorClass}
                >
                  Open
                </Button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-4">
          Tip: Copy a link and open it on your phone's browser to test the mobile experience.
          The app will run fullscreen without the desktop frame.
        </p>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 text-sm text-slate-500">
        <p>Prototype built with LLM Boilerplate</p>
        <p className="mt-1">All data is stored locally in your browser</p>
      </div>
    </div>
  )
}
