import { useMemo } from 'react'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { useAuthStore } from '@/store/useAuthStore'
import { getSettingsTabs } from '../tabs'

export const GeneralSettingPage = () => {
  const loggedInUser = useAuthStore((state) => state.user)

  // Super Admin check
  const isSuperAdmin = useMemo(() => {
    const roles = loggedInUser?.roles || []
    return roles.some((r: any) => {
      const name = typeof r === 'string' ? r : r.name
      return name?.toLowerCase() === 'super-admin' || name?.toLowerCase() === 'super admin'
    })
  }, [loggedInUser])

  const tabs = useMemo(() => getSettingsTabs('/settings/setting', isSuperAdmin), [isSuperAdmin])

  return (
    <ListPageLayout
      title="Web Setting"
      backTo="/"
      tabs={tabs}
      disableCard={true}
      rowData={[]}
      columnDefs={[]}
    >
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 max-w-[1600px] mx-auto">
        <h2 className="text-lg font-semibold text-slate-800 border-b border-gray-50 pb-4">
          General Settings
        </h2>
        <p className="text-sm text-gray-500">Placeholder for general web configuration settings.</p>
      </div>
    </ListPageLayout>
  )
}
