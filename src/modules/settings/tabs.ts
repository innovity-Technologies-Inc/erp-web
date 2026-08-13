export const settingsTabs = [
  { name: 'Organization', to: '/settings/organization', role: 'super-admin' },
  { name: 'Company', to: '/settings/company', permission: 'view_company' },
  { name: 'Currency', to: '/settings/currency', permission: 'view_currency' },
  { name: 'Print', to: '/settings/print', permission: 'view_print_setting' },
  { name: 'Email', to: '/settings/email', permission: 'view_email_setting' },
  { name: 'Setting', to: '/settings/setting', permission: 'view_general_setting' },
]

export const getSettingsTabs = (
  activePath: string,
  isSuperAdmin: boolean,
  hasPermission: (permission: string) => boolean
) => {
  return settingsTabs
    .filter((tab) => {
      if (tab.role === 'super-admin') return isSuperAdmin
      if (tab.permission) return hasPermission(tab.permission)
      return true
    })
    .map((tab) => ({
      ...tab,
      active: tab.to === activePath,
    }))
}
