import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './AuthProvider';

export const metadata: Metadata = {
  title: 'VisuTek Dashboard',
  description: '3D Product Viewer Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
