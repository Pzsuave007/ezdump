import './globals.css';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Easy Load & Dump | Junk Removal - Spokane, WA',
  description: 'Professional dump trailer rental and junk removal services in Spokane, WA. We drop off, you fill it, we haul it away!',
  keywords: 'dump trailer rental, junk removal, Spokane WA, trash hauling, debris removal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
