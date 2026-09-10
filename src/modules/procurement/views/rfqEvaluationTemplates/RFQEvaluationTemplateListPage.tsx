import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Edit, Trash2, Award, FileText } from 'lucide-react'
import {
  useRFQEvaluationTemplates,
  useDeleteRFQEvaluationTemplate,
} from '../../hooks/useRFQEvaluationTemplates'
import type { ColDef } from 'ag-grid-community'
import type { RFQEvaluationTemplate } from '../../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { formatDate } from '@/utils/formatters'
import { exportToExcel } from '@/utils/exportUtils'
import { clsx } from 'clsx'

export const RFQEvaluationTemplateListPage = () => {
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()

  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')

  // Confirmation Delete States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<{ uuid: string; name: string } | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    name: true,
    technical_weightage: true,
    commercial_weightage: true,
    criteria: true,
    date: true,
    action: true,
  })

  // Data Fetching params
  const params = useMemo(
    () => ({
      page: currentPage,
      per_page: pageSize,
      search: search || undefined,
    }),
    [currentPage, pageSize, search]
  )

  const { data: templatesData, isLoading } = useRFQEvaluationTemplates(params)
  const { mutate: deleteTemplate, isPending: isDeleting } = useDeleteRFQEvaluationTemplate()

  // Actions
  const handleAdd = () => {
    navigate({ to: '/procurement/rfq-templates/create' })
  }

  const handleEdit = (template: RFQEvaluationTemplate) => {
    navigate({
      to: '/procurement/rfq-templates/edit/$id',
      params: { id: template.uuid },
    })
  }

  const handleDeleteClick = (template: { uuid: string; name: string }) => {
    setTemplateToDelete(template)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (templateToDelete) {
      deleteTemplate(templateToDelete.uuid, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setTemplateToDelete(null)
          showNotificationModal(
            'Template Deleted!',
            `Evaluation template "${templateToDelete.name}" has been removed successfully.`,
            'success'
          )
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || error.message || 'Failed to delete template.'
          showNotificationModal('Delete Failed', message, 'error')
        },
      })
    }
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const handleExport = () => {
    if (!templatesData?.response) return

    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'Template Name', key: 'name', width: 35 },
      { header: 'Technical Weightage (%)', key: 'technical_weightage', width: 25 },
      { header: 'Commercial Weightage (%)', key: 'commercial_weightage', width: 25 },
      { header: 'Total Criteria Items', key: 'criteria_count', width: 20 },
      { header: 'Created Date', key: 'created_at', width: 18 },
    ]

    const exportData = templatesData.response.map((item, index) => ({
      sl: index + 1,
      name: item.name,
      technical_weightage: `${item.technical_weightage}%`,
      commercial_weightage: `${item.commercial_weightage}%`,
      criteria_count: Array.isArray(item.criteria) ? item.criteria.length : 0,
      created_at: item.created_at ? formatDate(item.created_at) : '—',
    }))

    exportToExcel(exportData, exportColumns, 'rfq-evaluation-templates')
  }

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<RFQEvaluationTemplate>[]>(
    () => [
      {
        headerName: 'SL',
        valueGetter: (params) => {
          const index = params.node?.rowIndex ?? 0
          return (currentPage - 1) * pageSize + index + 1
        },
        width: 70,
        pinned: 'left',
        hide: !visibleCols.sl,
        cellClass: 'text-gray-400 font-medium border-r border-primary/10 flex items-center justify-center',
      },
      {
        headerName: 'TEMPLATE NAME',
        field: 'name',
        flex: 1.5,
        minWidth: 250,
        hide: !visibleCols.name,
        cellClass: 'font-semibold text-gray-900 flex items-center',
        cellRenderer: (params: any) => {
          return (
            <div className="flex items-center gap-2.5 h-full">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Award className="w-4 h-4" />
              </div>
              <span className="font-semibold text-gray-900">{params.value}</span>
            </div>
          )
        },
      },
      {
        headerName: 'TECHNICAL WEIGHT',
        field: 'technical_weightage',
        width: 170,
        hide: !visibleCols.technical_weightage,
        cellRenderer: (params: any) => {
          return (
            <div className="flex items-center h-full">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                Tech: {params.value}%
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'COMMERCIAL WEIGHT',
        field: 'commercial_weightage',
        width: 170,
        hide: !visibleCols.commercial_weightage,
        cellRenderer: (params: any) => {
          return (
            <div className="flex items-center h-full">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Comm: {params.value}%
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'CRITERIA ITEMS',
        field: 'criteria',
        width: 180,
        hide: !visibleCols.criteria,
        cellRenderer: (params: any) => {
          const count = Array.isArray(params.value) ? params.value.length : 0
          return (
            <div className="flex items-center h-full">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                <FileText className="w-3 h-3 text-gray-500" />
                {count} {count === 1 ? 'Criterion' : 'Criteria'}
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'DATE',
        field: 'created_at',
        width: 130,
        hide: !visibleCols.date,
        cellClass: 'text-gray-600 flex items-center justify-center',
        valueFormatter: (params) => (params.value ? formatDate(params.value) : '—'),
      },
      {
        headerName: 'ACTIONS',
        width: 110,
        pinned: 'right',
        hide: !visibleCols.action || !hasAnyPermission(['edit_rfq', 'delete_rfq']),
        cellClass: 'flex items-center justify-center gap-1.5',
        cellRenderer: (params: any) => {
          const data: RFQEvaluationTemplate = params.data
          return (
            <div className="flex items-center gap-1.5 h-full">
              <PermissionGuard permission="edit_rfq">
                <button
                  onClick={() => handleEdit(data)}
                  className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 cursor-pointer"
                  title="Edit Template"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </PermissionGuard>

              <PermissionGuard permission="delete_rfq">
                <button
                  onClick={() => handleDeleteClick({ uuid: data.uuid, name: data.name })}
                  className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 cursor-pointer"
                  title="Delete Template"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </PermissionGuard>
            </div>
          )
        },
      },
    ],
    [currentPage, pageSize, visibleCols, hasAnyPermission]
  )

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Template Name', field: 'name', visible: visibleCols.name },
    { name: 'Technical Weightage', field: 'technical_weightage', visible: visibleCols.technical_weightage },
    { name: 'Commercial Weightage', field: 'commercial_weightage', visible: visibleCols.commercial_weightage },
    { name: 'Criteria Items', field: 'criteria', visible: visibleCols.criteria },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const totalRecords = templatesData?.meta?.total ?? 0
  const totalPages = Math.ceil(totalRecords / pageSize) || 1

  const tabs = [
    { name: 'Vendors', to: '/procurement/vendors', permission: ['view_vendor', 'view_vendor_invitation', 'view_vendor_category', 'view_vendor_document_type', 'view_vendor_blacklist'] },
    { name: 'Requisitions & RFQ', to: '/procurement/purchase-requisitions', active: true, permission: ['view_rfq', 'view_purchase_requisition'] },
    { name: 'Purchase Orders', to: '/procurement/purchase-orders', permission: 'view_purchase_order' },
    { name: 'Goods Receipt (GRN)', to: '/procurement/grns', permission: 'view_grn' },
    { name: 'Invoices & Payments', to: '/procurement/invoices', permission: ['view_invoice', 'submit_invoice', 'view_vendor_invoice'] },
    { name: 'Budgets & Cost Centers', to: '/procurement/budgets', permission: ['view_budget', 'view_budget_category', 'view_budget_head', 'view_cost_center'] },
  ]

  const titleOptions = [
    { name: 'Purchase Requisitions', to: '/procurement/purchase-requisitions', permission: 'view_purchase_requisition' },
    { name: 'Request For Quotations (RFQ)', to: '/procurement/rfqs', permission: 'view_rfq' },
    { name: 'RFQ Evaluation Templates', to: '/procurement/rfq-templates', permission: 'view_rfq_evaluation_template' },
    { name: 'Terms & Conditions Library', to: '/procurement/terms-library', permission: 'view_terms_library' },
  ]

  return (
    <>
      <ListPageLayout
        title="RFQ Evaluation Templates"
        titleOptions={titleOptions}
        backTo="/procurement/purchase-requisitions"
        tabs={tabs}
        onCreate={handleAdd}
        createPermission="create_rfq"
        searchWidth="max-w-[220px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={templatesData?.response || []}
        columnDefs={columnDefs}
        // Pagination
        recordsTotal={totalRecords}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
        // Column Filter
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
        // Export
        onExport={handleExport}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Evaluation Template?"
        message={`Are you sure you want to delete template "${templateToDelete?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
