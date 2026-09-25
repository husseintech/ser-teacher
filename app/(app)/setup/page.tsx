import { and, asc, eq } from "drizzle-orm";
import { BookPlus, GraduationCap, Link2, Save, Users } from "lucide-react";
import { addClassAction, addSubjectAction, assignSubjectAction, deleteClassAction, saveProfileAction, syncRosterAction, updateClassStageAction } from "@/app/actions";
import { DeleteClassButton } from "@/components/app/delete-class-button";
import { getDb } from "@/db";
import { classes, students, subjects, teacherProfiles, teachingAssignments } from "@/db/schema";
import { requireTeacher } from "@/lib/auth";

export const metadata = { title: "بياناتي وصفوفي" };

export default async function SetupPage() {
  const user = await requireTeacher();
  const db = getDb();
  const [[profile], subjectRows, classRows, assignmentRows, studentRows] = await Promise.all([
    db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, user.id)).limit(1),
    db.select().from(subjects).where(eq(subjects.userId, user.id)).orderBy(asc(subjects.name)),
    db.select().from(classes).where(eq(classes.userId, user.id)).orderBy(asc(classes.createdAt)),
    db
      .select({ id: teachingAssignments.id, classId: teachingAssignments.classId, subjectId: teachingAssignments.subjectId, subjectName: subjects.name })
      .from(teachingAssignments)
      .innerJoin(subjects, eq(subjects.id, teachingAssignments.subjectId))
      .where(eq(teachingAssignments.userId, user.id)),
    db.select().from(students).where(and(eq(students.userId, user.id), eq(students.active, true))).orderBy(asc(students.position)),
  ]);

  const assignmentsByClass = new Map<string, typeof assignmentRows>();
  for (const assignment of assignmentRows) assignmentsByClass.set(assignment.classId, [...(assignmentsByClass.get(assignment.classId) ?? []), assignment]);

  return (
    <>
      <header className="page-header">
        <div><h1>بياناتي وصفوفي</h1><p>هذه البيانات تظهر على أغلفة الدفاتر، وتُحفظ في حسابك.</p></div>
      </header>

      <div className="stack">
        <section className="card">
          <div className="card-title"><h2>بيانات المعلم والمدرسة</h2></div>
          <form action={saveProfileAction} className="form-grid">
            <div className="form-row">
              <div className="field"><label>اسم المعلم</label><input className="input" value={user.fullName} readOnly /></div>
              <div className="field"><label>البريد الإلكتروني</label><input className="input" dir="ltr" value={user.email} readOnly /></div>
            </div>
            <div className="form-row">
              <div className="field"><label htmlFor="schoolName">اسم المدرسة</label><input className="input" id="schoolName" name="schoolName" defaultValue={profile?.schoolName} placeholder="مثال: ذكور المنصور الأساسية" required /></div>
              <div className="field"><label htmlFor="schoolNationalId">الرقم الوطني للمدرسة</label><input className="input" id="schoolNationalId" name="schoolNationalId" defaultValue={profile?.schoolNationalId} required /></div>
            </div>
            <div className="form-row">
              <div className="field"><label htmlFor="directorate">مديرية التربية والتعليم</label><input className="input" id="directorate" name="directorate" defaultValue={profile?.directorate ?? "يطا"} required /></div>
              <div className="field"><label htmlFor="academicYear">العام الدراسي</label><input className="input" id="academicYear" name="academicYear" defaultValue={profile?.academicYear ?? "2026/2027"} dir="ltr" required /></div>
            </div>
            <button className="btn btn-primary" type="submit"><Save size={18} />حفظ البيانات</button>
          </form>
        </section>

        <section className="content-grid" style={{ marginTop: 0 }}>
          <div className="card">
            <div className="card-title"><h2>المواد التي أدرسها</h2><BookPlus color="var(--green)" /></div>
            <form action={addSubjectAction} className="inline-form">
              <div className="field"><label htmlFor="subjectName">اسم المادة</label><input className="input" id="subjectName" name="name" placeholder="اللغة العربية" required /></div>
              <button className="btn btn-primary" type="submit">إضافة المادة</button>
            </form>
            <div className="divider" />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{subjectRows.length ? subjectRows.map((subject) => <span className="badge" key={subject.id}>{subject.name}</span>) : <span style={{ color: "var(--muted)" }}>لم تضف مواد بعد.</span>}</div>
          </div>

          <div className="card">
            <div className="card-title"><h2>الصفوف التي أدرسها</h2><GraduationCap color="var(--green)" /></div>
            <form action={addClassAction} className="inline-form">
              <div className="field"><label htmlFor="className">اسم الصف والشعبة</label><input className="input" id="className" name="name" placeholder="الصف الرابع أ" required /></div>
              <div className="field"><label htmlFor="stage">نوع دفتر العلامات</label><select className="select" id="stage" name="stage" required><option value="" disabled>اختر نوع المرحلة</option><option value="basic">المرحلة الأساسية (1–4)</option><option value="upper">المرحلة من الخامس فما فوق</option></select></div>
              <button className="btn btn-primary" type="submit">حفظ الصف</button>
            </form>
            <p style={{ color: "var(--muted)", fontSize: ".82rem", margin: "10px 0 0" }}>إذا كان الصف موجودًا مسبقًا، فإن حفظ الاسم نفسه يحدّث نوع مرحلته بدل تجاهل الاختيار.</p>
            <div className="divider" />
            <div className="class-stage-list">{classRows.length ? classRows.map((schoolClass) => (
              <div className="class-stage-item" key={schoolClass.id}>
                <strong>{schoolClass.name}</strong>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <form action={updateClassStageAction} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="hidden" name="classId" value={schoolClass.id} />
                    <select className="select" name="stage" defaultValue={schoolClass.stage} aria-label={`نوع دفتر العلامات لصف ${schoolClass.name}`}>
                      <option value="basic">المرحلة الأساسية (1–4)</option>
                      <option value="upper">المرحلة من الخامس فما فوق</option>
                    </select>
                    <button className="btn btn-secondary btn-small" type="submit">حفظ</button>
                  </form>
                  <DeleteClassButton action={deleteClassAction} classId={schoolClass.id} className={schoolClass.name} />
                </div>
              </div>
            )) : <span style={{ color: "var(--muted)" }}>لم تضف صفوفًا بعد.</span>}</div>
          </div>
        </section>

        <section className="card">
          <div className="card-title"><div><h2>ربط المواد بالصفوف</h2><span style={{ color: "var(--muted)" }}>حدد المادة التي تدرسها لكل صف؛ يمكن إضافة أكثر من مادة.</span></div><Link2 color="var(--green)" /></div>
          {classRows.length && subjectRows.length ? <div className="roster-grid">{classRows.map((schoolClass) => (
            <div className="roster-card" key={schoolClass.id}>
              <h3>{schoolClass.name}</h3>
              <p>{(assignmentsByClass.get(schoolClass.id) ?? []).map((row) => row.subjectName).join("، ") || "لا توجد مواد مرتبطة"}</p>
              <form action={assignSubjectAction} className="inline-form">
                <input type="hidden" name="classId" value={schoolClass.id} />
                <div className="field"><select className="select" name="subjectId" aria-label={`مادة ${schoolClass.name}`} required><option value="">اختر المادة</option>{subjectRows.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</select></div>
                <button className="btn btn-secondary btn-small" type="submit">ربط المادة</button>
              </form>
            </div>
          ))}</div> : <div className="empty-state">أضف صفًا ومادة أولًا.</div>}
        </section>

        <section className="card">
          <div className="card-title"><div><h2>أسماء الطلاب</h2><span style={{ color: "var(--muted)" }}>انسخ العمود من Excel والصقه هنا؛ كل اسم في سطر مستقل.</span></div><Users color="var(--green)" /></div>
          {classRows.length ? <div className="roster-grid">{classRows.map((schoolClass) => {
            const roster = studentRows.filter((student) => student.classId === schoolClass.id);
            return (
              <form action={syncRosterAction} className="roster-card" key={schoolClass.id}>
                <input type="hidden" name="classId" value={schoolClass.id} />
                <h3>{schoolClass.name}</h3>
                <p>{roster.length} طالبًا محفوظًا</p>
                <div className="field"><label htmlFor={`roster-${schoolClass.id}`}>القائمة</label><textarea className="textarea" id={`roster-${schoolClass.id}`} name="names" defaultValue={roster.map((student) => student.name).join("\n")} placeholder={"أحمد محمد محمود علي\nخالد يوسف حسن سالم\n..."} /></div>
                <button className="btn btn-primary" style={{ width: "100%", marginTop: 12 }} type="submit"><Save size={17} />حفظ قائمة الطلاب</button>
              </form>
            );
          })}</div> : <div className="empty-state">أضف صفوفك أولًا، ثم الصق قائمة كل صف.</div>}
        </section>
      </div>
    </>
  );
}
