import Link from "next/link";

export default function NotFound() {
  return <main className="auth-page"><section className="auth-card" style={{ textAlign: "center" }}><h1>الصفحة غير موجودة</h1><p className="lead">قد يكون الرابط غير صحيح أو أن السجل غير متاح لحسابك.</p><Link className="btn btn-primary" href="/dashboard">العودة إلى لوحة المعلم</Link></section></main>;
}
