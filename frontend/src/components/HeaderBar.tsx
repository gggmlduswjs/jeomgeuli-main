import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, Search, BookOpen, FileText } from "lucide-react";
import BrailleToggle from "./BrailleToggle";

interface HeaderBarProps {
  /** 상위에서 점자 출력 상태를 관리하고 싶다면 전달 */
  brailleOn?: boolean;
  onBrailleToggle?: (v: boolean) => void;
  className?: string;
}

const HeaderBar = ({ brailleOn, onBrailleToggle, className = "" }: HeaderBarProps) => {
  // 상위에서 안 넘겨주면 내부에서 관리
  const [localOn, setLocalOn] = useState(false);
  const isOn = typeof brailleOn === "boolean" ? brailleOn : localOn;
  const handleToggle = (v: boolean) => {
    if (onBrailleToggle) onBrailleToggle(v);
    else setLocalOn(v);
  };

  const navItems = [
    { path: "/", label: "홈", icon: Home },
    { path: "/explore", label: "정보탐색", icon: Search },
    { path: "/learn", label: "점자학습", icon: BookOpen },
    { path: "/review", label: "복습노트", icon: FileText },
  ] as const;

  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg px-1">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">점</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">점글이</h1>
          </NavLink>

          {/* Navigation */}
          <nav className="flex items-center space-x-1" role="navigation" aria-label="주요 페이지 이동">
            {navItems.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/"} // 홈은 정확히 일치할 때만 활성
                className={({ isActive }) =>
                  `
                  flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200
                  ${isActive ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}
                  `
                }
                aria-label={label}
              >
                <Icon size={20} aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Braille Toggle */}
          <BrailleToggle on={isOn} onChange={handleToggle} />
        </div>
      </div>
    </header>
  );
};

export default HeaderBar;
