"use client";

import { useState, useRef, Fragment, useEffect } from "react";
import { Dialog, Transition, Switch } from "@headlessui/react";
import { createClient } from "@/utils/supabase/client";
import {
  XMarkIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  TrashIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";

// Local constants to ensure stability and avoid import errors
const CATEGORIES = [
  "Furniture",
  "Electronics",
  "Books & Notes",
  "Clothing",
  "Appliances",
  "Dorm Essentials",
  "Services",
  "Other",
];

const CONDITIONS = ["New", "Like New", "Good", "Fair"];

interface CreateListingModalProps {
  isOpen: boolean;
  closeModal: () => void;
  onSuccess: () => void;
}

export default function CreateListingModal({
  isOpen,
  closeModal,
  onSuccess,
}: CreateListingModalProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- UI STATE ---
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isDesktop, setIsDesktop] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- FORM STATE ---
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState(CONDITIONS[1]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPhone, setShowPhone] = useState(false);

  // --- IMAGE STATE ---
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [compressedFiles, setCompressedFiles] = useState<File[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handle Resize & Init
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768; // Tailwind md breakpoint
      setIsDesktop(desktop);
      // If switching to desktop while on mobile step 3, go back to step 2 (merged view)
      if (desktop) {
        setStep((prev) => (prev === 3 ? 2 : prev));
      }
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch user phone on open
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
    } else {
      // Reset logic when modal closes
      const timer = setTimeout(() => {
        setStep(1);
        resetForm();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // --- HANDLERS ---
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      setPrice("");
      return;
    }
    const num = parseFloat(val);
    if (num < 0) {
      setPrice("0");
    } else {
      setPrice(val);
    }
  };

  const processFiles = async (files: File[]) => {
    setIsCompressing(true);
    setErrorMsg(null);
    const totalImages = previewUrls.length + files.length;

    if (totalImages > 3) {
      toast.error("Maximum 3 images allowed.");
      setIsCompressing(false);
      return;
    }

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressed = await Promise.all(
        files.map((file) => imageCompression(file, options)),
      );
      setCompressedFiles((prev) => [...prev, ...compressed]);
    } catch (error) {
      toast.error("Image processing failed.");
      setPreviewUrls((prev) => prev.slice(0, prev.length - newPreviews.length));
    } finally {
      setIsCompressing(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeImage = (index: number) => {
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setCompressedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSkipPhotos = () => {
    setPreviewUrls([]);
    setCompressedFiles([]);
    setStep(2);
  };

  const validateStep2 = () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return false;
    }
    if (!price) {
      toast.error("Please enter a price");
      return false;
    }
    return true;
  };

  // --- SUBMISSION ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isCompressing)
        throw new Error("Please wait for images to finish processing.");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in.");

      const imageUrls: string[] = [];

      // Upload images if they exist
      if (compressedFiles.length > 0) {
        for (const file of compressedFiles) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from("listings")
            .upload(fileName, file);
          if (uploadError) throw uploadError;
          const {
            data: { publicUrl },
          } = supabase.storage.from("listings").getPublicUrl(fileName);
          imageUrls.push(publicUrl);
        }
      }

      // Update phone if provided
      if (phoneNumber) {
        await supabase
          .from("profiles")
          .update({ phone_number: phoneNumber })
          .eq("id", user.id);
      }

      // Insert item
      const { error: insertError } = await supabase.from("items").insert({
        seller_id: user.id,
        title,
        description,
        price: parseFloat(price),
        category,
        condition,
        images: imageUrls,
        display_phone: showPhone ? phoneNumber : null,
        status: "Active",
      });

      if (insertError) throw insertError;

      toast.success("Listing posted successfully!");
      resetForm();
      onSuccess();
      closeModal();
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Failed to create listing.");
      toast.error(error.message || "Failed to post.");
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
    setErrorMsg(null);
    setStep(1);
  };

  // Helper to render Extra Info (Description/Phone) since it appears in different steps based on device
  const renderExtraInfoFields = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Description
        </label>
        <textarea
          required
          maxLength={400}
          rows={isDesktop ? 3 : 5}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#D42121] focus:border-transparent outline-none resize-none placeholder-gray-400"
          placeholder="Describe the item condition, pickup location, etc."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/60">
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
              className={`${showPhone ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`}
            />
          </Switch>
        </div>
        <input
          type="tel"
          placeholder="Enter your phone number"
          className={`w-full px-4 py-2 bg-white border rounded-lg text-sm outline-none transition-all ${
            showPhone
              ? "border-gray-300 text-gray-900 focus:ring-2 focus:ring-[#D42121]/20"
              : "border-gray-100 text-gray-400 bg-gray-100 cursor-not-allowed"
          }`}
          disabled={!showPhone}
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[80]" onClose={closeModal}>
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" />

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white/95 backdrop-blur-xl p-8 text-left align-middle shadow-2xl transition-all border border-white/50">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {step === 1 ? "Add Photos" : "Item Details"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 font-medium">
                    {step === 1
                      ? "Showcase your item to attract more buyers."
                      : !isDesktop
                        ? `Step 2 of 3`
                        : "Fill in the details to publish your listing."}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* STEP 1: PHOTOS (Common for Mobile & Desktop) */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  {/* Drag & Drop Zone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      relative group cursor-pointer flex flex-col items-center justify-center w-full h-64 
                      rounded-2xl border-2 border-dashed transition-all duration-200 bg-gray-50/50
                      ${
                        dragActive
                          ? "border-[#D42121] bg-red-50/50 scale-[0.99]"
                          : "border-gray-300 hover:border-[#D42121] hover:bg-gray-50"
                      }
                    `}
                  >
                    <div className="p-4 text-center space-y-3">
                      <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto text-[#D42121] group-hover:scale-110 transition-transform duration-300">
                        <PhotoIcon className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-700">
                          Click or drop images here
                        </p>
                        <p className="text-sm text-gray-500 font-medium">
                          Up to 3 photos (Max 5MB each)
                        </p>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                    />
                  </div>

                  {/* Previews */}
                  {previewUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {previewUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-xl overflow-hidden group shadow-sm border border-gray-200"
                        >
                          <img
                            src={url}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isCompressing && (
                    <div className="flex items-center justify-center gap-2 text-[#D42121] font-medium py-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Optimizing your images...</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={handleSkipPhotos}
                      className="flex-1 py-3.5 px-6 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      Skip
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={previewUrls.length === 0 || isCompressing}
                      className="flex-1 py-3.5 px-6 rounded-xl font-bold text-white bg-[#D42121] hover:bg-[#b01b26] shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      Next
                      <ArrowRightIcon className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: DETAILS (Basic Info) */}
              {step === 2 && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!isDesktop) {
                      if (validateStep2()) setStep(3);
                    } else {
                      handleSubmit(e);
                    }
                  }}
                  className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Title
                      </label>
                      <input
                        required
                        maxLength={60}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#D42121] focus:border-transparent outline-none transition-all placeholder-gray-400"
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
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#D42121] focus:border-transparent outline-none transition-all placeholder-gray-400"
                          placeholder="0.00"
                          value={price}
                          onChange={handlePriceChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#D42121] focus:border-transparent outline-none appearance-none"
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
                                ? "bg-gray-900 text-white border-gray-900 shadow-md"
                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Desktop: Show Extra Info here (Merged View) */}
                  {isDesktop && renderExtraInfoFields()}

                  {errorMsg && (
                    <p className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg">
                      {errorMsg}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <ArrowLeftIcon className="w-4 h-4 stroke-[3]" />
                      Back
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3.5 px-6 rounded-xl font-bold text-white bg-[#D42121] hover:bg-[#b01b26] shadow-lg shadow-red-500/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {isDesktop ? (
                        loading ? (
                          <>Posting...</>
                        ) : (
                          <>
                            Post Item{" "}
                            <ArrowRightIcon className="w-4 h-4 stroke-[3]" />
                          </>
                        )
                      ) : (
                        <>
                          Next <ArrowRightIcon className="w-4 h-4 stroke-[3]" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: EXTRA INFO (Mobile Only) */}
              {step === 3 && !isDesktop && (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300"
                >
                  {renderExtraInfoFields()}

                  {errorMsg && (
                    <p className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg">
                      {errorMsg}
                    </p>
                  )}

                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <ArrowLeftIcon className="w-4 h-4 stroke-[3]" />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3.5 px-6 rounded-xl font-bold text-white bg-[#D42121] hover:bg-[#b01b26] shadow-lg shadow-red-500/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>Posting...</>
                      ) : (
                        <>
                          Post Item{" "}
                          <ArrowRightIcon className="w-4 h-4 stroke-[3]" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
