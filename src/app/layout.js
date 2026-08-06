import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Present — Attendance, verified',
  description:
    'Geo-location and facial recognition verified attendance for classrooms. No proxies, no buddy check-ins, no paperwork.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/vendor/face-api.min.js" as="script" />
        <script src="/vendor/face-api.min.js" async />
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
        <Footer />
      </body>
    </html>
  );
}
