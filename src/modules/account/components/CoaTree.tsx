import { clsx } from 'clsx'
import type { TreeItem } from '../api/coa.api'

interface CoaTreeProps {
  items: TreeItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
}

export const CoaTree = ({ items, selectedId, onSelect, expandedIds, onToggleExpand }: CoaTreeProps) => {

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1:
        return 'Type'
      case 2:
        return 'Category'
      case 3:
        return 'Sub Category'
      case 4:
        return 'Group'
      case 5:
        return 'Sub Group'
      default:
        return 'Sub Group'
    }
  }

  const renderNode = (node: TreeItem, depth: number) => {
    const nodeIdStr = node.id.toString()
    const isExpanded = expandedIds.has(nodeIdStr)
    const hasChildren = node.children && node.children.length > 0
    const isSelected = selectedId === nodeIdStr

    return (
      <div key={nodeIdStr} className="relative select-none">
        {/* Table-tree Row */}
        <div 
          className={clsx(
            "grid grid-cols-12 gap-4 px-4 py-2.5 items-center border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-default text-[13px] font-poppins",
            isSelected ? "bg-blue-50/50" : "bg-white"
          )}
        >
          {/* VALUE Column */}
          <div 
            className="col-span-6 flex items-center" 
            style={{ paddingLeft: `${depth * 20}px` }}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleExpand(nodeIdStr)
                }}
                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 mr-1 shrink-0 transition-colors"
              >
                {isExpanded ? (
                  <svg className="h-4 w-4 fill-current text-slate-500 stroke-slate-500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M6 9l6 6 6-6H6z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 fill-current text-slate-500 stroke-slate-500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M9 6l6 6-6 6V6z" />
                  </svg>
                )}
              </button>
            ) : (
              /* Custom bent elbow arrow for child items */
              <svg className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0 ml-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5v7h7m-3-3l3 3-3 3" />
              </svg>
            )}

            <span className={clsx(
              "font-medium tracking-wide",
              isSelected ? "text-primary font-semibold" : "text-slate-700"
            )}>
              {node.name}
            </span>
          </div>

          {/* LEVEL Column */}
          <div className="col-span-3 text-slate-400 font-medium">
            {getLevelLabel(node.level)}
          </div>

          {/* STATUS Column */}
          <div className="col-span-2">
            <span className={clsx(
              "text-[12px] font-semibold",
              node.is_active === 1 ? "text-blue-600" : "text-slate-400"
            )}>
              {node.is_active === 1 ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* ACTION Column */}
          <div className="col-span-1 text-right">
            <button 
              onClick={(e) => {
                e.stopPropagation()
                onSelect(nodeIdStr)
              }}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 inline-flex items-center justify-center transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
              </svg>
            </button>
          </div>
        </div>

        {/* Children Recursion */}
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => 
              renderNode(child, depth + 1)
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-poppins shrink-0">
        <div className="col-span-6">Value</div>
        <div className="col-span-3">Level</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-1 text-right">Action</div>
      </div>
      
      {/* Table Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {items.map((item) => renderNode(item, 0))}
      </div>
    </div>
  )
}
