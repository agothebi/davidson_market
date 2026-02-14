"use client";

import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { createClient } from "@/utils/supabase/client";
import {
  XMarkIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", price: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [userName, setUserName] = useState<string>("");

  const fetchProfile = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();
    if (data) setUserName(data.full_name);
  };

  const fetchMyInventory = async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("items")
      .select("id, title, price, images, status, created_at")
      .eq("seller_id", userId)
      .eq("status", "Active")
      .order("created_at", { ascending: false });

    if (data) setMyItems(data as MyItem[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
      fetchMyInventory();
      setEditingId(null);
    }
  }, [isOpen, userId]);

  const startEditing = (item: MyItem) => {
    setEditingId(item.id);
    setEditForm({ title: item.title, price: item.price.toString() });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ title: "", price: "" });
  };

  const saveEdit = async (itemId: string) => {
    if (!editForm.title.trim() || !editForm.price.trim()) {
      toast.error("Title and Price are required.");
      return;
    }

    setIsSaving(true);

    // Optimistic Update
    setMyItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              title: editForm.title,
              price: parseFloat(editForm.price),
            }
          : item,
      ),
    );

    const { error } = await supabase
      .from("items")
      .update({ title: editForm.title, price: parseFloat(editForm.price) })
      .eq("id", itemId);

    setIsSaving(false);

    if (error) {
      toast.error("Failed to save changes.");
      fetchMyInventory(); // Revert on error
    } else {
      toast.success("Listing updated successfully.");
      setEditingId(null);
    }
  };

  const handleDelete = async (item: MyItem) => {
    if (
      !confirm(
        "Are you sure you want to delete this listing permanently? This cannot be undone.",
      )
    )
      return;

    // Optimistic Remove
    setMyItems((prev) => prev.filter((i) => i.id !== item.id));

    // Delete from DB
    const { error } = await supabase.from("items").delete().eq("id", item.id);

    if (error) {
      toast.error("Error deleting listing.");
      fetchMyInventory(); // Revert
    } else {
      toast.success("Listing deleted.");
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={closeModal}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-out duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white/90 backdrop-blur-2xl border border-white/60 p-8 shadow-2xl transition-all">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {userName
                        ? `${userName.split(" ")[0]}'s Listings`
                        : "My Listings"}
                    </h3>
                    <p className="text-sm font-medium text-gray-500 mt-1">
                      Manage your active inventory.
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 rounded-full bg-white/50 hover:bg-white text-gray-400 hover:text-[#D42121] transition-colors shadow-sm"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* List Container */}
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-24 bg-gray-100 rounded-2xl animate-pulse"
                        />
                      ))}
                    </div>
                  ) : myItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <PhotoIcon className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-900 font-bold text-lg">
                        No active listings
                      </p>
                      <p className="text-gray-500 text-sm mt-1 mb-4">
                        You haven't listed anything for sale yet.
                      </p>
                      <button
                        onClick={closeModal}
                        className="text-[#D42121] font-bold text-sm hover:underline"
                      >
                        Close and sell something!
                      </button>
                    </div>
                  ) : (
                    myItems.map((item) => (
                      <div
                        key={item.id}
                        className="group relative flex flex-col sm:flex-row items-center gap-4 p-3 pr-5 rounded-2xl border border-white/60 bg-white/60 hover:bg-white hover:shadow-lg hover:border-white transition-all duration-300"
                      >
                        {/* Image Thumbnail */}
                        <div className="h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shadow-inner">
                          <img
                            src={
                              item.images && item.images.length > 0
                                ? item.images[0]
                                : "https://placehold.co/600x400/e2e8f0/475569?text=No+Image"
                            }
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        {/* Content Area */}
                        <div className="flex-grow min-w-0 w-full sm:w-auto text-center sm:text-left">
                          {editingId === item.id ? (
                            <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
                              <input
                                type="text"
                                value={editForm.title}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    title: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#D42121] focus:border-transparent outline-none shadow-sm"
                                placeholder="Item Title"
                                autoFocus
                              />
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                                  $
                                </span>
                                <input
                                  type="number"
                                  value={editForm.price}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      price: e.target.value,
                                    })
                                  }
                                  className="w-full pl-7 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#D42121] focus:border-transparent outline-none shadow-sm"
                                  placeholder="Price"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <h4 className="font-bold text-gray-900 truncate text-base leading-tight">
                                {item.title}
                              </h4>
                              <div className="flex items-center justify-center sm:justify-start gap-3">
                                <span className="text-[#D42121] font-bold text-lg">
                                  ${item.price}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                  Active
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 self-center sm:self-center mt-2 sm:mt-0">
                          {editingId === item.id ? (
                            <>
                              <button
                                onClick={() => saveEdit(item.id)}
                                disabled={isSaving}
                                className="p-2.5 bg-[#D42121] text-white rounded-xl hover:bg-[#b01b26] transition-all shadow-md active:scale-95"
                                title="Save Changes"
                              >
                                <CheckIcon className="w-5 h-5 stroke-[2.5]" />
                              </button>
                              <button
                                onClick={cancelEditing}
                                disabled={isSaving}
                                className="p-2.5 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-xl transition-all active:scale-95"
                                title="Cancel"
                              >
                                <XMarkIcon className="w-5 h-5 stroke-[2.5]" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditing(item)}
                                className="p-2.5 text-gray-400 bg-white border border-gray-200 hover:border-[#D42121] hover:text-[#D42121] hover:bg-red-50 rounded-xl transition-all shadow-sm active:scale-95 group"
                                title="Edit Listing"
                              >
                                <PencilSquareIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="p-2.5 text-gray-400 bg-white border border-gray-200 hover:border-red-200 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm active:scale-95 group"
                                title="Delete Listing"
                              >
                                <TrashIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
