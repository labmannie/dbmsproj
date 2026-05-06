import type { Metadata } from 'next';
import './globals.css';
import SessionWrapper from '@/components/SessionWrapper';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: {
    default: 'NIE Lost & Found',
    template: '%s · NIE Lost & Found',
  },
  description: 'Official lost and found portal for the National Institute of Engineering, Mysore. Report lost items or claim found ones.',
  keywords: ['NIE', 'Mysore', 'lost and found', 'campus', 'lost items'],
  openGraph: {
    title: 'NIE Lost & Found',
    description: 'Campus lost & found portal for NIE Mysore.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionWrapper>
          <Navbar />
          {children}
        </SessionWrapper>
      </body>
    </html>
  );
}
