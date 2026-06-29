import { useMemo, useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import type { ColDef } from 'ag-grid-community'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { Select2 } from '@/components/Select/Select2'
import { DateRangePicker } from '@/components/DateRangePicker/DateRangePicker'
import { clsx } from 'clsx'
import { 
  useFinancialYearsDatatable, 
  useDeleteFinancialYear, 
  useToggleFinancialYearStatus 
} from '../../hooks/useFinancialYear'
import type { FinancialYearListItem } from '../../api/financial-year.api'
import { FinancialYearModal } from '../../components/FinancialYearModal'

export const FinancialYearPage = () => {
  // Pagination & Search States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')

  // Custom Filter States
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEditId, setSelectedEditId] = useState<number | null>(null)

  // Delete States
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [idToDelete, setIdToDelete] = useState<number | null>(null)

  // Status Toggle States
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false)
  const [statusYearId, setStatusYearId] = useState<number | null>(null)
  const [statusYearLabel, setStatusYearLabel] = useState<'Open' | 'Close'>('Close')

  // Fetch data (we request a larger length to handle advanced client-side filters cleanly in React)
  const params = useMemo(() => ({
    draw: 1,
    start: 0,
    length: 1000,
    search: { value: search }
  }), [search])

  const { data: rawDataResponse, isLoading } = useFinancialYearsDatatable(params)
  const { mutate: deleteYear, isPending: isDeleting } = useDeleteFinancialYear()
  const { mutate: toggleStatus, isPending: isToggling } = useToggleFinancialYearStatus()
  const [togglingId, setTogglingId] = useState<number | null>(null)

  // ── 1. Advanced Client-Side Filtering & Search Synchronization ──
  const filteredRowData = useMemo(() => {
    let rows = rawDataResponse?.data || []

    // Filter by Year
    if (selectedYear) {
      rows = rows.filter(r => String(r.year) === selectedYear)
    }

    // Filter by Status (Active/Inactive)
    if (selectedStatus) {
      rows = rows.filter(r => r.status === selectedStatus)
    }

    // Filter by Date Range (Overlapping Interval Formula)
    if (dateRange.start && dateRange.end) {
      rows = rows.filter(r => r.start_date <= dateRange.end && r.end_date >= dateRange.start)
    }

    return rows
  }, [rawDataResponse, selectedYear, selectedStatus, dateRange])

  // Extract unique years dynamically from fetched data for the filter dropdown
  const dynamicYearOptions = useMemo(() => {
    const years = rawDataResponse?.data?.map(item => String(item.year)) ?? []
    const uniqueYears = Array.from(new Set(years)).sort((a, b) => b.localeCompare(a))
    return [
      { value: '', label: 'Year' },
      ...uniqueYears.map(y => ({ value: y, label: y }))
    ]
  }, [rawDataResponse])

  // Paginated chunk to display in AG Grid
  const displayRowData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredRowData.slice(startIndex, startIndex + pageSize)
  }, [filteredRowData, currentPage, pageSize])

  const totalPages = Math.ceil(filteredRowData.length / pageSize)

  // ── 2. CRUD Event Handlers ──
  const handleAdd = () => {
    setSelectedEditId(null)
    setIsModalOpen(true)
  }

  const handleEdit = (id: number) => {
    setSelectedEditId(id)
    setIsModalOpen(true)
  }

  const handleStatusToggleClick = (id: number, currentStatus: string) => {
    setStatusYearId(id)
    setStatusYearLabel(currentStatus === 'Active' ? 'Close' : 'Open')
    setIsStatusConfirmOpen(true)
  }

  const handleConfirmStatusToggle = () => {
    if (statusYearId) {
      setTogglingId(statusYearId)
      toggleStatus(statusYearId, {
        onSuccess: () => {
          setTogglingId(null)
          setIsStatusConfirmOpen(false)
          setStatusYearId(null)
        },
        onError: () => {
          setTogglingId(null)
          setIsStatusConfirmOpen(false)
          setStatusYearId(null)
        }
      })
    }
  }

  const handleDeleteClick = (id: number) => {
    setIdToDelete(id)
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (idToDelete) {
      deleteYear(idToDelete, {
        onSuccess: () => {
          setIsDeleteConfirmOpen(false)
          setIdToDelete(null)
        }
      })
    }
  }

  // ── 3. AG Grid Columns Definition ──
  const columnDefs = useMemo<ColDef<FinancialYearListItem>[]>(() => [
    {
      headerName: 'SL',
      valueGetter: (params) => {
        const index = params.node?.rowIndex ?? 0
        return (currentPage - 1) * pageSize + index + 1
      },
      width: 80,
      pinned: 'left',
      cellClass: 'text-gray-400 font-medium border-r border-primary/10 flex items-center justify-center font-poppins',
    },
    {
      headerName: 'YEAR',
      field: 'year',
      minWidth: 150,
      flex: 1,
      cellClass: 'font-semibold text-gray-900 flex items-center font-poppins',
    },
    {
      headerName: 'START DATE',
      field: 'start_date',
      width: 180,
      cellClass: 'text-gray-600 flex items-center font-poppins',
    },
    {
      headerName: 'END DATE',
      field: 'end_date',
      width: 180,
      cellClass: 'text-gray-600 flex items-center font-poppins',
    },
    {
      headerName: 'STATUS',
      field: 'status',
      width: 200,
      cellRenderer: (params: any) => {
        const isActive = params.value === 'Active'
        const isProcessing = isToggling && togglingId === params.data.id

        return (
          <div className="flex items-center gap-3 h-full">
            <PermissionGuard permission="edit_financial_year">
              <button
                onClick={() => handleStatusToggleClick(params.data.id, params.data.status)}
                disabled={isProcessing}
                className={clsx(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none shrink-0 cursor-pointer",
                  isActive ? "bg-[#1e3a5f]" : "bg-gray-200",
                  isProcessing && "opacity-50 cursor-not-allowed"
                )}
              >
                <span
                  className={clsx(
                    "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition duration-200 ease-in-out shadow-sm",
                    isActive ? "translate-x-4.5" : "translate-x-0.5"
                  )}
                />
              </button>
            </PermissionGuard>
            <span className={clsx("text-[13px] font-medium font-poppins", isActive ? "text-[#1e3a5f]" : "text-gray-400")}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        )
      }
    },
    {
      headerName: 'ACTION',
      width: 120,
      pinned: 'right',
      cellClass: 'flex items-center justify-center gap-1.5',
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-1.5 h-full">
          <PermissionGuard permission="edit_financial_year">
            <button
              onClick={() => handleEdit(params.data.id)}
              className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/edit"
              title="Edit Year"
            >
              <Edit className="h-4 w-4" />
            </button>
          </PermissionGuard>

          <PermissionGuard permission="delete_financial_year">
            <button
              onClick={() => handleDeleteClick(params.data.id)}
              className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/del"
              title="Delete Year"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </PermissionGuard>
        </div>
      ),
    }
  ], [currentPage, pageSize, isToggling, togglingId])

  // ── 4. Dropdown Filter Options ──
  const statusOptions = [
    { value: '', label: 'Status' },
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' }
  ]

  // Custom Toolbar Filter Controls
  const customFilters = (
    <div className="flex items-center gap-3">
      <div className="w-[120px]">
        <Select2
          options={dynamicYearOptions}
          value={selectedYear}
          onChange={(val) => { setSelectedYear(val || ''); setCurrentPage(1) }}
          rounded="full"
          variant="solid"
          placeholder="Year"
        />
      </div>
      <div className="w-[120px]">
        <Select2
          options={statusOptions}
          value={selectedStatus}
          onChange={(val) => { setSelectedStatus(val || ''); setCurrentPage(1) }}
          rounded="full"
          variant="solid"
          placeholder="Status"
        />
      </div>
    </div>
  )

  const customToolbarRight = (
    <DateRangePicker
      from={dateRange.start}
      to={dateRange.end}
      onChange={(start, end) => { setDateRange({ start, end }); setCurrentPage(1) }}
    />
  )

  const tabs = [
    { name: 'Accounts', to: '/account/chart-of-accounts', active: true },
    { name: 'Report', to: '/account/reports', active: false },
    { name: 'EIN', to: '/account/ein', active: false },
  ]

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

  return (
    <>
      <ListPageLayout<any>
        title="Financial Year Manage"
        titleOptions={navOptions}
        tabs={tabs}
        backTo="/account/chart-of-accounts"
        onCreate={handleAdd}
        createPermission="create_financial_year"
        addLabel="Add"
        showSearch={true}
        searchValue={search}
        onSearchChange={(val) => { setSearch(val); setCurrentPage(1) }}
        isLoading={isLoading}
        // AG Grid Table Props
        rowData={displayRowData}
        columnDefs={columnDefs}
        // Pagination Meta
        recordsTotal={filteredRowData.length}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
        // Filters
        showStatusFilter={false}
        showColumnFilter={false}
        toolbarExtra={customFilters}
        toolbarRightExtra={customToolbarRight}
      />

      {/* Create / Edit Modal */}
      <FinancialYearModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editId={selectedEditId}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Financial Year?"
        message="Are you sure you want to delete this financial year? This action cannot be undone."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />

      {/* Status Toggle Confirmation Modal */}
      <ConfirmationModal
        isOpen={isStatusConfirmOpen}
        onClose={() => setIsStatusConfirmOpen(false)}
        onConfirm={handleConfirmStatusToggle}
        title={statusYearLabel === 'Close' ? 'Close Financial Year?' : 'Open Financial Year?'}
        message={`Are you sure you want to ${statusYearLabel.toLowerCase()} this financial year?`}
        confirmText="Yes"
        isLoading={isToggling}
      />
    </>
  )
}
