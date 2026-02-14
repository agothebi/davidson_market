"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { PlusIcon, FunnelIcon } from "@heroicons/react/24/outline";

// Components
import LoginModal from "./LoginModal";
import OnboardingModal from "./OnboardingModal";
import CreateListingModal from "./CreateListingModal";
import ItemCard, { Item } from "./ItemCard";
import ItemDetailsModal from "./ItemDetailsModal";

const CATEGORIES = [
  "All",
  "Furniture",
  "Electronics",
  "Books & Notes",
  "Clothing",
  "Appliances",
  "Dorm Essentials",
  "Services",
  "Other",
];

export default function MarketInterface() {
  const supabase = createClient();

  // --- STATE ---
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // --- MODALS ---
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // --- INTERACTION ---
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [pendingItem, setPendingItem] = useState<Item | null>(null);

  // --- DATA & AUTH ---
  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("items")
        .select(`*, seller:profiles(full_name, avatar_url)`)
        .eq("status", "Active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems(data as Item[]);
    } catch (err) {
      console.error("Error loading items:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();
    if (data && !data.full_name) setIsOnboardingModalOpen(true);
  };

  useEffect(() => {
    fetchItems();
    const initSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        checkProfile(user.id);
      }
    };
    initSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        setIsAuthenticated(true);
        if (pendingItem) {
          setSelectedItem(pendingItem);
          setIsDetailsModalOpen(true);
          setPendingItem(null);
        }
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [pendingItem]);

  const handleItemClick = (item: Item) => {
    if (!isAuthenticated) {
      setPendingItem(item);
      setIsLoginModalOpen(true);
    } else {
      setSelectedItem(item);
      setIsDetailsModalOpen(true);
    }
  };

  const filteredItems =
    selectedCategory === "All"
      ? items
      : items.filter((item) => item.category === selectedCategory);

  return (
    // CONTAINER
    <div className="h-full flex flex-col w-full max-w-6xl mx-auto px-4 md:px-0">
      {/* --- SECTION 1: FIXED HEADER (Title + Filters) --- */}
      <div className="flex-none pt-24 pb-2 z-20">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-6"></div>

        {/* Filter Pills */}
        <div className="relative w-full">
          {/* 1. Scrollable Container */}
          <div className="flex items-center gap-3 overflow-x-auto p-2 rounded-full bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Static Funnel Icon */}
            <div className="flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-white text-gray-500 shadow-sm border border-gray-100">
              <FunnelIcon className="w-5 h-5" />
            </div>

            {/* Scrollable Categories */}
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`
                  whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 shadow-sm border shrink-0
                  ${
                    selectedCategory === cat
                      ? "bg-gray-900 text-white border-gray-900 scale-105 shadow-md"
                      : "bg-white/60 hover:bg-white text-gray-700 border-transparent hover:border-white/50 hover:scale-105"
                  }
                `}
              >
                {cat}
              </button>
            ))}

            {/* Spacer for mobile scrolling */}
            <div className="w-4 shrink-0 md:hidden" />
          </div>

          {/* 2. MOBILE ONLY SHADOW GRADIENT
              - md:hidden -> Vanishes on desktop (Medium screens +).
              - from-black/5 -> Creates the subtle shadow depth on mobile.
          */}
          <div className="md:hidden pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black/5 to-transparent rounded-r-full z-10" />
        </div>
      </div>

      {/* --- SECTION 2: SCROLLABLE FEED (THE BOX) --- */}
      {/* 1. flex-1: Fills space
          2. bg-white/60 backdrop-blur-xl: The Colored Box Look
          3. rounded-3xl + border: The Container Shape
          4. p-6: Internal padding
      */}
      <div className="relative flex-1 min-h-0 mt-4 rounded-t-3xl md:rounded-xl border border-white/50 shadow-xl overflow-hidden">
        {/* 1. Base White Background */}
        <div className="absolute inset-0 bg-white/90" />

        {/* 2. The Striped Pattern (Static) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            backgroundImage: `repeating-linear-gradient(
                   -45deg,
                   transparent,p
                   transparent 10px,
                 rgba(0, 0, 0, 0.21) 10px,
                 rgba(0, 0, 0, 0.11) 11px
               )`,
          }}
        />

        {/* 3. The Scrollable Content Area (Floats on top) */}
        <div className="absolute inset-0 z-10 overflow-y-auto p-6 md:p-15 pb-20 no-scrollbar md:custom-scrollbar">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-[4/5] bg-white/50 rounded-3xl animate-pulse"
                />
              ))}
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-5 gap-8 md:gap-7 animate-in fade-in duration-500">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onClick={() => handleItemClick(item)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="bg-white/40 backdrop-blur-md p-8 rounded-3xl inline-block border border-white/40 shadow-sm">
                <p className="text-xl font-bold text-gray-600">
                  No items found in "{selectedCategory}".
                </p>
                {selectedCategory !== "All" && (
                  <button
                    onClick={() => setSelectedCategory("All")}
                    className="mt-4 text-[#D42121] font-bold hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      {/* FAB */}
      {isAuthenticated && (
        <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-40">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="
              group flex items-center justify-start
              bg-[#D42121] text-white
              h-14 rounded-full
              shadow-lg hover:shadow-xl
              transition-all duration-300 ease-in-out
              active:scale-95
              overflow-hidden
            "
          >
            {/* 1. ICON CONTAINER (Fixed Width) 
                - w-14 (56px): Ensures the button is a perfect circle when collapsed.
                - shrink-0: Prevents the icon from getting squashed during animation.
            */}
            <div className="w-14 h-full flex items-center justify-center shrink-0">
              <PlusIcon className="w-7 h-7 stroke-[2.5px]" />
            </div>

            {/* 2. TEXT CONTAINER (Stable Expansion) 
                - max-w-0: Hidden by default (width is 0).
                - group-hover:max-w-xs: Expands smoothly on hover.
                - opacity-0 -> 100: Fades in while expanding.
            */}
            <span
              className="
              max-w-0 opacity-0 
              group-hover:max-w-[120px] group-hover:opacity-100 group-hover:pr-5
              transition-all duration-300 ease-out
              whitespace-nowrap font-bold text-[15px]
            "
            >
              List Item
            </span>
          </button>
        </div>
      )}

      {/* MODALS */}
      <LoginModal
        isOpen={isLoginModalOpen}
        closeModal={() => {
          setIsLoginModalOpen(false);
          setPendingItem(null);
        }}
        onLoginSuccess={() => setIsLoginModalOpen(false)}
      />
      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        onComplete={() => {
          setIsOnboardingModalOpen(false);
          window.location.reload();
        }}
      />
      <CreateListingModal
        isOpen={isCreateModalOpen}
        closeModal={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchItems();
          setSelectedCategory("All");
        }}
      />
      <ItemDetailsModal
        isOpen={isDetailsModalOpen}
        closeModal={() => {
          setIsDetailsModalOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        currentUserEmail={currentUser?.email}
      />
    </div>
  );
}
