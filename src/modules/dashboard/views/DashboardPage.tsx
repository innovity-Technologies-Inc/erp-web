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
  <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
      {/* Outer Thin Ring */}
      <circle cx="50" cy="50" r="46" stroke="#f3f4f6" strokeWidth="1.5" fill="transparent" />
      <circle cx="50" cy="50" r="46" stroke="#FF7D5E" strokeWidth="1.5" strokeDasharray="289" strokeDashoffset="200" fill="transparent" strokeLinecap="round" />
      <circle cx="50" cy="50" r="46" stroke="#4ADE80" strokeWidth="1.5" strokeDasharray="289" strokeDashoffset="240" fill="transparent" strokeLinecap="round" />
      
      {/* Inner Thick Ring */}
      <circle cx="50" cy="50" r="34" stroke="#f3f4f6" strokeWidth="12" fill="transparent" />
      {/* Total Purchase (Coral) */}
      <circle cx="50" cy="50" r="34" stroke="#FF7D5E" strokeWidth="12" strokeDasharray="213.6" strokeDashoffset="140" fill="transparent" />
      {/* Total Sale (Green) */}
      <circle cx="50" cy="50" r="34" stroke="#4ADE80" strokeWidth="12" strokeDasharray="213.6" strokeDashoffset="185" fill="transparent" />
      {/* Total Expense (Yellow) */}
      <circle cx="50" cy="50" r="34" stroke="#FACC15" strokeWidth="12" strokeDasharray="213.6" strokeDashoffset="200" fill="transparent" />
      {/* Employee Salary (Blue) */}
      <circle cx="50" cy="50" r="34" stroke="#3B82F6" strokeWidth="12" strokeDasharray="213.6" strokeDashoffset="208" fill="transparent" />
      {/* Service (Light Blue) */}
      <circle cx="50" cy="50" r="34" stroke="#BFDBFE" strokeWidth="12" strokeDasharray="213.6" strokeDashoffset="212" fill="transparent" />
    </svg>
  </div>
)

