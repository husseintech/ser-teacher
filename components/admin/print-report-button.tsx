"use client";

import { Printer } from "lucide-react";

export function PrintReportButton() {
  return (
    <button
      className="btn btn-dark"
      type="button"
      onClick={() => window.print()}
      style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
    >
      <Printer size={18} />
      طباعة التقرير
    </button>
  );
}
