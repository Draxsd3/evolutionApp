import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
export const metadata: Metadata = { title: "Evolua — Diário pessoal", description: "Um diário simples e conversacional para compreender sua rotina.", icons:{icon:"/favicon.svg"} };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body className={geist.variable}>{children}</body></html>}
