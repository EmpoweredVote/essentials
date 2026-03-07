import { useCompass } from "../contexts/CompassContext";

export default function AuthIndicator() {
  const { isLoggedIn, userName } = useCompass();
  if (!isLoggedIn || !userName) return null;

  const initials =
    userName
      .split(" ")
      .map((s) => s[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
    userName[0]?.toUpperCase() ||
    "?";

  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        backgroundColor: "#00657c",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Manrope', sans-serif",
        fontWeight: 700,
        fontSize: 13,
        flexShrink: 0,
      }}
      title={userName}
    >
      {initials}
    </div>
  );
}
