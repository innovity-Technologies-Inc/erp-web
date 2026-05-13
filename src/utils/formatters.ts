export const formatCurrency = (amount: number | string, currency = '৳', position = 'right') => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(value)) return '0.00'
  
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

  return position === 'left' ? `${currency}${formatted}` : `${formatted}${currency}`
}

export const formatDate = (date: string | Date) => {
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}
