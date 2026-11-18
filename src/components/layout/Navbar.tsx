"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Rocket, Shield, User, Sparkles, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<"user" | "admin">("user");

  // Read mock role from localStorage if in client
  useEffect(() => {
    const savedRole = localStorage.getItem("launchpilot_role") as "user" | "admin";
    if (savedRole === "admin") {
      setUserRole("admin");
      setIsAdmin(true);
    }
  }, []);

  const toggleRole = () => {
    const nextRole = userRole === "user" ? "admin" : "user";
    setUserRole(nextRole);
    setIsAdmin(nextRole === "admin");
    localStorage.setItem("launchpilot_role", nextRole);
    window.dispatchEvent(new Event("role-change"));
  };

  const navLinks = [
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Platforms (50+)", href: "/#platforms" },
    { label: "Pricing", href: "/pricing" },
    { label: "Dashboard", href: "/dashboard" },
    ...(isAdmin ? [{ label: "Admin Panel", href: "/admin", isSpecial: true }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-md shadow-indigo-500/20">
            <Rocket className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              LaunchPilot
              <Badge variant="outline" className="border-indigo-500/40 bg-indigo-500/10 text-indigo-300 text-[10px] py-0 px-1.5">
                Beta
              </Badge>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-white ${
                pathname === link.href ? "text-white font-semibold" : "text-muted-foreground"
              } ${link.isSpecial ? "text-purple-400 font-semibold flex items-center gap-1" : ""}`}
            >
              {link.isSpecial && <Shield className="w-3.5 h-3.5" />}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right CTA & Role Switcher */}
        <div className="hidden md:flex items-center gap-3">
          {/* Quick Role Switcher for instant demo/testing */}
          <button
            onClick={toggleRole}
            title="Click to toggle between Founder and Admin view"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border border-border/80 bg-secondary/50 text-muted-foreground hover:text-foreground transition-all hover:border-indigo-500/50"
          >
            {userRole === "admin" ? (
              <>
                <Shield className="w-3 h-3 text-purple-400" />
                <span className="text-purple-300 font-medium">Admin Mode</span>
              </>
            ) : (
              <>
                <User className="w-3 h-3 text-indigo-400" />
                <span>Founder Mode</span>
              </>
            )}
            <span className="text-[10px] bg-background/80 px-1 py-0.2 rounded border border-border text-muted-foreground">
              switch
            </span>
          </button>

          <Button asChild variant="brand" size="sm" className="gap-1.5 font-medium">
            <Link href="/submit">
              <Sparkles className="w-4 h-4" />
              Submit Product Free
            </Link>
          </Button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <Button asChild variant="brand" size="sm" className="text-xs px-3">
            <Link href="/submit">Submit</Link>
          </Button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-muted-foreground hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border/80 bg-background/95 px-4 pt-3 pb-6 space-y-3 backdrop-blur-2xl">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-base font-medium text-foreground/80 hover:text-white rounded-lg hover:bg-secondary/60"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-border/60 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Demo Role View</span>
            <button
              onClick={toggleRole}
              className="text-xs px-3 py-1 rounded-full border border-border bg-secondary flex items-center gap-1.5"
            >
              {userRole === "admin" ? "Admin Mode" : "Founder Mode"} (toggle)
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
