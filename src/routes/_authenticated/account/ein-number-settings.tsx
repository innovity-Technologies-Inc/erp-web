import { createFileRoute } from '@tanstack/react-router'
import { EinNumberSettingPage } from '@/modules/account/views/ein/EinNumberSettingPage'

export const Route = createFileRoute('/_authenticated/account/ein-number-settings')({
  component: EinNumberSettingPage,
})
