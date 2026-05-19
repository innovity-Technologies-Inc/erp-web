import { useMemo, useState } from 'react'
import { Edit, Trash2, Eye } from 'lucide-react'
import { useTermsDatatable, useDeleteTerm } from '../../hooks/useTerms'
import type { ColDef } from 'ag-grid-community'
import type { TermListItem } from '../../api/terms.api'
import { TermModal } from '../../components/TermModal'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { clsx } from 'clsx'
import { ListPageLayout, type NavTab } from '@/components/ListPageLayout/Listpagelayout'
import type { TermFormValues } from '../../hooks/validation'
import { useUiStore } from '@/store/useUiStore'
import { exportToExcel } from '@/utils/exportUtils'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'

const tabs = [
  { name: 'Manage Sale', to: '/inventory/sales' },
  { name: 'Manage Sales Payment', to: '/inventory/sales/payments' },
  { name: 'Manage Sales Terms',   to: '/inventory/sales/terms', active: true },
  { name: 'Manage Contact Us',    to: '/inventory/sales/contact-us' },
]

export const TermsListPage = () => {
  const [searchTerm, setSearchTerm]   = useState('')
  const [status, setStatus]           = useState('')
  const [fromDate, setFromDate]       = useState('')
  const [toDate, setToDate]           = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null)
  const [selectedTermData, setSelectedTermData] = useState<TermFormValues | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize]       = useState(10)
  const [gridApi, setGridApi]         = useState<any>(null)
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    date: true,
    description: true,
    status: true,
    action: true
  })

  const params = useMemo(() => ({
    draw:   1,
    start:  (currentPage - 1) * pageSize,
    length: pageSize,
    search: { value: searchTerm, regex: false },
    status,
    start_date: fromDate,
    end_date: toDate
  }), [searchTerm, status, fromDate, toDate, currentPage, pageSize])

  const { data: termsData, isLoading } = useTermsDatatable(params)
  const { mutate: deleteTerm, isPending: isDeleting } = useDeleteTerm()
  
  const handleEdit = (item: TermListItem) => {
    setSelectedTermId(item.id)
    setSelectedTermData({
      description: item.description,
      status: item.status === 'Active' ? 1 : 0
    })
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setSelectedTermId(null)
    setSelectedTermData(null)
    setIsModalOpen(true)
  }

  const handleDelete = (id: number) => {
    setSelectedTermId(id)
    setIsConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (selectedTermId) {
      deleteTerm(selectedTermId, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setSelectedTermId(null)
          showNotificationModal(
            'Deleted Successfully!',
            'Your sales term and condition has been deleted successfully.',
            'success'
          )
        }
      })
    }
  }

  const handleExport = () => {
    if (!termsData?.data) return

    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'Date', key: 'created_at', width: 20 },
      { header: 'Description', key: 'description', width: 60 },
      { header: 'Status', key: 'status', width: 15 },
    ]

    const exportData = termsData.data.map((item, index) => ({
      sl: index + 1,
      created_at: (item as any).created_at ? new Date((item as any).created_at) : '',
      description: item.description,
      status: item.status,
    }))

    exportToExcel(exportData, exportColumns, 'sales-terms')
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const totalPages = Math.ceil((termsData?.recordsFiltered ?? 0) / pageSize)

  const columnDefs = useMemo<ColDef<TermListItem>[]>(() => [
    {
      headerName: 'SL',
      valueGetter: (params) => {
        return (currentPage - 1) * pageSize + (params.node?.rowIndex ?? 0) + 1
      },
      width: 80,
      flex: 0,
      pinned: 'left',
      hide: !visibleCols.sl,
      cellClass: 'text-gray-400 font-medium border-r border-primary/30 flex items-center justify-center',
    },
    {
      headerName: 'DATE',
      field: 'created_at',
      width: 140,
      flex: 0,
      hide: !visibleCols.date,
      cellClass: 'text-[#475569] font-medium',
    },
    {
      headerName: 'DESCRIPTION',
      field: 'description',
      flex: 1,
      hide: !visibleCols.description,
      cellRenderer: (params: any) => (
        <div className="line-clamp-1  text-[#475569] font-normal" title={params.value}>
          {params.value}
        </div>
      ),
    },
    {
      headerName: 'STATUS',
      field: 'status',
      width: 140,
      flex: 0,
      hide: !visibleCols.status,
      cellRenderer: (params: any) => {
        const status = params.value
        const isActive = status === 'Approved' || status === 'Active'
        return (
          <span className={clsx(
            'px-4 py-1 rounded-full text-[12px] font-medium tracking-tight',
            isActive ? 'bg-[#dbeafe] text-primary' : 'bg-[#f1f5f9] text-[#94a3b8]'
          )}>
            {status}
          </span>
        )
      },
    },
    {
      headerName: 'ACTION',
      field: 'id',
      width: 120,
      flex: 0,
      sortable: false,
      filter: false,
      pinned: 'right',
      hide: !visibleCols.action || !hasAnyPermission(['edit_terms_condition', 'delete_terms_condition']),
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-center gap-1.5 h-full">
          <PermissionGuard permission="edit_terms_condition">
            <button
              onClick={() => handleEdit(params.data)}
              className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/edit"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
          </PermissionGuard>
          <PermissionGuard permission="delete_terms_condition">
            <button
              onClick={() => handleDelete(params.data.id)}
              className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/delete"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ], [visibleCols, currentPage, pageSize, hasAnyPermission])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Description', field: 'description', visible: visibleCols.description },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  return (
    <>
      <ListPageLayout<TermListItem>
        title="Sales Terms & Conditions"
        backTo="/inventory/sales"
        tabs={tabs}
        onCreate={handleAdd}
        createPermission="create_terms_condition"
        showStatusFilter={true}
        statusValue={status}
        onStatusChange={(val) => { setStatus(val); setCurrentPage(1) }}
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={(from, to) => { setFromDate(from); setToDate(to); setCurrentPage(1) }}
        onExport={handleExport}
        rowData={termsData?.data}
        columnDefs={columnDefs}
        isLoading={isLoading}
        recordsTotal={termsData?.recordsFiltered ?? 0}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
        searchValue={searchTerm}
        onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1) }}
        gridOptions={{
          onGridReady: (params) => setGridApi(params.api)
        }}
      />

      <TermModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedTermId(null)
          setSelectedTermData(null)
        }}
        termId={selectedTermId}
        initialData={selectedTermData}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false)
          setSelectedTermId(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Sales Term?"
        message="Are you sure you want to delete this sales term? This action cannot be undone."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
