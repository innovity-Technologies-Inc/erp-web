import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import { getSettingsTabs } from '../tabs'
import { usePermissions } from '@/hooks/usePermissions'
import { useOrganizationsDatatable, useDeleteOrganization } from '../hooks/useOrganizations'
import { showOrganization, storeOrganization } from '../api/settings.api'
import { OrganizationModal } from '../components/OrganizationModal'
import type { ColDef } from 'ag-grid-community'
import type { OrganizationListItem } from '../api/settings.api'

export const OrganizationPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()
  const loggedInUser = useAuthStore((state) => state.user)
  const { hasPermission } = usePermissions()

  // Super Admin check
  const isSuperAdmin = useMemo(() => {
    const roles = loggedInUser?.roles || []
    return roles.some((r: any) => {
      const name = typeof r === 'string' ? r : r.name
      return name?.toLowerCase() === 'super-admin' || name?.toLowerCase() === 'super admin'
    })
  }, [loggedInUser])

  // Redirect non-super-admins to Company Settings page
  useEffect(() => {
    if (!isSuperAdmin) {
      navigate({ to: '/settings/company' })
    }
  }, [isSuperAdmin, navigate])

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
    name: true,
    email: true,
    phone: true,
    status: true,
    expire_at: true,
    action: true,
  })

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  // Load tabs with dynamic active status
  const tabs = useMemo(() => getSettingsTabs('/settings/organization', isSuperAdmin, hasPermission), [isSuperAdmin, hasPermission])

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

  const { data: orgsData, isLoading } = useOrganizationsDatatable(params)
  const { mutate: deleteOrg, isPending: isDeleting } = useDeleteOrganization()

  const handleAdd = () => {
    setSelectedUuid(null)
    setIsModalOpen(true)
  }

  const handleEditClick = (optionsHtml: string) => {
    const match = optionsHtml.match(/data-uuid="([^"]+)"/)
    if (match && match[1]) {
      const uuid = match[1]
      queryClient.removeQueries({ queryKey: ['organization', uuid] })
      setSelectedUuid(uuid)
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

  const handleStatusToggle = async (row: OrganizationListItem) => {
    console.log('Toggling status for row:', row)
    const optionsHtml = row.options
    const match = optionsHtml ? optionsHtml.match(/data-uuid="([^"]+)"/) : null
    const uuid = match ? match[1] : null
    console.log('Extracted UUID:', uuid)
    if (!uuid) return

    setTogglingUuid(uuid)

    try {
      console.log('Fetching details for UUID:', uuid)
      const detailRes = await showOrganization(uuid)
      const org = detailRes.response
      console.log('Fetched details:', org)
      
      const newStatus = org.status === 1 ? 0 : 1
      console.log('Flipped status to:', newStatus)

      const payload = {
        id: org.id,
        name: org.name,
        email: org.email,
        phone: org.phone,
        address: org.address,
        expire_at: org.expire_at ? org.expire_at.split('T')[0] : null,
        status: newStatus,
      }
      console.log('Sending payload to store:', payload)

      const res = await storeOrganization(payload)
      console.log('Backend response:', res)

      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      queryClient.removeQueries({ queryKey: ['organization', uuid] })
      
      showNotificationModal(
        'Status Updated!',
        `Organization status changed to ${newStatus === 1 ? 'Active' : 'Inactive'}.`,
        'success'
      )
    } catch (err: any) {
      console.error('Failed to toggle status:', err)
      const msg = err.response?.data?.message || err.message || 'Failed to toggle status.'
      showNotificationModal('Update Failed', msg, 'error')
    } finally {
      setTogglingUuid(null)
    }
  }

  const handleConfirmDelete = () => {
    if (uuidToDelete) {
      deleteOrg(uuidToDelete, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setUuidToDelete(null)
          showNotificationModal(
            'Deleted Successfully!',
            'The organization has been deleted successfully.',
            'success'
          )
        },
        onError: (err: any) => {
          setIsConfirmOpen(false)
          setUuidToDelete(null)
          const msg = err.response?.data?.message || err.message || 'Failed to delete organization.'
          showNotificationModal('Delete Failed', msg, 'error')
        },
      })
    }
  }

  const columnDefs = useMemo<ColDef<OrganizationListItem>[]>(
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
        headerName: 'ORGANIZATION NAME',
        field: 'name',
        minWidth: 200,
        flex: 1,
        hide: !visibleCols.name,
        cellClass: 'font-semibold text-slate-800 flex items-center',
      },
      {
        headerName: 'EMAIL',
        field: 'email',
        minWidth: 220,
        flex: 1.2,
        hide: !visibleCols.email,
        cellClass: 'text-gray-600 flex items-center',
      },
      {
        headerName: 'PHONE',
        field: 'phone',
        width: 160,
        hide: !visibleCols.phone,
        cellClass: 'text-gray-600 flex items-center justify-center font-medium',
      },
      {
        headerName: 'STATUS',
        field: 'status',
        width: 180,
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
        headerName: 'EXPIRES AT',
        field: 'expire_at',
        width: 150,
        hide: !visibleCols.expire_at,
        cellClass: 'text-gray-500 flex items-center justify-center font-medium',
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
                title="Edit Organization"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteClick(optionsHtml)}
                className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/del"
                title="Delete Organization"
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
      { name: 'Organization Name', field: 'name', visible: visibleCols.name },
      { name: 'Email', field: 'email', visible: visibleCols.email },
      { name: 'Phone', field: 'phone', visible: visibleCols.phone },
      { name: 'Status', field: 'status', visible: visibleCols.status },
      { name: 'Expires At', field: 'expire_at', visible: visibleCols.expire_at },
      { name: 'Action', field: 'action', visible: visibleCols.action },
    ],
    [visibleCols]
  )

  const totalPages = useMemo(() => {
    return Math.ceil((orgsData?.recordsFiltered || 0) / pageSize)
  }, [orgsData, pageSize])

  if (!isSuperAdmin) {
    return null // Keep blank layout while redirection is running
  }

  return (
    <>
      <ListPageLayout
        title="Organization List"
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
        createPermission="create_user"
        addLabel="Create"
        // AG Grid Props
        rowData={orgsData?.data || []}
        columnDefs={columnDefs}
        // Pagination
        recordsTotal={orgsData?.recordsFiltered || 0}
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

      {/* Organization Modal popup */}
      <OrganizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        organizationUuid={selectedUuid}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="Delete Organization"
        message="Are you sure you want to delete this organization? All associated data will be permanently removed. This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onClose={() => setIsConfirmOpen(false)}
        confirmText="Yes, delete it"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </>
  )
}
