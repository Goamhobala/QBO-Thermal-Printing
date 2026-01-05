/**
 * Format date to South African format (dd/mm/yyyy)
 * @param dateStr - ISO date string or date string
 * @returns Formatted date string in dd/mm/yyyy format
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Convert date from dd/mm/yyyy to yyyy-mm-dd (for input[type="date"])
 * @param dateStr - Date string in dd/mm/yyyy format
 * @returns ISO date string (yyyy-mm-dd)
 */
export function parseDate(dateStr: string): string {
  const [day, month, year] = dateStr.split('/')
  return `${year}-${month}-${day}`
}

/**
 * Format date from yyyy-mm-dd to dd/mm/yyyy for display
 * @param isoDateStr - ISO date string (yyyy-mm-dd)
 * @returns Formatted date string in dd/mm/yyyy format
 */
export function formatInputDate(isoDateStr: string): string {
  if (!isoDateStr) return ''
  const [year, month, day] = isoDateStr.split('-')
  return `${day}/${month}/${year}`
}
