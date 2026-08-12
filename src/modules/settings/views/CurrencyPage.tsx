import { useMemo, useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import { getSettingsTabs } from '../tabs'
import { useCurrenciesDatatable, useDeleteCurrency } from '../hooks/useCurrencies'
import { CurrencyModal } from '../components/CurrencyModal'
import type { ColDef } from 'ag-grid-community'
import type { CurrencyListItem } from '../api/settings.api'

export const CurrencyPage = () => {
  const { showNotificationModal } = useUiStore()
  const loggedInUser = useAuthStore((state) => state.user)

  // Super Admin check
  const isSuperAdmin = useMemo(() => {
    const roles = loggedInUser?.roles || []
    return roles.some((r: any) => {
      const name = typeof r === 'string' ? r : r.name
      return name?.toLowerCase() === 'super-admin' || name?.toLowerCase() === 'super admin'
    })
  }, [loggedInUser])

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [idToDelete, setIdToDelete] = useState<number | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    currency_name: true,
    icon: true,
    action: true,
  })

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  // Load tabs with dynamic active status
  const tabs = useMemo(() => getSettingsTabs('/settings/currency', isSuperAdmin), [isSuperAdmin])

  // Params for Datatable endpoint
  const params = useMemo(
    () => ({
      draw: 1,
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      search: { value: search },
    }),
    [currentPage, pageSize, search]
  )

  const { data: currenciesData, isLoading } = useCurrenciesDatatable(params)
  const { mutate: deleteCurrencyMutation, isPending: isDeleting } = useDeleteCurrency()

  const handleAdd = () => {
    setSelectedId(null)
    setIsModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (idToDelete) {
      deleteCurrencyMutation(idToDelete, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setIdToDelete(null)
          showNotificationModal(
            'Deleted Successfully!',
            'The currency has been deleted successfully.',
            'success'
          )
        },
        onError: (err: any) => {
          setIsConfirmOpen(false)
          setIdToDelete(null)
          const msg = err.response?.data?.message || err.message || 'Failed to delete currency.'
          showNotificationModal('Delete Failed', msg, 'error')
        },
      })
    }
  }

  const columnDefs = useMemo<ColDef<CurrencyListItem>[]>(
    () => [
      {
        headerName: 'SL',
        valueGetter: (params) => {
          const index = params.node?.rowIndex ?? 0
          return (currentPage - 1) * pageSize + index + 1
        },
        width: 80,
        pinned: 'left',
        hide: !visibleCols.sl,
        cellClass: 'text-gray-400 font-medium border-r border-primary/10 flex items-center justify-center',
      },
      {
        headerName: 'CURRENCY NAME',
        field: 'currency_name',
        minWidth: 250,
        flex: 1.5,
        hide: !visibleCols.currency_name,
        cellClass: 'font-semibold text-slate-800 flex items-center',
      },
      {
        headerName: 'CURRENCY SYMBOL',
        field: 'icon',
        minWidth: 200,
        flex: 1,
        hide: !visibleCols.icon,
        cellClass: 'text-gray-600 font-semibold flex items-center justify-center',
      },
      {
        headerName: 'ACTIONS',
        width: 120,
        pinned: 'right',
        hide: !visibleCols.action,
        cellClass: 'flex items-center justify-center gap-1.5',
        cellRenderer: (params: any) => {
          const currencyId = params.data?.id
          if (!currencyId) return null
          return (
            <div className="flex items-center gap-1.5 h-full">
              <button
                onClick={() => {
                  setSelectedId(currencyId)
                  setIsModalOpen(true)
                }}
                className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/edit"
                title="Edit Currency"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setIdToDelete(currencyId)
                  setIsConfirmOpen(true)
                }}
                className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/del"
                title="Delete Currency"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )
        },
      },
    ],
    [visibleCols, currentPage, pageSize]
  )

  const filterColumns = useMemo(
    () => [
      { name: 'SL', field: 'sl', visible: visibleCols.sl },
      { name: 'Currency Name', field: 'currency_name', visible: visibleCols.currency_name },
      { name: 'Currency Symbol', field: 'icon', visible: visibleCols.icon },
      { name: 'Action', field: 'action', visible: visibleCols.action },
    ],
    [visibleCols]
  )

  const totalPages = useMemo(() => {
    return Math.ceil((currenciesData?.recordsFiltered || 0) / pageSize)
  }, [currenciesData, pageSize])

  return (
    <>
      <ListPageLayout
        title="Currency List"
        backTo="/"
        tabs={tabs}
        searchWidth="max-w-[200px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        onCreate={handleAdd}
        createPermission="create_currency"
        addLabel="Create"
        // AG Grid Props
        rowData={currenciesData?.data || []}
        columnDefs={columnDefs}
        // Pagination
        recordsTotal={currenciesData?.recordsFiltered || 0}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
        // Column Filter
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
        gridOptions={{
          rowHeight: 46,
          suppressRowTransform: true,
        }}
      />

      {/* Currency Modal popup */}
      <CurrencyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currencyId={selectedId}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="Delete Currency"
        message="Are you sure you want to delete this currency? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onClose={() => setIsConfirmOpen(false)}
        confirmText="Yes, delete it"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </>
  )
}
