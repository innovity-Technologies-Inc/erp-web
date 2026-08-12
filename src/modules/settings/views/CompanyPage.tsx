import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import { getSettingsTabs } from '../tabs'
import { useCompaniesDatatable, useDeleteCompany } from '../hooks/useCompanies'
import { showCompany, storeCompany } from '../api/settings.api'
import { CompanyModal } from '../components/CompanyModal'
import type { ColDef } from 'ag-grid-community'
import type { CompanyListItem } from '../api/settings.api'

export const CompanyPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()
  const loggedInUser = useAuthStore((state) => state.user)

  // Super Admin check
  const isSuperAdmin = useMemo(() => {
    const roles = loggedInUser?.roles || []
    return roles.some((r: any) => {
      const name = typeof r === 'string' ? r : r.name
      return name?.toLowerCase() === 'super-admin' || name?.toLowerCase() === 'super admin'
    })
  }, [loggedInUser])

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null)

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [uuidToDelete, setUuidToDelete] = useState<string | null>(null)

  const [togglingUuid, setTogglingUuid] = useState<string | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    company_name: true,
    organization: true,
    email: true,
    mobile: true,
    status: true,
    action: true,
  })

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  // Load tabs with dynamic active status
  const tabs = useMemo(() => getSettingsTabs('/settings/company', isSuperAdmin), [isSuperAdmin])

  const statusOptions = useMemo(
    () => [
      { label: 'Active', value: '1' },
      { label: 'Inactive', value: '0' },
    ],
    []
  )

  // Params for Datatable endpoint
  const params = useMemo(
    () => ({
      draw: 1,
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      search: { value: search },
      status: statusFilter !== '' ? statusFilter : undefined,
    }),
    [currentPage, pageSize, search, statusFilter]
  )

  const { data: companiesData, isLoading } = useCompaniesDatatable(params)
  const { mutate: deleteCompanyMutation, isPending: isDeleting } = useDeleteCompany()

  const handleAdd = () => {
    setSelectedUuid(null)
    setIsModalOpen(true)
  }

  const handleEditClick = (optionsHtml: string) => {
    const match = optionsHtml.match(/data-uuid="([^"]+)"/)
    if (match && match[1]) {
      setSelectedUuid(match[1])
      setIsModalOpen(true)
    }
  }

  const handleDeleteClick = (optionsHtml: string) => {
    const match = optionsHtml.match(/data-uuid="([^"]+)"/)
    if (match && match[1]) {
      setUuidToDelete(match[1])
      setIsConfirmOpen(true)
    }
  }

  const handleStatusToggle = async (row: CompanyListItem) => {
    const optionsHtml = row.options
    const match = optionsHtml ? optionsHtml.match(/data-uuid="([^"]+)"/) : null
    const uuid = match ? match[1] : null
    if (!uuid) return

    setTogglingUuid(uuid)

    try {
      const detailRes = await showCompany(uuid)
      const comp = detailRes.response
      
      const newStatus = comp.status === 1 ? 0 : 1

      const payload = {
        id: comp.id,
        organization_id: comp.organization_id,
        company_name: comp.company_name,
        mobile: comp.mobile,
        email: comp.email,
        website: comp.website,
        address: comp.address,
        vat_no: comp.vat_no,
        cr_no: comp.cr_no,
        status: newStatus,
      }

      await storeCompany(payload)

      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['company'] })
      
      showNotificationModal(
        'Status Updated!',
        `Company status changed to ${newStatus === 1 ? 'Active' : 'Inactive'}.`,
        'success'
      )
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to toggle status.'
      showNotificationModal('Update Failed', msg, 'error')
    } finally {
      setTogglingUuid(null)
    }
  }

  const handleConfirmDelete = () => {
    if (uuidToDelete) {
      deleteCompanyMutation(uuidToDelete, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setUuidToDelete(null)
          showNotificationModal(
            'Deleted Successfully!',
            'The company has been deleted successfully.',
            'success'
          )
        },
        onError: (err: any) => {
          setIsConfirmOpen(false)
          setUuidToDelete(null)
          const msg = err.response?.data?.message || err.message || 'Failed to delete company.'
          showNotificationModal('Delete Failed', msg, 'error')
        },
      })
    }
  }

  const columnDefs = useMemo<ColDef<CompanyListItem>[]>(
    () => [
      {
        headerName: 'SL',
        valueGetter: (params) => {
          const index = params.node?.rowIndex ?? 0
          return (currentPage - 1) * pageSize + index + 1
        },
        width: 80,
        pinned: 'left',
        hide: !visibleCols.sl,
        cellClass: 'text-gray-400 font-medium border-r border-primary/10 flex items-center justify-center',
      },
      {
        headerName: 'COMPANY NAME',
        field: 'company_name',
        minWidth: 200,
        flex: 1.2,
        hide: !visibleCols.company_name,
        cellClass: 'font-semibold text-slate-800 flex items-center',
      },
      {
        headerName: 'ORGANIZATION',
        field: 'organization',
        minWidth: 180,
        flex: 1,
        hide: !visibleCols.organization,
        cellClass: 'text-gray-600 flex items-center',
      },
      {
        headerName: 'EMAIL',
        field: 'email',
        minWidth: 200,
        flex: 1.2,
        hide: !visibleCols.email,
        cellClass: 'text-gray-600 flex items-center',
      },
      {
        headerName: 'MOBILE',
        field: 'mobile',
        width: 150,
        hide: !visibleCols.mobile,
        cellClass: 'text-gray-600 flex items-center justify-center font-medium',
      },
      {
        headerName: 'STATUS',
        field: 'status',
        width: 160,
        hide: !visibleCols.status,
        cellClass: 'flex items-center justify-center',
        cellRenderer: (params: any) => {
          const optionsHtml = params.data?.options
          const match = optionsHtml ? optionsHtml.match(/data-uuid="([^"]+)"/) : null
          const uuid = match ? match[1] : null

          const isActive = params.value?.includes('badge-success')
          const isProcessing = togglingUuid && togglingUuid === uuid

          return (
            <div className="flex items-center gap-2 h-full leading-none">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium tracking-tight uppercase leading-none ${
                  isActive ? 'bg-[#e2f8f0] text-[#0d9488]' : 'bg-[#fef2f2] text-[#e11d48]'
                }`}
              >
                {isActive ? 'Active' : 'Inactive'}
              </span>
              <button
                disabled={!!isProcessing}
                onClick={(e) => {
                  e.stopPropagation()
                  handleStatusToggle(params.data)
                }}
                className="text-gray-400 hover:text-primary transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : isActive ? (
                  <ToggleRight className="w-5 h-5 text-primary" strokeWidth={1.5} />
                ) : (
                  <ToggleLeft className="w-5 h-5" strokeWidth={1.5} />
                )}
              </button>
            </div>
          )
        },
      },
      {
        headerName: 'ACTIONS',
        field: 'options',
        width: 120,
        pinned: 'right',
        hide: !visibleCols.action,
        cellClass: 'flex items-center justify-center gap-1.5',
        cellRenderer: (params: any) => {
          const optionsHtml = params.value
          if (!optionsHtml) return null
          return (
            <div className="flex items-center gap-1.5 h-full">
              <button
                onClick={() => handleEditClick(optionsHtml)}
                className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/edit"
                title="Edit Company"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteClick(optionsHtml)}
                className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/del"
                title="Delete Company"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )
        },
      },
    ],
    [visibleCols, currentPage, pageSize, togglingUuid]
  )

  const filterColumns = useMemo(
    () => [
      { name: 'SL', field: 'sl', visible: visibleCols.sl },
      { name: 'Company Name', field: 'company_name', visible: visibleCols.company_name },
      { name: 'Organization', field: 'organization', visible: visibleCols.organization },
      { name: 'Email', field: 'email', visible: visibleCols.email },
      { name: 'Mobile', field: 'mobile', visible: visibleCols.mobile },
      { name: 'Status', field: 'status', visible: visibleCols.status },
      { name: 'Action', field: 'action', visible: visibleCols.action },
    ],
    [visibleCols]
  )

  const totalPages = useMemo(() => {
    return Math.ceil((companiesData?.recordsFiltered || 0) / pageSize)
  }, [companiesData, pageSize])

  return (
    <>
      <ListPageLayout
        title="Company List"
        backTo="/"
        tabs={tabs}
        searchWidth="max-w-[200px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        onCreate={handleAdd}
        createPermission="create_company"
        addLabel="Create"
        // AG Grid Props
        rowData={companiesData?.data || []}
        columnDefs={columnDefs}
        // Pagination
        recordsTotal={companiesData?.recordsFiltered || 0}
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
        // Status Filter
        showStatusFilter={true}
        statusValue={statusFilter}
        onStatusChange={(val) => {
          setStatusFilter(val)
          setCurrentPage(1)
        }}
        statusOptions={statusOptions}
        gridOptions={{
          rowHeight: 46,
          suppressRowTransform: true,
        }}
      />

      {/* Company Modal popup */}
      <CompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        companyUuid={selectedUuid}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="Delete Company"
        message="Are you sure you want to delete this company? All associated data will be permanently removed. This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onClose={() => setIsConfirmOpen(false)}
        confirmText="Yes, delete it"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </>
  )
}
