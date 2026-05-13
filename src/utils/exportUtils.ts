import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { formatDate } from './formatters'

interface ExportColumn {
  header: string
  key: string
  width?: number
}

export const exportToExcel = async (
  data: any[],
  columns: ExportColumn[],
  fileName: string
) => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Data')

  // Set columns with auto-width logic if width is not provided
  worksheet.columns = columns.map((col) => {
    // Calculate a reasonable width based on header length if not specified
    const defaultWidth = Math.max(col.header.length + 5, 15)
    return {
      header: col.header.toUpperCase(),
      key: col.key,
      width: col.width || defaultWidth,
    }
  })

  // Add rows and format dates if needed
  const processedData = data.map((item) => {
    const newItem = { ...item }
    // If there's a date field, we can format it here or leave it raw
    // Industry standard is to provide raw date but set Excel format
    return newItem
  })

  worksheet.addRows(processedData)

  // Professional Styling
  // 1. Header Styling
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E4BA1' }, // Primary Color
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 25

  // 2. Add borders to all cells and format dates
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      // Apply borders
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        right: { style: 'thin', color: { argb: 'FFEEEEEE' } },
      }
      
      // Professional Date Formatting
      // If the value is a Date object, apply a standard date format
      if (rowNumber > 1 && cell.value instanceof Date) {
        cell.numFmt = 'dd/mm/yyyy'
        cell.alignment = { horizontal: 'center' }
      }
    })
  })

  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, `${fileName}.xlsx`)
}
