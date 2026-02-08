"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { PlusIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

// Components
import LoginModal from "./LoginModal";
import OnboardingModal from "./OnboardingModal";
import CreateListingModal from "./CreateListingModal";
import ItemCard, { Item } from "./ItemCard";
import ItemDetailsModal from "./ItemDetailsModal";

export default function MarketInterface() {
  const supabase = createClient();

  // --- STATE: DATA ---
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE: AUTH & USER ---
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // --- STATE: MODALS ---
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // --- STATE: INTERACTION ---
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [pendingItem, setPendingItem] = useState<Item | null>(null); // The "Boomerang" item

  // --- 1. DATA FETCHING ---
  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("items")
        .select(
          `
          *,
          seller:profiles(full_name, avatar_url)
        `,
        )
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

  // --- 2. AUTH & INTELLIGENCE ---
  const checkProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    if (data && !data.full_name) {
      setIsOnboardingModalOpen(true);
    }
  };

  useEffect(() => {
    // Initial Load
    fetchItems();

    // Auth Check
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

    // Listen for Auth Changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        setIsAuthenticated(true);
        // If we are logging in, check if there's a pending item to open
        if (pendingItem) {
          setSelectedItem(pendingItem);
          setIsDetailsModalOpen(true);
          setPendingItem(null); // Clear the memory
        }
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [pendingItem]); // dependency on pendingItem ensures the boomerang works

  // --- 3. HANDLERS ---

  const handleItemClick = (item: Item) => {
    if (!isAuthenticated) {
      // GUEST: Save intent -> Force Login
      setPendingItem(item);
      setIsLoginModalOpen(true);
    } else {
      // USER: Open Details
      setSelectedItem(item);
      setIsDetailsModalOpen(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
    // The useEffect hook above handles the "Boomerang" logic automatically
  };

  return (
    <div className="relative flex flex-col items-center min-h-screen px-4 pt-24 md:pt-32 pb-20 bg-white">
      {/* HEADER SECTION */}
      <div className="text-center max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-4">
          Davidson <span className="text-[#D42121]">Market</span>
        </h1>
        <p className="text-lg text-gray-500 font-medium">
          The trusted marketplace for students & faculty.
        </p>
      </div>

      {/* FEED SECTION */}
      {loading ? (
        // Loading Skeletons
        <div className="w-full max-w-6xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-[4/5] bg-gray-100 rounded-3xl animate-pulse"
            />
          ))}
        </div>
      ) : items.length > 0 ? (
        // Real Items
        <div className="w-full max-w-6xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onClick={() => handleItemClick(item)}
            />
          ))}
        </div>
      ) : (
        // Empty State
        <div className="text-center py-20 text-gray-400">
          <p className="text-xl font-medium">
            No items yet. Be the first to sell!
          </p>
        </div>
      )}

      {/* FLOATING ACTION BUTTON (FAB) */}
      {isAuthenticated && (
        <div className="fixed bottom-8 right-6 md:bottom-10 md:right-10 z-40">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="group flex items-center gap-2 bg-[#D42121] text-white p-4 rounded-full shadow-[0_8px_30px_rgb(212,33,33,0.4)] hover:shadow-[0_8px_30px_rgb(212,33,33,0.6)] hover:scale-110 transition-all duration-300"
          >
            <PlusIcon className="w-6 h-6 stroke-[3px]" />
            <span className="hidden group-hover:block font-bold pr-2 animate-in slide-in-from-right-2 fade-in duration-200">
              Sell Item
            </span>
          </button>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* 1. Login (The Gatekeeper) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        closeModal={() => {
          setIsLoginModalOpen(false);
          setPendingItem(null); // Cancel the boomerang if they close modal
        }}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 2. Onboarding (The Intelligence Fallback) */}
      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        onComplete={() => {
          setIsOnboardingModalOpen(false);
          window.location.reload();
        }}
      />

      {/* 3. Create Listing (The Supply) */}
      <CreateListingModal
        isOpen={isCreateModalOpen}
        closeModal={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchItems(); // Refresh feed after posting
        }}
      />

      {/* 4. Item Details (The Demand) */}
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
