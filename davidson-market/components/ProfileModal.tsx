"use client";

import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { createClient } from "@/utils/supabase/client";
import {
  XMarkIcon,
  TrashIcon,
  CheckBadgeIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";

interface ProfileModalProps {
  isOpen: boolean;
  closeModal: () => void;
  userId: string | undefined;
}

interface MyItem {
  id: string;
  title: string;
  price: number;
  images: string[];
  status: "Active" | "Sold" | "Archived";
  created_at: string;
}

export default function ProfileModal({
  isOpen,
  closeModal,
  userId,
}: ProfileModalProps) {
  const supabase = createClient();
  const [myItems, setMyItems] = useState<MyItem[]>([]);
  const [loading, setLoading] = useState(false);

  // --- FETCH DATA ---
  const fetchMyInventory = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("items")
      .select("id, title, price, images, status, created_at")
      .eq("seller_id", userId)
      .neq("status", "Archived") // Don't show deleted items
      .order("created_at", { ascending: false });

    if (data) setMyItems(data as MyItem[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) fetchMyInventory();
  }, [isOpen, userId]);

  // --- ACTIONS ---
  const handleMarkSold = async (itemId: string) => {
    // Optimistic UI Update
    setMyItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, status: "Sold" } : item,
      ),
    );

    const { error } = await supabase
      .from("items")
      .update({ status: "Sold" })
      .eq("id", itemId);

    if (error) {
      // Revert if failed
      console.error("Failed to mark sold", error);
      fetchMyInventory();
    }
  };

  const handleDelete = async (itemId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this item? This cannot be undone.",
      )
    )
      return;

    // Optimistic UI: Remove from list immediately
    setMyItems((prev) => prev.filter((item) => item.id !== itemId));

    // Soft Delete (Archive)
    const { error } = await supabase
      .from("items")
      .update({ status: "Archived" })
      .eq("id", itemId);

    if (error) {
      console.error("Failed to delete", error);
      fetchMyInventory();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={closeModal}>
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" />

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white p-8 shadow-2xl transition-all">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    My Inventory
                  </h3>
                  <p className="text-sm text-gray-500">
                    Manage your active listings.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Inventory List */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                  <div className="text-center py-10 text-gray-400">
                    Loading your items...
                  </div>
                ) : myItems.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl">
                    <ArchiveBoxIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">
                      You haven't listed anything yet.
                    </p>
                  </div>
                ) : (
                  myItems.map((item) => (
                    <div
                      key={item.id}
                      className={`
                        relative flex items-center gap-4 p-4 rounded-2xl border transition-all
                        ${item.status === "Sold" ? "bg-gray-50 border-gray-100 opacity-75" : "bg-white border-gray-200 hover:border-gray-300"}
                      `}
                    >
                      {/* Thumbnail */}
                      <div className="h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 relative">
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                        {item.status === "Sold" && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              Sold
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-grow min-w-0">
                        <h4 className="font-bold text-gray-900 truncate">
                          {item.title}
                        </h4>
                        <p className="text-[#D42121] font-bold text-sm">
                          ${item.price}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Posted{" "}
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2">
                        {item.status === "Active" && (
                          <button
                            onClick={() => handleMarkSold(item.id)}
                            className="flex items-center gap-1 px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors"
                            title="Mark as Sold"
                          >
                            <CheckBadgeIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Sold</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Listing"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
