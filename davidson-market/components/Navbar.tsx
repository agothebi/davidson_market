"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import LoginModal from "./LoginModal";
import ProfileModal from "./ProfileModal"; // <--- IMPORT THIS
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  BellAlertIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false); // <--- NEW STATE

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      if (data && !error) {
        setFullName(data.full_name);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        fetchProfile(user.id);
      }
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setFullName(null);
      }
    });

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setFullName(null);
    window.location.reload();
  };

  return (
    <>
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <nav
          className={`
            pointer-events-auto
            w-full max-w-5xl 
            flex items-center justify-between 
            pl-6 pr-4 py-2
            rounded-full 
            border transition-all duration-300
            ${
              isScrolled
                ? "bg-white/90 border-gray-200/50 shadow-md backdrop-blur-xl"
                : "bg-white/75 border-white/40 shadow-sm backdrop-blur-xl"
            }
          `}
        >
          {/* A. LOGO */}
          <Link
            href="/"
            className="flex items-center group transition-opacity hover:opacity-80"
          >
            <div className="relative h-12 w-12 md:h-16 md:w-16 overflow-hidden">
              <Image
                src="/logo.png"
                alt="Davidson Market"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 48px, 64px"
              />
            </div>
          </Link>

          {/* B. AUTH SECTION */}
          <div className="flex items-center gap-3">
            <a
              href="https://coursenotifier.koyeb.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-[#D42121] bg-none hover:bg-red-50 px-3 py-2 rounded-full border border-transparent transition-colors"
            >
              <BellAlertIcon className="w-4 h-4" />
              WebTree Alert
            </a>

            {user ? (
              <div className="flex items-center gap-3">
                {/* 1. Real Name Badge (CLICKABLE NOW) */}
                <button
                  onClick={() => setIsProfileOpen(true)} // <--- TRIGGERS MODAL
                  className="hidden md:flex items-center gap-2 text-xs font-bold text-gray-700 bg-gray-100/80 px-3 py-2 rounded-full border border-gray-200 shadow-sm hover:bg-gray-200 hover:border-gray-300 transition-all active:scale-95"
                >
                  <UserCircleIcon className="w-5 h-5 text-[#D42121] shrink-0" />
                  <span className="truncate max-w-[150px]">
                    {fullName || "Davidson Student"}
                  </span>
                </button>

                {/* 2. Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-2 py-2 text-gray-500 hover:text-[#D42121] transition-colors duration-200"
                  title="Log out"
                >
                  <span className="text-sm font-medium hidden sm:inline">
                    Log out
                  </span>
                  <ArrowRightOnRectangleIcon className="w-6 h-6 sm:w-5 sm:h-5" />
                </button>
              </div>
            ) : (
              // Login Button
              <button
                onClick={() => setIsLoginOpen(true)}
                className="group relative flex items-center gap-2 bg-[#D42121] hover:bg-[#b01b26] text-white px-6 py-2.5 rounded-full shadow-[0_4px_14px_-4px_rgba(212,33,33,0.5)] hover:shadow-[0_6px_20px_-4px_rgba(212,33,33,0.6)] transition-all duration-200 ease-out hover:scale-[1.02] active:scale-95"
              >
                <span className="text-sm font-bold">Login</span>
                <ArrowLeftOnRectangleIcon className="w-4 h-4 text-white/90" />
              </button>
            )}

            {/* C. MOBILE MENU */}
            <div className="relative md:hidden" ref={mobileMenuRef}>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 rounded-full text-gray-500 hover:bg-gray-100/50 hover:text-[#D42121] transition-colors focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>

              {isMobileMenuOpen && (
                <div className="absolute right-0 top-full mt-5 w-52 p-2 rounded-2xl bg-white/90 backdrop-blur-2xl border border-white/40 shadow-xl flex flex-col gap-2 origin-top-right animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5 z-50">
                  {user && (
                    // Mobile User Profile Trigger
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsProfileOpen(true);
                      }}
                      className="flex flex-col gap-1 bg-red-50/80 border border-red-100/50 rounded-xl p-3 w-full text-left active:bg-red-100 transition-colors"
                    >
                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                        Manage Listings
                      </p>
                      <div className="flex items-center gap-2">
                        <UserCircleIcon className="w-4 h-4 text-[#D42121]" />
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {fullName || "Davidson Student"}
                        </span>
                      </div>
                    </button>
                  )}

                  <a
                    href="https://coursenotifier.koyeb.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-white/60 border border-gray-200/50 hover:bg-white text-gray-700 hover:text-[#D42121] font-bold text-xs py-3 px-3 rounded-xl shadow-sm transition-all active:scale-95"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BellAlertIcon className="w-4 h-4" />
                    <span>WebTree Alert</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      <LoginModal
        isOpen={isLoginOpen}
        closeModal={() => setIsLoginOpen(false)}
      />

      {/* 3. ADD THE PROFILE MODAL HERE */}
      <ProfileModal
        isOpen={isProfileOpen}
        closeModal={() => setIsProfileOpen(false)}
        userId={user?.id}
      />
    </>
  );
}
