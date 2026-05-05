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
  Calendar,
  ChevronDown
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuthStore } from '@/store/useAuthStore'
import { useState, useEffect } from 'react'

interface StatCardProps {
  name: string
  value: string | number
  icon: any
  color: string
  className?: string
}

const StatCard = ({ name, value, icon: Icon, color, className }: StatCardProps) => (
  <div className={clsx("bg-card-bg/60 p-3 rounded-[10px] shadow-sm flex flex-col items-start gap-1.5 relative mt-3 group hover:shadow-md transition-all h-full border border-white/40", className)}>
    <div className={clsx(
        "w-9 h-9 rounded-xl flex items-center justify-center shadow-md absolute -top-3 left-4 transition-transform group-hover:scale-110", 
        color
    )}>
      <Icon className="h-5 w-5" strokeWidth={2.5} />
    </div>
    
    <div className="flex flex-col gap-0 mt-5">
      <p className="text-[10px] font-bold text-gray-400 tracking-tight leading-none mb-1">{name}</p>
      <p className="text-xl font-black text-gray-600 tracking-tighter">{value}</p>
    </div>
  </div>
)

const DonutChartMock = () => (
  <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
    <svg className="w-full h-full transform -rotate-90">
      <circle cx="48" cy="48" r="38" stroke="#f3f4f6" strokeWidth="10" fill="transparent" />
      <circle cx="48" cy="48" r="38" stroke="#ef4444" strokeWidth="10" strokeDasharray="238" strokeDashoffset="150" fill="transparent" strokeLinecap="round" />
      <circle cx="48" cy="48" r="38" stroke="#22c55e" strokeWidth="10" strokeDasharray="238" strokeDashoffset="200" fill="transparent" strokeLinecap="round" />
      <circle cx="48" cy="48" r="38" stroke="#f59e0b" strokeWidth="10" strokeDasharray="238" strokeDashoffset="220" fill="transparent" strokeLinecap="round" />
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center">
       <span className="text-[8px] font-black text-gray-300 uppercase leading-none">Total</span>
       <span className="text-sm font-black text-gray-700">100%</span>
    </div>
  </div>
)

const HorizontalBarMock = ({ name, value, max }: { name: string, value: number, max: number }) => (
  <div className="flex items-center gap-3 w-full">
    <div className="w-[140px] shrink-0 text-[10px] font-bold text-gray-400 truncate text-left uppercase tracking-tight">
      {name}
    </div>
    <div className="flex-1 h-4 relative flex items-center">
      <div 
        className="h-2.5 bg-[#b3cbfb] rounded-full transition-all duration-1000 relative z-10" 
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  </div>
)

