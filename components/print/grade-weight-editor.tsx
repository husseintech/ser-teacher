"use client";

import { useState } from "react";
import { Save, Settings2 } from "lucide-react";
import { updateGradebookWeightsAction } from "@/app/actions";

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
  academicYear,
  weights,
}: {
  classId: string;
  subjectId: string;
  academicYear: string;
  weights: Weights;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="grade-weight-editor screen-only">
      <div className="grade-weight-editor-summary">
        <strong>أوزان العلامات الظاهرة باللون الأصفر</strong>
        <button className="btn btn-secondary btn-small" type="button" onClick={() => setOpen((value) => !value)}>
          <Settings2 size={15} />{open ? "إغلاق التعديل" : "تعديل الأوزان"}
        </button>
      </div>
      {open ? (
        <form action={updateGradebookWeightsAction}>
          <input type="hidden" name="classId" value={classId} />
          <input type="hidden" name="subjectId" value={subjectId} />
          <input type="hidden" name="academicYear" value={academicYear} />
          <div className="grade-weight-editor-fields">
            <label className="grade-weight-editor-field">اختبار قصير 1<input name="shortExam1Weight" type="number" min="0" max="100" defaultValue={weights.shortExam1} required /></label>
            <label className="grade-weight-editor-field">اختبار نصف الفصل<input name="midtermExamWeight" type="number" min="0" max="100" defaultValue={weights.midtermExam} required /></label>
            <label className="grade-weight-editor-field">اختبار قصير 2<input name="shortExam2Weight" type="number" min="0" max="100" defaultValue={weights.shortExam2} required /></label>
            <label className="grade-weight-editor-field">التقويم النوعي<input name="qualitativeWeight" type="number" min="0" max="100" defaultValue={weights.qualitative} required /></label>
            <label className="grade-weight-editor-field">اختبار نهاية الفصل<input name="finalExamWeight" type="number" min="0" max="100" defaultValue={weights.finalExam} required /></label>
          </div>
          <div className="grade-weight-editor-actions">
            <span>يجب أن يكون مجموع الأوزان 100%.</span>
            <button className="btn btn-primary btn-small" type="submit"><Save size={15} />حفظ الأوزان</button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
