import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { headers } from "next/headers";
import AppkitProvider from "@/context/appkit";
import { WalletProvider } from "@/context/wallet";
import { PollingProvider } from "@/context/polling-context";
import { POLLING_INTERVALS } from "@/constants/api";
import { Toaster } from "@/components/ui/sonner";
import { TradePairContextProvider } from "@/context/trade-pair-context";
import Footer from "@/components/footer/Footer";
import { ThemeProvider } from "next-themes";
import Header from "@/components/header/header";
import QueryProvider from "@/context/query-provider-context";
import PageTransition from "@/components/animations/page-transition";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Canopy Swap",
  description: "",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get("cookie");

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <AppkitProvider cookies={cookies}>
              <WalletProvider>
                <TradePairContextProvider>
                  <PollingProvider
                    ordersInterval={POLLING_INTERVALS.ORDERS}
                    balanceInterval={POLLING_INTERVALS.BALANCE}
                    heightInterval={POLLING_INTERVALS.HEIGHT}
                  >
                    <Header />
                    <main className="w-full max-w-screen-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
                      <PageTransition>{children}</PageTransition>
                    </main>
                    <Footer />
                    <Toaster richColors />
                  </PollingProvider>
                </TradePairContextProvider>
              </WalletProvider>
            </AppkitProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
