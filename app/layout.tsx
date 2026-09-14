import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className="antialiased min-h-screen">
        {/* Tiada padding-top atau max-w di sini, sesuai untuk Landing Page */}
        {children}
      </body>
    </html>
  );
}
