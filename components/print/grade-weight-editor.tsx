"use client";

import { Save, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { updateGradebookWeightsAction } from "@/app/actions";
import { initialActionState } from "@/lib/action-state";

type Weights = {
  shortExam1: number;
  midtermExam: number;
  shortExam2: number;
  qualitative: number;
  finalExam: number;
};

export function GradeWeightEditor({
  classId,
  subjectId,
  className,
  subjectName,
  academicYear,
  weights,
}: {
  classId: string;
  subjectId: string;
  className: string;
  subjectName: string;
  academicYear: string;
  weights: Weights;
}) {
  const [state, action, pending] = useActionState(updateGradebookWeightsAction, initialActionState);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const refreshed = useRef(false);

  // بعد نجاح الحفظ تُعاد قراءة الأوزان من قاعدة البيانات،
  // فتنعكس على صفحتَي الفصل الأول والفصل الثاني معًا.
  useEffect(() => {
    if (!state.ok || refreshed.current) return;
    refreshed.current = true;
    router.refresh();
  }, [state.ok, router]);

  return (
    <div className="grade-weight-editor screen-only">
      <div className="grade-weight-editor-summary">
        <strong>
          أوزان العلامات: {className} — {subjectName}
        </strong>
        <button className="btn btn-secondary btn-small" type="button" onClick={() => setOpen((value) => !value)}>
          <Settings2 size={15} />{open ? "إغلاق التعديل" : "تعديل الأوزان"}
        </button>
      </div>
      {open ? (
        <form action={action}>
          <input type="hidden" name="classId" value={classId} />
          <input type="hidden" name="subjectId" value={subjectId} />
          <input type="hidden" name="academicYear" value={academicYear} />
          <div className="grade-weight-editor-fields">
            <label className="grade-weight-editor-field">اختبار قصير 1<input name="shortExam1Weight" type="number" min="0" max="1000" defaultValue={weights.shortExam1} required /></label>
            <label className="grade-weight-editor-field">اختبار نصف الفصل<input name="midtermExamWeight" type="number" min="0" max="1000" defaultValue={weights.midtermExam} required /></label>
            <label className="grade-weight-editor-field">اختبار قصير 2<input name="shortExam2Weight" type="number" min="0" max="1000" defaultValue={weights.shortExam2} required /></label>
            <label className="grade-weight-editor-field">التقويم النوعي<input name="qualitativeWeight" type="number" min="0" max="1000" defaultValue={weights.qualitative} required /></label>
            <label className="grade-weight-editor-field">اختبار نهاية الفصل<input name="finalExamWeight" type="number" min="0" max="1000" defaultValue={weights.finalExam} required /></label>
          </div>
          <div className="grade-weight-editor-actions">
            <span>اكتب مجموع علامات المادة كما هو، دون اشتراط 100.</span>
            <button className="btn btn-primary btn-small" disabled={pending} type="submit">
              <Save size={15} />{pending ? "جارٍ الحفظ..." : "حفظ الأوزان"}
            </button>
          </div>
          {state.message ? (
            <div className={`alert ${state.ok ? "alert-success" : "alert-error"}`} role="status">{state.message}</div>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
