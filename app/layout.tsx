import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import ScrollToTop from '@/components/ScrollToTop';

export const metadata: Metadata = {
  title: 'RecursiveQnA - Open Academic Q&A & Problem Solutions',
  description: 'A minimal, distraction-free educational platform where learners post questions in any field with text, photos, and videos, collaborate on solutions, and share insights under verified academic moderation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <ThemeProvider>
          {children}
          <ScrollToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}
