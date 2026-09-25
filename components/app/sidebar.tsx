"use client";

import { BookOpenCheck, CalendarCheck2, Home, LogOut, Menu, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions";
import { Brand } from "@/components/brand";

const navigation = [
  { href: "/dashboard", label: "لوحة المعلم", icon: Home },
  { href: "/setup", label: "بياناتي وصفوفي", icon: Settings2 },
  { href: "/gradebooks", label: "دفتر العلامات", icon: BookOpenCheck },
  { href: "/attendance", label: "الحضور والغياب", icon: CalendarCheck2 },
];

export function AppNavigation({ fullName, email }: { fullName: string; email: string }) {
  const pathname = usePathname();
  return (
    <>
      <input className="mobile-menu" id="mobile-menu" type="checkbox" />
      <header className="mobile-header">
        <strong>خدمات معلمين</strong>
        <label className="menu-button" htmlFor="mobile-menu" aria-label="فتح القائمة"><Menu size={23} /></label>
      </header>
      <aside className="sidebar">
        <Brand compact />
        <nav className="nav-list" aria-label="القائمة الرئيسية">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
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
