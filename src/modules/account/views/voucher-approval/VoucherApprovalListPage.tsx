import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Edit2, Eye, Check, Loader2 } from 'lucide-react'
import type { ColDef } from 'ag-grid-community'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { Modal } from '@/components/Modal/Modal'
import { useUiStore } from '@/store/useUiStore'
import { formatCurrency } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { 
  useVoucherApprovalDatatable, 
  useVoucherApprovalDetails, 
  useApproveVoucher 
} from '../../hooks/useVoucherApproval'
import type { VoucherApprovalListItem } from '../../api/voucher-approval.api'

export const VoucherApprovalListPage = () => {
  const navigate = useNavigate()
  const notify = useUiStore((state) => state.notify)
  const { currency, currencyPosition } = useSettings()

  // Pagination, Search & Filter States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<string>('')

  // Column Visibility State
  const [visibleCols, setVisibleCols] = useState({
    sl: true,
    invoice: true,
    voucherNo: true,
    type: true,
    remark: true,
    amount: true,
    approve: true,
    actions: true,
  })

  const toggleColumn = (field: string) => {
    setVisibleCols(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Invoice No', field: 'invoice', visible: visibleCols.invoice },
    { name: 'Voucher No', field: 'voucherNo', visible: visibleCols.voucherNo },
    { name: 'Type', field: 'type', visible: visibleCols.type },
    { name: 'Remark', field: 'remark', visible: visibleCols.remark },
    { name: 'Total Amount', field: 'amount', visible: visibleCols.amount },
    { name: 'Approve', field: 'approve', visible: visibleCols.approve },
    { name: 'Actions', field: 'actions', visible: visibleCols.actions },
  ]

  // Details Modal States
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Direct Approval States
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false)
  const [recordToApprove, setRecordToApprove] = useState<{ uuid: string; id: number } | null>(null)

  // Datatable parameters mapped to support server-side column searching
  const params = useMemo(() => {
    const cols = [
      { data: 'reference_no', searchable: 'true', orderable: 'false', search: { value: '' } },
      { data: 'v_no', searchable: 'true', orderable: 'true', search: { value: '' } },
      { data: 'v_type', searchable: 'true', orderable: 'false', search: { value: selectedType } },
      { data: 'narration', searchable: 'true', orderable: 'false', search: { value: '' } },
      { data: 'debit', searchable: 'true', orderable: 'false', search: { value: '' } }
    ]
    return {
      draw: 1,
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      search: { value: search },
      columns: cols
    }
  }, [currentPage, pageSize, search, selectedType])

  // Queries & Mutations
  const { data: datatableResponse, isLoading, refetch } = useVoucherApprovalDatatable(params)
  const { data: voucherDetails, isLoading: isDetailsLoading } = useVoucherApprovalDetails(selectedId)
  const { mutate: approveVoucher, isPending: isApproving } = useApproveVoucher()

  // Total pages calculation
  const totalPages = Math.ceil((datatableResponse?.recordsFiltered ?? 0) / pageSize)

  // Handlers
  const handleViewDetails = (id: number) => {
    setSelectedId(id)
    setIsDetailsOpen(true)
  }

  const handleApproveClick = (uuid: string, id: number) => {
    setRecordToApprove({ uuid, id })
    setIsApproveConfirmOpen(true)
  }

  const handleConfirmApprove = () => {
    if (recordToApprove) {
      approveVoucher(recordToApprove.uuid, {
        onSuccess: () => {
          notify('Voucher approved successfully!', 'success')
          setIsApproveConfirmOpen(false)
          setRecordToApprove(null)
          refetch()
        }
      })
    }
  }

  const handleModalApprove = () => {
    if (voucherDetails?.data?.uuid) {
      approveVoucher(voucherDetails.data.uuid, {
        onSuccess: () => {
          notify('Voucher approved successfully!', 'success')
          setIsDetailsOpen(false)
          setSelectedId(null)
          refetch()
        }
      })
    }
  }

  const handleEditClick = (v_type: string, uuid: string) => {
    let toRoute = '/account/chart-of-accounts'
    if (v_type === 'DV') toRoute = `/account/voucher/debit/edit/${uuid}`
    else if (v_type === 'CV') toRoute = `/account/voucher/credit/edit/${uuid}`
    else if (v_type === 'JV') toRoute = `/account/voucher/journal/edit/${uuid}`
    else if (v_type === 'CT') toRoute = `/account/voucher/contra/edit/${uuid}`
    
    navigate({ to: toRoute })
  }

  // Columns & Options
  const columnDefs = useMemo<ColDef<VoucherApprovalListItem>[]>(() => [
    {
      headerName: 'SL',
      valueGetter: (params) => {
        return (currentPage - 1) * pageSize + (params.node?.rowIndex ?? 0) + 1
      },
      width: 70,
      hide: !visibleCols.sl,
    },
    {
      headerName: 'Invoice No',
      field: 'reference_no',
      valueFormatter: (params) => params.value || 'N/A',
      minWidth: 120,
      hide: !visibleCols.invoice,
    },
    {
      headerName: 'Voucher No',
      field: 'v_no',
      cellRenderer: (params: any) => (
        <span className="font-bold text-[#003671]">
          {params.value}
        </span>
      ),
      minWidth: 160,
      hide: !visibleCols.voucherNo,
    },
    {
      headerName: 'Type',
      field: 'v_type',
      cellRenderer: (params: any) => {
        const type = params.value
        let typeName = 'N/A'
        let colorClasses = 'bg-gray-100 text-gray-700'
        if (type === 'DV') {
          typeName = 'Debit Voucher'
          colorClasses = 'bg-blue-50 text-blue-700 border-blue-100'
        } else if (type === 'CV') {
          typeName = 'Credit Voucher'
          colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-100'
        } else if (type === 'JV') {
          typeName = 'Journal Voucher'
          colorClasses = 'bg-purple-50 text-purple-700 border-purple-100'
        } else if (type === 'CT') {
          typeName = 'Contra Voucher'
          colorClasses = 'bg-amber-50 text-amber-700 border-amber-100'
        }
        return (
          <span className={`inline-flex items-center px-2 py-0.5 border text-xs font-semibold rounded-md ${colorClasses}`}>
            {typeName}
          </span>
        )
      },
      minWidth: 150,
      hide: !visibleCols.type,
    },
    {
      headerName: 'Remark',
      field: 'narration',
      cellRenderer: (params: any) => (
        <span className="text-gray-500 italic font-medium">
          {params.value || 'No narration'}
        </span>
      ),
      minWidth: 200,
      flex: 1,
      hide: !visibleCols.remark,
    },
    {
      headerName: `Total Amount`,
      field: 'debit',
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition),
      type: 'numericColumn',
      minWidth: 140,
      hide: !visibleCols.amount,
    },
    {
      headerName: 'Approve',
      field: 'uuid',
      cellRenderer: (params: any) => {
        if (!params.data) return null
        return (
          <div className="flex items-center justify-center h-full">
            <PermissionGuard permission="approve_voucher">
              <button
                onClick={() => handleApproveClick(params.data.uuid, params.data.id)}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-all shadow-sm shadow-amber-500/10 hover:scale-105 cursor-pointer"
                title="Approve Voucher"
              >
                <Check className="h-3.5 w-3.5" /> Approve
              </button>
            </PermissionGuard>
          </div>
        )
      },
      width: 120,
      sortable: false,
      filter: false,
      hide: !visibleCols.approve,
    },
    {
      headerName: 'Actions',
      field: 'id',
      cellRenderer: (params: any) => {
        if (!params.data) return null
        return (
          <div className="flex items-center justify-center gap-2 h-full">
            <button
              onClick={() => handleViewDetails(params.data.id)}
              className="p-2 hover:bg-sky-50 text-[#0284c7] rounded-xl transition-all border border-transparent hover:border-sky-100 hover:scale-110"
              title="Show Details"
            >
              <Eye className="h-4 w-4" />
            </button>

            <button
              onClick={() => handleEditClick(params.data.v_type, params.data.uuid)}
              className="p-2 hover:bg-emerald-50 text-[#059669] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110"
              title="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          </div>
        )
      },
      width: 120,
      sortable: false,
      filter: false,
      hide: !visibleCols.actions,
    }
  ], [currentPage, pageSize, currency, currencyPosition, visibleCols])

  const calculatedTotals = useMemo(() => {
    let debit = 0
    let credit = 0
    if (voucherDetails?.data?.items) {
      voucherDetails.data.items.forEach((item: any) => {
        debit += parseFloat(item.debit) || 0
        credit += parseFloat(item.credit) || 0
      })
    }
    return { debit, credit }
  }, [voucherDetails])

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

  const statusOptions = [
    { label: 'Debit Voucher', value: 'DV' },
    { label: 'Credit Voucher', value: 'CV' },
    { label: 'Journal Voucher', value: 'JV' },
    { label: 'Contra Voucher', value: 'CT' }
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .min-w-\\[120px\\] {
          min-width: 240px !important;
        }
      `}} />
      <ListPageLayout<VoucherApprovalListItem>
        title="Voucher Approval"
        titleOptions={navOptions}
        tabs={tabs}
        backTo="/account/chart-of-accounts"
        showSearch={true}
        searchValue={search}
        onSearchChange={(val) => { setSearch(val); setCurrentPage(1); }}
        showStatusFilter={true}
        statusValue={selectedType}
        onStatusChange={(val) => { setSelectedType(val); setCurrentPage(1); }}
        statusOptions={statusOptions}
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
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

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => { setIsDetailsOpen(false); setSelectedId(null); }}
        title="Voucher Details"
        size="xl"
      >
        <div className="p-4 font-poppins">
          {isDetailsLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : voucherDetails?.data ? (
            <div className="space-y-6">
              {/* Logo & Info header */}
              <div className="flex justify-between items-start pb-6 border-b border-gray-100">
                <div>
                  {voucherDetails.webSetting?.invoice_logo_url || voucherDetails.webSetting?.logo_url || voucherDetails.company?.logo_url ? (
                    <img 
                      src={voucherDetails.webSetting?.invoice_logo_url || voucherDetails.webSetting?.logo_url || voucherDetails.company?.logo_url} 
                      alt="Logo" 
                      className="h-10 w-auto object-contain mb-3" 
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-primary flex items-center justify-center text-white font-bold text-lg mb-3">
                      G
                    </div>
                  )}
                  {!(voucherDetails.webSetting?.invoice_logo_url || voucherDetails.webSetting?.logo_url || voucherDetails.company?.logo_url) && (
                    <h4 className="text-md font-bold text-slate-800">
                      {voucherDetails.company?.company_name || 'GEN-ITECH'}
                    </h4>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500 space-y-1">
                  <div><strong>Voucher No:</strong> <span className="text-slate-800 font-semibold">{voucherDetails.data.v_no}</span></div>
                  <div><strong>Date:</strong> <span className="text-slate-800 font-semibold">{voucherDetails.data.v_date}</span></div>
                  <div><strong>Type:</strong> <span className="text-slate-800 font-semibold">{voucherDetails.data.v_type}</span></div>
                  <div><strong>Reference:</strong> <span className="text-slate-800 font-semibold">{voucherDetails.data.reference_no || 'N/A'}</span></div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-gray-150 rounded-xl overflow-hidden">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-150">
                      <th className="px-4 py-2.5 text-left font-bold text-gray-500 text-xs uppercase tracking-wider">Particulars</th>
                      <th className="px-4 py-2.5 text-right font-bold text-gray-500 text-xs uppercase tracking-wider w-[20%]">Debit</th>
                      <th className="px-4 py-2.5 text-right font-bold text-gray-500 text-xs uppercase tracking-wider w-[20%]">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {voucherDetails.data.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div className="font-bold text-gray-800 text-[13px]">
                            {item.acc_coa?.head_name ?? 'N/A'}
                            {item.sub_type !== 1 && item.acc_sub_code?.name && ` (${item.acc_sub_code.name})`}
                          </div>
                          {item.ledger_comment && (
                            <div className="text-[11px] text-gray-400 mt-1 italic font-medium">
                              "{item.ledger_comment}"
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {parseFloat(item.debit || '0').toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {parseFloat(item.credit || '0').toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="bg-slate-50/50 font-bold border-t border-gray-150">
                      <td className="px-4 py-3 text-center text-xs font-extrabold text-[#003671] uppercase tracking-wider">Total</td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {calculatedTotals.debit.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {calculatedTotals.credit.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Remarks Narration */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Remark</div>
                <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-lg text-sm text-gray-600 italic">
                  "{voucherDetails.data.narration || 'No remark provided'}"
                </div>
              </div>

              {/* Actions Footer inside modal */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setIsDetailsOpen(false); setSelectedId(null); }}
                  className="px-4 py-2 border border-gray-200 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-all font-poppins text-sm font-semibold cursor-pointer"
                >
                  Close
                </button>
                <PermissionGuard permission="approve_voucher">
                  <button
                    type="button"
                    onClick={handleModalApprove}
                    disabled={isApproving}
                    className="px-4 py-2 bg-[#0d7a50] hover:bg-[#0a6642] text-white rounded-lg transition-all font-poppins text-sm font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" /> Approve Voucher
                      </>
                    )}
                  </button>
                </PermissionGuard>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">Failed to load details.</div>
          )}
        </div>
      </Modal>

      {/* Approve Confirmation Modal */}
      <ConfirmationModal
        isOpen={isApproveConfirmOpen}
        onClose={() => { setIsApproveConfirmOpen(false); setRecordToApprove(null); }}
        onConfirm={handleConfirmApprove}
        title="Approve Voucher?"
        message="Are you sure you want to approve this voucher? This action will post the transaction entries permanently to the general ledger."
        confirmText="Yes, Approve"
        isLoading={isApproving}
      />
    </>
  )
}
