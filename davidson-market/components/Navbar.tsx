"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import LoginModal from "./LoginModal";
import ProfileModal from "./ProfileModal";
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  BellAlertIcon,
  Bars3Icon,
  XMarkIcon,
  BookOpenIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);

  // Modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Menus
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();
      if (data && !error) setFullName(data.full_name);
    } catch (error) {
      console.error("Error:", error);
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

    const handleClickOutside = (event: MouseEvent) => {
      // Close Mobile Menu
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }

      // Close Desktop Dropdown
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setFullName(null);
    setIsDropdownOpen(false);
    window.location.reload();
  };

  const handleOpenListings = () => {
    setIsProfileOpen(true);
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        {/* PERMANENT GLASS NAVBAR */}
        <nav className="pointer-events-auto w-full max-w-5xl flex items-center justify-between pl-6 pr-4 py-2 rounded-full border transition-all duration-300 bg-white/75 border-white/40 shadow-sm backdrop-blur-xl">
          {/* LOGO */}
          <Link
            href="/"
            className="flex items-center group transition-opacity hover:opacity-80"
          >
            <div className="relative h-18 w-18 md:h-16 md:w-19 overflow-hidden">
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

          {/* AUTH SECTION */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              {/* Davidson Courses Button */}
              <a
                href="https://davidsoncourses.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-[#D42121] bg-none hover:bg-red-50 px-3 py-2 rounded-full border border-transparent hover:border-red-100 transition-all"
              >
                <BookOpenIcon className="w-4 h-4" />
                Davidson Courses
              </a>

              {/* Separator */}
              <div className="h-4 w-px bg-gray-300/50" />

              {/* WebTree Alert Button */}
              <a
                href="https://coursenotifier.koyeb.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-[#D42121] bg-none hover:bg-red-50 px-3 py-2 rounded-full border border-transparent hover:border-red-100 transition-all"
              >
                <BellAlertIcon className="w-4 h-4" />
                WebTree Alert
              </a>
            </div>

            {user ? (
              <div className="relative hidden md:block" ref={dropdownRef}>
                {/* DESKTOP USER DROPDOWN TRIGGER */}
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`
                    flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border transition-all duration-200
                    ${
                      isDropdownOpen
                        ? "bg-white border-gray-300 shadow-md ring-2 ring-red-50"
                        : "bg-gray-50/80 border-gray-200 hover:bg-white hover:border-gray-300 hover:shadow-sm"
                    }
                  `}
                >
                  <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center">
                    <UserCircleIcon className="w-5 h-5 text-[#D42121]" />
                  </div>
                  <span className="text-xs font-bold text-gray-700 max-w-[100px] truncate">
                    {fullName ? fullName.split(" ")[0] : "Student"}
                  </span>
                  <ChevronDownIcon
                    className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* DESKTOP DROPDOWN MENU */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-3 w-48 p-1.5 rounded-2xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-xl ring-1 ring-black/5 flex flex-col gap-1 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-3 py-2 border-b border-gray-100 mb-1">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Signed in as
                      </p>
                      <p className="text-sm font-bold text-gray-800 truncate">
                        {fullName || "User"}
                      </p>
                    </div>

                    <button
                      onClick={handleOpenListings}
                      className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-sm font-medium text-gray-700 rounded-xl hover:bg-[#D42121] hover:text-white transition-all group"
                    >
                      <ClipboardDocumentListIcon className="w-4 h-4 text-gray-500 group-hover:text-white" />
                      My Listings
                    </button>

                    <div className="h-px bg-gray-100 mx-2 my-0.5" />

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-sm font-medium text-gray-600 rounded-xl hover:bg-red-50 hover:text-[#D42121] transition-all"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="group relative flex items-center gap-2 bg-[#D42121] hover:bg-[#b01b26] text-white px-6 py-2.5 rounded-full shadow-[0_4px_14px_-4px_rgba(212,33,33,0.5)] hover:shadow-[0_6px_20px_-4px_rgba(212,33,33,0.6)] transition-all duration-200 ease-out hover:scale-[1.02] active:scale-95"
              >
                <span className="text-sm font-bold">Login</span>
                <ArrowLeftOnRectangleIcon className="w-4 h-4 text-white/90" />
              </button>
            )}

            {/* MOBILE MENU TRIGGER */}
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

              {/* MOBILE MENU CONTENT */}
              {isMobileMenuOpen && (
                <div className="absolute right-0 top-full mt-5 w-64 p-2 rounded-2xl bg-white/90 backdrop-blur-2xl border border-white/40 shadow-xl flex flex-col gap-2 origin-top-right animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5 z-50">
                  {user && (
                    <div className="mb-1">
                      <button
                        onClick={handleOpenListings}
                        className="flex flex-col gap-1 bg-gradient-to-br from-red-50 to-white border border-red-100 rounded-xl p-4 w-full text-left active:scale-[0.98] transition-all shadow-sm"
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <p className="text-[10px] font-bold text-[#D42121] uppercase tracking-wider">
                            Manage Listings
                          </p>
                          <ClipboardDocumentListIcon className="w-4 h-4 text-[#D42121]" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center">
                            <UserCircleIcon className="w-4 h-4 text-[#D42121]" />
                          </div>
                          <span className="text-sm font-bold text-gray-900 truncate">
                            {fullName || "Davidson Student"}
                          </span>
                        </div>
                      </button>
                    </div>
                  )}

                  <a
                    href="https://davidsoncourses.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-start gap-3 w-full bg-white/60 border border-gray-200/50 hover:bg-white text-gray-700 hover:text-[#D42121] font-bold text-xs py-3 px-4 rounded-xl shadow-sm transition-all active:scale-95"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BookOpenIcon className="w-4 h-4" />
                    <span>Davidson Courses</span>
                  </a>

                  <a
                    href="https://coursenotifier.koyeb.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-start gap-3 w-full bg-white/60 border border-gray-200/50 hover:bg-white text-gray-700 hover:text-[#D42121] font-bold text-xs py-3 px-4 rounded-xl shadow-sm transition-all active:scale-95"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BellAlertIcon className="w-4 h-4" />
                    <span>WebTree Alert</span>
                  </a>

                  {user && (
                    <button
                      onClick={handleLogout}
                      className="mt-1 flex items-center justify-center gap-2 w-full bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 font-bold text-xs py-3 rounded-xl border border-transparent transition-all"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      Log Out
                    </button>
                  )}
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
      <ProfileModal
        isOpen={isProfileOpen}
        closeModal={() => setIsProfileOpen(false)}
        userId={user?.id}
      />
    </>
  );
}
