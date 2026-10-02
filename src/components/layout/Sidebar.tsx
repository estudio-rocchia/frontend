"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import rocchiaLogo from "@/assets/rocchia-logo.png";
import { mainNav } from "@/config/navigation";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[260px] shrink-0 flex-col gap-2 bg-primary px-4 py-6">
      <div className="flex items-center gap-2.5 pb-5">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-white/25">
          <Image
            src={rocchiaLogo}
            alt=""
            width={882}
            height={882}
            priority
            className="h-full w-full object-cover"
          />
        </div>
        <span className="text-lg font-bold text-text-on-primary">Rocchia</span>
      </div>
      <p className="mb-2 text-[11px] text-[var(--nav-subtitle)]">
        Jurídico · Inmobiliario
      </p>
      <nav className="flex flex-1 flex-col gap-1">
        {mainNav.map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-sm px-3.5 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "text-text-on-primary"
                  : "text-[var(--nav-muted)] hover:text-text-on-primary/90"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
