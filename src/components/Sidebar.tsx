"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutGrid, 
  Globe, 
  TrendingUp, 
  Lightbulb, 
  Newspaper, 
  Moon, 
  Sun, 
  PanelLeftClose, 
  PanelLeft,
  ChevronDown,
  Menu,
  X
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Overview", href: "/", icon: LayoutGrid },
  { name: "Global Markets", href: "/stocks", icon: Globe },
  { name: "Top stocks", href: "/terminal", icon: TrendingUp },
  { name: "Trade Ideas", href: "/trade-ideas", icon: Lightbulb },
  { name: "Market News", href: "/news", icon: Newspaper },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    setMounted(true);
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
    setTheme(document.documentElement.getAttribute("data-theme") || "light");
    
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme") || "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    setTheme(newTheme);
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* MOBILE HEADER BAR (< 1024px) */}
      <header className="mobile-header-only" style={{ width: "100%", height: "60px", borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", padding: "0 1.25rem", alignItems: "center", justifyContent: "space-between", flexShrink: 0, zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button 
            onClick={() => setMobileMenuOpen(true)} 
            style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: "8px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-text-primary)" }}
          >
            <Menu size={20} strokeWidth={2} />
          </button>
          <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <img src={theme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"} alt="Logo" style={{ height: "24px", width: "auto", objectFit: "contain" }} />
          </Link>
        </div>
        <button 
          onClick={toggleTheme} 
          title="Toggle Theme" 
          style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: "8px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-text-secondary)" }}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </header>

      {/* MOBILE OVERLAY DRAWER */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)} 
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex" }}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            style={{ width: "280px", height: "100%", backgroundColor: "var(--color-bg)", borderRight: "1px solid var(--color-border)", display: "flex", flexDirection: "column", padding: "1.5rem 1.25rem", boxShadow: "4px 0 25px rgba(0,0,0,0.35)", overflowY: "auto", zIndex: 1001 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
              <Link href="/" onClick={() => setMobileMenuOpen(false)} style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
                <img src={theme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"} alt="Logo" style={{ height: "26px", width: "auto" }} />
              </Link>
              <button 
                onClick={() => setMobileMenuOpen(false)} 
                style={{ background: "transparent", border: "none", borderRadius: "6px", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-text-tertiary)" }}
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "auto" }}>
              {NAV_ITEMS.map(item => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                      padding: "0.75rem 0.9rem",
                      borderRadius: "10px",
                      textDecoration: "none",
                      color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                      backgroundColor: isActive ? "var(--color-surface)" : "transparent",
                      fontWeight: isActive ? 600 : 500,
                      fontSize: "0.95rem",
                      border: isActive ? "1px solid var(--color-border)" : "1px solid transparent"
                    }}
                  >
                    <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.75} color={isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)"} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div style={{ marginTop: "auto", paddingTop: "1.25rem", borderTop: "1px solid var(--color-border)" }}>
               <button 
                 onClick={() => { toggleTheme(); setMobileMenuOpen(false); }} 
                 style={{ display: "flex", alignItems: "center", gap: "0.85rem", padding: "0.75rem 0.9rem", borderRadius: "10px", border: "none", background: "transparent", color: "var(--color-text-secondary)", fontWeight: 500, fontSize: "0.9rem", width: "100%", cursor: "pointer", textAlign: "left" }}
               >
                 {theme === "light" ? <Moon size={19} /> : <Sun size={19} />} 
                 {theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR (>= 1024px) */}
      <div className="desktop-sidebar-only" style={{
        width: isCollapsed ? "80px" : "240px",
        height: "100vh",
        backgroundColor: "var(--color-bg)",
        borderRight: "1px solid var(--color-border)",
        flexDirection: "column",
        padding: isCollapsed ? "1.5rem 0.6rem" : "1.5rem 1.1rem",
        flexShrink: 0,
        overflowY: "auto",
        transition: "width 0.2s ease, padding 0.2s ease"
      }}>
        {/* Brand & Collapse */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "space-between", marginBottom: "2.2rem", padding: isCollapsed ? "0" : "0 0.25rem" }}>
          {!isCollapsed && (
            <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
              <img 
                src={theme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"} 
                alt="Aura Logo" 
                style={{ height: "28px", width: "auto", objectFit: "contain" }} 
              />
            </Link>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            title={isCollapsed ? "Expand Navigation" : "Collapse Navigation"}
            style={{ 
              background: "transparent", 
              border: "none", 
              borderRadius: "6px", 
              width: "30px", 
              height: "30px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              cursor: "pointer", 
              color: "var(--color-text-tertiary)",
              transition: "color 0.15s, background-color 0.15s"
            }}
            onMouseOver={e => { e.currentTarget.style.color = "var(--color-text-primary)"; e.currentTarget.style.backgroundColor = "var(--color-surface)"; }}
            onMouseOut={e => { e.currentTarget.style.color = "var(--color-text-tertiary)"; e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            {isCollapsed ? <PanelLeft size={20} strokeWidth={1.75} /> : <PanelLeftClose size={20} strokeWidth={1.75} />}
          </button>
        </div>

        {/* Primary Navigation */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "auto" }}>
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link 
                key={item.name} 
                href={item.href}
                prefetch={true}
                title={isCollapsed ? item.name : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isCollapsed ? "center" : "space-between",
                  padding: "0.65rem 0.8rem",
                  borderRadius: "10px",
                  textDecoration: "none",
                  color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                  backgroundColor: isActive ? "var(--color-surface)" : "transparent",
                  fontWeight: isActive ? 600 : 500,
                  fontSize: "0.9rem",
                  letterSpacing: "-0.01em",
                  transition: "all 0.15s ease",
                  border: isActive ? "1px solid var(--color-border)" : "1px solid transparent",
                  boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.03)" : "none"
                }}
                onMouseOver={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "var(--color-surface)";
                    e.currentTarget.style.color = "var(--color-text-primary)";
                  }
                }}
                onMouseOut={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", justifyContent: isCollapsed ? "center" : "flex-start", width: isCollapsed ? "100%" : "auto" }}>
                  <item.icon size={19} strokeWidth={isActive ? 2.2 : 1.75} color={isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)"} />
                  {!isCollapsed && item.name}
                </div>
                
                {!isCollapsed && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {(item as any).badge && (
                      <div style={{ backgroundColor: "var(--color-surface-hover)", color: "var(--color-text-secondary)", fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "999px", border: "1px solid var(--color-border)" }}>
                        {(item as any).badge}
                      </div>
                    )}
                    {(item as any).hasDropdown && <ChevronDown size={14} strokeWidth={2} color="var(--color-text-tertiary)" />}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Nav */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "auto", paddingTop: "1.25rem", borderTop: "1px solid var(--color-border)" }}>
           <button 
             onClick={toggleTheme} 
             title={isCollapsed ? (theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode") : undefined} 
             style={{ 
               display: "flex", 
               alignItems: "center", 
               justifyContent: isCollapsed ? "center" : "flex-start", 
               gap: "0.85rem", 
               padding: "0.65rem 0.8rem", 
               borderRadius: "10px", 
               border: "1px solid transparent", 
               background: "transparent", 
               color: "var(--color-text-secondary)", 
               fontWeight: 500, 
               fontSize: "0.875rem", 
               cursor: "pointer", 
               textAlign: "left",
               transition: "all 0.15s ease"
             }}
             onMouseOver={e => { e.currentTarget.style.backgroundColor = "var(--color-surface)"; e.currentTarget.style.color = "var(--color-text-primary)"; }}
             onMouseOut={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
           >
             {theme === "light" ? <Moon size={18} strokeWidth={1.8} /> : <Sun size={18} strokeWidth={1.8} />} 
             {!isCollapsed && (theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode")}
           </button>
        </div>
      </div>
    </>
  );
}
