// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\frontend\src\app\layout.js
import { Outfit } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { GoogleOAuthProvider } from '@react-oauth/google';

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "The Courtyard | Premium Pickleball & Coaching Club",
  description: "Experience premium sports luxury at The Courtyard. Real-time court bookings, elite coach training programs, custom memberships, and high-energy tournaments.",
};

export default function RootLayout({ children }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1049285741029-placeholderclientid.apps.googleusercontent.com";

  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <head>
        {/* Load elegant backup typography from google fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;1,600&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-sport-dark text-gray-100 min-h-full flex flex-col font-sans">
        <GoogleOAuthProvider clientId={googleClientId}>
          <AppProvider>
            {children}
          </AppProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
