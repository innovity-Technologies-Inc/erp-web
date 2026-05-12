import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WebSetting, CompanyInformation } from '@/api/settings.api'

interface SettingsState {
  webSetting: WebSetting | null
  companyInformation: CompanyInformation | null
  setSettings: (settings: { webSetting: WebSetting | null; companyInformation: CompanyInformation | null }) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      webSetting: null,
      companyInformation: null,
      setSettings: (settings) => set(settings),
    }),
    {
      name: 'erp-settings',
    }
  )
)
