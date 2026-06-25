import { useState } from "react";
import { Header, getFeedbackUrl } from "@empoweredvote/ev-ui";
import { useCompass } from "../contexts/CompassContext";
import { redirectToLogin } from "../lib/auth";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "../hooks/useTheme";
import { getAutoOpenMyLocation, setAutoOpenMyLocation } from "../lib/locationPref";

export function Layout({ children }) {
  const { isLoggedIn, userName, logout } = useCompass();
  const { isDark } = useTheme();

  // Opt-in toggle (default OFF): when on, a Connected Account is auto-ported to its
  // saved home-location representatives on the next app open (read in Landing.jsx).
  // The ev-ui menu closes on click, so the ☑/☐ glyph reflects the new state on reopen.
  const [autoOpen, setAutoOpen] = useState(() => getAutoOpenMyLocation());
  const autoLocationItem = {
    label: `${autoOpen ? "☑" : "☐"}  Default to my saved location`,
    onClick: () => {
      const next = !autoOpen;
      setAutoOpenMyLocation(next);
      setAutoOpen(next);
    },
  };

  const feedbackItem = {
    label: "Feedback",
    onClick: () => window.open(getFeedbackUrl({ feature: 'essentials' }), '_blank', 'noopener,noreferrer'),
  };

  const profileMenu = isLoggedIn
    ? {
        label: userName || "Account",
        items: [
          { label: "Profile", onClick: () => { window.location.href = 'https://login.empowered.vote/profile'; } },
          { label: "EV Financials", onClick: () => { window.location.href = 'https://financials.empowered.vote'; } },
          autoLocationItem,
          feedbackItem,
          { label: "Sign out", onClick: logout },
        ],
      }
    : {
        label: "Account",
        items: [
          { label: "EV Financials", onClick: () => { window.location.href = 'https://financials.empowered.vote'; } },
          feedbackItem,
          { label: "Sign in", onClick: () => redirectToLogin() },
        ],
      };

  return (
    <>
      <Header
        logoSrc="/EVLogo.svg"
        logoAlt="Empowered Vote"
        logoHref="https://empowered.vote"
        navItems={[]}
        darkMode={isDark}
        secondaryAction={<ThemeToggle />}
        onNavigate={(href) => { window.location.href = href === '/' ? 'https://empowered.vote' : href; }}
        profileMenu={profileMenu}
        style={isDark ? {
          backgroundColor: '#0d1117',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        } : undefined}
      />
      {children}
    </>
  );
}
