import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/lib/query-provider';

export const metadata: Metadata = {
  title: {
    default: 'DDM Verify Admin',
    template: '%s • DDM Verify Admin',
  },
  description: 'Admin dashboard for DDM Verify',
  icons: {
    icon: [{ url: '/ddm-icon.png', type: 'image/png' }],
    shortcut: '/ddm-icon.png',
    apple: '/ddm-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
