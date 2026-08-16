import { createFileRoute } from '@tanstack/react-router'
import { EinSettingPage } from '@/modules/account/views/ein/EinSettingPage'

export const Route = createFileRoute('/_authenticated/account/ein-setting')({
  component: EinSettingPage,
})
