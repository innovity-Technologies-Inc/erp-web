import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { useBudgetDetails } from '../../hooks/useBudgets'
import { useSettings } from '@/hooks/useSettings'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { clsx } from 'clsx'
import { PieChart, DollarSign, ArrowUpRight, ShieldAlert, CheckCircle2 } from 'lucide-react'

interface BudgetDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  budgetUuid: string | null
}

const statusBadgeColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  closed: 'bg-gray-100 text-gray-500 border-gray-200',
}

export const BudgetDetailsModal = ({
  isOpen,
  onClose,
  budgetUuid,
}: BudgetDetailsModalProps) => {
  const { currency, currencyPosition } = useSettings()
  const { data, isLoading } = useBudgetDetails(budgetUuid)
  const budget = (data as any)?.response || (data as any)?.data || (data as any)

  if (!isOpen) return null

  const allocatedLimit = budget?.allocated_limit ? Number(budget.allocated_limit) : Number(budget?.allocated_amount || 0)
  const utilizedAmount = budget?.utilized_amount ? Number(budget.utilized_amount) : 0
  const committedAmount = budget?.committed_amount ? Number(budget.committed_amount) : 0
  const availableBalance = budget?.available_balance ? Number(budget.available_balance) : allocatedLimit - utilizedAmount - committedAmount

  const utilizationPercent = allocatedLimit > 0 ? Math.min(100, Math.round(((utilizedAmount + committedAmount) / allocatedLimit) * 100)) : 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={budget?.budget_no ? `Budget Details — ${budget.budget_no}` : 'Budget Allocation Details'}
      footer={
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="py-12 flex justify-center items-center text-gray-400 text-sm">
          Loading budget details...
        </div>
      ) : !budget ? (
        <div className="py-8 text-center text-gray-500">No details found.</div>
      ) : (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-blue-700 font-semibold text-[11px] uppercase tracking-normal">
                <div className="p-1 bg-blue-100/80 rounded-md shrink-0">
                  <DollarSign className="h-3 w-3" />
                </div>
                <span className="leading-tight">Allocated Limit</span>
              </div>
              <p className="text-sm font-bold font-mono text-gray-900 mt-2">
                {formatCurrency(allocatedLimit, currency, currencyPosition)}
              </p>
            </div>

            <div className="p-3 bg-purple-50/60 border border-purple-200/80 rounded-xl flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-purple-700 font-semibold text-[11px] uppercase tracking-normal">
                <div className="p-1 bg-purple-100/80 rounded-md shrink-0">
                  <ArrowUpRight className="h-3 w-3" />
                </div>
                <span className="leading-tight">Utilized (Vouchers)</span>
              </div>
              <p className="text-sm font-bold font-mono text-gray-900 mt-2">
                {formatCurrency(utilizedAmount, currency, currencyPosition)}
              </p>
            </div>

            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-amber-700 font-semibold text-[11px] uppercase tracking-normal">
                <div className="p-1 bg-amber-100/80 rounded-md shrink-0">
                  <ShieldAlert className="h-3 w-3" />
                </div>
                <span className="leading-tight">Committed (PR/PO)</span>
              </div>
              <p className="text-sm font-bold font-mono text-gray-900 mt-2">
                {formatCurrency(committedAmount, currency, currencyPosition)}
              </p>
            </div>

            <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px] uppercase tracking-normal">
                <div className="p-1 bg-emerald-100/80 rounded-md shrink-0">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <span className="leading-tight">Available Balance</span>
              </div>
              <p className="text-sm font-bold font-mono text-emerald-700 mt-2">
                {formatCurrency(availableBalance, currency, currencyPosition)}
              </p>
            </div>
          </div>

          {/* Utilization Progress Bar */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                <PieChart className="h-3.5 w-3.5 text-primary" /> Budget Utilization
              </span>
              <span className="font-bold text-gray-900">{utilizationPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={clsx(
                  'h-2 transition-all duration-500 rounded-full',
                  utilizationPercent > 90
                    ? 'bg-rose-500'
                    : utilizationPercent > 70
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                )}
                style={{ width: `${utilizationPercent}%` }}
              />
            </div>
          </div>

          {/* Allocation Info Table */}
          <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 text-xs">
            <div className="p-2.5 flex justify-between">
              <span className="text-gray-500">Financial Year:</span>
              <span className="font-medium text-gray-900">{budget.financial_year?.year || '—'}</span>
            </div>
            <div className="p-2.5 flex justify-between">
              <span className="text-gray-500">Cost Center:</span>
              <span className="font-medium text-gray-900">{budget.cost_center?.name || '—'}</span>
            </div>
            <div className="p-2.5 flex justify-between">
              <span className="text-gray-500">Budget Head:</span>
              <span className="font-medium text-gray-900">{budget.budget_head?.name || '—'}</span>
            </div>
            {budget.remarks && (
              <div className="p-2.5 flex justify-between">
                <span className="text-gray-500">Remarks:</span>
                <span className="font-medium text-gray-900">{budget.remarks}</span>
              </div>
            )}
            <div className="p-2.5 flex justify-between">
              <span className="text-gray-500">Created At:</span>
              <span className="text-gray-600">{budget.created_at ? formatDate(budget.created_at) : '—'}</span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
