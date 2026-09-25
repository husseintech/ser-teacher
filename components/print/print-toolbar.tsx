"use client";

import { ArrowRight, Printer } from "lucide-react";

export function PrintToolbar() {
  return (
    <div className="print-toolbar no-print">
      <button className="btn btn-primary" onClick={() => window.print()} type="button"><Printer size={18} />طباعة</button>
      <button className="btn btn-secondary" onClick={() => window.history.back()} type="button"><ArrowRight size={18} />عودة</button>
    </div>
  );
}
