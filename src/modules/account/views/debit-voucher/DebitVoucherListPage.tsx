import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Edit2, Trash2, Eye, Printer, Loader2 } from 'lucide-react'
import type { ColDef } from 'ag-grid-community'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { Modal } from '@/components/Modal/Modal'
import { DateRangePicker } from '@/components/DateRangePicker/DateRangePicker'
import { formatCurrency } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { 
  useDebitVouchersDatatable, 
  useDeleteDebitVoucher, 
  useDebitVoucherDetails 
} from '../../hooks/useDebitVoucher'
import type { DebitVoucherListItem } from '../../api/debit-voucher.api'

export const DebitVoucherListPage = () => {
  const navigate = useNavigate()
  const { currency, currencyPosition, companyInformation, webSetting } = useSettings()

  // Pagination & Search States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')

  // Filter States
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [selectedStatus, setSelectedStatus] = useState('')

  // Details Modal States
  const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

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

  const { data: rawDataResponse, isLoading } = useDebitVouchersDatatable(params)
  const { mutate: deleteVoucher, isPending: isVoucherDeleting } = useDeleteDebitVoucher()

  // Details Hook
  const { data: voucherDetails, isLoading: isDetailsLoading } = useDebitVoucherDetails(selectedVoucherId)

  // ── Client-Side Filtering ──
  const filteredRowData = useMemo(() => {
    let rows = rawDataResponse?.data || []

    // Filter by Date Range
    if (dateRange.start && dateRange.end) {
      rows = rows.filter(r => r.v_date >= dateRange.start && r.v_date <= dateRange.end)
    }

    // Filter by Status
    if (selectedStatus) {
      const isApprovedValue = selectedStatus === 'Approved' ? 1 : 0
      rows = rows.filter(r => r.is_approved === isApprovedValue)
    }

    return rows
  }, [rawDataResponse, dateRange, selectedStatus])

  // Paginated chunk to display in AG Grid
  const displayRowData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredRowData.slice(startIndex, startIndex + pageSize)
  }, [filteredRowData, currentPage, pageSize])

  const totalPages = Math.ceil(filteredRowData.length / pageSize)

  // ── CRUD Event Handlers ──
  const handleCreate = () => {
    navigate({ to: '/account/voucher/debit/create' })
  }

  const handleEdit = (uuid: string) => {
    navigate({ to: `/account/voucher/debit/edit/${uuid}` })
  }

  const handleDeleteClick = (uuid: string, id: number) => {
    setRecordToDelete({ uuid, id })
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (recordToDelete) {
      deleteVoucher(recordToDelete, {
        onSuccess: () => {
          setIsDeleteConfirmOpen(false)
          setRecordToDelete(null)
        }
      })
    }
  }

  const handleViewDetails = (id: number) => {
    setSelectedVoucherId(id)
    setIsDetailsOpen(true)
  }

  const handlePrint = () => {
    window.print()
  }

  // ── AG Grid Columns Definition ──
  const columnDefs = useMemo<ColDef<DebitVoucherListItem>[]>(() => [
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
      headerName: 'V. NO',
      field: 'v_no',
      width: 150,
      cellClass: 'font-semibold text-gray-900 flex items-center justify-center font-poppins',
    },
    {
      headerName: 'DATE',
      field: 'v_date',
      width: 150,
      cellClass: 'text-gray-600 flex items-center justify-center font-poppins',
    },
    {
      headerName: 'REMARK',
      field: 'narration',
      minWidth: 250,
      flex: 1.5,
      cellClass: 'text-gray-600 flex items-center font-poppins',
      valueFormatter: (params) => params.value || '-',
    },
    {
      headerName: 'TOTAL AMOUNT',
      field: 'debit',
      width: 180,
      cellClass: 'text-right font-semibold text-gray-900 flex items-center justify-end pr-4 font-poppins',
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition),
    },
    {
      headerName: 'STATUS',
      field: 'status',
      width: 130,
      cellClass: 'flex items-center justify-center font-poppins',
      cellRenderer: (params: any) => {
        const isApproved = params.data.is_approved === 1
        return (
          <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
            isApproved 
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
              : 'bg-amber-50 text-amber-600 border border-amber-100'
          }`}>
            {params.value}
          </span>
        )
      }
    },
    {
      headerName: 'ACTION',
      width: 150,
      pinned: 'right',
      cellClass: 'flex items-center justify-center gap-1.5',
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-1.5 h-full">
          <PermissionGuard permission="view_debit_voucher">
            <button
              onClick={() => handleViewDetails(params.data.id)}
              className="p-2 hover:bg-blue-50 text-[#1e4ba1] rounded-xl transition-all border border-transparent hover:border-blue-100 hover:scale-110"
              title="Show Details"
            >
              <Eye className="h-4 w-4" />
            </button>
          </PermissionGuard>

          <PermissionGuard permission="edit_debit_voucher">
            {params.data.is_approved !== 1 && (
              <button
                onClick={() => handleEdit(params.data.uuid)}
                className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110"
                title="Edit Record"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
          </PermissionGuard>

          <PermissionGuard permission="delete_debit_voucher">
            {params.data.is_approved !== 1 && (
              <button
                onClick={() => handleDeleteClick(params.data.uuid, params.data.id)}
                className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110"
                title="Delete Record"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </PermissionGuard>
        </div>
      ),
    }
  ], [currentPage, pageSize, currency, currencyPosition])

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

  const detailsModalFooter = (
    <div className="flex justify-end gap-3 print:hidden">
      <button
        onClick={() => setIsDetailsOpen(false)}
        className="px-5 py-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-all font-poppins text-sm font-medium"
      >
        Close
      </button>
      <button
        onClick={handlePrint}
        className="px-5 py-2 bg-[#0d7a50] hover:bg-[#0a6642] text-white rounded-lg transition-all flex items-center gap-2 font-poppins text-sm font-medium shadow-md shadow-emerald-500/10"
      >
        <Printer className="h-4 w-4" />
        Print
      </button>
    </div>
  )

  const calculatedTotals = useMemo(() => {
    if (!voucherDetails?.items) return { debit: 0, credit: 0 }
    let drSum = 0
    let crSum = 0
    voucherDetails.items.forEach(item => {
      drSum += parseFloat(item.debit) || 0
      crSum += parseFloat(item.credit) || 0
    })
    return { debit: drSum, credit: crSum }
  }, [voucherDetails])

  return (
    <>
      <ListPageLayout<any>
        title="Debit Voucher"
        titleOptions={navOptions}
        tabs={tabs}
        backTo="/account/chart-of-accounts"
        onCreate={handleCreate}
        createPermission="create_debit_voucher"
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
        showStatusFilter={true}
        statusValue={selectedStatus}
        onStatusChange={(val) => { setSelectedStatus(val); setCurrentPage(1); }}
        statusOptions={[
          { label: 'Approved', value: 'Approved' },
          { label: 'Pending', value: 'Pending' }
        ]}
        showColumnFilter={false}
        toolbarRightExtra={customToolbarRight}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Debit Voucher?"
        message="Are you sure you want to delete this debit voucher? This action cannot be undone."
        confirmText="Yes, Delete"
        isLoading={isVoucherDeleting}
      />

      {/* Details / Print Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Voucher Detail"
        size="lg"
        footer={detailsModalFooter}
      >
        {isDetailsLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-gray-500 font-medium text-sm">Loading details...</span>
          </div>
        ) : voucherDetails ? (
          <div className="p-2 print:p-0 font-poppins" id="print-area">
            {/* Header section */}
            <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-6 print:border-b-0 print:pb-0">
              <div className="w-[30%]">
                {webSetting?.logo_url || companyInformation?.logo_url ? (
                  <img 
                    src={webSetting?.logo_url || companyInformation?.logo_url || undefined} 
                    alt="Logo" 
                    className="max-h-[60px] object-contain print:max-h-[50px]" 
                  />
                ) : (
                  <div className="h-10 w-28 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-400">LOGO</div>
                )}
              </div>

              <div className="w-[40%] text-center">
                <h2 className="text-[18px] font-bold text-[#1e293b] print:text-[16px]">{companyInformation?.company_name}</h2>
                <span className="inline-block mt-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100 uppercase tracking-wide print:bg-transparent print:border-0 print:text-black print:text-[14px]">
                  Debit Voucher
                </span>
              </div>

              <div className="w-[30%] text-right text-sm">
                <table className="ml-auto text-xs text-gray-500 print:text-black">
                  <tbody>
                    <tr>
                      <td className="font-bold text-[#475569] text-left pr-2">Voucher No</td>
                      <td className="pr-1">:</td>
                      <td className="text-right text-[#1e293b] font-semibold">{voucherDetails.v_no}</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-[#475569] text-left pr-2">Date</td>
                      <td className="pr-1">:</td>
                      <td className="text-right text-[#1e293b] font-semibold">{voucherDetails.v_date}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden mb-6 print:border-black print:rounded-none">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-gray-200 print:bg-transparent print:border-black">
                    <th className="px-4 py-3 text-left font-bold text-gray-700 print:text-black">Particulars</th>
                    <th className="px-4 py-3 text-right font-bold text-gray-700 print:text-black w-[20%]">Debit</th>
                    <th className="px-4 py-3 text-right font-bold text-gray-700 print:text-black w-[20%]">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 print:divide-black">
                  {voucherDetails.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 print:hover:bg-transparent">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 print:text-black">
                          {item.acc_coa?.head_name ?? 'N/A'}
                          {item.sub_type !== 1 && item.acc_sub_code?.name && ` (${item.acc_sub_code.name})`}
                        </div>
                        {item.ledger_comment && (
                          <div className="text-xs text-gray-400 mt-0.5 print:text-black">{item.ledger_comment}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 print:text-black">
                        {parseFloat(item.debit) > 0 ? formatCurrency(item.debit, currency, currencyPosition) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 print:text-black">
                        {parseFloat(item.credit) > 0 ? formatCurrency(item.credit, currency, currencyPosition) : '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#f8fafc]/50 font-bold border-t border-gray-200 print:bg-transparent print:border-black">
                    <td className="px-4 py-3 text-right text-gray-700 print:text-black">Total:</td>
                    <td className="px-4 py-3 text-right text-gray-900 print:text-black">
                      {formatCurrency(calculatedTotals.debit, currency, currencyPosition)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 print:text-black">
                      {formatCurrency(calculatedTotals.credit, currency, currencyPosition)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Remark */}
            <div className="mb-8 p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-600 print:bg-transparent print:border-0 print:p-0 print:text-black">
              <span className="font-bold text-[#475569] mr-2 print:text-black">Remark:</span>
              {voucherDetails.narration}
            </div>

            {/* Signature section */}
            <div className="grid grid-cols-4 gap-4 mt-16 pt-6 border-t border-gray-100 text-center text-xs text-gray-500 print:border-black print:text-black">
              <div>
                <div className="border-t border-gray-200 pt-1.5 print:border-black">Prepared By</div>
              </div>
              <div>
                <div className="border-t border-gray-200 pt-1.5 print:border-black">Checked By</div>
              </div>
              <div>
                <div className="border-t border-gray-200 pt-1.5 print:border-black">Authorized By</div>
              </div>
              <div>
                <div className="border-t border-gray-200 pt-1.5 print:border-black">Pay By</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">Failed to load details.</div>
        )}
      </Modal>

      {/* CSS print overrides */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}} />
    </>
  )
}
