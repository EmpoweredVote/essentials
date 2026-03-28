import { Header, defaultNavItems, defaultCtaButton } from "@chrisandrewsedu/ev-ui";
import { useCompass } from "../contexts/CompassContext";
import { redirectToLogin } from "../lib/auth";
import { useSearchParams } from "react-router-dom";
import { NavSearch } from './NavSearch/NavSearch';

export function Layout({ children }) {
  const { isLoggedIn, userName, logout } = useCompass();
  const [searchParams] = useSearchParams();
  const currentAddress = searchParams.get('q') || '';

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
            onClick: () => redirectToLogin(),
          },
        ],
      };

  const navItems = currentAddress
    ? defaultNavItems.map(item => {
        if (item.dropdown) {
          return {
            ...item,
            dropdown: item.dropdown.map(sub =>
              sub.label === 'Read & Rank'
                ? { ...sub, href: `https://readrank.empowered.vote?address=${encodeURIComponent(currentAddress)}` }
                : sub
            ),
          };
        }
        return item;
      })
    : defaultNavItems;

  return (
    <>
      <Header
        logoSrc="/EVLogo.svg"
        logoAlt="Empowered Vote"
        navItems={navItems}
        ctaButton={defaultCtaButton}
        onNavigate={(href) => { window.location.href = href; }}
        profileMenu={profileMenu}
      />
      <NavSearch />
      {children}
    </>
  );
}
