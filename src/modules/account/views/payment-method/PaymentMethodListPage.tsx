import { useMemo, useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import type { ColDef } from 'ag-grid-community'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { useUiStore } from '@/store/useUiStore'
import { 
  usePaymentMethodsDatatable, 
  useDeletePaymentMethod
} from '../../hooks/usePaymentMethod'
import type { PaymentMethodListItem } from '../../api/payment-method.api'
import { PaymentMethodModal } from '../../components/PaymentMethodModal'

export const PaymentMethodListPage = () => {
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()

  // Pagination & Search States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')

  // Modal & Edit States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEditId, setSelectedEditId] = useState<number | null>(null)

  // Delete Confirmation States
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [idToDelete, setIdToDelete] = useState<number | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    name: true,
    action: true
  })

  // Data Fetching
  const params = useMemo(() => ({
    draw: 1,
    start: (currentPage - 1) * pageSize,
    length: pageSize,
    search: { value: search }
  }), [currentPage, pageSize, search])

  const { data: datatableResponse, isLoading } = usePaymentMethodsDatatable(params)
  const { mutate: deletePaymentMethod, isPending: isDeleting } = useDeletePaymentMethod()


  // Event Handlers
  const handleAdd = () => {
    setSelectedEditId(null)
    setIsModalOpen(true)
  }

  const handleEdit = (id: number) => {
    setSelectedEditId(id)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (id: number) => {
    setIdToDelete(id)
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (idToDelete) {
      deletePaymentMethod(idToDelete, {
        onSuccess: () => {
          setIsDeleteConfirmOpen(false)
          setIdToDelete(null)
          showNotificationModal(
            'Deleted!',
            'Payment method has been removed successfully.',
            'success'
          )
        }
      })
    }
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  // AG Grid Columns Definition
  const columnDefs = useMemo<ColDef<PaymentMethodListItem>[]>(() => [
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
      headerName: 'Payment Method Name',
      field: 'head_name',
      flex: 1,
      hide: !visibleCols.name,
      cellClass: 'font-medium text-gray-900 flex items-center',
    },
    {
      headerName: 'Actions',
      width: 120,
      pinned: 'right',
      hide: !visibleCols.action || !hasAnyPermission(['edit_payment_method', 'delete_payment_method']),
      cellClass: 'flex items-center justify-center gap-1.5',
      cellRenderer: (params: any) => {
        const id = params.data.id
        return (
          <div className="flex items-center gap-1.5 h-full">
            <PermissionGuard permission="edit_payment_method">
              <button
                onClick={() => handleEdit(id)}
                className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/edit"
                title="Edit Payment Method"
              >
                <Edit className="h-4 w-4" />
              </button>
            </PermissionGuard>

            <PermissionGuard permission="delete_payment_method">
              <button
                onClick={() => handleDeleteClick(id)}
                className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/del"
                title="Delete Payment Method"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </PermissionGuard>
          </div>
        )
      }
    }
  ], [currentPage, pageSize, visibleCols, hasAnyPermission])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Payment Method Name', field: 'name', visible: visibleCols.name },
    { name: 'Action', field: 'action', visible: visibleCols.action }
  ]

  const totalPages = Math.ceil((datatableResponse?.recordsFiltered ?? 0) / pageSize)

  const navOptions = [
    { name: 'Chart of Accounts', to: '/account/chart-of-accounts' },
    { name: 'Account Sub Type', to: '/account/sub-type' },
    { name: 'Sub Account Manage', to: '/account/sub-account' },
    { name: 'Predefined Accounts', to: '/account/predefined-accounts' },
    { name: 'Financial Year Manage', to: '/account/financial-year' },
    { name: 'Opening Balance', to: '/account/opening-balance' },
    { name: 'Debit Voucher', to: '/account/voucher/debit' },
    { name: 'Credit Voucher', to: '/account/voucher/credit' },
    { name: 'Contra Voucher', to: '/account/voucher/contra' },
    { name: 'Journal Voucher', to: '/account/voucher/journal' },
    { name: 'Bank Reconciliation', to: '/account/bank-reconciliation' },
    { name: 'Payment Method', to: '/account/payment-method' },
    { name: 'Vendor Payment', to: '/account/vendor-payment' },
    { name: 'Merchant Receive', to: '/account/merchant-receive' },
    { name: 'Service Payment', to: '/account/service-payment' },
    { name: 'Cash Adjustment', to: '/account/cash-adjustment' },
    { name: 'Voucher Approval', to: '/account/voucher-approval' },
  ]

  const tabs = [
    { name: 'Accounts', to: '/account/chart-of-accounts', active: true },
    { name: 'Report', to: '/account/reports', active: false },
    { name: 'EIN', to: '/account/ein', active: false },
  ]

  return (
    <>
      <ListPageLayout<any>
        title="Payment Method"
        titleOptions={navOptions}
        tabs={tabs}
        backTo="/account/chart-of-accounts"
        onCreate={handleAdd}
        createPermission="create_payment_method"
        showSearch={true}
        searchValue={search}
        onSearchChange={(val) => { setSearch(val); setCurrentPage(1); }}
        // Column Filter
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
        toolbarRightExtra={<></>}
        // AG Grid Props
        rowData={datatableResponse?.data || []}
        columnDefs={columnDefs}
        isLoading={isLoading}
        // Pagination
        recordsTotal={datatableResponse?.recordsFiltered || 0}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
      />

      <PaymentMethodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editId={selectedEditId}
      />

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Payment Method?"
        message="Are you sure you want to remove this payment method? This action cannot be undone."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
