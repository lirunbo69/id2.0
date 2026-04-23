import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'MT虚拟商品自动发货系统',
  description: 'MT虚拟商品自动发货系统，面向虚拟商品经营场景提供自动发货与店铺展示能力。',
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
