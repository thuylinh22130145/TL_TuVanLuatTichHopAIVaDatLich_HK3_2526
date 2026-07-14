import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navClass = ({ isActive }) =>
  `text-sm font-medium transition ${
    isActive ? "text-law-gold" : "text-white/80 hover:text-white"
  }`;

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="bg-law-navy text-white shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif text-xl font-semibold tracking-tight">
            Văn phòng Luật
          </span>

          <span className="rounded bg-law-gold/20 px-2 py-0.5 text-xs text-law-gold">
            AI Tư vấn
          </span>
        </Link>

        {/* Menu */}
        <nav className="flex items-center gap-6">

          <NavLink to="/tu-van" className={navClass}>
            Tư vấn AI
          </NavLink>

          <NavLink to="/luat-su" className={navClass}>
            Đội ngũ & Đặt lịch
          </NavLink>

          {/* Nếu đã đăng nhập */}
          {user ? (
            <>
              <span className="text-sm text-white">
                Xin chào, <b>{user.full_name}</b>
              </span>

              {/* USER */}
              {user.role === "USER" && (
                <NavLink
                  to="/user/home"
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
                >
                  Trang cá nhân
                </NavLink>
              )}

              {/* LAWYER */}
              {user.role === "LAWYER" && (
                <NavLink
                  to="/lawyer/dashboard"
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
                >
                  Dashboard
                </NavLink>
              )}

              {/* ADMIN */}
              {user.role === "ADMIN" && (
                <NavLink
                  to="/admin/dashboard"
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
                >
                  Quản trị
                </NavLink>
              )}

              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-sm hover:bg-red-600"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              {/* Chưa đăng nhập */}
              <NavLink
                to="/login"
                className="rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
              >
                Đăng nhập
              </NavLink>

              <NavLink
                to="/register"
                className="rounded-lg bg-law-gold px-3 py-1.5 text-sm text-law-navy hover:opacity-90"
              >
                Đăng ký
              </NavLink>
            </>
          )}

        </nav>
      </div>
    </header>
  );
}