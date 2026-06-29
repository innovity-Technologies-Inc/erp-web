import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Edit2, Trash2 } from 'lucide-react'
import type { ColDef } from 'ag-grid-community'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { Select2 } from '@/components/Select/Select2'
import { DateRangePicker } from '@/components/DateRangePicker/DateRangePicker'
import { formatCurrency } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { useOpeningBalancesDatatable, useDeleteOpeningBalance } from '../../hooks/useOpeningBalance'
import type { OpeningBalanceListItem } from '../../api/opening-balance.api'

export const OpeningBalanceListPage = () => {
  const navigate = useNavigate()
  const { currency, currencyPosition } = useSettings()

  // Pagination & Search States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')

  // Custom Filter States
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('')
  const [selectedSubType, setSelectedSubType] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  // Delete States
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<{ uuid: string; id: number } | null>(null)

  // Fetch data
  const params = useMemo(() => ({
    draw: 1,
    start: 0,
    length: 1000,
    search: { value: search }
  }), [search])

  const { data: rawDataResponse, isLoading } = useOpeningBalancesDatatable(params)
  const { mutate: deleteRecord, isPending: isDeleting } = useDeleteOpeningBalance()

  // ── 1. Client-Side Filtering & Search Synchronization ──
  const filteredRowData = useMemo(() => {
    let rows = rawDataResponse?.data || []

    // Filter by Year
    if (selectedYear) {
      rows = rows.filter(r => String(r.year) === selectedYear)
    }

    // Filter by Account
    if (selectedAccount) {
      rows = rows.filter(r => r.account_name === selectedAccount)
    }

    // Filter by Sub Type
    if (selectedSubType) {
      rows = rows.filter(r => r.sub_type_name === selectedSubType)
    }

    // Filter by Date Range
    if (dateRange.start && dateRange.end) {
      rows = rows.filter(r => r.open_date >= dateRange.start && r.open_date <= dateRange.end)
    }

    return rows
  }, [rawDataResponse, selectedYear, selectedAccount, selectedSubType, dateRange])

  // Extract unique options dynamically from fetched data for the filter dropdowns
  const dynamicYearOptions = useMemo(() => {
    const years = rawDataResponse?.data?.map(item => String(item.year)) ?? []
    const uniqueYears = Array.from(new Set(years)).sort((a, b) => b.localeCompare(a))
    return [
      { value: '', label: 'Year' },
      ...uniqueYears.map(y => ({ value: y, label: y }))
    ]
  }, [rawDataResponse])

  const dynamicAccountOptions = useMemo(() => {
    const names = rawDataResponse?.data?.map(item => item.account_name) ?? []
    const uniqueNames = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b))
    return [
      { value: '', label: 'Account' },
      ...uniqueNames.map(name => ({ value: name, label: name }))
    ]
  }, [rawDataResponse])

  const dynamicSubTypeOptions = useMemo(() => {
    const names = rawDataResponse?.data?.map(item => item.sub_type_name).filter(Boolean) as string[] ?? []
    const uniqueNames = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b))
    return [
      { value: '', label: 'Sub Type' },
      ...uniqueNames.map(name => ({ value: name, label: name }))
    ]
  }, [rawDataResponse])

  // Paginated chunk to display in AG Grid
  const displayRowData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredRowData.slice(startIndex, startIndex + pageSize)
  }, [filteredRowData, currentPage, pageSize])

  const totalPages = Math.ceil(filteredRowData.length / pageSize)

  // ── 2. CRUD Event Handlers ──
  const handleCreate = () => {
    navigate({ to: '/account/opening-balance/create' })
  }

  const handleEdit = (uuid: string) => {
    navigate({ to: `/account/opening-balance/edit/${uuid}` })
  }

  const handleDeleteClick = (uuid: string, id: number) => {
    setRecordToDelete({ uuid, id })
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (recordToDelete) {
      deleteRecord(recordToDelete, {
        onSuccess: () => {
          setIsDeleteConfirmOpen(false)
          setRecordToDelete(null)
        }
      })
    }
  }

  // ── 3. AG Grid Columns Definition ──
  const columnDefs = useMemo<ColDef<OpeningBalanceListItem>[]>(() => [
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
      width: 120,
      cellClass: 'font-medium text-gray-600 flex items-center justify-center font-poppins',
    },
    {
      headerName: 'DATE',
      field: 'open_date',
      width: 150,
      cellClass: 'text-gray-600 flex items-center justify-center font-poppins',
    },
    {
      headerName: 'ACCOUNT NAME',
      field: 'account_name',
      minWidth: 200,
      flex: 1.5,
      cellClass: 'font-semibold text-gray-900 flex items-center font-poppins',
    },
    {
      headerName: 'SUB TYPE',
      field: 'sub_type_name',
      minWidth: 150,
      flex: 1,
      cellClass: 'text-gray-600 flex items-center font-poppins',
      valueFormatter: (params) => params.value || '-',
    },
    {
      headerName: 'DEBIT',
      field: 'debit',
      width: 150,
      cellClass: 'text-right font-semibold text-gray-900 flex items-center justify-end pr-4 font-poppins',
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition),
    },
    {
      headerName: 'CREDIT',
      field: 'credit',
      width: 150,
      cellClass: 'text-right font-semibold text-gray-900 flex items-center justify-end pr-4 font-poppins',
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition),
    },
    {
      headerName: 'ACTION',
      width: 120,
      pinned: 'right',
      cellClass: 'flex items-center justify-center gap-1.5',
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-1.5 h-full">
          <PermissionGuard permission="edit_opening_balance">
            <button
              onClick={() => handleEdit(params.data.uuid)}
              className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110"
              title="Edit Record"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          </PermissionGuard>

          <PermissionGuard permission="delete_opening_balance">
            <button
              onClick={() => handleDeleteClick(params.data.uuid, params.data.id)}
              className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110"
              title="Delete Record"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </PermissionGuard>
        </div>
      ),
    }
  ], [currentPage, pageSize, currency, currencyPosition])

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
      <div className="w-[200px]">
        <Select2
          options={dynamicAccountOptions}
          value={selectedAccount}
          onChange={(val) => { setSelectedAccount(val || ''); setCurrentPage(1) }}
          rounded="full"
          variant="solid"
          placeholder="Account"
        />
      </div>
      <div className="w-[180px]">
        <Select2
          options={dynamicSubTypeOptions}
          value={selectedSubType}
          onChange={(val) => { setSelectedSubType(val || ''); setCurrentPage(1) }}
          rounded="full"
          variant="solid"
          placeholder="Sub Type"
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
        title="Opening Balance"
        titleOptions={navOptions}
        tabs={tabs}
        backTo="/account/chart-of-accounts"
        onCreate={handleCreate}
        createPermission="create_opening_balance"
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Opening Balance?"
        message="Are you sure you want to delete this opening balance record? This action cannot be undone."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
