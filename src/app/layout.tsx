import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AppShell } from "@/components/AppShell";

const title = "Iqra Islamic Education School — Fee & Spending Database";

export const metadata = {
  title,
  description:
    "School Student & Teacher Recorder: student records, monthly fee collection, teacher salaries, other expenses and complete money tracking. Created by Mr. AbdulWahid.",
};

const THEME_SCRIPT = `try{var t=localStorage.getItem('iqra-theme');if(!t&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches){t='dark'}if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="bg-ink-50 font-sans text-ink-900 antialiased dark:bg-ink-950 dark:text-ink-100">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
