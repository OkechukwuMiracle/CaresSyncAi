import type { ReactNode } from 'react';
import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'CareSync Ai',
  description: 'CareSyncAi - Patient Follow-up Reminder & Insight Assistant',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
