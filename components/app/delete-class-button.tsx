"use client";

import { Trash2 } from "lucide-react";

export function DeleteClassButton({ action, classId, className, teacherId }: { action: (formData: FormData) => Promise<void>; classId: string; className: string; teacherId: string }) {
  return (
    <form action={async (formData: FormData) => {
      const confirmed = window.confirm("حذف الصف «" + className + "» نهائيًا؟\nسيتم حذف الطلاب، والمواد المرتبطة، ودفاتر العلامات والحضور الخاصة به بالكامل.");
      if (!confirmed) return;
      formData.set("classId", classId);
      formData.set("teacherId", teacherId);
      await action(formData);
    }}>
      <input type="hidden" name="teacherId" value={teacherId} />
      <input type="hidden" name="classId" value={classId} />
      <button className="btn btn-danger btn-small" type="submit" aria-label={"حذف صف " + className}><Trash2 size={15} />حذف</button>
    </form>
  );
}
