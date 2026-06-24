import { useState, useMemo, useEffect } from 'react'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { CoaTree } from '../../components/CoaTree'
import { CoaForm } from '../../components/CoaForm'
import { useGetAccountList } from '../../hooks/useCoa'
import { buildCoaTree } from '../../utils/coa-helpers'
import { LoadingState } from '@/components/Loading/LoadingState'
import { Landmark } from 'lucide-react'
import { coaApi } from '../../api/coa.api'
import { clsx } from 'clsx'

export const ChartOfAccountPage = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<'edit' | 'new'>('edit')
  const [formData, setFormData] = useState<any>(null)
  const [isLoadingForm, setIsLoadingForm] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['1', '2', '3', '4', '5']))

  const { data: accountList, isLoading: isLoadingList } = useGetAccountList()

  // Build the hierarchical tree data
  const rawTreeData = useMemo(() => {
    if (!accountList || !Array.isArray(accountList)) return []
    return buildCoaTree(accountList)
  }, [accountList])

  // Filter the tree based on globalSearch
  const treeData = useMemo(() => {
    if (!globalSearch) return rawTreeData

    const searchLower = globalSearch.toLowerCase()

    const filterTree = (nodes: any[]): any[] => {
      return nodes
        .map(node => {
          const filteredChildren = node.children ? filterTree(node.children) : []
          const matchesSearch = 
            node.name.toLowerCase().includes(searchLower) || 
            node.id.toString().toLowerCase().includes(searchLower)

          if (matchesSearch || filteredChildren.length > 0) {
            return {
              ...node,
              children: filteredChildren
            }
          }
          return null
        })
        .filter((node): node is any => node !== null)
    }

    return filterTree(rawTreeData)
  }, [rawTreeData, globalSearch])

  // Auto-expand paths leading to search results
  useEffect(() => {
    if (globalSearch && accountList) {
      const searchLower = globalSearch.toLowerCase()
      const newExpanded = new Set<string>()

      accountList.forEach(item => {
        const matches = 
          item.head_name.toLowerCase().includes(searchLower) || 
          item.head_code.toString().toLowerCase().includes(searchLower)

        if (matches) {
          let parentCode = item.p_head_code
          while (parentCode && parentCode !== '0' && parentCode !== 0) {
            newExpanded.add(parentCode.toString())
            const parentItem = accountList.find(a => a.head_code.toString() === parentCode.toString())
            parentCode = parentItem ? parentItem.p_head_code : '0'
          }
        }
      })

      setExpandedIds(newExpanded)
    } else {
      // Default initial expanded codes when search is empty
      setExpandedIds(new Set(['1', '2', '3', '4', '5']))
    }
  }, [globalSearch, accountList])

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

  // Load form data when a node is selected or "New" is clicked
  useEffect(() => {
    if (selectedId) {
      const fetchForm = async () => {
        setIsLoadingForm(true)
        try {
          if (mode === 'edit') {
            const data = await coaApi.getForm(selectedId)
            setFormData(data)
          } else {
            const data = await coaApi.getNewFormDefaults(selectedId)
            setFormData(data)
          }
        } catch (error) {
          console.error('Error fetching COA form:', error)
        } finally {
          setIsLoadingForm(false)
        }
      }
      fetchForm()
    }
  }, [selectedId, mode])

  // Smooth scroll to the form card when the form is opened and data is loaded
  useEffect(() => {
    if (selectedId && formData) {
      const timer = setTimeout(() => {
        const formElement = document.getElementById('coa-form-container')
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [selectedId, formData])

  const handleSelect = (id: string) => {
    setMode('edit')
    setSelectedId(id)
  }

  const handleNew = (parentId: string) => {
    setMode('new')
    setSelectedId(parentId)
  }

  const handleUndo = () => {
    setMode('edit')
  }

  const handleToggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleExpandAll = () => {
    if (!accountList) return
    const allCodes = accountList.map(a => a.head_code.toString())
    setExpandedIds(new Set(allCodes))
  }

  const handleCollapseAll = () => {
    setExpandedIds(new Set())
  }

  const customToolbarRight = (
    <div className="flex items-center gap-3">
      <button 
        onClick={handleExpandAll}
        className="h-8 px-5 bg-[#f1f3f7] hover:bg-[#e2e8f0] text-slate-600 hover:text-slate-800 text-[12px] font-medium rounded-full flex items-center gap-2 transition-all active:scale-95 shadow-sm font-poppins"
      >
        <svg className="h-4 w-4 fill-current text-slate-600 stroke-slate-600" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6H6z" />
        </svg>
        Expand All
      </button>
      <button 
        onClick={handleCollapseAll}
        className="h-8 px-5 bg-[#f1f3f7] hover:bg-[#e2e8f0] text-slate-600 hover:text-slate-800 text-[12px] font-medium rounded-full flex items-center gap-2 transition-all active:scale-95 shadow-sm font-poppins"
      >
        <svg className="h-4 w-4 fill-current text-slate-600 stroke-slate-600" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M9 6l6 6-6 6V6z" />
        </svg>
        Collapse All
      </button>
    </div>
  )

  return (
    <ListPageLayout<any>
      title="Chart of Account"
      titleOptions={navOptions}
      tabs={tabs}
      backTo="/"
      showSearch={true}
      searchValue={globalSearch}
      onSearchChange={setGlobalSearch}
      toolbarRightExtra={customToolbarRight}
      showStatusFilter={false}
      showColumnFilter={false}
      rowData={[]}
      columnDefs={[]}
      isLoading={false}
      recordsTotal={0}
      currentPage={1}
      pageSize={10}
      totalPages={1}
      onPageChange={() => {}}
      onPageSizeChange={() => {}}
    >
      {isLoadingList ? (
        <div className="min-h-[500px] flex items-center justify-center">
          <LoadingState message="Loading Chart of Accounts..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Side: Tree View (takes full 12 cols if no item is selected, else contracts to 7 cols) */}
          <div className={clsx(
            "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col h-full transition-all duration-300 ease-in-out",
            selectedId ? "lg:col-span-7" : "lg:col-span-12"
          )}>
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
              {treeData.length > 0 ? (
                <CoaTree
                  items={treeData}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  expandedIds={expandedIds}
                  onToggleExpand={handleToggleExpand}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center min-h-[500px]">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <Landmark className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-[16px] font-bold text-[#1e293b] mb-2 font-poppins">No Accounts Found</h3>
                  <p className="text-[13px] text-gray-500 max-w-[250px] font-poppins">
                    No Chart of Accounts data found or loaded at the moment.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Form View (renders and slides in from the right when an account is selected) */}
          {selectedId && formData && (
            <div id="coa-form-container" className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit self-start animate-in fade-in slide-in-from-right-5 duration-300 ease-in-out">
              <div className={clsx("transition-opacity duration-300", isLoadingForm ? "opacity-50" : "opacity-100")}>
                <CoaForm
                  initialData={formData}
                  mode={mode}
                  isLoading={isLoadingForm}
                  onNew={handleNew}
                  onUndo={handleUndo}
                  onClose={() => setSelectedId(null)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </ListPageLayout>
  )
}
