"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import { ReactNode } from "react";

// Routes where the public Header/Footer should NOT appear.
// These panels have their own sidebar layouts.
const PANEL_PREFIXES = ["/admin", "/vendedor", "/auth"];

export default function ConditionalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPanel = PANEL_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isPanel) {
    // Panel routes: no public header/footer, just children
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
