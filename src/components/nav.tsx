"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/log", label: "Log" },
  { href: "/checkpoints", label: "Checkpoints" },
  { href: "/vocab", label: "Vocab" },
  { href: "/diary", label: "Diary" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <nav className="bg-white border-b">
      <div className="max-w-2xl mx-auto px-4 flex items-center gap-4 h-12 overflow-x-auto">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm whitespace-nowrap ${
              pathname === l.href
                ? "text-blue-600 font-medium"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <button
          onClick={() => signOut()}
          className="ml-auto text-sm text-gray-400 hover:text-gray-600 whitespace-nowrap"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
