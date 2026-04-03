import './globals.css';
import { LanguageProvider } from '../lib/i18n/LanguageContext';

export const metadata = {
  title: 'AXON | Institutional B2B Marketplace',
  description: 'Global Execution Floor for Natural Stone',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#020509]">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}