import { and, asc, eq } from "drizzle-orm";
import { BookPlus, GraduationCap, Link2, Save, Users } from "lucide-react";
import { addClassAction, addSubjectAction, assignSubjectAction, deleteClassAction, deleteSubjectAction, saveProfileAction, syncRosterAction, updateClassStageAction, updateSubjectAction } from "@/app/actions";
import { DeleteClassButton } from "@/components/app/delete-class-button";
import { DeleteSubjectButton } from "@/components/app/delete-subject-button";
import { getDb } from "@/db";
import { classes, students, subjects, teacherProfiles, teachingAssignments } from "@/db/schema";
import { requireTeacher } from "@/lib/auth";

export const metadata = { title: "بياناتي وصفوفي" };

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ teacherId?: string }> }) {
  const user = await requireTeacher();
  const query = await searchParams;
  const db = getDb();
  const teacherRows = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, user.id)).orderBy(asc(teacherProfiles.createdAt));
  const profile = teacherRows.find((item) => item.id === query.teacherId) ?? teacherRows[0];
  if (!profile) return <div className="empty-state">لا يوجد معلم في هذا الحساب.</div>;
  const [subjectRows, classRows, assignmentRows, studentRows] = await Promise.all([
    db.select().from(subjects).where(and(eq(subjects.userId, user.id), eq(subjects.teacherProfileId, profile.id))).orderBy(asc(subjects.name)),
    db.select().from(classes).where(and(eq(classes.userId, user.id), eq(classes.teacherProfileId, profile.id))).orderBy(asc(classes.createdAt)),
    db.select({ id: teachingAssignments.id, classId: teachingAssignments.classId, subjectId: teachingAssignments.subjectId, subjectName: subjects.name })
      .from(teachingAssignments).innerJoin(subjects, eq(subjects.id, teachingAssignments.subjectId))
      .where(and(eq(teachingAssignments.userId, user.id), eq(teachingAssignments.teacherProfileId, profile.id))),
    db.select().from(students).where(and(eq(students.userId, user.id), eq(students.teacherProfileId, profile.id), eq(students.active, true))).orderBy(asc(students.position)),
  ]);

  const assignmentsByClass = new Map<string, typeof assignmentRows>();
  for (const assignment of assignmentRows) assignmentsByClass.set(assignment.classId, [...(assignmentsByClass.get(assignment.classId) ?? []), assignment]);

  return (
    <>
      <header className="page-header">
        <div><h1>بياناتي وصفوفي</h1><p>يمكن للحساب الواحد إدارة عدة معلمين، ولكل معلم دفاتره وطلابه بشكل مستقل.</p></div>
      </header>

      <section className="card" style={{ marginBottom: 18 }}><div className="card-title"><h2>اختيار المعلم</h2></div><form method="get" className="inline-form"><div className="field"><label htmlFor="teacherId">المعلم</label><select className="select" id="teacherId" name="teacherId" defaultValue={profile.id}>{teacherRows.map((teacher) => <option value={teacher.id} key={teacher.id}>{teacher.name}</option>)}</select></div><button className="btn btn-secondary" type="submit">فتح بيانات المعلم</button></form><div className="divider" /><form action={addTeacherAction} className="inline-form"><input type="hidden" name="teacherId" value={profile.id} /><div className="field"><label htmlFor="newTeacherName">إضافة معلم جديد</label><input className="input" id="newTeacherName" name="name" placeholder="اسم المعلم الرباعي" required /></div><button className="btn btn-primary" type="submit">إضافة المعلم</button></form></section>

      <div className="stack">
        <section className="card">
          <div className="card-title"><h2>بيانات المعلم والمدرسة</h2></div>
          <form action={saveProfileAction} className="form-grid"><input type="hidden" name="teacherId" value={profile.id} />
            <div className="form-row">
              <div className="field"><label>اسم المعلم</label><input className="input" value={profile.name} readOnly /></div>
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
            <form action={addSubjectAction} className="inline-form"><input type="hidden" name="teacherId" value={profile.id} />
              <div className="field"><label htmlFor="subjectName">اسم المادة</label><input className="input" id="subjectName" name="name" placeholder="اللغة العربية" required /></div>
              <button className="btn btn-primary" type="submit">إضافة المادة</button>
            </form>
            <div className="divider" />
            <div className="subject-list">{subjectRows.length ? subjectRows.map((subject) => (
              <div className="subject-item" key={subject.id}>
                <form action={updateSubjectAction} className="inline-form subject-edit-form">
                  <input type="hidden" name="teacherId" value={profile.id} /><input type="hidden" name="subjectId" value={subject.id} />
                  <div className="field"><label htmlFor={`subject-${subject.id}`}>اسم المادة</label><input className="input" id={`subject-${subject.id}`} name="name" defaultValue={subject.name} required /></div>
                  <button className="btn btn-secondary btn-small" type="submit"><Save size={15} />حفظ الاسم</button>
                </form>
                <DeleteSubjectButton action={deleteSubjectAction} subjectId={subject.id} subjectName={subject.name} teacherId={profile.id} />
              </div>
            )) : <span style={{ color: "var(--muted)" }}>لم تضف مواد بعد.</span>}</div>
          </div>

          <div className="card">
            <div className="card-title"><h2>الصفوف التي أدرسها</h2><GraduationCap color="var(--green)" /></div>
            <form action={addClassAction} className="inline-form"><input type="hidden" name="teacherId" value={profile.id} />
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
                    <input type="hidden" name="teacherId" value={profile.id} /><input type="hidden" name="classId" value={schoolClass.id} />
                    <select className="select" name="stage" defaultValue={schoolClass.stage} aria-label={`نوع دفتر العلامات لصف ${schoolClass.name}`}>
                      <option value="basic">المرحلة الأساسية (1–4)</option>
                      <option value="upper">المرحلة من الخامس فما فوق</option>
                    </select>
                    <button className="btn btn-secondary btn-small" type="submit">حفظ</button>
                  </form>
                  <DeleteClassButton action={deleteClassAction} classId={schoolClass.id} className={schoolClass.name} teacherId={profile.id} />
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
                <input type="hidden" name="teacherId" value={profile.id} /><input type="hidden" name="classId" value={schoolClass.id} />
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
                <input type="hidden" name="teacherId" value={profile.id} />
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
