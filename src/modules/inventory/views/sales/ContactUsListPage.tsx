import { useMemo, useState } from 'react'
import { Mail } from 'lucide-react'
import { useContactUsDatatable } from '../../hooks/useContactUs'
import type { ColDef } from 'ag-grid-community'
import type { ContactUsListItem } from '../../api/contactUs.api'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { exportToExcel } from '@/utils/exportUtils'
import { useNavigate } from '@tanstack/react-router'
import { clsx } from 'clsx'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'

const tabs = [
  { name: 'Manage Sale', to: '/inventory/sales' },
  { name: 'Manage Sales Payment', to: '/inventory/sales/payments' },
  { name: 'Manage Sales Terms',   to: '/inventory/sales/terms' },
  { name: 'Manage Contact Us',    to: '/inventory/sales/contact-us', active: true },
]

export const ContactUsListPage = () => {
  const [searchTerm, setSearchTerm]   = useState('')
  const [fromDate, setFromDate]       = useState('')
  const [toDate, setToDate]           = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize]       = useState(10)
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    date: true,
    name: true,
    email: true,
    phone: true,
    subject: true,
    status: true,
    action: true
  })

  const params = useMemo(() => ({
    draw:   1,
    start:  (currentPage - 1) * pageSize,
    length: pageSize,
    search: { value: searchTerm, regex: false },
    start_date: fromDate,
    end_date: toDate
  }), [searchTerm, fromDate, toDate, currentPage, pageSize])

  const { data: contactData, isLoading } = useContactUsDatatable(params)
  
  const handleView = (id: number) => {
    navigate({ to: `/inventory/contact-us/reply/${id}` })
  }

  const handleExport = () => {
    if (!contactData?.data) return

    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'Date', key: 'created_at', width: 20 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Subject', key: 'subject', width: 40 },
      { header: 'Status', key: 'status', width: 15 },
    ]

    const exportData = contactData.data.map((item, index) => ({
      sl: index + 1,
      created_at: item.created_at ? new Date(item.created_at) : '',
      name: item.name,
      email: item.email,
      phone: item.phone,
      subject: item.subject,
      status: (item as any).status || 'Pending',
    }))

    exportToExcel(exportData, exportColumns, 'contact-us-messages')
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const totalPages = Math.ceil((contactData?.recordsFiltered ?? 0) / pageSize)

  const columnDefs = useMemo<ColDef<ContactUsListItem>[]>(() => [
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
      headerName: 'NAME',
      field: 'name',
      width: 180,
      flex: 1,
      hide: !visibleCols.name,
      cellClass: 'text-[#475569] font-medium',
    },
    {
      headerName: 'EMAIL',
      field: 'email',
      width: 220,
      flex: 1,
      hide: !visibleCols.email,
      cellClass: 'text-[#475569] font-normal',
    },
    {
      headerName: 'PHONE',
      field: 'phone',
      width: 160,
      flex: 0,
      hide: !visibleCols.phone,
      cellClass: 'text-[#475569] font-normal',
    },
    {
      headerName: 'SUBJECT',
      field: 'subject',
      flex: 1.5,
      hide: !visibleCols.subject,
      cellRenderer: (params: any) => (
        <div className="line-clamp-1 text-[#475569] font-normal" title={params.value}>
          {params.value}
        </div>
      ),
    },
    {
      headerName: 'STATUS',
      field: 'status' as any,
      width: 120,
      flex: 0,
      hide: !visibleCols.status,
      cellRenderer: (params: any) => {
        const status = params.value || 'Pending'
        const isReplied = status === 'Replied'
        return (
          <span className={clsx(
            'px-3 py-1 rounded-full text-[11px] font-medium tracking-tight uppercase',
            isReplied ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fef9c3] text-[#854d0e]'
          )}>
            {status}
          </span>
        )
      }
    },
    {
      headerName: 'ACTION',
      field: 'id',
      width: 100,
      flex: 0,
      sortable: false,
      filter: false,
      pinned: 'right',
      hide: !visibleCols.action || !hasPermission('view_sales'),
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-center gap-1.5 h-full">
          <PermissionGuard permission="view_sales">
            <button
              onClick={() => handleView(params.data.id)}
              className="p-2 hover:bg-blue-50 text-primary rounded-xl transition-all border border-transparent hover:border-blue-100 hover:scale-110 group/view"
              title="View & Reply"
            >
              <Mail className="h-4 w-4" />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ], [visibleCols, currentPage, pageSize, hasPermission])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Name', field: 'name', visible: visibleCols.name },
    { name: 'Email', field: 'email', visible: visibleCols.email },
    { name: 'Phone', field: 'phone', visible: visibleCols.phone },
    { name: 'Subject', field: 'subject', visible: visibleCols.subject },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  return (
    <>
      <ListPageLayout<ContactUsListItem>
        title="Manage Contact Us"
        backTo="/inventory/sales"
        tabs={tabs}
        createPermission="view_sales"
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={(from, to) => { setFromDate(from); setToDate(to); setCurrentPage(1) }}
        onExport={handleExport}
        rowData={contactData?.data}
        columnDefs={columnDefs}
        isLoading={isLoading}
        recordsTotal={contactData?.recordsFiltered ?? 0}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
        searchValue={searchTerm}
        onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1) }}
        gridOptions={{
          onGridReady: () => {}
        }}
      />
    </>
  )
}
