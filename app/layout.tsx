import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DDM Verify Admin',
  description: 'Admin dashboard for DDM Verify',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