const AreaChartMock = () => (
  <div className="w-full h-80 relative mt-6 flex gap-6">
    {/* Y-Axis Labels */}
    <div className="flex flex-col justify-between text-[11px] font-bold text-gray-400/80 pb-10 w-16 text-right">
      <span>1,200,000</span>
      <span>1,000,000</span>
      <span>800,000</span>
      <span>600,000</span>
      <span>400,000</span>
      <span>200,000</span>
      <span className="text-gray-300">0</span>
    </div>

    <div className="flex-1 flex flex-col">
      <div className="flex-1 relative">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200">
          <defs>
            <linearGradient id="colorPurchase" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F8AFF" stopOpacity={0.4}/>
              <stop offset="100%" stopColor="#4F8AFF" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34D399" stopOpacity={0.4}/>
              <stop offset="100%" stopColor="#34D399" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          {/* Grid Lines */}
          {[0, 33.3, 66.6, 100, 133.3, 166.6, 200].map((y) => (
            <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#f3f4f6" strokeWidth="1.5" />
          ))}

          {/* Purchase Path (Blue) - Matching the screenshot bumps */}
          <path 
            d="M0,140 C50,140 80,60 150,60 C220,60 250,120 320,120 C390,120 420,70 500,70 C580,70 620,110 700,110 C780,110 820,40 900,40 C950,40 1000,70 1000,70 L1000,200 L0,200 Z" 
            fill="url(#colorPurchase)"
          />
          <path 
            d="M0,140 C50,140 80,60 150,60 C220,60 250,120 320,120 C390,120 420,70 500,70 C580,70 620,110 700,110 C780,110 820,40 900,40 C950,40 1000,70 1000,70" 
            fill="none" stroke="#4F8AFF" strokeWidth="3" strokeLinecap="round"
          />

          {/* Sales Path (Green) - Matching the screenshot bumps */}
          <path 
            d="M0,160 C50,160 80,180 150,180 C220,180 250,140 320,140 C390,140 420,160 500,160 C580,160 620,180 700,180 C780,180 820,140 900,140 C950,140 1000,160 1000,160 L1000,200 L0,200 Z" 
            fill="url(#colorSales)"
          />
          <path 
            d="M0,160 C50,160 80,180 150,180 C220,180 250,140 320,140 C390,140 420,160 500,160 C580,160 620,180 700,180 C780,180 820,140 900,140 C950,140 1000,160 1000,160" 
            fill="none" stroke="#34D399" strokeWidth="3" strokeLinecap="round"
          />
        </svg>
      </div>

      {/* X-Axis Labels */}
      <div className="flex justify-between mt-6 px-2 text-[11px] font-bold text-gray-400/80">
        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
          <span key={m}>{m}</span>
        ))}
      </div>
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
  const user = useAuthStore((state) => state.user)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDateTime = (date: Date) => {
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    const day = date.getDate()
    const month = date.toLocaleDateString('en-US', { month: 'long' })
    const year = date.getFullYear()
    const suffix = ['th', 'st', 'nd', 'rd']
    const v = day % 100
    const ordinal = (v >= 11 && v <= 13) ? 'th' : (suffix[day % 10] || 'th')
    return `${time} - ${day}${ordinal} ${month}, ${year}`
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-gray-700 tracking-tight">
            Hello, {user ? `${user.first_name} ${user.last_name}` : 'User'}
          </h1>
          <p className="text-sm text-gray-400 font-bold tracking-tight italic">
            {formatDateTime(currentTime)}
          </p>
        </div>

        <div className="flex items-center gap-4 min-w-0">
          <div className="relative w-56 shrink-0">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-card-bg/60 border border-gray-200 rounded-xl py-2 px-5 pr-10 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all placeholder:text-gray-300 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-3 px-3 py-2 bg-card-bg/60 border border-gray-50 rounded-xl text-[10px] font-bold text-gray-400 shadow-sm cursor-pointer hover:bg-card-bg transition-colors uppercase tracking-tight">
               <span>From</span>
               <Calendar className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <div className="flex items-center gap-3 px-3 py-2 bg-card-bg/60 border border-gray-50 rounded-xl text-[10px] font-bold text-gray-400 shadow-sm cursor-pointer hover:bg-card-bg transition-colors uppercase tracking-tight">
               <span>To</span>
               <Calendar className="h-3.5 w-3.5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid: Strictly Aligned with card_manage.png (3 and 3 divide) */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        
        {/* TOP ROW: 6 SMALL CARDS (Aligned 3 and 3) */}
        {stats.map((stat, idx) => (
          <div key={stat.name} className="col-span-12 md:col-span-4 lg:col-span-2">
            <StatCard {...stat} />
          </div>
        ))}

        {/* SECTION 2: LEFT GROUP (Under first 3 cards) */}
        <div className="col-span-12 lg:col-span-6 grid grid-cols-6 gap-6">
           {/* Total Sale (Aligns with Card 1) */}
           <div className="col-span-6 md:col-span-2 bg-card-bg/60 p-3 rounded-[10px] shadow-sm flex flex-col items-start gap-1 relative mt-3 border border-white/40 group hover:shadow-md transition-all">
              <div className="w-8 h-8 rounded-lg bg-[#e8f0fe] text-[#4285f4] flex items-center justify-center shadow-md absolute -top-3 left-4">
                 <Coins className="h-4 w-4" />
              </div>
              <div className="flex flex-col gap-0 mt-4">
                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Sale</p>
                 <p className="text-xl font-black text-gray-600 tracking-tighter">497</p>
              </div>
           </div>

           {/* Channel Wise Sale (Aligns with Cards 2 & 3) */}
           <div className="col-span-6 md:col-span-4 bg-card-bg/60 p-3 rounded-[10px] shadow-sm flex flex-col gap-2 relative mt-3 border border-white/40 group hover:shadow-md transition-all">
              <div className="w-8 h-8 rounded-lg bg-[#fff4e5] text-[#ff9800] flex items-center justify-center shadow-md absolute -top-3 left-4">
                 <PieChartIcon className="h-4 w-4" />
              </div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-4 ml-1">Channel Wise Sale</p>
              <div className="flex items-center gap-4 ml-1">
                 <div className="flex flex-col">
                    <span className="text-[8px] text-gray-400 uppercase font-black">Admin:</span>
                    <span className="text-lg font-black text-gray-600">497</span>
                 </div>
                 <div className="flex flex-col border-l border-gray-200 pl-3">
                    <span className="text-[8px] text-gray-400 uppercase font-black">Web:</span>
                    <span className="text-lg font-black text-gray-600">03</span>
                 </div>
                 <div className="flex flex-col border-l border-gray-200 pl-3">
                    <span className="text-[8px] text-gray-400 uppercase font-black">App:</span>
                    <span className="text-lg font-black text-gray-600">01</span>
                 </div>
              </div>
           </div>

           {/* Expense Statement (Full width of left group) */}
           <div className="col-span-6 bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-4">
              <div className="flex justify-between items-center px-1">
                 <h3 className="text-sm font-black text-[#544f6c] tracking-tight">Expense Statement (৳)</h3>
                 <div className="flex items-center gap-2 px-2 py-1 bg-[#f4f4f9] rounded-full text-[8px] font-black text-gray-400 shadow-sm cursor-pointer uppercase tracking-tight">
                    <span>Weekly</span>
                    <ChevronDown className="h-3 w-3" />
                 </div>
              </div>

              <div className="flex items-center gap-6 mt-1">
                 <DonutChartMock />
                 <div className="grid grid-cols-2 gap-x-6 gap-y-3 flex-1">
                    {[
                       { label: 'Total Purchase', value: '525', percent: '34.93%', color: 'bg-[#ef4444]' },
                       { label: 'Total Sale', value: '224', percent: '40.11%', color: 'bg-[#22c55e]' },
                       { label: 'Total Expense', value: '145', percent: '25.00%', color: 'bg-[#f59e0b]' },
                       { label: 'Employee Salary', value: '145', percent: '25.00%', color: 'bg-[#4285f4]' },
                       { label: 'Service', value: '145', percent: '25.00%', color: 'bg-[#00bcd4]' },
                    ].map((item) => (
                       <div key={item.label} className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1">
                             <div className={clsx("w-1.5 h-1.5 rounded-full", item.color)}></div>
                             <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter truncate">{item.label}</span>
                          </div>
                          <div className="flex items-baseline gap-1 pl-2.5">
                             <span className="text-xs font-black text-gray-700">{item.value}</span>
                             <span className="text-[7px] font-bold text-gray-300">({item.percent})</span>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* SECTION 3: RIGHT GROUP (Under last 3 cards) */}
        <div className="col-span-12 lg:col-span-6 flex flex-col">
           {/* Best Sale Product (Tall, aligns with last 3 cards) */}
           <div className="flex-1 bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-6">
              <div className="flex justify-between items-center px-1">
                 <h3 className="text-sm font-black text-[#544f6c] tracking-tight">Best Sale Product</h3>
                 <div className="flex items-center gap-2 px-2 py-1 bg-[#f4f4f9] rounded-full text-[8px] font-black text-gray-400 shadow-sm cursor-pointer uppercase tracking-tight">
                    <span>Weekly</span>
                    <ChevronDown className="h-3 w-3" />
                 </div>
              </div>

              <div className="relative flex-1 mt-2">
                 {/* Background Grid Lines */}
                 <div className="absolute inset-0 left-[152px] flex justify-between pointer-events-none pr-1">
                    {[0, 200, 400, 600, 800, 1000, 1200].map((val) => (
                       <div key={val} className="h-full border-l border-gray-50 last:border-r" />
                    ))}
                 </div>

                 <div className="flex flex-col gap-4 pr-1 relative z-10">
                    {[
                       { name: 'Deshi Shad Paratha 2400gm', value: 1100 },
                       { name: 'Tatka Stolon of Taro 300gm', value: 350 },
                       { name: 'Lexus Vegetable Cracker 1800gm', value: 650 },
                       { name: 'Deshi Shad Paratha 1600gm', value: 550 },
                       { name: 'Deshi Tatka Beanseed 300gm', value: 1050 },
                       { name: 'Deshi Shad Dal Puri 454gm', value: 850 },
                    ].map((item) => (
                       <HorizontalBarMock key={item.name} name={item.name} value={item.value} max={1200} />
                    ))}
                 </div>

                 <div className="flex justify-between pl-[152px] mt-4 text-[10px] font-bold text-gray-400 pr-1">
                    {[0, 200, 400, 600, 800, 1000, 1200].map((val) => (
                       <span key={val} className="w-0 flex justify-center whitespace-nowrap">{val}</span>
                    ))}
                 </div>
              </div>
           </div>
        </div>

      </div>

      {/* Row 4: Full Width Monthly Report */}
      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-4 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <h3 className="text-xl font-black text-[#544f6c] tracking-tight px-1">Monthly Sales & Purchase Report</h3>
           <div className="flex items-center gap-8">
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className="w-5 h-[3px] bg-[#4F8AFF] rounded-full"></div>
                    <span className="text-[11px] font-bold text-[#4F8AFF] tracking-tight">Purchase</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-5 h-[3px] bg-[#34D399] rounded-full"></div>
                    <span className="text-[11px] font-bold text-[#544f6c] tracking-tight">Sales</span>
                 </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-[#f3f4f6] rounded-[12px] text-[11px] font-bold text-gray-400 shadow-sm cursor-pointer border border-transparent hover:bg-gray-200 transition-colors">
                 <span>Monthly</span>
                 <ChevronDown className="h-3.5 w-3.5" />
              </div>
           </div>
        </div>
        <AreaChartMock />
      </div>
    </div>
  )
}
