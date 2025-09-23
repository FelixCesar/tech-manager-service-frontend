import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';


interface FileSheet {
  fileName: string;
  rows: any[];
}

interface CombinedRow {
  __index: number;
  __file: string;
  __fileRow: number;
  raw: any;
}
@Component({
  selector: 'app-filtro',
  imports: [CommonModule, FormsModule],
  templateUrl: './filtro.html',
  styleUrl: './filtro.css'
})
export class Filtro {

  files: File[] = [];
  fileSheets: FileSheet[] = [];
  combined: CombinedRow[] = [];
  detectedHeaders: string[] = [];
  detectedOperators: Set<string> = new Set();
  appliedFilters: string[] = [];
  lastResult: CombinedRow[] = [];

  opColumn: string = '';
  askOrange: boolean = true;
  mode: 'include' | 'exclude' = 'include';

  previewHeaders: string[] = [];
  previewRows: any[] = [];
  summary: string = '';

  sanitize(v: any): string {
    return v === null || v === undefined ? '' : String(v).trim();
  }

  onFileSelected(event: any) {
    this.files = Array.from(event.target.files);
  }

  async readFirstSheet(file: File): Promise<FileSheet> {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    const sn = wb.SheetNames[0];
    const sheet = wb.Sheets[sn];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: null });
    return { fileName: file.name, rows: json };
  }

  async loadFiles() {
    if (this.files.length === 0) {
      alert('Selecciona archivos antes de cargar.');
      return;
    }
    this.fileSheets = [];
    this.detectedOperators = new Set();

    for (const f of this.files) {
      try {
        const res = await this.readFirstSheet(f);
        this.fileSheets.push(res);
      } catch (e: any) {
        alert('Error leyendo ' + f.name + ': ' + e.message);
        return;
      }
    }

    const firstRows = this.fileSheets[0].rows;
    this.detectedHeaders =
      firstRows.length > 0
        ? Object.keys(firstRows[0]).map((h) => h || '')
        : ['col1', 'col2', 'col3'];

    this.combined = [];
    let globalIdx = 0;
    for (const fs of this.fileSheets) {
      for (let i = 0; i < fs.rows.length; i++) {
        const row = fs.rows[i];
        globalIdx++;
        this.combined.push({
          __index: globalIdx,
          __file: fs.fileName,
          __fileRow: i + 2,
          raw: row
        });
      }
    }

    const probableHeader =
      this.detectedHeaders[2] || this.detectedHeaders[this.detectedHeaders.length - 1];
    this.opColumn = probableHeader;

    this.combined.forEach((r) => {
      const op = this.sanitize(r.raw[probableHeader]);
      if (op) this.detectedOperators.add(op);
    });

    alert('Archivos cargados. Revisa la columna de operador y selecciona filtros.');
  }

  applyFilters() {
    if (this.combined.length === 0) {
      alert('Carga primero los archivos.');
      return;
    }

    const selectedOps = Array.from(this.detectedOperators).filter((op) =>
      this.appliedFilters.includes(op)
    );

    const result: CombinedRow[] = [];
    for (const r of this.combined) {
      const opRaw = this.sanitize(r.raw[this.opColumn]);
      const keep =
        selectedOps.length === 0
          ? true
          : this.mode === 'include'
          ? selectedOps.includes(opRaw)
          : !selectedOps.includes(opRaw);
      if (keep) result.push(r);
    }

    this.lastResult = result;
    this.renderPreview(result);
  }

  renderPreview(rows: CombinedRow[]) {
    const first = rows[0];
    this.previewHeaders = first
      ? Object.keys(first.raw)
      : this.detectedHeaders.length
      ? this.detectedHeaders
      : ['col1', 'col2', 'col3'];

    this.previewRows = rows.slice(0, 50).map((r) => r.raw);

    this.summary = `Filas después del filtro: ${rows.length} — mostrando primeras ${this.previewRows.length}`;
  }

  saveExcel() {
    const rows = this.lastResult;
    if (rows.length === 0) {
      alert('No hay resultados para guardar');
      return;
    }
    const headers = Object.keys(rows[0].raw);
    const aoa = [headers];
    for (const r of rows) {
      aoa.push(headers.map((h) => r.raw[h]));
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, 'Resultado');
    XLSX.writeFile(wb, 'resultado_filtrado.xlsx');
  }

  saveCsv() {
    const rows = this.lastResult;
    if (rows.length === 0) {
      alert('No hay resultados para descargar');
      return;
    }
    const headers = Object.keys(rows[0].raw);
    const csvRows = [headers.join(',')];
    for (const r of rows) {
      const line = headers
        .map((h) =>
          '"' +
          String(r.raw[h] === null || r.raw[h] === undefined ? '' : String(r.raw[h])).replace(
            /"/g,
            '""'
          ) +
          '"'
        )
        .join(',');
      csvRows.push(line);
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resultado_filtrado.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 600);
  }
getChecked(event: Event): boolean {
  return (event.target as HTMLInputElement).checked;
}

toggleFilter(op: string, checked: boolean) {
  if (checked) {
    this.appliedFilters.push(op);
  } else {
    this.appliedFilters = this.appliedFilters.filter(f => f !== op);
  }
}



}
