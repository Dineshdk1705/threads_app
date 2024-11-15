import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "../globals.css";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("@/components/shared/Header"));
const LeftSideBar = dynamic(() => import("@/components/shared/LeftSideBar"), {
  ssr: false,
});
const RightSideBar = dynamic(() => import("@/components/shared/RightSideBar"), {
  ssr: false,
});
const Footer = dynamic(() => import("@/components/shared/Footer"));

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Threads",
  description: "A Next.js 15 Meta Threads application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <html lang="en">
        <body className={`${inter.className}`}>
          <Header />
          <main className="flex flex-row">
            <LeftSideBar />
            <section className="main-container">
              <div className="children-container">
                {children || <p>No content</p>}
              </div>
            </section>
            <RightSideBar />
          </main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
