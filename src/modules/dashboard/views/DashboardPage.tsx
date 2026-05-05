import { 
  Users, 
  Package, 
  Store, 
  Warehouse, 
  Truck, 
  MessageCircle,
  Coins,
  PieChart as PieChartIcon,
  Search,
  Calendar
} from 'lucide-react'
import { clsx } from 'clsx'

interface StatCardProps {
  name: string
  value: string | number
  icon: any
  color: string
  className?: string
}

const StatCard = ({ name, value, icon: Icon, color, className }: StatCardProps) => (
  <div className={clsx("bg-card-bg/60 pt-4 pr-2 pl-2 pb-4 rounded-[10px] shadow-sm flex flex-col items-start gap-3 relative mt-4 group hover:shadow-md transition-all h-full", className)}>
    {/* Floating Icon Box */}
    <div className={clsx(
        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg absolute -top-4 left-6 transition-transform group-hover:scale-110 group-hover:-rotate-3", 
        color
    )}>
      <Icon className="h-6 w-6" strokeWidth={2.5} />
    </div>
    
    <div className="flex flex-col gap-0.5 mt-6">
      <p className="text-sm font-bold text-gray-400 tracking-tight">{name}</p>
      <p className="text-2xl font-black text-gray-600 tracking-tighter">{value}</p>
    </div>
  </div>
)

const stats = [
  { name: 'Total Merchant', value: '132', icon: Store, color: 'bg-[#e8f0fe] text-[#4285f4]' },
  { name: 'Total Product', value: '143', icon: Package, color: 'bg-[#fff4e5] text-[#ff9800]' },
  { name: 'Total Vendor', value: '14', icon: Users, color: 'bg-[#f3e8ff] text-[#9c27b0]' },
  { name: 'Total Warehouse', value: '05', icon: Warehouse, color: 'bg-[#e8fbf3] text-[#4caf50]' },
  { name: 'Total Purchase', value: '34', icon: Truck, color: 'bg-[#fffde7] text-[#fbc02d]' },
  { name: 'Total Contact Msg', value: '02', icon: MessageCircle, color: 'bg-[#e8f0fe] text-[#00bcd4]' },
]

export const DashboardPage = () => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Area with Search and Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-gray-700 tracking-tight">Hello, Kazi Sakib</h1>
          <p className="text-sm text-gray-400 font-bold tracking-tight italic">11:53 Am - 4th May, 2026</p>
        </div>

        <div className="flex items-center gap-4 min-w-0">
          {/* Search Bar */}
          <div className="relative w-64 shrink-0">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-card-bg/60 border border-gray-200 rounded-xl py-2 px-5 pr-12 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all placeholder:text-gray-300 font-medium"
            />
          </div>

          {/* Date Filters */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-3 px-4 py-2 bg-card-bg/60 border border-gray-50 rounded-xl text-xs font-bold text-gray-400 shadow-sm cursor-pointer hover:bg-card-bg transition-colors">
               <span>From</span>
               <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-card-bg/60 border border-gray-50 rounded-xl text-xs font-bold text-gray-400 shadow-sm cursor-pointer hover:bg-card-bg transition-colors">
               <span>To</span>
               <Calendar className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-10">
        {stats.map((stat) => (
          <StatCard key={stat.name} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 items-stretch">
        {/* Total Sale Card */}
        <div className="lg:col-span-3">
          <StatCard 
            name="Total Sale" 
            value="497" 
            icon={Coins} 
            color="bg-[#fff4e5] text-[#ff9800]" 
            className="" 
          />
        </div>

        {/* Channel Wise Sale */}
        <div className="lg:col-span-4 bg-card-bg/60 pt-4 pr-2 pl-2 pb-4 rounded-[15px] shadow-sm flex flex-col gap-4 relative mt-4 h-full">
          <div className="w-12 h-12 rounded-2xl bg-[#fef2f2] text-[#ef4444] flex items-center justify-center shadow-lg absolute -top-4 left-6">
            <PieChartIcon className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-tight mt-6">Channel Wise Sale</p>
          <div className="flex items-center gap-8 mt-2">
             <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Admin:</span>
                <span className="text-2xl font-black text-gray-600">497</span>
             </div>
             <div className="flex flex-col border-l border-gray-200 pl-6">
                <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Web:</span>
                <span className="text-2xl font-black text-gray-600 tracking-tighter">03</span>
             </div>
             <div className="flex flex-col border-l border-gray-200 pl-6">
                <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">App:</span>
                <span className="text-2xl font-black text-gray-600 tracking-tighter">01</span>
             </div>
          </div>
        </div>

        {/* Placeholder for Best Sale Product */}
        <div className="lg:col-span-5 bg-white p-4 rounded-[15px] shadow-sm border border-dashed border-gray-200 flex flex-col justify-center items-center text-gray-300 mt-4 h-full text-center">
           <p className="text-sm font-black uppercase tracking-[0.2em] italic">Best Sale Product Analysis</p>
           <p className="text-xs font-bold mt-2">Recharts Integration Ready</p>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
        <div className="lg:col-span-5 bg-white p-10 rounded-[40px] shadow-sm min-h-[350px] border border-dashed border-gray-200 flex items-center justify-center text-gray-300">
           <p className="text-sm font-black uppercase tracking-[0.2em] italic">Expense Statement</p>
        </div>
        <div className="lg:col-span-7 bg-white p-10 rounded-[40px] shadow-sm min-h-[350px] border border-dashed border-gray-200 flex items-center justify-center text-gray-300">
           <p className="text-sm font-black uppercase tracking-[0.2em] italic">Monthly Performance Trend</p>
        </div>
      </div>
    </div>
  )
}
