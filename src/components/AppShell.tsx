import { useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Bell,
  ChevronDown,
  Compass,
  HeartHandshake,
  Menu,
  MessagesSquare,
  PlugZap,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { Brand } from "./Brand";
import { useAuth } from "../context/AuthContext";
import { useMessaging } from "../context/MessagingContext";
import { ChatDock } from "./ChatDock";

const links = [
  { to: "/app/discover", label: "Discover", icon: Compass },
  { to: "/app/messages", label: "Messages", icon: MessagesSquare },
  { to: "/app/assessments", label: "Assessments", icon: Sparkles },
  { to: "/app/integrations", label: "My tastes", icon: PlugZap },
  { to: "/app/profile", label: "My profile", icon: UserRound },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const { unreadCount } = useMessaging();
  const [menu, setMenu] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const initials = (user?.displayName || user?.email || "U")
    .split(/\s+/)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const current =
    links.find((link) => location.pathname.startsWith(link.to))?.label ||
    (location.pathname.startsWith("/admin") ? "Admin" : "Havenly");

  return (
    <div className="min-h-screen bg-[#f7f6f0]">
      <header className="sticky top-0 z-40 border-b border-black/6 bg-[#f7f6f0]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-17 max-w-[1440px] items-center gap-7 px-4 sm:px-6 lg:px-10">
          <Brand />
          <nav className="hidden flex-1 items-center gap-1 lg:flex">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold ${isActive ? "bg-white text-[#174f3f] shadow-sm" : "text-[#64716d] hover:bg-white/70 hover:text-[#26332f]"}`
                }
              >
                <Icon size={17} />
                {label}
                {to === "/app/messages" && unreadCount > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-[#f18b6d] px-1.5 py-0.5 text-[10px] font-black text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
              </NavLink>
            ))}
            {user?.role === "ADMIN" && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `ml-1 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold ${isActive ? "bg-[#174f3f] text-white" : "text-[#64716d] hover:bg-white"}`
                }
              >
                <ShieldCheck size={17} />
                Admin
              </NavLink>
            )}
          </nav>
          <span className="hidden flex-1 text-center text-sm font-bold md:block lg:hidden">
            {current}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/app/messages"
              className="relative grid size-10 place-items-center rounded-xl text-[#52605c] hover:bg-white"
              aria-label="Messages"
            >
              <Bell size={19} />
              {unreadCount > 0 && <span className="absolute right-2 top-1.5 grid min-w-4 place-items-center rounded-full border border-[#f7f6f0] bg-[#ef8265] px-1 text-[9px] font-black text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </Link>
            <div className="relative hidden sm:block">
              <button
                onClick={() => setProfileMenu(!profileMenu)}
                className="flex items-center gap-2 rounded-xl p-1.5 pr-2 hover:bg-white"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-[#f0c96f] text-xs font-black text-[#493b18]">
                  {initials}
                </span>
                <ChevronDown size={15} className="text-[#71807b]" />
              </button>
              {profileMenu && (
                <div className="absolute right-0 top-12 w-56 rounded-2xl border border-black/8 bg-white p-2 shadow-xl">
                  <div className="border-b border-black/6 px-3 py-2.5">
                    <p className="truncate text-sm font-bold">
                      {user?.displayName}
                    </p>
                    <p className="truncate text-xs text-[#82908b]">
                      {user?.email}
                    </p>
                  </div>
                  <Link
                    to="/app/profile"
                    onClick={() => setProfileMenu(false)}
                    className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#f5f7f4]"
                  >
                    <Settings size={15} />
                    Profile settings
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#bd513c] hover:bg-[#fff4f0]"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
            <button
              className="grid size-10 place-items-center rounded-xl lg:hidden"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menu && (
          <nav className="border-t border-black/6 bg-white p-3 lg:hidden">
            {[
              ...links,
              ...(user?.role === "ADMIN"
                ? [{ to: "/admin", label: "Admin", icon: ShieldCheck }]
                : []),
            ].map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenu(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${isActive ? "bg-[#eaf4f0] text-[#174f3f]" : "text-[#52605c]"}`
                }
              >
                <Icon size={18} />
                {label}
                {to === "/app/messages" && unreadCount > 0 && <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-[#f18b6d] px-1.5 py-0.5 text-[10px] font-black text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 lg:px-10 lg:py-10">
        <Outlet />
      </main>
      <footer className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 border-t border-black/6 px-6 py-7 text-xs text-[#82908b] sm:flex-row">
        <span className="flex items-center gap-1.5">
          <HeartHandshake size={15} /> Better roommates, happier homes.
        </span>
        <span>© {new Date().getFullYear()} Havenly</span>
      </footer>
      <ChatDock />
    </div>
  );
}
