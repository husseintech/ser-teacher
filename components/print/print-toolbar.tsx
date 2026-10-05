"use client";

import { ArrowRight, Printer, Sheet } from "lucide-react";

export function GradebookExportButton({ stage, rowsCount }: { stage: "basic" | "upper"; rowsCount: number }) {
  return (
    <a
      className="btn btn-primary btn-small"
      href={`/api/export/gradebook?stage=${stage}&rows=${rowsCount}`}
      download
      title="تصدير دفتر العلامات إلى ملف Excel"
    >
      <Sheet size={15} />تصدير إلى Excel
    </a>
  );
}

export function PrintToolbar() {
  return (
    <div className="print-toolbar no-print">
      <button className="btn btn-primary" onClick={() => window.print()} type="button"><Printer size={18} />طباعة</button>
      <button className="btn btn-secondary" onClick={() => window.history.back()} type="button"><ArrowRight size={18} />عودة</button>
    </div>
  );
}
