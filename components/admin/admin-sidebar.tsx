"use client";

import { Activity, LayoutDashboard, LogOut, Menu, MessageSquareText, ShieldAlert, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions";
import { Brand } from "@/components/brand";

const navigation = [
  { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/admin/accounts", label: "حسابات المعلمين", icon: UsersRound },
  { href: "/admin/messages", label: "صندوق الرسائل", icon: MessageSquareText },
  { href: "/admin/activity", label: "سجل النشاط", icon: Activity },
  { href: "/admin/maintenance", label: "صيانة النظام", icon: ShieldAlert },
];

export function AdminNavigation({ fullName, email }: { fullName: string; email: string }) {
  const pathname = usePathname();

  return (
    <>
      <input className="mobile-menu" id="mobile-menu" type="checkbox" />
      <header className="mobile-header admin-mobile-header">
        <strong>إدارة خدمات معلمين</strong>
        <label className="menu-button" htmlFor="mobile-menu" aria-label="فتح القائمة"><Menu size={23} /></label>
      </header>
      <aside className="sidebar admin-sidebar">
        <Brand compact />
        <div className="admin-role-badge">مدير النظام</div>
        <nav className="nav-list" aria-label="قائمة الإدارة">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
            return <Link className={`nav-link${active ? " active" : ""}`} href={href} key={href}><Icon size={20} />{label}</Link>;
          })}
        </nav>
        <div className="sidebar-user">
          <strong>{fullName}</strong>
          <span dir="ltr">{email}</span>
          <form action={logoutAction}>
            <button className="logout-button" type="submit"><LogOut size={16} style={{ verticalAlign: "middle", marginLeft: 7 }} />تسجيل الخروج</button>
          </form>
        </div>
      </aside>
    </>
  );
}
