import { SiteHeader } from "@chrisandrewsedu/ev-ui";
import { useCompass } from "../contexts/CompassContext";

export function Layout({ children }) {
  const { isLoggedIn, userName, logout } = useCompass();

  const profileMenu = isLoggedIn
    ? {
        label: userName || "Account",
        items: [{ label: "Sign out", onClick: logout }],
      }
    : {
        label: "Account",
        items: [
          {
            label: "Sign in",
            href: `https://compass.empowered.vote/login?returnTo=${encodeURIComponent(window.location.href)}`,
          },
        ],
      };

  return (
    <>
      <SiteHeader logoSrc="/EVLogo.svg" profileMenu={profileMenu} />
      {children}
    </>
  );
}
