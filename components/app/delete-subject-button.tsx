"use client";

import { Trash2 } from "lucide-react";

export function DeleteSubjectButton({
  action,
  subjectId,
  subjectName,
  linkedCount,
}: {
  action: (formData: FormData) => Promise<void>;
  subjectId: string;
  subjectName: string;
  linkedCount: number;
}) {
  return (
    <form
      action={async (formData: FormData) => {
        const warning = linkedCount
          ? `\nالمادة مرتبطة بـ ${linkedCount} صف، وسيتم فك الربط وحذف دفاتر العلامات الخاصة بها.`
          : "";
        const confirmed = window.confirm(`حذف المادة «${subjectName}» نهائيًا؟${warning}`);
        if (!confirmed) return;
        formData.set("subjectId", subjectId);
        await action(formData);
      }}
    >
      <input type="hidden" name="subjectId" value={subjectId} />
      <button className="btn btn-danger btn-small" type="submit" aria-label={`حذف مادة ${subjectName}`}>
        <Trash2 size={15} />حذف
      </button>
    </form>
  );
}
