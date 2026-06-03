import type { Metadata } from "next";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Pet Care Reminder",
  description: "Track medications and care tasks for your pets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
