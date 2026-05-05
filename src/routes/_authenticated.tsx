import { createFileRoute } from '@tanstack/react-router'
import { AuthGuard } from '@/layouts/guards/AuthGuard'
import { AppShell } from '@/layouts/AppShell/AppShell'

export const Route = createFileRoute('/_authenticated')({
  component: () => (
    <AuthGuard>
      <AppShell />
    </AuthGuard>
  ),
})
