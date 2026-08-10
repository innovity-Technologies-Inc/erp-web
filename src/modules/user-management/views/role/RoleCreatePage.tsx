import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Check, Briefcase, Info, X } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { roleSchema } from '../../hooks/validation'
import type { RoleFormValues } from '../../hooks/validation'
import { useCreateRole, usePermissionsList } from '../../hooks/useRoles'
import { useUiStore } from '@/store/useUiStore'
import { Select2 } from '@/components/Select/Select2'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { usePermissions } from '@/hooks/usePermissions'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'

interface PermissionItem {
  id: number
  name: string
}

export const RoleCreatePage = () => {
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()
  const { user } = usePermissions()

  // States
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)

  // API Queries & Mutations
  const { data: permissionsData, isLoading } = usePermissionsList()
  const { mutate: createRole, isPending: isSaving } = useCreateRole()

  const isSuperAdmin = useMemo(() => {
    const roles = user?.roles || []
    return roles.some((r: any) => {
      const name = typeof r === 'string' ? r : r.name
      return name?.toLowerCase() === 'super-admin' || name?.toLowerCase() === 'super admin'
    })
  }, [user])

  const groupedPermissions = permissionsData?.data?.grouped_permissions || {}
  const organizationOptions = useMemo(() => {
    return permissionsData?.data?.organizations?.map(org => ({ value: org.id, label: org.name })) || []
  }, [permissionsData])

  const allCompanies = useMemo(() => {
    return permissionsData?.data?.companies || []
  }, [permissionsData])

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isDirty, isSubmitted },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      organization_id: '',
      company_id: '',
      permissions: [],
    },
  })

  // Manually register permissions field so React Hook Form tracks its validation
  useEffect(() => {
    register('permissions')
  }, [register])

  // Watch organization to filter companies
  const selectedOrgId = watch('organization_id')

  const companyOptions = useMemo(() => {
    if (!selectedOrgId) {
      return allCompanies.map(c => ({ value: c.id, label: c.company_name }))
    }
    return allCompanies
      .filter(c => String(c.organization_id) === String(selectedOrgId))
      .map(c => ({ value: c.id, label: c.company_name }))
  }, [selectedOrgId, allCompanies])

  // Sync permissions selection with react-hook-form
  useEffect(() => {
    setValue('permissions', selectedIds, { shouldDirty: true })
    trigger('permissions')
  }, [selectedIds, setValue, trigger])

  // Flat list of all available permission items
  const allPermissionItems = useMemo<PermissionItem[]>(() => {
    const list: PermissionItem[] = []
    Object.values(groupedPermissions).forEach(groups => {
      Object.values(groups).forEach(perms => {
        perms.forEach(p => list.push(p))
      })
    })
    return list
  }, [groupedPermissions])

  // Helper to categorize permissions in a group into standard CRUD vs custom
  const getCategorizedPerms = (perms: PermissionItem[]) => {
    const actions = ['view', 'create', 'edit', 'delete'] as const
    const standard: Record<typeof actions[number], PermissionItem | null> = {
      view: null,
      create: null,
      edit: null,
      delete: null,
    }
    const other: PermissionItem[] = []

    perms.forEach(perm => {
      let matchedAction: typeof actions[number] | null = null
      for (const act of actions) {
        if (perm.name.toLowerCase().includes(act)) {
          matchedAction = act
          break
        }
      }
      if (matchedAction) {
        standard[matchedAction] = perm
      } else {
        other.push(perm)
      }
    })

    return { standard, other }
  }

  // ----------------------------------------------------
  // Selection Logic Handlers
  // ----------------------------------------------------

  // 1. Single Toggle
  const handleToggle = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  // Helper to get all permission IDs inside a specific module
  const getModulePermissionIds = (moduleName: string): number[] => {
    const ids: number[] = []
    const groups = groupedPermissions[moduleName] || {}
    Object.values(groups).forEach(perms => {
      perms.forEach(p => ids.push(p.id))
    })
    return ids
  }

  // Helper to get all permission IDs for a specific group (row)
  const getGroupPermissionIds = (moduleName: string, groupName: string): number[] => {
    const perms = groupedPermissions[moduleName]?.[groupName] || []
    return perms.map(p => p.id)
  }

  // Helper to get all permission IDs in a module matching a column action
  const getColumnPermissionIds = (moduleName: string, action: string): number[] => {
    const ids: number[] = []
    const groups = groupedPermissions[moduleName] || {}
    Object.values(groups).forEach(perms => {
      perms.forEach(p => {
        if (p.name.toLowerCase().includes(action.toLowerCase())) {
          ids.push(p.id)
        }
      })
    })
    return ids
  }

  // Toggle select all (Global Master)
  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(allPermissionItems.map(p => p.id))
    } else {
      setSelectedIds([])
    }
  }

  // Toggle select all in a Module
  const handleToggleModule = (moduleName: string, checked: boolean) => {
    const moduleIds = getModulePermissionIds(moduleName)
    if (checked) {
      setSelectedIds(prev => Array.from(new Set([...prev, ...moduleIds])))
    } else {
      setSelectedIds(prev => prev.filter(id => !moduleIds.includes(id)))
    }
  }

  // Toggle select all in a specific Group (Row)
  const handleToggleGroup = (moduleName: string, groupName: string, checked: boolean) => {
    const groupIds = getGroupPermissionIds(moduleName, groupName)
    if (checked) {
      setSelectedIds(prev => Array.from(new Set([...prev, ...groupIds])))
    } else {
      setSelectedIds(prev => prev.filter(id => !groupIds.includes(id)))
    }
  }

  // Toggle select all in a specific Column of a Module
  const handleToggleColumn = (moduleName: string, action: string, checked: boolean) => {
    const columnIds = getColumnPermissionIds(moduleName, action)
    if (checked) {
      setSelectedIds(prev => Array.from(new Set([...prev, ...columnIds])))
    } else {
      setSelectedIds(prev => prev.filter(id => !columnIds.includes(id)))
    }
  }

  // ----------------------------------------------------
  // Checked / Indeterminate States Checkers
  // ----------------------------------------------------

  const isGlobalAllChecked = useMemo(() => {
    if (allPermissionItems.length === 0) return false
    return allPermissionItems.every(p => selectedIds.includes(p.id))
  }, [allPermissionItems, selectedIds])

  const isGlobalSomeChecked = useMemo(() => {
    return selectedIds.length > 0 && !isGlobalAllChecked
  }, [selectedIds, isGlobalAllChecked])

  const isModuleAllChecked = (moduleName: string) => {
    const ids = getModulePermissionIds(moduleName)
    if (ids.length === 0) return false
    return ids.every(id => selectedIds.includes(id))
  }

  const isModuleSomeChecked = (moduleName: string) => {
    const ids = getModulePermissionIds(moduleName)
    if (ids.length === 0) return false
    const checkedCount = ids.filter(id => selectedIds.includes(id)).length
    return checkedCount > 0 && checkedCount < ids.length
  }

  const isGroupAllChecked = (moduleName: string, groupName: string) => {
    const ids = getGroupPermissionIds(moduleName, groupName)
    if (ids.length === 0) return false
    return ids.every(id => selectedIds.includes(id))
  }

  const isGroupSomeChecked = (moduleName: string, groupName: string) => {
    const ids = getGroupPermissionIds(moduleName, groupName)
    if (ids.length === 0) return false
    const checkedCount = ids.filter(id => selectedIds.includes(id)).length
    return checkedCount > 0 && checkedCount < ids.length
  }

  const isColumnAllChecked = (moduleName: string, action: string) => {
    const ids = getColumnPermissionIds(moduleName, action)
    if (ids.length === 0) return false
    return ids.every(id => selectedIds.includes(id))
  }

  const isColumnSomeChecked = (moduleName: string, action: string) => {
    const ids = getColumnPermissionIds(moduleName, action)
    if (ids.length === 0) return false
    const checkedCount = ids.filter(id => selectedIds.includes(id)).length
    return checkedCount > 0 && checkedCount < ids.length
  }

  // ----------------------------------------------------
  // Form Submission & Dirty Protection
  // ----------------------------------------------------

  const handleBackOrCancel = () => {
    if (isDirty) {
      setIsDiscardModalOpen(true)
    } else {
      navigate({ to: '/role' })
    }
  }

  const onSubmit = (data: RoleFormValues) => {
    const payload = {
      name: data.name,
      permissions: data.permissions,
      ...(isSuperAdmin && data.organization_id ? { organization_id: Number(data.organization_id) } : {}),
      ...(isSuperAdmin && data.company_id ? { company_id: Number(data.company_id) } : {}),
    }

    createRole(payload, {
      onSuccess: () => {
        showNotificationModal(
          'Saved Successfully!',
          'The new role has been created successfully.',
          'success'
        )
        navigate({ to: '/role' })
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || error.message || 'Failed to create role.'
        showNotificationModal('Submission Failed', message, 'error')
      },
    })
  }

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-10 font-poppins text-[#475569]">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBackOrCancel}
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </button>
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">Add New Role</h1>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Main Info Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold text-slate-800 tracking-tight">New Role</h2>
                  <p className="text-[12px] text-gray-400 font-medium">Define a role and assign specific permissions for your team members.</p>
                </div>
              </div>
              <Info className="h-5 w-5 text-gray-300" />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <FormField label="Role Name" error={errors.name?.message} required>
                <input
                  {...register('name')}
                  type="text"
                  placeholder="e.g. Senior Inventory Manager"
                  className="erp-input w-full"
                  autoComplete="off"
                />
                <p className="text-[11px] text-gray-400 mt-1 font-medium">Avoid using generic names like "User" or "Admin" for better clarity.</p>
              </FormField>
            </div>

            {isSuperAdmin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <FormField label="Organization" error={errors.organization_id?.message}>
                  <Controller
                    name="organization_id"
                    control={control}
                    render={({ field }) => (
                      <Select2
                        {...field}
                        options={organizationOptions}
                        placeholder="Select Organization"
                        isLoading={isLoading}
                      />
                    )}
                  />
                </FormField>

                <FormField label="Company" error={errors.company_id?.message}>
                  <Controller
                    name="company_id"
                    control={control}
                    render={({ field }) => (
                      <Select2
                        {...field}
                        options={companyOptions}
                        placeholder="Select Company"
                        isLoading={isLoading}
                      />
                    )}
                  />
                </FormField>
              </div>
            )}
          </div>

          {/* Permissions Matrix Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
            <div>
              <h3 className="text-[16px] font-semibold text-slate-800 tracking-tight">Assign Permissions</h3>
              <p className="text-[12px] text-gray-400 font-medium">Configure access levels for each module.</p>
            </div>
            
            <div className="flex items-center bg-white px-4 py-2.5 rounded-lg border border-gray-150 shadow-sm">
              <input
                type="checkbox"
                id="select-all-global"
                checked={isGlobalAllChecked}
                ref={el => {
                  if (el) el.indeterminate = isGlobalSomeChecked
                }}
                onChange={e => handleToggleAll(e.target.checked)}
                className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary/20 accent-[#059669] cursor-pointer"
              />
              <label htmlFor="select-all-global" className="ml-2.5 text-[11px] font-bold text-slate-700 select-none uppercase tracking-wider cursor-pointer">
                Select All Permissions
              </label>
            </div>
          </div>

          {isSubmitted && errors.permissions && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-lg text-[13px] font-medium">
              {errors.permissions.message}
            </div>
          )}

          {/* Permissions Tables Grid (2x2 Layout matching mockup) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.keys(groupedPermissions).map(moduleName => {
              const groups = groupedPermissions[moduleName] || {}
              return (
                <div key={moduleName} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                  {/* Module Box Title */}
                  <div className="bg-slate-50/75 border-b border-gray-100 px-4 py-4.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50/80 flex items-center justify-center text-primary">
                        <Briefcase className="h-4.5 w-4.5 text-blue-600" />
                      </div>
                      <span className="text-[14px] font-semibold text-slate-800 tracking-tight">{moduleName}</span>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`module-${moduleName}`}
                        checked={isModuleAllChecked(moduleName)}
                        ref={el => {
                          if (el) el.indeterminate = isModuleSomeChecked(moduleName)
                        }}
                        onChange={e => handleToggleModule(moduleName, e.target.checked)}
                        className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary/20 accent-[#059669] cursor-pointer"
                      />
                      <label htmlFor={`module-${moduleName}`} className="ml-2 text-[10px] font-bold text-gray-400 uppercase select-none tracking-wider cursor-pointer">
                        Select Module
                      </label>
                    </div>
                  </div>

                  {/* Grid Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 bg-slate-50/30 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          <th className="py-3 px-4 w-[40%]">Feature</th>
                          {['View', 'Create', 'Edit', 'Delete'].map(action => (
                            <th key={action} className="py-3 px-2 text-center w-[15%]">
                              <div className="flex flex-col items-center gap-1.5">
                                <span>{action}</span>
                                <input
                                  type="checkbox"
                                  checked={isColumnAllChecked(moduleName, action)}
                                  ref={el => {
                                    if (el) el.indeterminate = isColumnSomeChecked(moduleName, action)
                                  }}
                                  onChange={e => handleToggleColumn(moduleName, action, e.target.checked)}
                                  className="w-3.5 h-3.5 rounded text-primary border-gray-200 focus:ring-primary/20 accent-[#059669] cursor-pointer"
                                />
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {Object.keys(groups).map(groupName => {
                          const permsInGroup = groups[groupName] || []
                          const { standard, other } = getCategorizedPerms(permsInGroup)

                          return (
                            <>
                              {/* Standard CRUD Row */}
                              {permsInGroup.some(p => ['view', 'create', 'edit', 'delete'].some(a => p.name.toLowerCase().includes(a))) && (
                                <tr key={groupName} className="hover:bg-slate-50/20 transition-colors text-[12px]">
                                  <td className="py-3.5 px-4 font-medium text-slate-700">
                                    <span className="select-none">
                                      {groupName.replace(/_/g, ' ')}
                                    </span>
                                  </td>
                                  
                                  {/* Standard Actions Checkboxes */}
                                  {(['view', 'create', 'edit', 'delete'] as const).map(act => {
                                    const item = standard[act]
                                    return (
                                      <td key={act} className="py-3.5 px-2 text-center">
                                        {item ? (
                                          <input
                                            type="checkbox"
                                            checked={selectedIds.includes(item.id)}
                                            onChange={() => handleToggle(item.id)}
                                            className="w-4 h-4 rounded text-primary border-gray-250 focus:ring-primary/20 accent-[#059669] cursor-pointer"
                                          />
                                        ) : (
                                          <span className="text-gray-250 select-none">—</span>
                                        )}
                                      </td>
                                    )
                                  })}
                                </tr>
                              )}

                              {/* Other/Special Custom Rows */}
                              {other.map(oPerm => (
                                <tr key={oPerm.id} className="hover:bg-slate-50/20 transition-colors text-[12px]">
                                  <td className="py-3.5 px-4 font-medium text-slate-700">
                                    <span className="select-none">
                                      {oPerm.name.split('.').pop()?.replace(/_/g, ' ') || oPerm.name}
                                    </span>
                                  </td>
                                  
                                  {/* Other permissions are placed under "View", rest are dashes */}
                                  <td className="py-3.5 px-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={selectedIds.includes(oPerm.id)}
                                      onChange={() => handleToggle(oPerm.id)}
                                      className="w-4 h-4 rounded text-primary border-gray-250 focus:ring-primary/20 accent-[#059669] cursor-pointer"
                                    />
                                  </td>
                                  <td className="py-3.5 px-2 text-center">
                                    <span className="text-gray-250 select-none">—</span>
                                  </td>
                                  <td className="py-3.5 px-2 text-center">
                                    <span className="text-gray-250 select-none">—</span>
                                  </td>
                                  <td className="py-3.5 px-2 text-center">
                                    <span className="text-gray-250 select-none">—</span>
                                  </td>
                                </tr>
                              ))}
                            </>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-150 max-w-[1600px] mx-auto">
            <button
              type="button"
              onClick={handleBackOrCancel}
              className="bg-white text-[#64748b] border border-gray-200 px-6 h-10 rounded-lg hover:bg-gray-50 transition-all shadow-sm text-[13px] font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#059669] hover:bg-[#047857] text-white px-8 h-10 rounded-lg transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 text-[13px] font-semibold disabled:opacity-50"
            >
              <Check className="h-4 w-4" strokeWidth={3} />
              <span>Save</span>
            </button>
          </div>
        </form>
      </div>

      {/* Discard Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDiscardModalOpen}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        onConfirm={() => navigate({ to: '/role' })}
        onCancel={() => setIsDiscardModalOpen(false)}
        confirmText="Yes, discard"
        cancelText="Keep editing"
        variant="danger"
      />
    </div>
  )
}
