import { useQuery } from '@tanstack/react-query'
import { getGlobalSettings } from '@/api/settings.api'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useEffect, useCallback } from 'react'

export const useSettings = () => {
  const { setSettings, webSetting, companyInformation } = useSettingsStore()
  const token = useAuthStore((state) => state.token)

  // We rely on the persisted Zustand store as the primary source.
  // We automatically re-fetch the settings whenever the auth token changes.
  const query = useQuery({
    queryKey: ['global-settings', token],
    queryFn: getGlobalSettings,
    staleTime: Infinity, // Keep data fresh within the session
  })

  const injectThemeColors = useCallback((settings: any) => {
    if (settings.webSetting) {
      const root = document.documentElement
      const ws = settings.webSetting
      root.style.setProperty('--color-primary', ws.color_primary)
      root.style.setProperty('--color-info', ws.color_info)
      root.style.setProperty('--color-success', ws.color_success)
      root.style.setProperty('--color-warning', ws.color_warning)
      root.style.setProperty('--color-danger', ws.color_danger)
      if (ws.sidebar_color) {
        root.style.setProperty('--color-sidebar', ws.sidebar_color)
      }
    }
  }, [])

  // Sync query data to Zustand and inject colors
  useEffect(() => {
    if (query.data?.data) {
      const settings = query.data.data
      setSettings(settings)
      injectThemeColors(settings)
    } else if (webSetting) {
      // If no new query data but we have persisted data, ensure colors are injected
      injectThemeColors({ webSetting, companyInformation })
    }
  }, [query.data, setSettings, injectThemeColors, webSetting, companyInformation])

  return {
    ...query,
    webSetting,
    companyInformation,
    logo: webSetting?.logo_url || companyInformation?.logo_url || null,
    siteName: webSetting?.site_name || companyInformation?.company_name || 'Nexus ERP',
    currency: webSetting?.currency || '৳',
    currencyPosition: webSetting?.currency_position || 'right',
  }
}
