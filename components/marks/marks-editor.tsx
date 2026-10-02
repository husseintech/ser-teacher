"use client";

import { Check, Settings2 } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { saveMarksAction } from "@/app/actions";
import { GradeMarkPopover } from "@/components/marks/grade-mark-popover";
import { initialActionState } from "@/lib/action-state";
import {
  COMPLETION_MAX,
  GRADE_SECTIONS,
  MARK_KEYS,
  TERMS,
  markTotal,
  toMarkNumber,
} from "@/lib/grade-sections";
import type { MarkKey, MarkValues } from "@/lib/grade-sections";

export type MarkEditorRow = {
  studentId: string;
  name: string;
  status: string;
  terms: Record<1 | 2, MarkValues>;
  notes: Record<1 | 2, string>;
};

export function MarksEditor({
  classId,
  className,
  subjectId,
  subjectName,
  initialRows,
}: {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  initialRows: MarkEditorRow[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [term, setTerm] = useState<1 | 2>(1);
  const [state, action, pending] = useActionState(saveMarksAction, initialActionState);

  const payload = useMemo(
    () =>
      JSON.stringify(
        rows.map((row) => ({
          studentId: row.studentId,
          marks: Object.fromEntries(
            MARK_KEYS.map((key) => [key, row.terms[term][key]]),
          ),
          completion: term === 2 ? row.terms[2].completion : null,
          notes: row.notes[term],
        })),
      ),
    [rows, term],
  );

  useEffect(() => {
    if (state.ok) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.ok]);

  function setMark(studentId: string, key: MarkKey, raw: string) {
    setRows((current) =>
      current.map((row) => {
        if (row.studentId !== studentId) return row;
        const terms: Record<1 | 2, MarkValues> = { ...row.terms };
        terms[term] = { ...terms[term], [key]: toMarkNumber(raw) };
        return { ...row, terms };
      }),
    );
  }

  function setCompletion(studentId: string, raw: string) {
    setRows((current) =>
      current.map((row) => {
        if (row.studentId !== studentId) return row;
        const terms: Record<1 | 2, MarkValues> = { ...row.terms };
        terms[2] = { ...terms[2], completion: toMarkNumber(raw) };
        return { ...row, terms };
      }),
    );
  }

  function setNotes(studentId: string, value: string) {
    setRows((current) =>
      current.map((row) => {
        if (row.studentId !== studentId) return row;
        const notes: Record<1 | 2, string> = { ...row.notes };
        notes[term] = value;
        return { ...row, notes };
      }),
    );
  }

  return (
    <form action={action} className="stack">
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="subjectId" value={subjectId} />
      <input type="hidden" name="term" value={term} />
      <input type="hidden" name="rows" value={payload} />

      <section className="card">
        <div className="card-title">
          <div>
            <h2>{className} — {subjectName}</h2>
            <span style={{ color: "var(--muted)" }}>
              اكتب علامة كل اختبار في خانته، والمجموع يُحسب تلقائيًا. اضغط زر «تعديل» في أي صف لفتح مربع مستقل لعلامات ذلك الطالب في هذا الفصل.
            </span>
          </div>
          <Settings2 color="var(--green)" />
        </div>

        <div className="term-tabs" role="tablist" aria-label="الفصل الدراسي">
          {TERMS.map((item) => (
            <button
              aria-selected={term === item.term}
              className={`term-tab${term === item.term ? " active" : ""}`}
              key={item.term}
              onClick={() => setTerm(item.term)}
              role="tab"
              type="button"
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="data-table-wrap">
          <table className="data-table grade-table">
            <thead>
              <tr>
                <th>#</th>
                <th>اسم الطالب</th>
                {GRADE_SECTIONS.map((section) => (
                  <th key={section.key}>
                    {section.label}
                    <br />
                    <span className="weight-hint">{section.weight}</span>
                  </th>
                ))}
                <th>المجموع / 100</th>
                {term === 2 ? <th>علامة الإكمال / {COMPLETION_MAX}</th> : null}
                <th>ملاحظات</th>
                <th>تعديل</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const values = row.terms[term];
                return (
                  <tr key={row.studentId}>
                    <td>{index + 1}</td>
                    <td className="name-col">
                      {row.name}
                      {row.status && row.status !== "منتظم" ? (
                        <span className="student-status-hint">{row.status}</span>
                      ) : null}
                    </td>
                    {GRADE_SECTIONS.map((section) => (
                      <td key={section.key}>
                        <input
                          aria-label={`${section.label} — ${row.name}`}
                          className={`mark-input${values[section.key] === null ? " empty" : ""}`}
                          inputMode="decimal"
                          max={section.max}
                          min={0}
                          name={`display-${row.studentId}-${section.key}`}
                          onChange={(event) => setMark(row.studentId, section.key, event.target.value)}
                          placeholder="—"
                          step="0.5"
                          type="number"
                          value={values[section.key] ?? ""}
                        />
                      </td>
                    ))}
                    <td className="grade-total">{markTotal(values)}</td>
                    {term === 2 ? (
                      <td>
                        <input
                          aria-label={`علامة الإكمال — ${row.name}`}
                          className={`mark-input${values.completion === null ? " empty" : ""}`}
                          inputMode="decimal"
                          max={COMPLETION_MAX}
                          min={0}
                          onChange={(event) => setCompletion(row.studentId, event.target.value)}
                          placeholder="—"
                          step="0.5"
                          type="number"
                          value={values.completion ?? ""}
                        />
                      </td>
                    ) : null}
                    <td>
                      <input
                        aria-label={`ملاحظات — ${row.name}`}
                        className="input notes"
                        maxLength={300}
                        onChange={(event) => setNotes(row.studentId, event.target.value)}
                        value={row.notes[term]}
                      />
                    </td>
                    <td>
                      <GradeMarkPopover
                        onChange={(key, value) => setMark(row.studentId, key, value)}
                        onCompletionChange={(value) => setCompletion(row.studentId, value)}
                        otherTermValues={row.terms[term === 1 ? 2 : 1]}
                        studentName={row.name}
                        term={term}
                        values={values}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="editor-toolbar">
          <button className="btn btn-primary" disabled={pending || !rows.length} type="submit">
            <Check size={18} />
            {pending ? "جارٍ الحفظ..." : `حفظ علامات ${TERMS[term - 1].name}`}
          </button>
          {state.message ? (
            <span className={`alert ${state.ok ? "alert-success" : "alert-error"}`} role="status">
              {state.message}
            </span>
          ) : null}
        </div>
      </section>
    </form>
  );
}
