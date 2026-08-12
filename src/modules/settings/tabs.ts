export const settingsTabs = [
  { name: 'Organization', to: '/settings/organization' },
  { name: 'Company', to: '/settings/company' },
  { name: 'Currency', to: '/settings/currency' },
  { name: 'Print', to: '/settings/print' },
  { name: 'Email', to: '/settings/email' },
  { name: 'Setting', to: '/settings/setting' },
]

export const getSettingsTabs = (activePath: string, isSuperAdmin: boolean) => {
  return settingsTabs
    .filter((tab) => isSuperAdmin || tab.to !== '/settings/organization')
    .map((tab) => ({
      ...tab,
      active: tab.to === activePath,
    }))
}
