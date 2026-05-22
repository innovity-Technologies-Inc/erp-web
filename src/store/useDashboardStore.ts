import { create } from 'zustand'
import { format, startOfMonth, endOfMonth } from 'date-fns'

interface DateRange {
  from: string
  to: string
}

interface DashboardState {
  globalRange: DateRange
  expenseRange: DateRange
  bestSaleRange: DateRange
  trendRange: DateRange
  channelRange: DateRange
  isCustomGlobal: boolean
  
  setGlobalRange: (from: string, to: string) => void
  setExpenseRange: (from: string, to: string) => void
  setBestSaleRange: (from: string, to: string) => void
  setTrendRange: (from: string, to: string) => void
  setChannelRange: (from: string, to: string) => void
  
  resetDashboard: () => void
}

const getMonthRange = () => ({
  from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
  to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
})

const initialRange: DateRange = { from: '', to: '' }

export const useDashboardStore = create<DashboardState>((set) => ({
  globalRange: initialRange,
  expenseRange: getMonthRange(),
  bestSaleRange: getMonthRange(),
  trendRange: getMonthRange(),
  channelRange: getMonthRange(),
  isCustomGlobal: false,
  
  setGlobalRange: (from, to) => set({ 
    globalRange: { from, to },
    isCustomGlobal: !!from 
  }),
  
  setExpenseRange: (from, to) => set({ expenseRange: { from, to } }),
  setBestSaleRange: (from, to) => set({ bestSaleRange: { from, to } }),
  setTrendRange: (from, to) => set({ trendRange: { from, to } }),
  setChannelRange: (from, to) => set({ channelRange: { from, to } }),
  
  resetDashboard: () => set({ 
    globalRange: initialRange,
    expenseRange: getMonthRange(),
    bestSaleRange: getMonthRange(),
    trendRange: getMonthRange(),
    channelRange: getMonthRange(),
    isCustomGlobal: false
  }),
}))
