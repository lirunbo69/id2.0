import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: '千寻寄售平台复刻版',
  description: '基于 Next.js + Supabase 的虚拟商品自动发货 SaaS 平台。',
};

const themeInitScript = `
  try {
    const savedTheme = localStorage.getItem('merchant-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  } catch (error) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
      </body>
    </html>
  );
}
