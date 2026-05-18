import { 
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { clsx } from 'clsx'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { useGetDashboardAnalytics } from '../api/dashboard.api'
import { useSettings } from '@/hooks/useSettings'

// Icons
import ChannelWiseIcon from '@/assets/icons/Channel_Wise_Sale_icon.png'
import TotalProductIcon from '@/assets/icons/total_product_card_icon.png'
import TotalMerchantIcon from '@/assets/icons/total_merchante_card_icon.png'
import TotalVendorIcon from '@/assets/icons/total_vendor_card_icon.png'
import TotalWarehouseIcon from '@/assets/icons/total_warehouse_card_icon.png'
import TotalPurchaseIcon from '@/assets/icons/total_purchase_card_icon.png'
import TotalContactIcon from '@/assets/icons/total_contact_card_icon.png'
import TotalSaleIcon from '@/assets/icons/total_sale_card_icon.png'

interface StatCardProps {
  name: string
  value: string | number
  icon: string
  className?: string
}

const StatCard = ({ name, value, icon, className }: StatCardProps) => (
  <div className={clsx(
    "px-6 rounded-[16px] shadow-sm flex items-center justify-between h-28 group transition-all duration-300",
    "bg-white text-gray-800 hover:bg-primary hover:text-white hover:-translate-y-1 hover:shadow-md",
    className
  )}>
    <div className="flex flex-col justify-center gap-1">
      <p className="text-[13px] font-medium text-gray-500 group-hover:text-white/80 transition-colors">{name}</p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
    </div>
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all">
      <img 
        src={icon} 
        alt={name} 
        className="h-8 w-8 object-contain transition-all" 
      />
    </div>
  </div>
)

const DonutChart = ({ data, centerLabel, centerValue, size = 160 }: { data: any[], centerLabel: string, centerValue: string | number, size?: number }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0) || 1;
  const circumference = 2 * Math.PI * 38;
  let cumulativePercent = 0;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Shadow layer for donut */}
        <circle cx="50" cy="50" r="38" stroke="rgba(0,0,0,0.05)" strokeWidth="14" fill="transparent" />
        
        {data.map((item, idx) => {
          const percent = (item.value / total) * 100;
          const offset = circumference - (percent / 100) * circumference;
          const rotation = (cumulativePercent / 100) * 360;
          cumulativePercent += percent;

          if (percent === 0) return null;

          return (
            <circle
              key={idx}
              cx="50" cy="50" r="38"
              stroke={item.color}
              strokeWidth={idx === 0 ? "13" : "12"} // Slightly thicker for the first segment
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              fill="transparent"
              style={{ 
                transform: `rotate(${rotation}deg)`, 
                transformOrigin: 'center',
                transition: 'all 0.5s ease'
              }}
            />
          );
        })}
      </svg>

      {/* Center White Circle with Shadow */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full w-[60%] h-[60%] m-auto shadow-[inset_0_2px_4px_rgba(0,0,0,0.05),0_10px_20px_rgba(0,0,0,0.06)] text-center">
        <span className="text-[14px] font-bold text-gray-800 leading-tight font-poppins px-2 truncate w-full">{centerLabel}</span>
        <span className="text-[20px] font-bold text-gray-800 leading-tight font-poppins mt-0.5">{centerValue}</span>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-primary/20 rounded-xl shadow-2xl flex flex-col gap-1.5 min-w-[100px]">
        <div className="text-gray-400 text-[9px] font-bold uppercase px-1">{label}</div>
        <div className="flex flex-col bg-primary/5 p-1.5 rounded-lg border border-primary/10">
          <span className="text-[9px] text-primary font-bold uppercase leading-none mb-1">Purchase</span>
          <span className="text-[13px] text-primary font-black leading-none">{payload[0].value.toLocaleString()}</span>
        </div>
        <div className="flex flex-col bg-success/5 p-1.5 rounded-lg border border-success/10">
          <span className="text-[9px] text-success font-bold uppercase leading-none mb-1">Sales</span>
          <span className="text-[13px] text-success font-black leading-none">{payload[1].value.toLocaleString()}</span>
        </div>
      </div>
    );
  }
  return null;
};

