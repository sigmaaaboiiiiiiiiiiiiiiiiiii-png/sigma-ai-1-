import * as XLSX from 'xlsx';
import { ExcelWorkbookData } from '../types/excel';

export async function downloadWorkbookAsXlsx(workbook: ExcelWorkbookData): Promise<void> {
  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: workbook.title,
    Subject: workbook.subtitle || workbook.topic,
    Author: 'Sigma AI Spreadsheet Studio',
    CreatedDate: new Date(),
  };

  workbook.sheets.forEach((sheetData, sIdx) => {
    const aoa: any[][] = [];

    // Row 1: Column Headers
    const headers = sheetData.columns.map((c) => c.header);
    aoa.push(headers);

    // Subsequent Rows: Cell values
    sheetData.rows.forEach((row) => {
      const rowValues = sheetData.columns.map((col) => {
        const cell = row.cells[col.key];
        return cell !== undefined ? cell.value : '';
      });
      aoa.push(rowValues);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Attach real Excel formulas and number/currency/percentage formats
    sheetData.rows.forEach((row, rIdx) => {
      const excelRowIndex = rIdx + 1; // 0 is header row
      sheetData.columns.forEach((col, cIdx) => {
        const cellData = row.cells[col.key];
        if (!cellData) return;

        const cellRef = XLSX.utils.encode_cell({ r: excelRowIndex, c: cIdx });
        const cellObj = ws[cellRef] || { t: 's', v: cellData.value };

        if (typeof cellData.value === 'number') {
          cellObj.t = 'n';
          cellObj.v = cellData.value;
        }

        if (cellData.formula && cellData.formula.startsWith('=')) {
          cellObj.f = cellData.formula.slice(1);
        }

        const fmt = cellData.format || col.format;
        if (fmt === 'currency') {
          const sym = workbook.currencySymbol.trim() || '$';
          cellObj.z = sym.length > 1 ? `"${sym} "#,##0.00` : `${sym}#,##0.00`;
        } else if (fmt === 'percentage') {
          cellObj.z = '0.0"%"';
        } else if (fmt === 'number' && typeof cellData.value === 'number') {
          cellObj.z = '#,##0.##';
        }

        ws[cellRef] = cellObj;
      });
    });

    // Set column widths
    ws['!cols'] = sheetData.columns.map((col) => ({
      wch: col.width || Math.max(14, col.header.length + 4),
    }));

    const safeSheetName =
      (sheetData.name || `Sheet${sIdx + 1}`)
        .replace(/[\\/?*[\]:]/g, '')
        .slice(0, 31) || `Sheet${sIdx + 1}`;

    XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
  });

  // If charts exist, also append a Chart Data Summary sheet so Excel users have the chart series ready
  if (workbook.charts && workbook.charts.length > 0) {
    const chartSpec = workbook.charts[0];
    const sourceSheet =
      workbook.sheets.find((s) => s.name === chartSpec.sheetName) || workbook.sheets[0];
    if (sourceSheet) {
      const chartRows: any[][] = [
        [chartSpec.title],
        ['Chart Type', chartSpec.type.toUpperCase()],
        [],
        [
          sourceSheet.columns.find((c) => c.key === chartSpec.labelColumnKey)?.header || 'Category',
          ...chartSpec.valueColumnKeys.map(
            (vk) => sourceSheet.columns.find((c) => c.key === vk)?.header || vk
          ),
        ],
      ];

      sourceSheet.rows
        .filter((r) => !r.isSummaryRow)
        .forEach((r) => {
          chartRows.push([
            r.cells[chartSpec.labelColumnKey]?.value ?? '',
            ...chartSpec.valueColumnKeys.map((vk) => Number(r.cells[vk]?.value) || 0),
          ]);
        });

      const chartWs = XLSX.utils.aoa_to_sheet(chartRows);
      chartWs['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 18 }];
      if (!wb.SheetNames.includes('Chart Data')) {
        XLSX.utils.book_append_sheet(wb, chartWs, 'Chart Data');
      }
    }
  }

  const safeFilename =
    workbook.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'sigma-workbook';

  XLSX.writeFile(wb, `${safeFilename}.xlsx`);
}