const LegendItem = ({ label, value, percent, color }: { label: string, value: string, percent: string, color: string }) => (
  <div className="flex flex-col gap-0.5 min-w-0">
    <div className="flex items-center gap-1.5">
      <div className="relative w-3 h-3 shrink-0">
        <div className={clsx("absolute top-0 left-0 w-2 h-2 rounded-[1.5px] opacity-40", color)}></div>
        <div className={clsx("absolute bottom-0 right-0 w-2 h-2 rounded-[1.5px]", color)}></div>
      </div>
      <span className="text-[7px] font-bold text-gray-400">{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-[14px] font-black text-[#334155] tracking-tight">{value}</span>
      <span className="text-[8px] font-bold text-gray-400/70">({percent})</span>
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

const AreaChartMock = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Mock data that roughly matches the visual paths and screenshot
  const chartData = [
    { purchase: 360000, sales: 240000 },
    { purchase: 640000, sales: 120000 },
    { purchase: 840000, sales: 340000 },
    { purchase: 720000, sales: 400000 },
    { purchase: 640000, sales: 280000 },
    { purchase: 880000, sales: 340000 },
    { purchase: 800000, sales: 300000 }, // Jul
    { purchase: 720000, sales: 500000 },
    { purchase: 920000, sales: 360000 },
    { purchase: 1060000, sales: 500000 },
    { purchase: 840000, sales: 340000 },
    { purchase: 720000, sales: 480000 },
  ];

  const maxVal = 1200000;
  const getY = (val: number) => 200 - (val / maxVal) * 200;
  const getX = (index: number) => (index * 1000) / 11;

  // Function to generate smooth path from points
  const getPath = (data: any[], key: string, isClosed: boolean) => {
    const points = data.map((d, i) => ({ x: getX(i), y: getY(d[key]) }));
    let d = `M ${points[0].x},${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 2;
      const cp1y = curr.y;
      const cp2x = curr.x + (next.x - curr.x) / 2;
      const cp2y = next.y;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
    }
    
    if (isClosed) {
      d += ` L 1000,200 L 0,200 Z`;
    }
    return d;
  };

  return (
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
                <stop offset="0%" stopColor="#4F8AFF" stopOpacity={0.3}/>
                <stop offset="100%" stopColor="#4F8AFF" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34D399" stopOpacity={0.3}/>
                <stop offset="100%" stopColor="#34D399" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            {/* Grid Lines */}
            {[0, 33.3, 66.6, 100, 133.3, 166.6, 200].map((y) => (
              <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#f3f4f6" strokeWidth="1.5" />
            ))}

            {/* Purchase Path */}
            <path d={getPath(chartData, 'purchase', true)} fill="url(#colorPurchase)" />
            <path d={getPath(chartData, 'purchase', false)} fill="none" stroke="#4F8AFF" strokeWidth="1.5" strokeLinecap="round" />

            {/* Sales Path */}
            <path d={getPath(chartData, 'sales', true)} fill="url(#colorSales)" />
            <path d={getPath(chartData, 'sales', false)} fill="none" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" />

            {/* Hover Elements */}
            {hoveredIndex !== null && (
              <>
                <line 
                  x1={getX(hoveredIndex)} y1="0" 
                  x2={getX(hoveredIndex)} y2="200" 
                  stroke="#4F8AFF" strokeWidth="1" strokeDasharray="4 4" 
                />
                <circle 
                  cx={getX(hoveredIndex)} cy={getY(chartData[hoveredIndex].purchase)} 
                  r="4" fill="#4F8AFF" stroke="white" strokeWidth="2" 
                />
                <circle 
                  cx={getX(hoveredIndex)} cy={getY(chartData[hoveredIndex].sales)} 
                  r="4" fill="#34D399" stroke="white" strokeWidth="2" 
                />
              </>
            )}

            {/* Hitboxes */}
            {chartData.map((_, i) => (
              <rect
                key={i}
                x={getX(i) - 500/11}
                y="0"
                width={1000/11}
                height="200"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
          </svg>

          {/* Tooltip HTML overlay */}
          {hoveredIndex !== null && (
            <div 
              className="absolute bg-white/95 backdrop-blur-sm p-1.5 px-2 rounded-lg shadow-xl border border-blue-50/50 pointer-events-none z-50 flex flex-col gap-0.5 min-w-[80px] transition-all duration-200"
              style={{ 
                left: `${getX(hoveredIndex) / 10}%`, 
                top: `${getY(chartData[hoveredIndex].purchase) * 1.6 - 100}px`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-blue-400 uppercase tracking-tighter leading-tight">Purchase</span>
                <span className="text-[11px] font-black text-blue-600 leading-none">{chartData[hoveredIndex].purchase.toLocaleString()}</span>
              </div>
              <div className="flex flex-col border-t border-gray-100 pt-0.5 mt-0.5">
                <span className="text-[8px] font-bold text-green-400 uppercase tracking-tighter leading-tight">Sales</span>
                <span className="text-[11px] font-black text-green-600 leading-none">{chartData[hoveredIndex].sales.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* X-Axis Labels */}
        <div className="flex justify-between mt-6 px-2 text-[11px] font-bold text-gray-400/80">
          {months.map((m, i) => (
            <span key={m} className={clsx("transition-colors", hoveredIndex === i && "text-blue-500")}>{m}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

const stats = [
  { name: 'Total Merchant', value: '132', icon: Store, color: 'bg-[#e8f0fe] text-[#4285f4]' },
  { name: 'Total Product', value: '143', icon: Package, color: 'bg-[#fff4e5] text-[#ff9800]' },
  { name: 'Total Vendor', value: '14', icon: Users, color: 'bg-[#f3e8ff] text-[#9c27b0]' },
  { name: 'Total Warehouse', value: '05', icon: Warehouse, color: 'bg-[#e8fbf3] text-[#4caf50]' },
  { name: 'Total Purchase', value: '34', icon: Truck, color: 'bg-[#fffde7] text-[#fbc02d]' },
  { name: 'Total Contact Msg', value: '02', icon: MessageCircle, color: 'bg-[#e8f0fe] text-[#00bcd4]' },
]

const IncomeExpenseBlock = ({ title, income, expense, color, progressColor }: { title: string, income: string, expense: string, color: string, progressColor: string }) => (
  <div className={clsx("p-4 rounded-[22px] flex justify-between items-center relative overflow-hidden", color)}>
    <div className="flex flex-col gap-2.5">
      <h4 className="text-[14px] font-black text-[#544f6c]">{title}</h4>
      <div className="flex flex-col gap-0">
        <div className="flex items-center gap-1.5 leading-none">
          <div className="w-2 h-2 rounded-[2px] bg-[#3b82f6] opacity-70"></div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Income</span>
        </div>
        <p className="text-[16px] font-black text-[#334155] tracking-tighter leading-tight mt-0.5">{income}</p>
      </div>
      <div className="flex flex-col gap-0">
        <div className="flex items-center gap-1.5 leading-none">
          <div className="w-2 h-2 rounded-[2px] bg-gray-300"></div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Expense</span>
        </div>
        <p className="text-[16px] font-black text-[#334155] tracking-tighter leading-tight mt-0.5">{expense}</p>
      </div>
    </div>
    
    <div className="relative w-[70px] h-[70px] flex items-center justify-center shrink-0">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" stroke="#e5e7eb" strokeWidth="10" fill="transparent" opacity="0.3" />
        <circle 
          cx="50" cy="50" r="42" 
          stroke={progressColor} 
          strokeWidth="10" 
          strokeDasharray="263.8" 
          strokeDashoffset="180" 
          fill="transparent" 
          strokeLinecap="round" 
        />
      </svg>
    </div>
  </div>
)

const ReviewRow = ({ stars, width, count }: { stars: number, width: string, count: string }) => (
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-1 w-7">
      <span className="text-[12px] font-black text-[#544f6c]">{stars}</span>
      <div className="w-3.5 h-3.5 text-yellow-400">★</div>
    </div>
    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={clsx("h-full bg-[#3b82f6] rounded-full", width)}></div>
    </div>
    <span className="text-[11px] font-black text-gray-400 w-10 text-right">{count}</span>
  </div>
)

const TableRow = ({ label, value, isHeader = false }: { label: string, value: string, isHeader?: boolean }) => (
  <div className="grid grid-cols-2">
    <div className={clsx(
      "p-3 px-5 text-[13px] font-bold border-b border-r border-blue-100/50",
      isHeader ? "text-[#3b82f6] bg-[#eef4ff]" : "text-gray-500"
    )}>
      {label}
    </div>
    <div className={clsx(
      "p-3 px-5 text-[13px] font-black text-right border-b border-blue-100/50",
      isHeader ? "text-[#3b82f6] bg-[#eef4ff]" : "text-[#334155]"
    )}>
      {value}
    </div>
  </div>
)

const ReportTable = ({ title, headers, items = [], className }: { title: string, headers: string[], items?: any[], className?: string }) => {
  const colCount = headers.length;
  const gridStyle = { 
    display: 'grid', 
    gridTemplateColumns: colCount === 5 ? '80px 1.5fr 1fr 1fr 1fr' : (colCount === 4 ? '80px 1.5fr 1fr 1fr' : '80px 2fr 1fr')
  };

  return (
    <div className={clsx("bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-5", className)}>
      <div className="flex justify-between items-center px-1">
        <h3 className="text-[17px] font-black text-[#544f6c] tracking-tight">{title}</h3>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#f3f4f6] rounded-[15px] text-[11px] font-bold text-gray-400 cursor-pointer">
          <span>Weekly</span>
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>

      <div className="border border-blue-100 rounded-2xl overflow-hidden">
        <div className="bg-[#eef4ff]" style={gridStyle}>
          {headers.map(h => (
            <div key={h} className="p-2.5 px-4 text-[11px] font-black text-[#3b82f6] uppercase border-r border-blue-100/50 last:border-r-0">
              {h}
            </div>
          ))}
        </div>
        <div className="p-4 text-center text-xs font-bold text-gray-300 italic border-b border-blue-100/50 bg-white">
          Record not found
        </div>
        <div className="bg-white" style={gridStyle}>
          <div 
            className="p-2.5 px-5 text-[12px] font-black text-gray-400 text-right border-r border-blue-100/50 uppercase" 
            style={{ gridColumn: colCount === 5 ? 'span 3' : (colCount === 4 ? 'span 3' : 'span 2') }}
          >
            Total
          </div>
          <div className="p-2.5 px-5 text-[12px] font-black text-[#334155] text-right border-r border-blue-100/50 last:border-r-0">$0.00</div>
          {colCount === 5 && (
            <div className="p-2.5 px-5 text-[12px] font-black text-[#334155] text-right border-r border-blue-100/50 last:border-r-0">$0.00</div>
          )}
        </div>
      </div>
    </div>
  )
}

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
           <div className="col-span-6 bg-white p-2 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-6">
              <div className="flex justify-between items-center px-1">
                 <h3 className="text-lg font-black text-[#544f6c] tracking-tight">Expense Statement (৳)</h3>
                 <div className="flex items-center gap-2 px-4 py-2 bg-[#f3f4f6] rounded-[15px] text-[11px] font-bold text-gray-400 shadow-sm cursor-pointer border border-transparent hover:bg-gray-200 transition-colors">
                    <span>Weekly</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                 </div>
              </div>

              <div className="flex items-center">
                 <DonutChartMock />
                 <div className="grid grid-cols-3 gap-x-6 gap-y-8 flex-1">
                    <LegendItem label="Total Purchase" value="525" percent="34.93%" color="bg-[#FF7D5E]" />
                    <LegendItem label="Total Sale" value="224" percent="40.11%" color="bg-[#4ADE80]" />
                    <LegendItem label="Total Expense" value="145" percent="25.00%" color="bg-[#FACC15]" />
                    <LegendItem label="Employee Salary" value="145" percent="25.00%" color="bg-[#3B82F6]" />
                    <LegendItem label="Service" value="145" percent="25.00%" color="bg-[#BFDBFE]" />
                 </div>
              </div>
           </div>
        </div>

        {/* SECTION 3: RIGHT GROUP (Under last 3 cards) */}
        <div className="col-span-12 lg:col-span-6 flex flex-col">
           {/* Best Sale Product (Tall, aligns with last 3 cards) */}
           <div className="flex-1 bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-6">
              <div className="flex justify-between items-center px-1">
                 <h3 className="text-lg font-black text-[#544f6c] tracking-tight">Best Sale Product</h3>
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
      <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-4 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <h3 className="text-lg font-black text-[#544f6c] tracking-tight px-1">Monthly Sales & Purchase Report</h3>
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

      {/* Row 5: Lower Grid Sections (6 and 6 divide) */}
      <div className="grid grid-cols-12 gap-6 pb-2 items-stretch">
        {/* LEFT COLUMN: Income vs Expense & Customer Reviews */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
          {/* Income vs Expense Chart */}
          <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-6">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[18px] font-black text-[#544f6c] tracking-tight">Income vs Expense Chart</h3>
              <div className="flex items-center gap-2 px-4 py-2 bg-[#f3f4f6] rounded-[15px] text-[11px] font-bold text-gray-400 cursor-pointer">
                <span>Weekly</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <IncomeExpenseBlock title="Today" income="$1,250" expense="$820" color="bg-[#eef4ff]" progressColor="#3b82f6" />
              <IncomeExpenseBlock title="This Week" income="$8,750" expense="$5,940" color="bg-[#f0fdf4]" progressColor="#4ade80" />
              <IncomeExpenseBlock title="This Month" income="$36,500" expense="$24,300" color="bg-[#f0fdfa]" progressColor="#2dd4bf" />
              <IncomeExpenseBlock title="This Year" income="$428,000" expense="$297,500" color="bg-[#f5f3ff]" progressColor="#a855f7" />
            </div>
          </div>

          {/* Customer Reviews */}
          <div className="flex-1 bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-6">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[18px] font-black text-[#544f6c] tracking-tight">Customer Reviews</h3>
              <div className="flex items-center gap-2 px-4 py-2 bg-[#f3f4f6] rounded-[15px] text-[11px] font-bold text-gray-400 cursor-pointer">
                <span>Weekly</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="flex flex-col gap-5 px-1 mt-2">
              <ReviewRow stars={5} width="w-full" count="250" />
              <ReviewRow stars={4} width="w-[85%]" count="190" />
              <ReviewRow stars={3} width="w-[45%]" count="120" />
              <ReviewRow stars={2} width="w-[65%]" count="150" />
              <ReviewRow stars={1} width="w-[30%]" count="90" />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Todays Overview, Sales Due, Sales Report */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
          {/* Todays Overview */}
          <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-6">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[18px] font-black text-[#544f6c] tracking-tight">Todays Overview</h3>
              <div className="flex items-center gap-2 px-4 py-2 bg-[#f3f4f6] rounded-[15px] text-[11px] font-bold text-gray-400 cursor-pointer">
                <span>Weekly</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="border border-blue-100 rounded-2xl overflow-hidden">
              <TableRow label="Todays Report" value="$" isHeader />
              <TableRow label="Total Sales" value="$1,250" />
              <TableRow label="Total Purchase" value="$1,250" />
              <TableRow label="Last Sales" value="$" />
            </div>
          </div>

          {/* Todays Sales Due */}
          <ReportTable title="Todays Sales Due" headers={['SL.', 'Merchant Name', 'Voucher No', 'Due Amount']} />

          {/* Todays Sales Report */}
          <ReportTable title="Todays Sales Report" headers={['SL.', 'Vendor Name', 'Purchase ID', 'Due Amount']} className="flex-1" />
        </div>
      </div>

      {/* Row 6: Full Width Todays Sales Report */}
      <div className="pb-4">
        <ReportTable 
          title="Todays Sales Report" 
          headers={['SL.', 'Merchant Name', 'Invoice No', 'Total Amount', 'Paid Amount']} 
        />
      </div>
    </div>
  )
}
