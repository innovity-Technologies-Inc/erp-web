export interface DashboardStats {
  total_customer: number;
  total_product: number;
  total_suppliers: number;
  total_warehouse: number;
  total_purchase_count: number;
  total_sales_count: number;
  total_contact_msg: number;
}

export interface MonthlyTrendItem {
  month: string;
  sales: number;
  purchase: number;
}

export interface ExpenseStatement {
  total_sales: number;
  total_purchase: number;
  total_expense: number;
  total_service: number;
  total_salary: number;
}

export interface ChannelSale {
  channel: string;
  total: number;
}

export interface TodaysOverview {
  total_sales: number;
  total_purchase: number;
  last_sales: number;
}

export interface IncomeExpenseItem {
  income: number;
  expense: number;
}

export interface PurchaseDueItem {
  id: number;
  purchase_id: string;
  purchase_date: string;
  grand_total_amount: string | number;
  due_amount: string | number;
  supplier_name: string;
  supplier_id: number;
}

export interface SalesDueItem {
  id: number;
  invoice: string;
  date: string;
  total_amount: string | number;
  due_amount: string | number;
  customer_name: string;
  customer_id: number;
}

export interface SalesReportItem {
  id: number;
  invoice: string;
  date: string;
  total_amount: string | number;
  paid_amount: string | number;
  customer_name: string;
  customer_id: number;
}

export interface DashboardAnalyticsResponse {
  success: boolean;
  stats: DashboardStats;
  channel_wise_sales: ChannelSale[];
  expense_statement: ExpenseStatement;
  monthly_trend: MonthlyTrendItem[];
  best_selling_products: { name: string; value: number }[];
  todays_overview: TodaysOverview;
  income_vs_expense: {
    today: IncomeExpenseItem;
    weekly: IncomeExpenseItem;
    monthly: IncomeExpenseItem;
    yearly: IncomeExpenseItem;
  };
  todays_sales_due: SalesDueItem[];
  todays_purchase_due: PurchaseDueItem[];
  todays_sales_report: SalesReportItem[];
}
