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
  ChevronDown,
  Loader2
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuthStore } from '@/store/useAuthStore'
import { useState, useEffect } from 'react'
import { useGetDashboardAnalytics } from '../api/dashboard.api'
import type { MonthlyTrendItem } from '../api/types'

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

const DonutChartMock = ({ expenseData }: { expenseData?: any }) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const total = Object.values(expenseData || {}).reduce((acc: number, curr: any) => acc + (Number(curr) || 0), 0) || 1;
  const values = [
    { key: 'total_purchase', label: 'Purchase', color: '#FF7D5E' },
    { key: 'total_sales', label: 'Sales', color: '#4ADE80' },
    { key: 'total_expense', label: 'Expense', color: '#FACC15' },
    { key: 'total_salary', label: 'Salary', color: '#3B82F6' },
    { key: 'total_service', label: 'Service', color: '#BFDBFE' },
  ];

  let cumulativePercent = 0;
  const circumference = 213.6; // 2 * PI * 34

  return (
    <div className="relative w-40 h-40 flex items-center justify-center shrink-0 group">
      <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="34" stroke="#f3f4f6" strokeWidth="12" fill="transparent" />
        {values.map((item) => {
          const val = Number(expenseData?.[item.key]) || 0;
          const percent = (val / total) * 100;
          const offset = circumference - (percent / 100) * circumference;
          const rotation = (cumulativePercent / 100) * 360;
          cumulativePercent += percent;

          if (percent === 0) return null;

          return (
            <circle
              key={item.key}
              cx="50" cy="50" r="34"
              stroke={item.color}
              strokeWidth={hoveredKey === item.key ? 15 : 12}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              fill="transparent"
              style={{ 
                transform: `rotate(${rotation}deg)`, 
                transformOrigin: 'center',
                transition: 'stroke-width 0.4s cubic-bezier(0.4, 0, 0.2, 1), stroke-dashoffset 0.4s ease'
              }}
              onMouseEnter={() => setHoveredKey(item.key)}
              onMouseLeave={() => setHoveredKey(null)}
              className="cursor-pointer outline-none"
            />
          );
        })}
      </svg>

      {/* Smooth Centered Data */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={clsx(
          "flex flex-col items-center transition-all duration-500 ease-out",
          hoveredKey ? "opacity-100 scale-100" : "opacity-0 scale-95 translate-y-1"
        )}>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] leading-none">
            {values.find(v => v.key === hoveredKey)?.label}
          </span>
          <span className="text-[16px] font-black text-gray-700 tracking-tighter mt-1">
            ${hoveredKey ? Number(expenseData?.[hoveredKey]).toLocaleString() : 0}
          </span>
        </div>
        
        {/* Default View (when not hovered) */}
        {!hoveredKey && (
          <div className="flex flex-col items-center animate-in fade-in duration-700">
            <PieChartIcon className="h-5 w-5 text-gray-200" />
          </div>
        )}
      </div>
    </div>
  );
};

const LegendItem = ({ label, value, percent, color }: { label: string, value: string | number, percent: string, color: string }) => (
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
  <div className="flex items-center gap-3 w-full group relative">
    <div className="w-[140px] shrink-0 text-[10px] font-bold text-gray-400 truncate text-left uppercase tracking-tight">
      {name}
    </div>
    <div className="flex-1 h-4 relative flex items-center">
      <div 
        className="h-2.5 bg-[#b3cbfb] rounded-full transition-all duration-500 relative z-10 group-hover:bg-[#4F8AFF] group-hover:shadow-sm" 
        style={{ width: `${(value / (max || 1)) * 100}%` }}
      />
    </div>

    {/* Product Name Tooltip */}
    <div className="absolute left-0 -top-8 bg-white border border-blue-50 shadow-xl px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 translate-y-2 group-hover:translate-y-0">
      <p className="text-[10px] font-black text-[#544f6c] whitespace-nowrap">{name}</p>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span className="text-[8px] font-bold text-gray-400 uppercase">Sales:</span>
        <span className="text-[11px] font-black text-blue-600">{value.toLocaleString()}</span>
      </div>
    </div>
  </div>
)

