"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();

  // Nobody is signed in on these, so offering office links and a sign-out
  // button would be noise.
  if (pathname.startsWith("/login") || pathname.startsWith("/auth")) {
    return (
      <nav className="mx-auto flex max-w-6xl items-center px-4 py-3">
        <span className="text-sm font-semibold tracking-tight text-slate-200">
          المكتب
        </span>
      </nav>
    );
  }

  return (
    <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3">
      <Link
        href="/floor"
        className="mr-auto text-sm font-semibold tracking-tight text-slate-200"
      >
        المكتب
      </Link>
      <NavLink href="/floor">الخريطة</NavLink>
      <NavLink href="/tasks">التاسكات</NavLink>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="rounded-md px-3 py-1.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
        >
          خروج
        </button>
      </form>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
    >
      {children}
    </Link>
  );
}
