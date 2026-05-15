import { useMemo, useState, useCallback } from 'react'
import { useInvoicePaymentsDatatable, useUpdateConfirmStatus } from '../hooks/useSales'
import type { ColDef } from 'ag-grid-community'
import type { InvoicePaymentListItem } from '../api/sales.api'
import { clsx } from 'clsx'
import { ListPageLayout, type NavTab } from '@/components/ListPageLayout/Listpagelayout'
import { useUiStore } from '@/store/useUiStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { exportToExcel } from '@/utils/exportUtils'
import { useUsers } from '@/hooks/useUsers'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { Select2 } from '@/components/Select/Select2'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'

const tabs: NavTab[] = [
  { name: 'Manage Sale',          to: '/inventory/sales' },
  { name: 'Manage Sales Payment', to: '/inventory/sales/payments', active: true },
  { name: 'Manage Sales Terms',   to: '/inventory/terms' },
  { name: 'Manage Contact Us',    to: '/inventory/contact-us' },
]

export const InvoicePaymentListPage = () => {
  const [searchTerm, setSearchTerm]     = useState('')
  const [status, setStatus]             = useState('')
  const [approvedBy, setApprovedBy]     = useState('')
  const [fromDate, setFromDate]         = useState('')
  const [toDate, setToDate]             = useState('')
  const [currentPage, setCurrentPage]   = useState(1)
  const [pageSize, setPageSize]         = useState(10)
  const [gridApi, setGridApi]           = useState<any>(null)
  
  // Confirmation state
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false)
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ uuid: string; value: number } | null>(null)

  const { currency, currencyPosition } = useSettings()
  const { data: usersResponse } = useUsers()
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateConfirmStatus()

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    date: true,
    paymentRef: true,
    transactionRef: true,
    approvedBy: true,
    invoiceNo: true,
    merchantName: true,
    totalAmount: true,
    paidAmount: true,
    dueAmount: true,
    status: true,
    updateStatus: true,
  })

  const params = useMemo(() => ({
    draw:   1,
    start:  (currentPage - 1) * pageSize,
    length: pageSize,
    search: { value: searchTerm, regex: false },
    status,
    approved_by: approvedBy,
    start_date: fromDate,
    end_date: toDate
  }), [searchTerm, status, approvedBy, fromDate, toDate, currentPage, pageSize])

  const { data: paymentsData, isLoading } = useInvoicePaymentsDatatable(params)

  const handleStatusChange = useCallback((uuid: string, value: number) => {
    setPendingStatusUpdate({ uuid, value })
    setIsStatusConfirmOpen(true)
  }, [])

  const confirmStatusUpdate = () => {
    if (pendingStatusUpdate) {
      updateStatus(pendingStatusUpdate, {
        onSuccess: () => {
          setIsStatusConfirmOpen(false)
          setPendingStatusUpdate(null)
        }
      })
    }
  }
  
  const handleExport = () => {
    if (!paymentsData?.data) return

    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'Date', key: 'invoice_date', width: 15 },
      { header: 'Payment Ref', key: 'payment_ref', width: 20 },
      { header: 'Transaction Ref', key: 'transaction_ref', width: 20 },
      { header: 'Approved By', key: 'approved_by', width: 20 },
      { header: 'Invoice No', key: 'invoice_id', width: 15 },
      { header: 'Merchant Name', key: 'customer_name', width: 30 },
      { header: 'Total Amount', key: 'total_amount', width: 15 },
      { header: 'Paid Amount', key: 'paid_amount', width: 15 },
      { header: 'Due Amount', key: 'due_amount', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ]

    const exportData = paymentsData.data.map((item, index) => ({
      sl: index + 1,
      invoice_date: item.invoice_date ? new Date(item.invoice_date) : '',
      payment_ref: item.payment_ref,
      transaction_ref: item.transaction_ref.replace(/<[^>]*>?/gm, ''), // Strip HTML
      approved_by: item.approved_by,
      invoice_id: item.invoice_id,
      customer_name: item.customer_name,
      total_amount: item.total_amount,
      paid_amount: item.paid_amount,
      due_amount: item.due_amount,
      status_text: item.status.replace(/<[^>]*>?/gm, ''), // Strip HTML
    }))

    exportToExcel(exportData, exportColumns, 'invoice-payments')
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const totalPages = Math.ceil((paymentsData?.recordsFiltered ?? 0) / pageSize)

  const columnDefs = useMemo<ColDef<InvoicePaymentListItem>[]>(() => [
    {
      headerName: 'SL',
      valueGetter: (params) => {
        return (currentPage - 1) * pageSize + (params.node?.rowIndex ?? 0) + 1
      },
      width: 80,
      flex: 0,
      pinned: 'left',
      hide: !visibleCols.sl,
      cellClass: 'text-gray-400 font-medium border-r border-gray-50 flex items-center justify-center',
    },
    {
      headerName: 'DATE',
      field: 'invoice_date',
      width: 130,
      flex: 0,
      hide: !visibleCols.date,
      cellClass: 'text-[#475569] font-medium',
    },
    {
      headerName: 'PAYMENT REF',
      field: 'payment_ref',
      width: 140,
      flex: 0,
      hide: !visibleCols.paymentRef,
      cellClass: 'text-[#64748b] font-normal',
    },
    {
      headerName: 'TRANSACTION REF',
      field: 'transaction_ref',
      width: 180,
      flex: 1,
      hide: !visibleCols.transactionRef,
      cellRenderer: (params: any) => {
        // Backend returns HTML link. We extract text and style it.
        const text = params.value.replace(/<[^>]*>?/gm, '')
        return (
          <span className="text-[#1e4ba1] font-bold hover:underline cursor-pointer">
            {text}
          </span>
        )
      }
    },
    {
      headerName: 'APPROVED BY',
      field: 'approved_by',
      width: 140,
      flex: 0,
      hide: !visibleCols.approvedBy,
      cellClass: 'text-[#64748b] font-medium',
    },
    {
      headerName: 'INVOICE NO',
      field: 'invoice_id',
      width: 120,
      flex: 0,
      hide: !visibleCols.invoiceNo,
      cellRenderer: (params: any) => (
        <span className="text-[#1e4ba1] font-bold">
          #{params.value}
        </span>
      )
    },
    {
      headerName: 'MERCHANT NAME',
      field: 'customer_name',
      flex: 1.5,
      hide: !visibleCols.merchantName,
      cellClass: 'text-[#475569] font-medium',
    },
    {
      headerName: 'TOTAL AMOUNT',
      field: 'total_amount',
      width: 140,
      flex: 0,
      hide: !visibleCols.totalAmount,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      cellClass: 'font-bold text-[#1e293b]',
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition)
    },
    {
      headerName: 'PAID AMOUNT',
      field: 'paid_amount',
      width: 140,
      flex: 0,
      hide: !visibleCols.paidAmount,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      cellClass: 'font-bold text-[#1e4ba1]',
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition)
    },
    {
      headerName: 'DUE AMOUNT',
      field: 'due_amount',
      width: 140,
      flex: 0,
      hide: !visibleCols.dueAmount,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      cellClass: 'font-bold text-rose-500',
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition)
    },
    {
      headerName: 'STATUS',
      field: 'status_value',
      width: 140,
      flex: 0,
      hide: !visibleCols.status,
      cellRenderer: (params: any) => {
        const val = params.value
        let label = 'N/A'
        let colorClass = 'bg-gray-100 text-gray-500'

        if (val === 1) {
          label = 'Approved'
          colorClass = 'bg-[#dcfce7] text-[#166534]'
        } else if (val === 2) {
          label = 'Pending'
          colorClass = 'bg-[#fef9c3] text-[#854d0e]'
        } else if (val === 0) {
          label = 'Unapproved'
          colorClass = 'bg-[#fee2e2] text-[#991b1b]'
        }

        return (
          <span className={clsx(
            'px-3 py-1 rounded-full text-[11px] font-bold tracking-tight uppercase',
            colorClass
          )}>
            {label}
          </span>
        )
      }
    },
    {
      headerName: 'UPDATE STATUS',
      field: 'uuid',
      width: 160,
      flex: 0,
      pinned: 'right',
      hide: !visibleCols.updateStatus,
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-center h-full px-2 py-1">
          <PermissionGuard permission="edit-payments">
            <Select2
              options={[
                { value: 2, label: 'Pending' },
                { value: 1, label: 'Approved' },
                { value: 0, label: 'Unapproved' }
              ]}
              value={params.data.status_value}
              onChange={(val) => handleStatusChange(params.value, Number(val))}
              isDisabled={params.data.status_value === 1}
              size="sm"
              className="w-full font-bold min-w-[120px]"
              menuPortalTarget={document.body}
              styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
            />
          </PermissionGuard>
        </div>
      )
    },
  ], [visibleCols, currency, currencyPosition, currentPage, pageSize, handleStatusChange])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Payment Ref', field: 'paymentRef', visible: visibleCols.paymentRef },
    { name: 'Transaction Ref', field: 'transactionRef', visible: visibleCols.transactionRef },
    { name: 'Approved By', field: 'approvedBy', visible: visibleCols.approvedBy },
    { name: 'Invoice No', field: 'invoiceNo', visible: visibleCols.invoiceNo },
    { name: 'Merchant Name', field: 'merchantName', visible: visibleCols.merchantName },
    { name: 'Total Amount', field: 'totalAmount', visible: visibleCols.totalAmount },
    { name: 'Paid Amount', field: 'paidAmount', visible: visibleCols.paidAmount },
    { name: 'Due Amount', field: 'dueAmount', visible: visibleCols.dueAmount },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Update Status', field: 'updateStatus', visible: visibleCols.updateStatus },
  ]

  const statusOptions = [
    { label: 'Approved', value: '1' },
    { label: 'Pending', value: '2' },
    { label: 'Unapproved', value: '0' },
  ]

  const userOptions = useMemo(() => {
    return usersResponse?.data.map(user => ({
      label: `${user.first_name} ${user.last_name}`,
      value: String(user.id)
    })) || []
  }, [usersResponse])

  const toolbarExtra = (
    <div className="relative shrink-0 min-w-[160px] z-50">
      <Select2
        options={userOptions}
        value={approvedBy}
        onChange={(val) => { setApprovedBy(val); setCurrentPage(1) }}
        placeholder="Approved By"
        rounded="full"
        variant="solid"
      />
    </div>
  )

  return (
    <>
      <ListPageLayout<InvoicePaymentListItem>
        title="Invoice Payment List"
        backTo="/inventory/sales"
        tabs={tabs}
        createPermission="create-payments"
        showStatusFilter={true}
        statusValue={status}
        onStatusChange={(val) => { setStatus(val); setCurrentPage(1) }}
        statusOptions={statusOptions}
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={(from, to) => { setFromDate(from); setToDate(to); setCurrentPage(1) }}
        onExport={handleExport}
        toolbarExtra={toolbarExtra}
        rowData={paymentsData?.data}
        columnDefs={columnDefs}
        isLoading={isLoading}
        recordsTotal={paymentsData?.recordsFiltered ?? 0}
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

      <ConfirmationModal
        isOpen={isStatusConfirmOpen}
        onClose={() => {
          setIsStatusConfirmOpen(false)
          setPendingStatusUpdate(null)
        }}
        onConfirm={confirmStatusUpdate}
        title="Update Payment Status?"
        message="Are you sure you want to change the status of this payment? This may trigger accounting vouchers if approved."
        confirmText="Yes, Update"
        isLoading={isUpdating}
      />
    </>
  )
}
