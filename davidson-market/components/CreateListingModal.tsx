"use client";

import { useState, useRef, Fragment, useEffect } from "react";
import { Dialog, Transition, Switch } from "@headlessui/react";
import { createClient } from "@/utils/supabase/client";
import {
  XMarkIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  TagIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import imageCompression from "browser-image-compression";

interface CreateListingModalProps {
  isOpen: boolean;
  closeModal: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  "Furniture",
  "Electronics",
  "Books & Notes",
  "Clothing",
  "Appliances",
  "Dorm Essentials",
  "Tickets",
  "Services",
  "Other",
];

const CONDITIONS = ["New", "Like New", "Good", "Fair"];

export default function CreateListingModal({
  isOpen,
  closeModal,
  onSuccess,
}: CreateListingModalProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FORM STATE ---
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState(CONDITIONS[1]);

  // Phone Logic
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPhone, setShowPhone] = useState(false);

  // Image Logic
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [compressedFiles, setCompressedFiles] = useState<File[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- 1. FETCH USER PHONE ON OPEN ---
  useEffect(() => {
    if (isOpen) {
      const fetchUserPhone = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("phone_number")
            .eq("id", user.id)
            .single();
          if (data?.phone_number) setPhoneNumber(data.phone_number);
        }
      };
      fetchUserPhone();
    }
  }, [isOpen]);

  // --- 2. IMAGE HANDLER (COMPRESSION) ---
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsCompressing(true);
      setErrorMsg(null);

      const newFiles = Array.from(e.target.files);
      const totalImages = previewUrls.length + newFiles.length;

      if (totalImages > 3) {
        setErrorMsg("Maximum 3 images allowed.");
        setIsCompressing(false);
        return;
      }

      // 1. Immediate Preview (Optimistic UI)
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviews]);

      // 2. Background Compression
      try {
        const options = {
          maxSizeMB: 1, // Compress to ~1MB or less
          maxWidthOrHeight: 1920, // Reasonable max resolution
          useWebWorker: true,
        };

        const compressed = await Promise.all(
          newFiles.map((file) => imageCompression(file, options)),
        );

        setCompressedFiles((prev) => [...prev, ...compressed]);
      } catch (error) {
        console.error("Compression error:", error);
        setErrorMsg("Failed to process images. Please try again.");
      } finally {
        setIsCompressing(false);
      }
    }
  };

  // --- 3. SUBMIT HANDLER ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (compressedFiles.length === 0)
        throw new Error("Please add at least 1 photo.");
      if (isCompressing)
        throw new Error("Please wait for images to finish processing.");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in.");

      // A. Upload Images to Supabase Storage
      const imageUrls: string[] = [];

      for (const file of compressedFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("listings") // Ensure this bucket exists!
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get Public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("listings").getPublicUrl(fileName);

        imageUrls.push(publicUrl);
      }

      // B. Update Profile Phone (Sync mechanism)
      if (phoneNumber) {
        await supabase
          .from("profiles")
          .update({ phone_number: phoneNumber })
          .eq("id", user.id);
      }

      // C. Create Listing Item
      const { error: insertError } = await supabase.from("items").insert({
        seller_id: user.id,
        title,
        description,
        price: parseFloat(price),
        category,
        condition,
        images: imageUrls,
        // Split-Brain Logic:
        display_phone: showPhone ? phoneNumber : null,
        status: "Active",
      });

      if (insertError) throw insertError;

      // Success
      resetForm();
      onSuccess();
      closeModal();
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Failed to create listing.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setPrice("");
    setDescription("");
    setPreviewUrls([]);
    setCompressedFiles([]);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[80]" onClose={closeModal}>
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm" />

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white p-8 text-left align-middle shadow-2xl transition-all">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold text-gray-900"
                >
                  Sell an Item
                </Dialog.Title>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Image Upload Section */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Photos (Max 3)
                  </label>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {/* Upload Button */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#D42121] hover:bg-red-50 transition-colors group"
                    >
                      <PhotoIcon className="w-8 h-8 text-gray-400 group-hover:text-[#D42121]" />
                      <span className="text-xs text-gray-500 mt-1 font-medium">
                        Add Photo
                      </span>
                    </div>

                    {/* Previews */}
                    {previewUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-gray-200"
                      >
                        <img
                          src={url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        {/* Remove Button (Optional - simplified for now) */}
                      </div>
                    ))}

                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                    />
                  </div>
                  {isCompressing && (
                    <p className="text-xs text-[#D42121] mt-2 animate-pulse font-medium">
                      Optimizing images...
                    </p>
                  )}
                </div>

                {/* 2. Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      required
                      maxLength={60}
                      className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#D42121] focus:border-transparent outline-none transition-all"
                      placeholder="e.g. Calculus Textbook"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Price ($)
                    </label>
                    <div className="relative">
                      <CurrencyDollarIcon className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#D42121] focus:border-transparent outline-none transition-all"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#D42121] outline-none appearance-none"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Condition
                    </label>
                    <div className="flex gap-2">
                      {CONDITIONS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCondition(c)}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                            condition === c
                              ? "bg-gray-900 text-white border-gray-900"
                              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    required
                    maxLength={400}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#D42121] outline-none resize-none"
                    placeholder="Describe the item condition, pickup location, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 text-right mt-1">
                    {description.length}/400
                  </p>
                </div>

                {/* 4. Contact Info (Split Brain Logic) */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-bold text-gray-900">
                        Show Phone Number?
                      </span>
                    </div>
                    <Switch
                      checked={showPhone}
                      onChange={setShowPhone}
                      className={`${showPhone ? "bg-[#D42121]" : "bg-gray-300"} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                    >
                      <span
                        className={`${showPhone ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </Switch>
                  </div>

                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    className={`w-full px-4 py-2 bg-white border rounded-lg text-sm outline-none transition-all ${showPhone ? "border-gray-300 text-gray-900" : "border-gray-100 text-gray-400 bg-gray-100"}`}
                    disabled={!showPhone}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    {showPhone
                      ? "This number will be visible on the listing page."
                      : "Buyers will only be able to see your email."}
                  </p>
                </div>

                {/* Error & Submit */}
                {errorMsg && (
                  <p className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || isCompressing}
                  className="w-full bg-[#D42121] text-white font-bold text-lg py-4 rounded-full shadow-lg hover:bg-[#b01b26] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? "Posting..." : "Post Item"}
                </button>
              </form>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
