import { useMemo } from 'react'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { useAuthStore } from '@/store/useAuthStore'
import { getSettingsTabs } from '../tabs'
import type { ColDef } from 'ag-grid-community'

export const CurrencyPage = () => {
  const loggedInUser = useAuthStore((state) => state.user)

  // Super Admin check
  const isSuperAdmin = useMemo(() => {
    const roles = loggedInUser?.roles || []
    return roles.some((r: any) => {
      const name = typeof r === 'string' ? r : r.name
      return name?.toLowerCase() === 'super-admin' || name?.toLowerCase() === 'super admin'
    })
  }, [loggedInUser])

  const tabs = useMemo(() => getSettingsTabs('/settings/currency', isSuperAdmin), [isSuperAdmin])

  const columnDefs = useMemo<ColDef[]>(
    () => [
      { headerName: 'SL', field: 'sl', width: 80 },
      { headerName: 'Currency Name', field: 'name', flex: 1 },
      { headerName: 'Symbol', field: 'symbol', flex: 1 },
      { headerName: 'Code', field: 'code', flex: 1 },
      { headerName: 'Action', field: 'action', width: 100 },
    ],
    []
  )

  return (
    <ListPageLayout
      title="Currency List"
      backTo="/"
      tabs={tabs}
      rowData={[]}
      columnDefs={columnDefs}
      isLoading={false}
      recordsTotal={0}
      currentPage={1}
      pageSize={10}
      totalPages={0}
      onPageChange={() => {}}
      onPageSizeChange={() => {}}
      searchValue=""
      onSearchChange={() => {}}
    />
  )
}
