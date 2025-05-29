"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link
                href="/"
                className="text-xl font-bold text-blue-600 dark:text-blue-400"
              >
                NextJS-Supabase
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NavLink href="/" current={pathname === "/"}>
                Beranda
              </NavLink>
              <NavLink href="/todos" current={pathname === "/todos"}>
                Tugas
              </NavLink>
              {user && (
                <NavLink href="/profile" current={pathname === "/profile"}>
                  Profil
                </NavLink>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {user.email}
                </span>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={toggleMobileMenu}
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden"
            id="mobile-menu"
          >
            <div className="pt-2 pb-3 space-y-1">
              <MobileNavLink
                href="/"
                current={pathname === "/"}
                onClick={toggleMobileMenu}
              >
                Beranda
              </MobileNavLink>
              <MobileNavLink
                href="/todos"
                current={pathname === "/todos"}
                onClick={toggleMobileMenu}
              >
                Tugas
              </MobileNavLink>
              {user && (
                <MobileNavLink
                  href="/profile"
                  current={pathname === "/profile"}
                  onClick={toggleMobileMenu}
                >
                  Profil
                </MobileNavLink>
              )}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
              {user ? (
                <div className="flex items-center px-4 space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[200px]">
                    {user.email}
                  </span>
                  <button
                    onClick={() => {
                      supabase.auth.signOut();
                      toggleMobileMenu();
                    }}
                    className="ml-auto px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="px-4">
                  <Link
                    href="/auth"
                    onClick={toggleMobileMenu}
                    className="block px-3 py-1.5 text-sm text-center bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    Login
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function NavLink({
  href,
  current,
  children,
}: {
  href: string;
  current: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
        current
          ? "border-blue-500 text-gray-900 dark:text-white"
          : "border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  current,
  children,
  onClick, // Tambahkan onClick prop
}: {
  href: string;
  current: boolean;
  children: React.ReactNode;
  onClick?: () => void; // Jadikan onClick opsional
}) {
  return (
    <Link
      href={href}
      onClick={onClick} // Teruskan onClick ke komponen Link
      className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
        current
          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400"
          : "border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-800 dark:hover:text-gray-200"
      }`}
    >
      {children}
    </Link>
  );
}