const AreaChartMock = ({ trendData = [] }: { trendData?: MonthlyTrendItem[] }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const months = trendData.length > 0 ? trendData.map(d => d.month.substring(0, 3)) : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const chartData = trendData.length > 0 ? trendData : Array(12).fill({ sales: 0, purchase: 0 });

  const maxVal = Math.max(...chartData.map(d => Math.max(d.sales, d.purchase, 1200000)));
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
        <span>{maxVal.toLocaleString()}</span>
        <span>{(maxVal * 0.8).toLocaleString()}</span>
        <span>{(maxVal * 0.6).toLocaleString()}</span>
        <span>{(maxVal * 0.4).toLocaleString()}</span>
        <span>{(maxVal * 0.2).toLocaleString()}</span>
        <span>0</span>
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

const IncomeExpenseBlock = ({ title, income, expense, color, progressColor }: { title: string, income: string | number, expense: string | number, color: string, progressColor: string }) => {
  const inc = typeof income === 'string' ? parseFloat(income.replace(/[^0-9.-]+/g,"")) : income;
  const exp = typeof expense === 'string' ? parseFloat(expense.replace(/[^0-9.-]+/g,"")) : expense;
  const total = inc + exp || 1;
  const percentage = (inc / total) * 100;
  const circumference = 263.8;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={clsx("p-4 rounded-[22px] flex justify-between items-center relative overflow-hidden", color)}>
      <div className="flex flex-col gap-2.5">
        <h4 className="text-[14px] font-black text-[#544f6c]">{title}</h4>
        <div className="flex flex-col gap-0">
          <div className="flex items-center gap-1.5 leading-none">
            <div className="w-2 h-2 rounded-[2px] bg-[#3b82f6] opacity-70"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Income</span>
          </div>
          <p className="text-[16px] font-black text-[#334155] tracking-tighter leading-tight mt-0.5">${inc.toLocaleString()}</p>
        </div>
        <div className="flex flex-col gap-0">
          <div className="flex items-center gap-1.5 leading-none">
            <div className="w-2 h-2 rounded-[2px] bg-gray-300"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Expense</span>
          </div>
          <p className="text-[16px] font-black text-[#334155] tracking-tighter leading-tight mt-0.5">${exp.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="relative w-[70px] h-[70px] flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" stroke="#e5e7eb" strokeWidth="10" fill="transparent" opacity="0.3" />
          <circle 
            cx="50" cy="50" r="42" 
            stroke={progressColor} 
            strokeWidth="10" 
            strokeDasharray={circumference} 
            strokeDashoffset={offset} 
            fill="transparent" 
            strokeLinecap="round" 
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
      </div>
    </div>
  )
}

const ReviewRow = ({ stars, width, count }: { stars: number, width: string, count: string | number }) => (
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

const TableRow = ({ label, value, isHeader = false }: { label: string, value: string | number, isHeader?: boolean }) => (
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
        
        {items.length > 0 ? (
          items.map((item, idx) => (
            <div key={idx} className="bg-white border-b border-blue-50 last:border-b-0 hover:bg-blue-50/30 transition-colors" style={gridStyle}>
              {Object.values(item).map((val: any, vIdx) => (
                <div key={vIdx} className="p-2.5 px-4 text-[12px] font-bold text-gray-600 border-r border-blue-100/30 last:border-r-0 truncate">
                  {vIdx > 1 && typeof val === 'number' ? val.toLocaleString() : val}
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-xs font-bold text-gray-300 italic border-b border-blue-100/50 bg-white">
            Record not found
          </div>
        )}

        <div className="bg-white" style={gridStyle}>
          <div 
            className="p-2.5 px-5 text-[12px] font-black text-gray-400 text-right border-r border-blue-100/50 uppercase" 
            style={{ gridColumn: colCount === 5 ? 'span 3' : 'span 3' }}
          >
            Total
          </div>
          <div className="p-2.5 px-5 text-[12px] font-black text-[#334155] text-right border-r border-blue-100/50 last:border-r-0">
            ${items.reduce((acc, curr) => acc + (Number(Object.values(curr)[3]) || 0), 0).toLocaleString()}
          </div>
          {colCount === 5 && (
            <div className="p-2.5 px-5 text-[12px] font-black text-[#334155] text-right border-r border-blue-100/50 last:border-r-0">
              ${items.reduce((acc, curr) => acc + (Number(Object.values(curr)[4]) || 0), 0).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { data, isLoading } = useGetDashboardAnalytics()

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

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" strokeWidth={1.5} />
        <p className="text-gray-400 font-bold animate-pulse">Loading dashboard data...</p>
      </div>
    )
  }

  const stats = [
    { name: 'Total Merchant', value: data?.stats.total_customer ?? 0, icon: Store, color: 'bg-[#e8f0fe] text-[#4285f4]' },
    { name: 'Total Product', value: data?.stats.total_product ?? 0, icon: Package, color: 'bg-[#fff4e5] text-[#ff9800]' },
    { name: 'Total Vendor', value: data?.stats.total_suppliers ?? 0, icon: Users, color: 'bg-[#f3e8ff] text-[#9c27b0]' },
    { name: 'Total Warehouse', value: data?.stats.total_warehouse ?? 0, icon: Warehouse, color: 'bg-[#e8fbf3] text-[#4caf50]' },
    { name: 'Total Purchase', value: data?.stats.total_purchase_count ?? 0, icon: Truck, color: 'bg-[#fffde7] text-[#fbc02d]' },
    { name: 'Total Contact Msg', value: data?.stats.total_contact_msg ?? 0, icon: MessageCircle, color: 'bg-[#e8f0fe] text-[#00bcd4]' },
  ]

  const channelSales = {
    admin: data?.channel_wise_sales.find(c => c.channel === 'admin')?.total ?? 0,
    web: data?.channel_wise_sales.find(c => c.channel === 'web')?.total ?? 0,
    app: data?.channel_wise_sales.find(c => c.channel === 'app')?.total ?? 0,
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

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        
        {/* TOP ROW: 6 SMALL CARDS */}
        {stats.map((stat, idx) => (
          <div key={stat.name} className="col-span-12 md:col-span-4 lg:col-span-2">
            <StatCard {...stat} />
          </div>
        ))}

        {/* SECTION 2: LEFT GROUP */}
        <div className="col-span-12 lg:col-span-6 grid grid-cols-6 gap-6">
           {/* Total Sale */}
           <div className="col-span-6 md:col-span-2 bg-card-bg/60 p-3 rounded-[10px] shadow-sm flex flex-col items-start gap-1 relative mt-3 border border-white/40 group hover:shadow-md transition-all">
              <div className="w-8 h-8 rounded-lg bg-[#e8f0fe] text-[#4285f4] flex items-center justify-center shadow-md absolute -top-3 left-4">
                 <Coins className="h-4 w-4" />
              </div>
              <div className="flex flex-col gap-0 mt-4">
                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Sale</p>
                 <p className="text-xl font-black text-gray-600 tracking-tighter">{data?.stats.total_sales_count ?? 0}</p>
              </div>
           </div>

           {/* Channel Wise Sale */}
           <div className="col-span-6 md:col-span-4 bg-card-bg/60 p-3 rounded-[10px] shadow-sm flex flex-col gap-2 relative mt-3 border border-white/40 group hover:shadow-md transition-all">
              <div className="w-8 h-8 rounded-lg bg-[#fff4e5] text-[#ff9800] flex items-center justify-center shadow-md absolute -top-3 left-4">
                 <PieChartIcon className="h-4 w-4" />
              </div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-4 ml-1">Channel Wise Sale</p>
              <div className="flex items-center gap-4 ml-1">
                 <div className="flex flex-col">
                    <span className="text-[8px] text-gray-400 uppercase font-black">Admin:</span>
                    <span className="text-lg font-black text-gray-600">{channelSales.admin}</span>
                 </div>
                 <div className="flex flex-col border-l border-gray-200 pl-3">
                    <span className="text-[8px] text-gray-400 uppercase font-black">Web:</span>
                    <span className="text-lg font-black text-gray-600">{channelSales.web}</span>
                 </div>
                 <div className="flex flex-col border-l border-gray-200 pl-3">
                    <span className="text-[8px] text-gray-400 uppercase font-black">App:</span>
                    <span className="text-lg font-black text-gray-600">{channelSales.app}</span>
                 </div>
              </div>
           </div>

           {/* Expense Statement */}
           <div className="col-span-6 bg-white p-2 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-6">
              <div className="flex justify-between items-center px-1">
                 <h3 className="text-lg font-black text-[#544f6c] tracking-tight">Expense Statement (৳)</h3>
                 <div className="flex items-center gap-2 px-4 py-2 bg-[#f3f4f6] rounded-[15px] text-[11px] font-bold text-gray-400 shadow-sm cursor-pointer border border-transparent hover:bg-gray-200 transition-colors">
                    <span>Weekly</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                 </div>
              </div>

              <div className="flex items-center">
                 <DonutChartMock expenseData={data?.expense_statement} />
                 <div className="grid grid-cols-3 gap-x-6 gap-y-8 flex-1">
                    {(() => {
                      const ex = data?.expense_statement;
                      const total = Object.values(ex || {}).reduce((acc: number, curr: any) => acc + (Number(curr) || 0), 0) || 1;
                      const getPct = (val: number) => ((val / total) * 100).toFixed(1) + '%';
                      
                      return (
                        <>
                          <LegendItem label="Total Purchase" value={ex?.total_purchase ?? 0} percent={getPct(ex?.total_purchase ?? 0)} color="bg-[#FF7D5E]" />
                          <LegendItem label="Total Sale" value={ex?.total_sales ?? 0} percent={getPct(ex?.total_sales ?? 0)} color="bg-[#4ADE80]" />
                          <LegendItem label="Total Expense" value={ex?.total_expense ?? 0} percent={getPct(ex?.total_expense ?? 0)} color="bg-[#FACC15]" />
                          <LegendItem label="Employee Salary" value={ex?.total_salary ?? 0} percent={getPct(ex?.total_salary ?? 0)} color="bg-[#3B82F6]" />
                          <LegendItem label="Service" value={ex?.total_service ?? 0} percent={getPct(ex?.total_service ?? 0)} color="bg-[#BFDBFE]" />
                        </>
                      )
                    })()}
                 </div>
              </div>
           </div>
        </div>

        {/* SECTION 3: RIGHT GROUP */}
        <div className="col-span-12 lg:col-span-6 flex flex-col">
           {/* Best Sale Product */}
           <div className="flex-1 bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-6">
              <div className="flex justify-between items-center px-1">
                 <h3 className="text-lg font-black text-[#544f6c] tracking-tight">Best Sale Product</h3>
                 <div className="flex items-center gap-2 px-2 py-1 bg-[#f4f4f9] rounded-full text-[8px] font-black text-gray-400 shadow-sm cursor-pointer uppercase tracking-tight">
                    <span>Weekly</span>
                    <ChevronDown className="h-3 w-3" />
                 </div>
              </div>

              <div className="relative flex-1 mt-2 flex flex-col min-h-0">
                 {(() => {
                    const products = data?.best_selling_products ?? [];
                    const maxVal = Math.max(...products.map(p => p.value), 100);
                    const ceiling = Math.ceil(maxVal / 100) * 100;
                    const steps = [0, 1, 2, 3, 4, 5, 6].map(v => Math.round((ceiling / 6) * v));

                    return (
                       <>
                          <div className="relative flex-1 min-h-0">
                             {/* Background Grid Lines - strictly contained within bars area */}
                             <div className="absolute inset-0 left-[152px] flex justify-between pointer-events-none pr-1">
                                {steps.map((val) => (
                                   <div key={val} className="h-full border-l border-gray-50 last:border-r" />
                                ))}
                             </div>

                             {/* Bars */}
                             <div className="flex flex-col gap-4 pr-1 relative z-10">
                                {products.map((item) => (
                                   <HorizontalBarMock key={item.name} name={item.name} value={item.value} max={ceiling} />
                                ))}
                             </div>
                          </div>

                          {/* Legend/Labels - completely outside the bars & grid container */}
                          <div className="flex justify-between pl-[152px] mt-6 text-[10px] font-bold text-gray-400 pr-1">
                             {steps.map((val) => (
                                <span key={val} className="w-0 flex justify-center whitespace-nowrap">{val.toLocaleString()}</span>
                             ))}
                          </div>
                       </>
                    );
                 })()}
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
        <AreaChartMock trendData={data?.monthly_trend} />
      </div>

      {/* Row 5: Lower Grid Sections */}
      <div className="grid grid-cols-12 gap-6 pb-2 items-stretch">
        {/* LEFT COLUMN */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
          <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-6">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[18px] font-black text-[#544f6c] tracking-tight">Income vs Expense Chart</h3>
              <div className="flex items-center gap-2 px-4 py-2 bg-[#f3f4f6] rounded-[15px] text-[11px] font-bold text-gray-400 cursor-pointer">
                <span>Weekly</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <IncomeExpenseBlock title="Today" income={data?.income_vs_expense.today.income ?? 0} expense={data?.income_vs_expense.today.expense ?? 0} color="bg-[#eef4ff]" progressColor="#3b82f6" />
              <IncomeExpenseBlock title="This Week" income={data?.income_vs_expense.weekly.income ?? 0} expense={data?.income_vs_expense.weekly.expense ?? 0} color="bg-[#f0fdf4]" progressColor="#4ade80" />
              <IncomeExpenseBlock title="This Month" income={data?.income_vs_expense.monthly.income ?? 0} expense={data?.income_vs_expense.monthly.expense ?? 0} color="bg-[#f0fdfa]" progressColor="#2dd4bf" />
              <IncomeExpenseBlock title="This Year" income={data?.income_vs_expense.yearly.income ?? 0} expense={data?.income_vs_expense.yearly.expense ?? 0} color="bg-[#f5f3ff]" progressColor="#a855f7" />
            </div>
          </div>

          <div className="flex-1 bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-6">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[18px] font-black text-[#544f6c] tracking-tight">Customer Reviews</h3>
              <div className="flex items-center gap-2 px-4 py-2 bg-[#f3f4f6] rounded-[15px] text-[11px] font-bold text-gray-400 shadow-sm cursor-pointer border border-transparent hover:bg-gray-200 transition-colors">
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

        {/* RIGHT COLUMN */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
          <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-6">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[18px] font-black text-[#544f6c] tracking-tight">Todays Overview</h3>
              <div className="flex items-center gap-2 px-4 py-2 bg-[#f3f4f6] rounded-[15px] text-[11px] font-bold text-gray-400 shadow-sm cursor-pointer border border-transparent hover:bg-gray-200 transition-colors">
                 <span>Weekly</span>
                 <ChevronDown className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="border border-blue-100 rounded-2xl overflow-hidden">
              <TableRow label="Todays Report" value="$" isHeader />
              <TableRow label="Total Sales" value={`$${data?.todays_overview.total_sales.toLocaleString() ?? 0}`} />
              <TableRow label="Total Purchase" value={`$${data?.todays_overview.total_purchase.toLocaleString() ?? 0}`} />
              <TableRow label="Last Sales" value={`$${data?.todays_overview.last_sales.toLocaleString() ?? 0}`} />
            </div>
          </div>

          <ReportTable 
            title="Todays Sales Due" 
            headers={['SL.', 'Merchant Name', 'Voucher No', 'Due Amount']} 
            items={(data?.todays_sales_due ?? []).map((item, idx) => ({
              sl: idx + 1,
              name: item.customer_name,
              invoice: item.invoice,
              due: item.due_amount
            }))}
          />

          <ReportTable 
            title="Todays Purchase Due" 
            headers={['SL.', 'Supplier Name', 'Purchase ID', 'Due Amount']} 
            className="flex-1"
            items={(data?.todays_purchase_due ?? []).map((item, idx) => ({
              sl: idx + 1,
              name: item.supplier_name,
              purchase_id: item.purchase_id,
              due: item.due_amount
            }))}
          />
        </div>
      </div>

      {/* Row 6: Full Width Todays Sales Report */}
      <div className="pb-4">
        <ReportTable 
          title="Todays Sales Report" 
          headers={['SL.', 'Merchant Name', 'Invoice No', 'Total Amount', 'Paid Amount']} 
          items={(data?.todays_sales_report ?? []).map((item, idx) => ({
            sl: idx + 1,
            name: item.customer_name,
            invoice: item.invoice,
            total: item.total_amount,
            paid: item.paid_amount
          }))}
        />
      </div>
    </div>
  )
}
