import { useQuery } from '@tanstack/react-query'
import { getGlobalSettings } from '@/api/settings.api'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useEffect } from 'react'

export const useSettings = () => {
  const { setSettings, webSetting, companyInformation } = useSettingsStore()

  const query = useQuery({
    queryKey: ['global-settings'],
    queryFn: getGlobalSettings,
    staleTime: 1000 * 60 * 30, // 30 minutes
  })

  useEffect(() => {
    if (query.data?.data) {
      const settings = query.data.data
      setSettings(settings)

      // Inject colors as CSS variables
      if (settings.webSetting) {
        const root = document.documentElement
        root.style.setProperty('--color-primary', settings.webSetting.color_primary)
        root.style.setProperty('--color-info', settings.webSetting.color_info)
        root.style.setProperty('--color-success', settings.webSetting.color_success)
        root.style.setProperty('--color-warning', settings.webSetting.color_warning)
        root.style.setProperty('--color-danger', settings.webSetting.color_danger)
        if (settings.webSetting.sidebar_color) {
          root.style.setProperty('--color-sidebar', settings.webSetting.sidebar_color)
        }
      }
    }
  }, [query.data, setSettings])

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
