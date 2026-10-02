"use client";

import { Unlink } from "lucide-react";

export function UnlinkSubjectButton({
  action,
  classId,
  className,
  subjectId,
  subjectName,
}: {
  action: (formData: FormData) => Promise<void>;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
}) {
  return (
    <form
      action={async (formData: FormData) => {
        const confirmed = window.confirm(
          `فك ربط المادة «${subjectName}» عن الصف «${className}»؟\nتبقى المادة محفوظة، لكن دفتر علامات هذه المادة لهذا الصف سيُحذف.`,
        );
        if (!confirmed) return;
        formData.set("classId", classId);
        formData.set("subjectId", subjectId);
        await action(formData);
      }}
    >
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="subjectId" value={subjectId} />
      <button className="btn btn-secondary btn-small" type="submit" aria-label={`فك ربط ${subjectName} عن ${className}`}>
        <Unlink size={15} />فك الربط
      </button>
    </form>
  );
}
