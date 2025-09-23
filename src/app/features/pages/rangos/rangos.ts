import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';


interface FileRow{
  phoneRaw: any;
  phone: string;
  fileName: string;
  fileRowExcel: number;
}

interface Block{
  prefix: string;
  start: number;
  end: number;
  count: number;
  startMeta: {fileName: string, fileRowExcel: number};
  endMeta: {fileName: string, fileRowExcel: number};
}

@Component({
  selector: 'app-rangos',
  imports: [CommonModule, FormsModule],
  templateUrl: './rangos.html',
  styleUrl: './rangos.css'
})
export class Rangos {

  files: File[] = [];
  loadedData: FileRow[] = [];
  detectedColumn: string = '';
  headers: string[] = [];
  resultsVisible = false;
  blocks: Block[] = [];
  summary = '';
  distinctPref = '';
  debugText = '';
  combineFiles = true;

  onFileChange(event: any) {
    this.files = Array.from(event.target.files);
  }

  sanitizePhone(s: any): string {
    if (s === null || s === undefined) return '';
    return String(s).replace(/\D/g, '');
  }

  detectPhoneColumn(headers: string[], sampleRows: any[]): string {
    const headerCandidates = headers.map(h => String(h || '').toLowerCase());
    for (const keyword of ['tel','telefono','numero','movil','mobile','mov','phone']) {
      const idx = headerCandidates.findIndex(h => h.includes(keyword));
      if (idx >= 0) return headers[idx];
    }

    const counts = headers.map(() => 0);
    for (const row of sampleRows) {
      headers.forEach((h, i) => {
        const v = this.sanitizePhone(row[h]);
        if (v.length >= 6) counts[i]++;
      });
    }
    const bestIdx = counts.indexOf(Math.max(...counts));
    return headers[bestIdx] || headers[0];
  }

  async readFirstSheet(file: File) {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: null });
    return { sheetName, json };
  }

  async processFiles() {
    if (this.files.length === 0) {
      alert('Selecciona al menos un archivo Excel.');
      return;
    }
    this.loadedData = [];

    const fileSheets: { fileName: string; rows: any[] }[] = [];
    for (const f of this.files) {
      try {
        const res = await this.readFirstSheet(f);
        fileSheets.push({ fileName: f.name, rows: res.json });
      } catch (e: any) {
        console.error('Error leyendo', f.name, e);
        alert('Error leyendo ' + f.name + ': ' + e.message);
        return;
      }
    }

    const firstHeaders = fileSheets[0].rows.length > 0 ? Object.keys(fileSheets[0].rows[0]) : [];
    const sampleRows = fileSheets[0].rows.slice(0, 20);
    this.detectedColumn = this.detectPhoneColumn(firstHeaders, sampleRows);

    // Unir headers de todos los archivos
    const headersUnion = new Set<string>();
    fileSheets.forEach(fs => fs.rows.slice(0, 1).forEach(r => Object.keys(r || {}).forEach(h => headersUnion.add(h))));
    this.headers = Array.from(headersUnion.size ? headersUnion : firstHeaders);

    let globalIndex = 0;
    for (const fs of fileSheets) {
      for (let i = 0; i < fs.rows.length; i++) {
        const row = fs.rows[i];
        globalIndex++;
        this.loadedData.push({
          phoneRaw: row[this.detectedColumn],
          phone: this.sanitizePhone(row[this.detectedColumn]),
          fileName: fs.fileName,
          fileRowExcel: i + 2 // +1 encabezado, +1 index
        });
      }
    }

    this.runAnalysis(this.loadedData, this.detectedColumn);
  }

  runAnalysis(data: FileRow[], columnName: string) {
    if (!data || data.length === 0) {
      alert('No hay datos para procesar');
      return;
    }

    const list = data.map((d, idx) => ({
      idxData: idx + 1,
      phone: d.phone,
      phoneRaw: d.phoneRaw,
      prefix: (d.phone || '').slice(0, 3),
      fileName: d.fileName,
      fileRowExcel: d.fileRowExcel
    }));

    const validList = list.filter(x => x.prefix && x.prefix.length === 3);
    const invalidCount = list.length - validList.length;

    const blocks: Block[] = [];
    let currentPref: string | null = null;
    let startIdx: number | null = null;
    let startMeta: any = null;
    let count = 0;
    let endMeta: any = null;

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const p = item.prefix;
      if (p !== currentPref) {
        if (currentPref !== null) {
          blocks.push({ prefix: currentPref, start: startIdx!, end: i, count, startMeta, endMeta });
        }
        currentPref = p;
        startIdx = i + 1;
        startMeta = { fileName: item.fileName, fileRowExcel: item.fileRowExcel };
        count = 1;
        endMeta = { fileName: item.fileName, fileRowExcel: item.fileRowExcel };
      } else {
        count++;
        endMeta = { fileName: item.fileName, fileRowExcel: item.fileRowExcel };
      }
    }
    if (currentPref !== null) {
      blocks.push({ prefix: currentPref, start: startIdx!, end: list.length, count, startMeta, endMeta });
    }

    this.blocks = blocks;
    this.summary = `Registros totales: ${list.length}${invalidCount ? ' — inválidos: ' + invalidCount : ''}`;
    const distinct = Array.from(new Set(blocks.map(b => b.prefix))).sort();
    this.distinctPref = 'Prefijos encontrados: ' + distinct.join(', ');
    this.debugText = list.slice(0, 20).map((r, i) =>
      `${i + 1}. ${r.phoneRaw || ''} -> ${r.phone} (pref:${r.prefix}) [${r.fileName}:${r.fileRowExcel}]`
    ).join('\n') || '(sin registros)';
    this.resultsVisible = true;
  }

  downloadCsv() {
    if (!this.blocks.length) {
      alert('No hay resultados para descargar');
      return;
    }
    const rows = [['#','prefijo','start','end','count','start_file','start_row_excel','end_file','end_row_excel']];
    this.blocks.forEach((b, i) =>
      rows.push([
        String(i + 1),
        String(b.prefix),
        String(b.start),
        String(b.end),
        String(b.count),
        String(b.startMeta.fileName),
        String(b.startMeta.fileRowExcel),
        String(b.endMeta.fileName),
        String(b.endMeta.fileRowExcel)
      ])
    );
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'rangos_prefijos.csv';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
  }

}
