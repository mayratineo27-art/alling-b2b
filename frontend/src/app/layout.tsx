import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import ConditionalShell from "@/components/layout/ConditionalShell";
import { CartDrawer } from "@/components/formato/CartDrawer";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GuestCartMerger } from "@/components/auth/GuestCartMerger";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

export const metadata: Metadata = {
  title: "Alling B2B",
  description: "Portal de compras corporativas Alling",
  icons: {
    icon: "/alling-logo.png",
    apple: "/alling-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[var(--alling-text)]">
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <AuthProvider>
            <ToastProvider>
              <FavoritesProvider>
                <CartProvider>
                  <GuestCartMerger />
                  <ConditionalShell>
                    {children}
                  </ConditionalShell>
                  <CartDrawer />
                </CartProvider>
              </FavoritesProvider>
            </ToastProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
