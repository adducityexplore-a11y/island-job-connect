import { ReactNode } from "react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col w-full relative overflow-x-hidden">
      <Navbar />
      <main className="flex-1 flex flex-col w-full pt-16 md:pt-20">
        {children}
      </main>
      <Footer />
    </div>
  );
}
