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
    /* ΣΤΑΘΕΡΟΠΟΙΗΣΗ ΣΤΟ HTML ΕΠΙΠΕΔΟ */
    <html lang="en" className="h-full w-full overflow-x-hidden">
      <body className="bg-[#020509] text-[#F8F5EE] antialiased min-h-full w-full overflow-x-hidden selection:bg-[#A6947D]/30">
        {/* ΣΤΡΑΤΗΓΙΚΗ LOCKDOWN: 
            1. overflow-x-hidden: Εξαφανίζει το πλάγιο κούνημα (wiggle).
            2. bg-[#020509]: Προστατεύει το visual integrity αν υπάρξει bounce.
            3. selection: Ενιαίο institutional χρώμα επιλογής κειμένου.
        */}
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}