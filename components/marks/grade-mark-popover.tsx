"use client";

import { PencilLine } from "lucide-react";
import { useRef, useState } from "react";
import {
  COMPLETION_MAX,
  EMPTY_MARK_VALUES,
  GRADE_SECTIONS,
  TERMS,
  formatMark,
  markTotal,
  toMarkNumber,
} from "@/lib/grade-sections";
import type { MarkKey, MarkValues } from "@/lib/grade-sections";

export function GradeMarkPopover({
  studentName,
  term,
  values,
  otherTermValues,
  onChange,
  onCompletionChange,
}: {
  studentName: string;
  term: 1 | 2;
  values: MarkValues;
  otherTermValues: MarkValues;
  onChange: (key: MarkKey, value: string) => void;
  onCompletionChange: (value: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<MarkValues>({ ...EMPTY_MARK_VALUES });
  const [completion, setCompletion] = useState("");

  function open() {
    setDraft({ ...EMPTY_MARK_VALUES, ...values });
    setCompletion(formatMark(values.completion));
    ref.current?.showModal();
  }

  return (
    <>
      <button
        aria-label={`تعديل علامات ${studentName}`}
        className="btn btn-secondary btn-small"
        onClick={open}
        type="button"
      >
        <PencilLine size={15} />تعديل
      </button>

      <dialog className="marks-dialog" ref={ref}>
        <div className="marks-dialog-header">
          <div>
            <h2>{studentName}</h2>
            <span>تعديل علامات {TERMS[term - 1].name}</span>
          </div>
          <button
            aria-label="إغلاق"
            className="marks-dialog-close"
            onClick={() => ref.current?.close()}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="marks-dialog-grid">
          {GRADE_SECTIONS.map((section) => (
            <div className="field" key={section.key}>
              <label htmlFor={`pop-${section.key}`}>
                {section.label} <span className="weight-hint">{section.weight}</span>
              </label>
              <input
                className="input"
                id={`pop-${section.key}`}
                inputMode="decimal"
                max={section.max}
                min={0}
                onChange={(event) => setDraft((current) => ({ ...current, [section.key]: toMarkNumber(event.target.value) }))}
                placeholder={`${section.max} كحد أقصى`}
                step="0.5"
                type="number"
                value={draft[section.key] ?? ""}
              />
            </div>
          ))}

          {term === 2 ? (
            <div className="field">
              <label htmlFor="pop-completion">علامة الإكمال</label>
              <input
                className="input"
                id="pop-completion"
                inputMode="decimal"
                max={COMPLETION_MAX}
                min={0}
                onChange={(event) => setCompletion(event.target.value)}
                placeholder={`${COMPLETION_MAX} كحد أقصى`}
                step="0.5"
                type="number"
                value={completion}
              />
            </div>
          ) : null}

          <div className="marks-dialog-total">
            <span>مجموع {TERMS[term - 1].short}</span>
            <strong>{markTotal({ ...draft, completion: term === 2 ? toMarkNumber(completion) : null })} / 100</strong>
          </div>
        </div>

        <p className="marks-dialog-note">
          {term === 1 ? TERMS[1].name : TERMS[0].name}: {GRADE_SECTIONS.map((section) => formatMark(otherTermValues[section.key]) || "—").join(" · ")}
        </p>

        <div className="marks-dialog-actions">
          <button className="btn btn-secondary" onClick={() => ref.current?.close()} type="button">
            إلغاء
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              for (const section of GRADE_SECTIONS) {
                onChange(section.key, formatMark(draft[section.key]));
              }
              if (term === 2) onCompletionChange(completion);
              ref.current?.close();
            }}
            type="button"
          >
            تطبيق التعديل
          </button>
        </div>
      </dialog>
    </>
  );
}
