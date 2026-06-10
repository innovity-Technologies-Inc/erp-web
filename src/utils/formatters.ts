export const formatCurrency = (amount: number | string, currency = '৳', position = 'right') => {
  if (amount === null || amount === undefined || amount === '') return position === 'left' ? `${currency}0.00` : `0.00${currency}`
  
  const strAmount = String(amount).replace(/[^0-9.-]+/g, '')
  const value = parseFloat(strAmount)
  
  if (isNaN(value)) return position === 'left' ? `${currency}0.00` : `0.00${currency}`
  
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

  return position === 'left' ? `${currency}${formatted}` : `${formatted}${currency}`
}

export const formatDate = (date: string | Date) => {
  if (!date) return 'N/A'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'N/A'
  
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}
