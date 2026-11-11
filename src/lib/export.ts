import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportExcel(filename: string, rows: Record<string, any>[]) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, filename + '.xlsx');
}

export function exportPdf(filename: string, title: string, headers: string[], rows: any[][]) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(10);
  doc.text('Mau Crest Dairies — Nurtured by Nature, Delivered Fresh', 14, 22);
  autoTable(doc, { head: [headers], body: rows, startY: 28, styles: { fontSize: 9 } });
  doc.save(filename + '.pdf');
}

export function printArea(html: string) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<html><head><title>Print</title><style>body{font-family:Arial,sans-serif;font-size:13px;color:#1E2A22}table{width:100%;border-collapse:collapse}td,th{border:1px solid #E7DDB5;padding:6px;text-align:left}</style></head><body>${html}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}
