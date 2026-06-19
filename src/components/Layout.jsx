import { Header, getFeedbackUrl } from "@empoweredvote/ev-ui";
import { useCompass } from "../contexts/CompassContext";
import { redirectToLogin } from "../lib/auth";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "../hooks/useTheme";

export function Layout({ children }) {
  const { isLoggedIn, userName, logout } = useCompass();
  const { isDark } = useTheme();

  const feedbackItem = {
    label: "Feedback",
    onClick: () => window.open(getFeedbackUrl(), '_blank', 'noopener,noreferrer'),
  };

  const profileMenu = isLoggedIn
    ? {
        label: userName || "Account",
        items: [
          { label: "Profile", onClick: () => { window.location.href = 'https://login.empowered.vote/profile'; } },
          { label: "EV Financials", onClick: () => { window.location.href = 'https://financials.empowered.vote'; } },
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
          backgroundColor: '#020618',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        } : undefined}
      />
      {children}
    </>
  );
}
