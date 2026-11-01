import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tune Clash | Multiplayer Music Guessing Party Game',
  description:
    'Join private rooms with friends, listen to 8-second clips, and race to guess the song in real time! Fast, fun, and no account required.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-background text-text-main flex flex-col min-h-screen antialiased selection:bg-neo-yellow selection:text-black">
        {children}
      </body>
    </html>
  );
}