const LegendItem = ({ 
  label, 
  value, 
  percent, 
  color, 
  variant = 'inline' 
}: { 
  label: string, 
  value: string | number, 
  percent?: string, 
  color: string,
  variant?: 'inline' | 'stacked'
}) => (
  <div className={clsx(
    "flex gap-3 py-0.5",
    variant === 'inline' ? "items-center" : "items-start"
  )}>
    {/* Stacked Square Icon */}
    <div className="relative w-4 h-4 shrink-0 mt-1">
      <div className="absolute top-0 left-0 w-3 h-3 rounded-[2px] opacity-30" style={{ backgroundColor: color }}></div>
      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-[2.5px] shadow-sm" style={{ backgroundColor: color }}></div>
    </div>
    
    <div className={clsx(
      "flex flex-1",
      variant === 'inline' ? "items-center justify-between" : "flex-col justify-start"
    )}>
      <span className={clsx(
        "font-semibold text-gray-500 font-poppins",
        variant === 'inline' ? "text-[14px]" : "text-[13px] leading-tight"
      )}>
        {label}:
      </span>
      <div className={clsx(
        "flex items-center",
        variant === 'inline' ? "gap-3" : "gap-2 mt-0.5"
      )}>
        <span className={clsx(
          "font-bold text-gray-800 font-poppins",
          variant === 'inline' ? "text-[14px]" : "text-[15px]"
        )}>
          {value}
        </span>
        {percent && (
          <span className={clsx(
            "font-medium text-gray-800 font-poppins opacity-50",
            variant === 'inline' ? "text-[14px]" : "text-[13px]"
          )}>
            ({percent}%)
          </span>
        )}
      </div>
    </div>
  </div>
)

const HorizontalBar = ({ name, value, max, color }: { name: string, value: number, max: number, color: string }) => (
  <div className="flex items-center gap-4 w-full">
    <div className="w-44 shrink-0 text-[11px] font-medium text-gray-500 truncate text-left">
      {name}
    </div>
    <div className="flex-1 h-6 relative flex items-center">
      <div 
        className="h-3.5 rounded-full transition-all duration-1000 relative z-10" 
        style={{ width: `${Math.max((value / (max || 1)) * 100, 2)}%`, backgroundColor: color }}
      />
    </div>
  </div>
)

