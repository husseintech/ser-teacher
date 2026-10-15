"use client";

import { ArrowRight, Minus, Plus, Printer, Sheet, Type } from "lucide-react";
import { useState } from "react";

export function GradebookExportButton({ stage, rowsCount, teacherId }: { stage: "basic" | "upper"; rowsCount: number; teacherId: string }) {
  return (
    <a
      className="btn btn-primary btn-small"
      href={`/api/export/gradebook?stage=${stage}&rows=${rowsCount}&teacherId=${teacherId}`}
      download
      title="تصدير دفتر العلامات إلى ملف Excel"
    >
      <Sheet size={15} />تصدير إلى Excel
    </a>
  );
}

export function PrintToolbar({ gradebook = false, combinedLayout = false }: { gradebook?: boolean; combinedLayout?: boolean }) {
  const [nameFontSize, setNameFontSize] = useState(combinedLayout ? 6 : 7.5);

  function changeNameFontSize(nextSize: number) {
    const boundedSize = Math.min(14, Math.max(5, Math.round(nextSize * 2) / 2));
    setNameFontSize(boundedSize);
    document.querySelector(".print-root")?.setAttribute("style", `--gradebook-name-font-size: ${boundedSize}pt`);
  }

  return (
    <div className="print-toolbar no-print">
      {gradebook ? (
        <div className="gradebook-name-size-control" aria-label="التحكم بحجم خط أسماء الطلاب">
          <Type size={17} />
          <span>حجم خط أسماء الطلاب</span>
          <button className="btn btn-secondary btn-small" onClick={() => changeNameFontSize(nameFontSize - 0.5)} disabled={nameFontSize <= 5} type="button" aria-label="تصغير خط أسماء الطلاب" title="تصغير خط أسماء الطلاب"><Minus size={15} /></button>
          <strong className="gradebook-name-size-value">{nameFontSize} pt</strong>
          <button className="btn btn-secondary btn-small" onClick={() => changeNameFontSize(nameFontSize + 0.5)} disabled={nameFontSize >= 14} type="button" aria-label="تكبير خط أسماء الطلاب" title="تكبير خط أسماء الطلاب"><Plus size={15} /></button>
          <button className="btn btn-secondary btn-small" onClick={() => changeNameFontSize(combinedLayout ? 6 : 7.5)} type="button">إعادة ضبط</button>
        </div>
      ) : null}
      <button className="btn btn-primary" onClick={() => window.print()} type="button"><Printer size={18} />طباعة</button>
      <button className="btn btn-secondary" onClick={() => window.history.back()} type="button"><ArrowRight size={18} />عودة</button>
    </div>
  );
}
