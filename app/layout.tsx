import './globals.css';
import { LanguageProvider } from '../lib/i18n/LanguageContext';

export const metadata = {
  title: 'AXON | Institutional B2B Marketplace',
  description: 'The premier platform for global marble trade.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Εδώ γίνεται η σύνδεση: Ο Provider αγκαλιάζει όλο το site */}
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}