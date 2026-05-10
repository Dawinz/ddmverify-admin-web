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
    icon: [{ url: '/icon.png', type: 'image/png', sizes: 'any' }],
    shortcut: '/icon.png',
    apple: [{ url: '/apple-icon.png', type: 'image/png', sizes: '180x180' }],
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