export const DashboardPage = () => {
  const { data, isLoading } = useGetDashboardAnalytics()
  const { currency, currencyPosition, webSetting } = useSettings()

  const formatCurrency = (amount: number | string) => {
    return currencyPosition === 'left' ? `${currency}${amount}` : `${amount}${currency}`
  }

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" strokeWidth={1.5} />
        <p className="text-gray-400 font-bold animate-pulse">Loading dashboard data...</p>
      </div>
    )
  }

  // Dynamic colors from theme or defaults
  const colors = {
    primary: webSetting?.color_primary || 'var(--color-primary)',
    info: webSetting?.color_info || 'var(--color-info)',
    success: webSetting?.color_success || 'var(--color-success)',
    warning: webSetting?.color_warning || 'var(--color-warning)',
    danger: webSetting?.color_danger || 'var(--color-danger)',
  }

  // Dynamic Channel Wise Sale Data
  const channelSales = data?.channel_wise_sales || []
  const totalChannelSale = channelSales.reduce((sum, item) => sum + item.total, 0) || 1
  const channelColors = [colors.warning, colors.primary, colors.info, colors.success, colors.danger]

  // Dynamic Expense Statement Data
  const expenseData = data?.expense_statement || {
    total_purchase: 0,
    total_sales: 0,
    total_expense: 0,
    total_salary: 0,
    total_service: 0
  }
  const totalExpenseVal = Object.values(expenseData).reduce((a, b) => a + b, 0) || 1

  // Dynamic Today's Overview
  const todaysOverview = data?.todays_overview || {
    total_sales: 0,
    total_purchase: 0,
    last_sales: 0
  }

  const bestProducts = data?.best_selling_products || []
  const maxProductRaw = Math.max(...bestProducts.map(p => p.value), 0);
  
  // Calculate dynamic grid steps for Best Sale Product
  const chartMax = maxProductRaw > 0 ? Math.ceil(maxProductRaw / 100) * 100 : 1000;
  const stepCount = 5;
  const stepSize = chartMax / stepCount;
  const gridSteps = Array.from({ length: stepCount + 1 }, (_, i) => Math.round(i * stepSize));

  // Trend Chart Data
  const trendData = data?.monthly_trend || []

  return (
    <div className="p-1 space-y-6 animate-in fade-in duration-700">
      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Row 1 */}
        <StatCard name="Total Product" value={data?.stats.total_product ?? 143} icon={TotalProductIcon} />
        <StatCard name="Total Merchant" value={data?.stats.total_customer ?? 132} icon={TotalMerchantIcon} />
        <StatCard name="Total Vendor" value={data?.stats.total_suppliers ?? 14} icon={TotalVendorIcon} />
        <StatCard name="Total Warehouse" value={data?.stats.total_warehouse ?? "05"} icon={TotalWarehouseIcon} />

        {/* Row 2 */}
        <StatCard name="Total Purchase" value={data?.stats.total_purchase_count ?? 143} icon={TotalPurchaseIcon} />
        <StatCard name="Total Contact Msg" value={data?.stats.total_contact_msg ?? 14} icon={TotalContactIcon} />
        <StatCard name="Total Sale" value={data?.stats.total_sales_count ?? 497} icon={TotalSaleIcon} />
        
        {/* Channel Wise Sale */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:row-span-2 flex flex-col items-center justify-between">
          <div className="flex justify-between items-start w-full mb-4 px-2">
            <h3 
              className="text-gray-500 text-xs font-semibold"
            >
              Channel Wise Sale
            </h3>
            <div className="shrink-0">
               <img src={ChannelWiseIcon} alt="Channel Wise Sale" className="h-6 w-6 object-contain" />
            </div>
          </div>
          
          <DonutChart 
            centerLabel={channelSales[0]?.channel || 'Admin'} 
            centerValue={channelSales[0]?.total || 0} 
            data={channelSales.map((item, idx) => ({
              value: item.total,
              color: channelColors[idx % channelColors.length]
            }))}
          />

          <div className="w-full space-y-4 mt-8 px-2">
            {channelSales.map((item, idx) => (
              <LegendItem 
                key={idx}
                label={item.channel} 
                value={item.total} 
                percent={((item.total / totalChannelSale) * 100).toFixed(2)} 
                color={channelColors[idx % channelColors.length]} 
              />
            ))}
          </div>
        </div>

        {/* Expense Statement (occupies 3 columns on LG) */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:col-span-2 lg:col-span-3 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 
              className="text-gray-500 font-semibold text-[16px]"
            >
              Expense Statement ({currency})
            </h3>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-main-bg rounded-lg text-[11px] font-bold text-gray-500 cursor-pointer">
              <span>Monthly</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-16">
            <DonutChart 
              centerLabel="Purchase" 
              centerValue={formatCurrency(expenseData.total_purchase)} 
              size={170}
              data={[
                { value: expenseData.total_purchase, color: colors.warning },
                { value: expenseData.total_sales, color: colors.danger },
                { value: expenseData.total_expense, color: colors.primary },
                { value: expenseData.total_salary, color: colors.info },
                { value: expenseData.total_service, color: colors.primary },
              ]}
            />

            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-12 flex-1">
              <LegendItem variant="stacked" label="Total Purchase" value={formatCurrency(expenseData.total_purchase)} percent={((expenseData.total_purchase / totalExpenseVal) * 100).toFixed(2)} color={colors.warning} />
              <LegendItem variant="stacked" label="Total Sale" value={formatCurrency(expenseData.total_sales)} percent={((expenseData.total_sales / totalExpenseVal) * 100).toFixed(2)} color={colors.danger} />
              <LegendItem variant="stacked" label="Total Expense" value={formatCurrency(expenseData.total_expense)} percent={((expenseData.total_expense / totalExpenseVal) * 100).toFixed(2)} color={colors.primary} />
              <LegendItem variant="stacked" label="Employee Salary" value={formatCurrency(expenseData.total_salary)} percent={((expenseData.total_salary / totalExpenseVal) * 100).toFixed(2)} color={colors.info} />
              <LegendItem variant="stacked" label="Service" value={formatCurrency(expenseData.total_service)} percent={((expenseData.total_service / totalExpenseVal) * 100).toFixed(2)} color={colors.primary} />
            </div>
          </div>
        </div>

        {/* Best Sale Product (occupies 2 columns on LG) */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:col-span-2 lg:col-span-2 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[#3b3b5e] font-bold text-[17px]">
              Best Sale Product
            </h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-main-bg rounded-full text-[10px] font-bold text-gray-500 cursor-pointer">
              <span>Monthly</span>
              <ChevronDown className="h-3 w-3" />
            </div>
          </div>
          <div className="relative flex-1 pt-1 pb-10">
            {/* Dynamic Grid Lines */}
            <div className="absolute inset-0 left-44 right-2 flex justify-between pointer-events-none mb-10">
              {gridSteps.map(step => (
                <div key={step} className="h-full border-l border-primary/30 relative">
                  <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 font-semibold">
                    {step}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="space-y-3.5 relative z-10">
              {bestProducts.length > 0 ? (
                bestProducts.map((p, idx) => (
                  <HorizontalBar 
                    key={idx} 
                    name={p.name} 
                    value={p.value} 
                    max={chartMax} 
                    color={idx % 3 === 0 ? colors.warning : (idx % 3 === 1 ? colors.primary : '#1e293b')} 
                  />
                ))
              ) : (
                <p className="text-gray-400 text-sm text-center py-10 font-medium">No sales data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Todays Overview (occupies 2 columns on LG) - Semantic Table Redesign */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:col-span-2 lg:col-span-2 flex flex-col">
          <h3 className="text-[#3b3b5e] font-bold text-[17px] mb-6">
            Todays Overview
          </h3>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {/* Top Table - Report */}
            <div className="border border-primary/20 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full border-collapse">
                <thead className="bg-primary/5 border-b border-primary/20">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-primary font-bold text-[14px] w-[45%]">Todays Report</th>
                    <th className="px-6 py-3.5 text-center text-primary font-bold text-[14px] border-l border-primary/20">
                      {currency}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/20">
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 text-gray-500 font-medium text-[13px]">Total Sales</td>
                    <td className="px-6 py-3 text-gray-800 font-bold text-[15px] border-l border-primary/20 text-center">
                      {formatCurrency(todaysOverview.total_sales)}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 text-gray-500 font-medium text-[13px]">Total Purchase</td>
                    <td className="px-6 py-3 text-gray-800 font-bold text-[15px] border-l border-primary/20 text-center">
                      {formatCurrency(todaysOverview.total_purchase)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Table - Last Sales */}
            <div className="border border-primary/20 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4.5 text-gray-500 font-medium text-[13px] w-[45%]">Last Sales</td>
                    <td className="px-6 py-4.5 text-gray-800 font-bold text-[15px] border-l border-primary/20 text-center">
                      {todaysOverview.last_sales ? formatCurrency(todaysOverview.last_sales) : currency}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Monthly Sales & Purchase Report Area Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:col-span-4 flex flex-col min-h-[400px]">
          <div className="flex flex-wrap justify-between items-center mb-8 gap-4 px-2">
            <h3 className="text-[#3b3b5e] font-bold text-[18px]">Monthly Sales & Purchase Report</h3>
            
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: colors.primary }}></div>
                  <span className="text-gray-500 font-semibold text-[12px]">Purchase</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: colors.success }}></div>
                  <span className="text-gray-500 font-semibold text-[12px]">Sales</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1.5 bg-main-bg rounded-full text-[11px] font-bold text-gray-500 cursor-pointer">
                <span>Monthly</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          <div className="flex-1 w-full -ml-4">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <filter id="lineShadow" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
                    <feOffset dx="0" dy="4" result="offsetBlur" />
                    <feFlood floodColor="black" floodOpacity="0.2" result="offsetColor" />
                    <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="shadow" />
                    <feMerge>
                      <feMergeNode in="shadow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <linearGradient id="colorPurchase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.primary} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={colors.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.success} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={colors.success} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                  tickFormatter={(value) => value.toLocaleString()}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="purchase" 
                  stroke={colors.primary} 
                  strokeWidth={3}
                  filter="url(#lineShadow)"
                  fillOpacity={1} 
                  fill="url(#colorPurchase)" 
                  activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke={colors.success} 
                  strokeWidth={3}
                  filter="url(#lineShadow)"
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                  activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Todays Sales Due */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:col-span-2 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[#3b3b5e] font-bold text-[17px]">Todays Sales Due</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-main-bg rounded-full text-[10px] font-bold text-gray-500 cursor-pointer">
              <span>Monthly</span>
              <ChevronDown className="h-3 w-3" />
            </div>
          </div>
          <div className="border border-primary/20 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead className="bg-primary/5 border-b border-primary/20">
                <tr className="text-primary font-bold text-[13px]">
                  <th className="px-4 py-3 text-left w-12">SL.</th>
                  <th className="px-4 py-3 text-left border-l border-primary/20">Merchant Name</th>
                  <th className="px-4 py-3 text-left border-l border-primary/20">Voucher No</th>
                  <th className="px-4 py-3 text-center border-l border-primary/20">Due Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/20">
                {data?.todays_sales_due && data.todays_sales_due.length > 0 ? (
                  data.todays_sales_due.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors text-[13px]">
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 text-gray-600 font-medium border-l border-primary/20 truncate max-w-[120px]">{item.customer_name}</td>
                      <td className="px-4 py-3 text-gray-600 border-l border-primary/20">{item.invoice}</td>
                      <td className="px-4 py-3 text-gray-800 font-bold border-l border-primary/20 text-center">{formatCurrency(item.due_amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm italic">Record not found</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-white border-t border-primary/20 font-bold text-[14px]">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right text-gray-600">Total</td>
                  <td className="px-4 py-3 text-gray-800 border-l border-primary/20 text-center">
                    {formatCurrency(data?.todays_sales_due?.reduce((sum, item) => sum + Number(item.due_amount), 0) || 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Todays Purchase Due */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:col-span-2 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[#3b3b5e] font-bold text-[17px]">Todays Purchase Due</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-main-bg rounded-full text-[10px] font-bold text-gray-500 cursor-pointer">
              <span>Monthly</span>
              <ChevronDown className="h-3 w-3" />
            </div>
          </div>
          <div className="border border-primary/20 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead className="bg-primary/5 border-b border-primary/20">
                <tr className="text-primary font-bold text-[13px]">
                  <th className="px-4 py-3 text-left w-12">SL.</th>
                  <th className="px-4 py-3 text-left border-l border-primary/20">Vendor Name</th>
                  <th className="px-4 py-3 text-left border-l border-primary/20">Purchase ID</th>
                  <th className="px-4 py-3 text-center border-l border-primary/20">Due Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/20">
                {data?.todays_purchase_due && data.todays_purchase_due.length > 0 ? (
                  data.todays_purchase_due.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors text-[13px]">
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 text-gray-600 font-medium border-l border-primary/20 truncate max-w-[120px]">{item.customer_name}</td>
                      <td className="px-4 py-3 text-gray-600 border-l border-primary/20">{item.purchase_id}</td>
                      <td className="px-4 py-3 text-gray-800 font-bold border-l border-primary/20 text-center">{formatCurrency(item.due_amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm italic">Record not found</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-white border-t border-primary/20 font-bold text-[14px]">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right text-gray-600">Total</td>
                  <td className="px-4 py-3 text-gray-800 border-l border-primary/20 text-center">
                    {formatCurrency(data?.todays_purchase_due?.reduce((sum, item) => sum + Number(item.due_amount), 0) || 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Todays Sales Report */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:col-span-4 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[#3b3b5e] font-bold text-[17px]">Todays Sales Report</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-main-bg rounded-full text-[10px] font-bold text-gray-500 cursor-pointer">
              <span>Weekly</span>
              <ChevronDown className="h-3 w-3" />
            </div>
          </div>
          <div className="border border-primary/20 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead className="bg-primary/5 border-b border-primary/20">
                <tr className="text-primary font-bold text-[13px]">
                  <th className="px-6 py-3.5 text-left w-12">SL.</th>
                  <th className="px-6 py-3.5 text-left border-l border-primary/20">Merchant Name</th>
                  <th className="px-6 py-3.5 text-left border-l border-primary/20">Invoice No</th>
                  <th className="px-6 py-3.5 text-center border-l border-primary/20 w-48">Total Amount</th>
                  <th className="px-6 py-3.5 text-center border-l border-primary/20 w-48">Paid Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/20">
                {data?.todays_sales_report && data.todays_sales_report.length > 0 ? (
                  data.todays_sales_report.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors text-[13px]">
                      <td className="px-6 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-6 py-3 text-gray-600 font-medium border-l border-primary/20">{item.customer_name}</td>
                      <td className="px-6 py-3 text-gray-600 border-l border-primary/20">{item.invoice}</td>
                      <td className="px-6 py-3 text-gray-800 font-bold border-l border-primary/20 text-center">{formatCurrency(item.total_amount)}</td>
                      <td className="px-6 py-3 text-gray-800 font-bold border-l border-primary/20 text-center">{formatCurrency(item.paid_amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm italic">Record not found</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-white border-t border-primary/20 font-bold text-[14px]">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right text-gray-600">Total</td>
                  <td className="px-6 py-4 text-gray-800 border-l border-primary/20 text-center">
                    {formatCurrency(data?.todays_sales_report?.reduce((sum, item) => sum + Number(item.total_amount), 0) || 0)}
                  </td>
                  <td className="px-6 py-4 text-gray-800 border-l border-primary/20 text-center">
                    {formatCurrency(data?.todays_sales_report?.reduce((sum, item) => sum + Number(item.paid_amount), 0) || 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
