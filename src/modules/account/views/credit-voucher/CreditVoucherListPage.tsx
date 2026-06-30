import { useState, useMemo, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Edit2, Trash2, Eye, Printer, Loader2 } from 'lucide-react'
import type { ColDef } from 'ag-grid-community'
import { useReactToPrint } from 'react-to-print'
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
  const printContentRef = useRef<HTMLDivElement>(null)
  
  const handlePrint = useReactToPrint({
    contentRef: printContentRef,
    documentTitle: `Credit_Voucher_${voucherDetails?.v_no || ''}`,
    onAfterPrint: () => {
      // Cleanups if any
    }
  })

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
      {isDetailsOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-[900px] flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 print:hidden">
              <h3 className="text-lg font-bold text-[#1e293b] font-poppins">Credit Voucher Detail</h3>
              <button 
                onClick={() => setIsDetailsOpen(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto flex-1 p-6" ref={printContentRef} id="print-area">
              {/* @media print CSS override */}
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
                    padding: 0px !important;
                    margin: 0px !important;
                  }
                }
              `}} />

              {isDetailsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm font-medium text-gray-500 font-poppins">Loading details...</span>
                </div>
              ) : voucherDetails ? (
                <div className="space-y-6">
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
                        <div className="h-10 w-28 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-400 font-poppins">LOGO</div>
                      )}
                    </div>
                    
                    <div className="text-right font-poppins text-[#475569]">
                      <h4 className="text-xl font-bold text-[#1e293b] mb-1">{companyInformation?.company_name || 'ERP System'}</h4>
                      <p className="text-xs whitespace-pre-line leading-relaxed">{companyInformation?.address || ''}</p>
                      <p className="text-xs">Email: {companyInformation?.email || ''} | Mob: {companyInformation?.mobile || ''}</p>
                    </div>
                  </div>

                  <div className="text-center py-2">
                    <span className="px-6 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full text-sm font-bold text-[#0d7a50] tracking-wider uppercase font-poppins">
                      Credit Voucher
                    </span>
                  </div>

                  {/* Meta details */}
                  <div className="grid grid-cols-2 gap-4 bg-gray-50/50 rounded-xl p-4 border border-gray-100/50 print:border-0 print:bg-transparent print:p-0">
                    <div className="space-y-1 text-sm font-poppins">
                      <p><span className="text-gray-400 font-medium">Voucher No:</span> <strong className="text-[#1e293b] font-semibold">{voucherDetails.v_no}</strong></p>
                      <p><span className="text-gray-400 font-medium">Voucher Date:</span> <span className="text-gray-600 font-semibold">{voucherDetails.v_date}</span></p>
                    </div>
                    <div className="space-y-1 text-sm text-right font-poppins">
                      {voucherDetails.cheque_no && (
                        <>
                          <p><span className="text-gray-400 font-medium">Cheque No:</span> <strong className="text-[#1e293b] font-semibold">{voucherDetails.cheque_no}</strong></p>
                          <p><span className="text-gray-400 font-medium">Cheque Date:</span> <span className="text-gray-600 font-semibold">{voucherDetails.cheque_date}</span></p>
                          <p><span className="text-gray-400 font-medium">Status:</span> <span className="text-gray-600 font-semibold">{voucherDetails.is_honour === 1 ? 'Honoured' : 'Not Honoured'}</span></p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Ledger entries table */}
                  <div className="border border-gray-100 rounded-xl overflow-hidden print:border-0">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-xs font-bold text-[#475569] border-b border-gray-100 font-poppins">
                          <th className="px-4 py-3 w-[60%]">Particulars</th>
                          <th className="px-4 py-3 text-right w-[20%]">Debit</th>
                          <th className="px-4 py-3 text-right w-[20%]">Credit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm font-poppins text-[#475569]">
                        {voucherDetails.items?.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/20 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-semibold text-[#1e293b]">
                                {item.acc_coa?.head_name ?? 'N/A'}
                                {item.sub_type !== 1 && item.acc_sub_code?.name && ` (${item.acc_sub_code.name})`}
                              </span>
                              {item.ledger_comment && (
                                <p className="text-xs text-gray-400 mt-0.5">{item.ledger_comment}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-gray-600">
                              {parseFloat(item.debit) > 0 ? (
                                currencyPosition === 'left' 
                                  ? `${currency} ${parseFloat(item.debit).toFixed(2)}` 
                                  : `${parseFloat(item.debit).toFixed(2)} ${currency}`
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-gray-600">
                              {parseFloat(item.credit) > 0 ? (
                                currencyPosition === 'left' 
                                  ? `${currency} ${parseFloat(item.credit).toFixed(2)}` 
                                  : `${parseFloat(item.credit).toFixed(2)} ${currency}`
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50/50 border-t border-gray-100 font-poppins font-bold text-sm text-[#1e293b]">
                          <td className="px-4 py-3 text-right">Total:</td>
                          <td className="px-4 py-3 text-right">
                            {currencyPosition === 'left'
                              ? `${currency} ${calculatedTotals.debit.toFixed(2)}`
                              : `${calculatedTotals.debit.toFixed(2)} ${currency}`}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {currencyPosition === 'left'
                              ? `${currency} ${calculatedTotals.credit.toFixed(2)}`
                              : `${calculatedTotals.credit.toFixed(2)} ${currency}`}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Remark */}
                  <div className="bg-gray-50/30 rounded-xl p-4 border border-gray-100/50 text-sm font-poppins">
                    <span className="text-gray-400 font-medium block mb-1">Remark/Narration:</span>
                    <p className="text-gray-700 italic">{voucherDetails.narration}</p>
                  </div>

                  {/* Signature Section */}
                  <div className="pt-16 grid grid-cols-4 gap-4 text-center text-xs font-bold text-gray-400 font-poppins print:pt-20">
                    <div>
                      <div className="border-t border-dashed border-gray-300 pt-2">Prepared By</div>
                    </div>
                    <div>
                      <div className="border-t border-dashed border-gray-300 pt-2">Checked By</div>
                    </div>
                    <div>
                      <div className="border-t border-dashed border-gray-300 pt-2">Verified By</div>
                    </div>
                    <div>
                      <div className="border-t border-dashed border-gray-300 pt-2">Authorized Signatory</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-gray-400 font-poppins">Failed to load voucher details.</div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end print:hidden">
              {detailsModalFooter}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
