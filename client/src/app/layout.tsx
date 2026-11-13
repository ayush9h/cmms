import { Manrope } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/layout/shell";
import { APP_NAME } from "@/lib/constants";
import { ThemeProvider } from "@/components/providers/theme-provider";

const primary = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata = {
  title: {
    default: `Maintenance : ${APP_NAME}`,
    template: `%s : ${APP_NAME}`,
  },
  description:
    "Asset downtime, repair delay and breakdown analysis for plant maintenance teams.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${primary.variable} `} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Shell>{children}</Shell>
        </ThemeProvider>
      </body>
    </html>
  );
}
