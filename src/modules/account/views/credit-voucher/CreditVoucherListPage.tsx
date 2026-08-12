import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Edit2, Trash2, Eye, Printer, Loader2 } from 'lucide-react'
import type { ColDef } from 'ag-grid-community'
import { Modal } from '@/components/Modal/Modal'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { DateRangePicker } from '@/components/DateRangePicker/DateRangePicker'
import { useSettings } from '@/hooks/useSettings'
import { 
  useCreditVouchersDatatable, 
  useCreditVoucherDetails, 
  useDeleteCreditVoucher 
} from '../../hooks/useCreditVoucher'
import type { CreditVoucherListItem } from '../../api/credit-voucher.api'

export const CreditVoucherListPage = () => {
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

  const { data: rawDataResponse, isLoading } = useCreditVouchersDatatable(params)
  const { mutate: deleteVoucher, isPending: isVoucherDeleting } = useDeleteCreditVoucher()

  // Details Hook
  const { data: voucherDetails, isLoading: isDetailsLoading } = useCreditVoucherDetails(selectedVoucherId)

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
    navigate({ to: '/account/voucher/credit/create' })
  }

  const handleEdit = (uuid: string) => {
    navigate({ to: `/account/voucher/credit/edit/${uuid}` })
  }

  const handleShowDetails = (id: number) => {
    setSelectedVoucherId(id)
    setIsDetailsOpen(true)
  }

  const handleDeleteClick = (uuid: string, id: number) => {
    setRecordToDelete({ uuid, id })
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (recordToDelete) {
      deleteVoucher({ uuid: recordToDelete.uuid, id: recordToDelete.id }, {
        onSuccess: () => {
          setIsDeleteConfirmOpen(false)
          setRecordToDelete(null)
        }
      })
    }
  }

  // ── Printing Layout Configuration ──
  const handlePrint = () => {
    window.print()
  }

  // AG Grid Columns
  const columnDefs = useMemo<ColDef<CreditVoucherListItem>[]>(() => [
    {
      headerName: 'SL',
      width: 80,
      valueGetter: (params) => {
        if (!params.node?.rowIndex && params.node?.rowIndex !== 0) return ''
        return String((currentPage - 1) * pageSize + params.node.rowIndex + 1)
      },
    },
    {
      headerName: 'V. NO',
      field: 'v_no',
      width: 140,
      cellClass: 'font-semibold text-primary',
    },
    {
      headerName: 'DATE',
      field: 'v_date',
      width: 120,
    },
    {
      headerName: 'REMARK',
      field: 'narration',
      flex: 1,
      minWidth: 220,
    },
    {
      headerName: 'AMOUNT',
      field: 'debit', // Credit Vouchers debit/credit total matches. We map debit sum as total amount.
      width: 150,
      cellClass: 'text-right font-semibold text-[#1e293b]',
      valueFormatter: (params) => {
        const val = parseFloat(String(params.value)) || 0
        const formatted = val.toFixed(2)
        return currencyPosition === 'left' ? `${currency} ${formatted}` : `${formatted} ${currency}`
      }
    },
    {
      headerName: 'STATUS',
      field: 'status',
      width: 120,
      cellRenderer: (params: any) => {
        const isApproved = params.data.is_approved === 1
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold select-none ${
              isApproved
                ? 'bg-emerald-50 text-[#10b981] border border-emerald-100'
                : 'bg-amber-50 text-[#f59e0b] border border-amber-100'
            }`}
          >
            {params.value}
          </span>
        )
      }
    },
    {
      headerName: 'ACTION',
      width: 140,
      pinned: 'right',
      cellClass: 'flex items-center justify-center gap-1.5',
      cellRenderer: (params: any) => {
        const isApproved = params.data.is_approved === 1
        return (
          <div className="flex items-center gap-1.5 h-full">
            <button
              onClick={() => handleShowDetails(params.data.id)}
              className="p-2 hover:bg-blue-50 text-[#3b82f6] rounded-xl transition-all border border-transparent hover:border-blue-100 hover:scale-110"
              title="Show Details"
            >
              <Eye className="h-4 w-4" />
            </button>

            <PermissionGuard permission="edit_credit_voucher">
              {!isApproved && (
                <button
                  onClick={() => handleEdit(params.data.uuid)}
                  className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110"
                  title="Edit Record"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              )}
            </PermissionGuard>

            <PermissionGuard permission="delete_credit_voucher">
              {!isApproved && (
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
        )
      },
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
      <ListPageLayout<CreditVoucherListItem>
        title="Credit Voucher"
        titleOptions={navOptions}
        tabs={tabs}
        backTo="/account/chart-of-accounts"
        onCreate={handleCreate}
        createPermission="create_credit_voucher"
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
        title="Delete Credit Voucher?"
        message="Are you sure you want to delete this credit voucher? This action cannot be undone."
        confirmText="Yes, Delete"
        variant="danger"
        isLoading={isVoucherDeleting}
      />

      {/* Details View Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        size="xl"
        showHeader={false}
      >
        {isDetailsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm font-medium text-gray-500 font-poppins">Loading details...</span>
          </div>
        ) : voucherDetails ? (
          <div id="print-area">
            {/* Modal Header inside Body */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6 print:hidden">
              <h2 className="text-lg font-bold text-[#1e293b] font-poppins">Voucher Details</h2>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-[#003671] hover:bg-[#002b5a] text-white rounded-lg transition-all flex items-center gap-2 font-poppins text-sm font-semibold shadow-sm"
                >
                  <Printer className="h-4 w-4" />
                  Print Voucher
                </button>
                <button
                  type="button"
                  onClick={() => setIsDetailsOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-all font-poppins text-sm font-semibold"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Voucher Card Container */}
            <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm space-y-6">
              
              {/* Header Section */}
              <div className="flex justify-between items-center pb-6 border-b border-gray-100 mb-6">
                {/* Logo and Type */}
                <div className="flex items-center gap-4">
                  {webSetting?.invoice_logo_url || webSetting?.logo_url || companyInformation?.logo_url ? (
                    <img 
                      src={webSetting?.invoice_logo_url || webSetting?.logo_url || companyInformation?.logo_url || undefined} 
                      alt="Logo" 
                      className="h-10 w-auto object-contain max-w-[150px]" 
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-md font-poppins shadow-blue-500/20">
                      G
                    </div>
                  )}
                  <div className="border-l border-gray-200 pl-4">
                    {!(webSetting?.invoice_logo_url || webSetting?.logo_url || companyInformation?.logo_url) && (
                      <h3 className="text-lg font-extrabold text-[#003671] tracking-wide leading-none uppercase mb-1.5">
                        {webSetting?.site_name || companyInformation?.company_name || 'GEN-ITECH'}
                      </h3>
                    )}
                    <span className="text-xs font-bold text-gray-400 tracking-wider mt-1.5 block uppercase">
                      Credit Voucher
                    </span>
                  </div>
                </div>

                {/* Voucher Meta Info */}
                <div className="text-right font-poppins text-[13px] text-gray-500">
                  <div className="grid grid-cols-[100px_10px_auto] text-left gap-y-1">
                    <span className="font-semibold text-gray-500">Voucher No</span>
                    <span className="text-gray-400">:</span>
                    <span className="text-[#1e293b] font-bold">{voucherDetails.v_no}</span>

                    <span className="font-semibold text-gray-500">Date</span>
                    <span className="text-gray-400">:</span>
                    <span className="text-[#1e293b] font-bold">{voucherDetails.v_date}</span>

                    {voucherDetails.cheque_no && (
                      <>
                        <span className="font-semibold text-gray-500">Cheque No</span>
                        <span className="text-gray-400">:</span>
                        <span className="text-[#1e293b] font-bold">{voucherDetails.cheque_no}</span>

                        <span className="font-semibold text-gray-500">Cheque Date</span>
                        <span className="text-gray-400">:</span>
                        <span className="text-[#1e293b] font-bold">{voucherDetails.cheque_date}</span>

                        <span className="font-semibold text-gray-500">Status</span>
                        <span className="text-gray-400">:</span>
                        <span className="text-[#1e293b] font-bold">
                          {voucherDetails.is_honour === 1 ? 'Honoured' : 'Not Honoured'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-gray-150 rounded-xl overflow-hidden">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#f8fafc] border-b border-gray-150">
                      <th className="px-5 py-3 text-left font-bold text-gray-500 text-xs tracking-wider uppercase">Particulars</th>
                      <th className="px-5 py-3 text-right font-bold text-gray-500 text-xs tracking-wider uppercase w-[20%]">Debit ({currency || 'BDT'})</th>
                      <th className="px-5 py-3 text-right font-bold text-gray-500 text-xs tracking-wider uppercase w-[20%]">Credit ({currency || 'BDT'})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {voucherDetails.items?.map((item) => {
                      const dbVal = parseFloat(item.debit) || 0
                      const crVal = parseFloat(item.credit) || 0
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-bold text-gray-800 text-[13px]">
                              {item.acc_coa?.head_name ?? 'N/A'}
                              {item.sub_type !== 1 && item.acc_sub_code?.name && ` (${item.acc_sub_code.name})`}
                            </div>
                            {item.ledger_comment && (
                              <div className="text-[11px] text-gray-400 mt-1 font-medium italic">
                                "{item.ledger_comment}"
                              </div>
                            )}
                          </td>
                          <td className={`px-5 py-4 text-right font-semibold text-[13px] ${dbVal > 0 ? 'text-gray-900 font-bold' : 'text-gray-400/60 font-normal'}`}>
                            {dbVal.toFixed(2)}
                          </td>
                          <td className={`px-5 py-4 text-right font-semibold text-[13px] ${crVal > 0 ? 'text-gray-900 font-bold' : 'text-gray-400/60 font-normal'}`}>
                            {crVal.toFixed(2)}
                          </td>
                        </tr>
                      )
                    })}
                    {/* Grand Total */}
                    <tr className="bg-[#f8fafc]/50 font-bold border-t border-gray-150">
                      <td className="px-5 py-3.5 text-center text-xs font-extrabold text-[#003671] tracking-wider uppercase">Grand Total</td>
                      <td className="px-5 py-3.5 text-right text-[13px] font-extrabold text-[#003671]">
                        {calculatedTotals.debit.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-[13px] font-extrabold text-[#003671]">
                        {calculatedTotals.credit.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Remarks Section */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Remarks</div>
                <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-xl text-[12px] text-gray-700 font-medium italic">
                  "{voucherDetails.narration || 'No narration provided'}"
                </div>
              </div>

              {/* Verification Trail */}
              <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl text-[12px] font-bold text-gray-700 uppercase tracking-wider">
                Verification Trail
              </div>

              {/* Signature Section */}
              <div className="grid grid-cols-4 gap-8 mt-12 pt-6 text-center text-[10px] font-bold text-gray-400 tracking-wider">
                <div>
                  <div className="border-t border-gray-200/80 pt-2 uppercase">Prepared By</div>
                </div>
                <div>
                  <div className="border-t border-gray-200/80 pt-2 uppercase">Checked By</div>
                </div>
                <div>
                  <div className="border-t border-gray-200/80 pt-2 uppercase">Verified By</div>
                </div>
                <div>
                  <div className="border-t border-gray-200/80 pt-2 uppercase">Authorized Signatory</div>
                </div>
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
          /* Hide all page and layout elements by default */
          body * {
            visibility: hidden !important;
          }
          
          /* Only make print-area card and its child text/images visible */
          #print-area, #print-area * {
            visibility: visible !important;
          }
          
          /* Position print-area at absolute top-left of Page 1 */
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Collapse the height and layout space of all wrapper containers in the document flow */
          #root, .fixed.inset-0.z-50, .relative.w-full.bg-white.rounded-2xl, .flex-1.overflow-y-auto.px-6.py-4 {
            height: 0 !important;
            min-height: 0 !important;
            max-height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
          }
          
          /* Ensure child nodes inside print-area render with their natural height */
          #print-area, #print-area div, #print-area table, #print-area tr, #print-area td, #print-area span, #print-area img {
            height: auto !important;
            max-height: none !important;
            min-height: 0 !important;
          }
          
          /* Hide print-hidden classes completely */
          .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Force colors and background colors to print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
    </>
  )
}
