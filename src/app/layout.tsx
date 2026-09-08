import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Next-Gen PMS v2.0 - Quản lý Dinh dưỡng & Bán trú Mầm non',
  description: 'Hệ thống Quản lý Mầm non & Cân đối Khẩu phần Dinh dưỡng Bán trú Thế hệ mới - Tuân thủ QĐ 2195/QĐ-BGDĐT & TT 51/2020',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="h-screen flex flex-col overflow-hidden">{children}</body>
    </html>
  );
}
