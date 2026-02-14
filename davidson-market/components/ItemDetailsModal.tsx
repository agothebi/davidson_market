"use client";

import React, { useState, Fragment, useEffect, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { formatDistanceToNow } from "date-fns";
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  FlagIcon,
  TicketIcon,
  BookOpenIcon,
  CpuChipIcon,
  ShoppingBagIcon,
  HomeIcon,
  UserIcon,
  TagIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

// --- Local Type Definitions ---

export interface Item {
  id: string;
  title: string;
  price: number;
  images: string[];
  condition: string;
  category: string;
  created_at: string;
  description: string;
  seller_id: string;
  display_phone: string | null;
  status: "Active" | "Sold" | "Archived";
  seller?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface ItemDetailsModalProps {
  item?: Item | null;
  isOpen: boolean;
  onClose?: () => void;
  closeModal?: () => void;
  onSuccess?: () => void; // Included to satisfy parent usage
  currentUserEmail?: string;
}

// --- Helpers ---

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Tickets":
      return TicketIcon;
    case "Books & Notes":
      return BookOpenIcon;
    case "Electronics":
      return CpuChipIcon;
    case "Clothing":
      return ShoppingBagIcon;
    case "Furniture":
      return HomeIcon;
    case "Services":
      return UserIcon;
    default:
      return TagIcon;
  }
};

// --- Component ---

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  item,
  isOpen,
  onClose,
  closeModal,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Touch state for swiping
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const handleClose = onClose || closeModal || (() => {});

  // Reset state when item opens
  useEffect(() => {
    if (isOpen) {
      setActiveImageIndex(0);
    }
  }, [isOpen, item]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "Escape") setIsLightboxOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, activeImageIndex, item]);

  if (!item) return null;

  const hasImages = item.images && item.images.length > 0;
  const currentImage = hasImages ? item.images[activeImageIndex] : null;
  const CategoryIcon = getCategoryIcon(item.category);

  const timeAgo = formatDistanceToNow(new Date(item.created_at), {
    addSuffix: true,
  });
  const sellerName = item.seller?.full_name || "Davidson Student";

  // --- Image Navigation ---

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (hasImages) {
      setActiveImageIndex((prev) => (prev + 1) % item.images.length);
    }
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (hasImages) {
      setActiveImageIndex(
        (prev) => (prev - 1 + item.images.length) % item.images.length,
      );
    }
  };

  // --- Swipe Handlers ---

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) nextImage();
    if (isRightSwipe) prevImage();
  };

  // --- Report Function ---
  const handleReport = () => {
    const subject = encodeURIComponent(
      `Report Listing: ${item.title} (ID: ${item.id})`,
    );
    const body = encodeURIComponent(
      `I would like to report this listing.\n\nReason:\n\n\n---\nItem ID: ${item.id}\nSeller: ${sellerName}`,
    );
    window.location.href = `mailto:gobaheti@davidson.edu?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[60]" onClose={handleClose}>
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
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" />
          </Transition.Child>

          {/* Modal Container */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95 translate-y-4"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100 translate-y-0"
                leaveTo="opacity-0 scale-95 translate-y-4"
              >
                <Dialog.Panel className="w-full max-w-4xl max-h-[85vh] md:h-[600px] transform overflow-hidden rounded-3xl bg-white text-left align-middle shadow-2xl transition-all border border-white/60 flex flex-col md:flex-row relative">
                  {/* Close Button */}
                  <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-white/50 hover:bg-white rounded-full text-gray-500 hover:text-[#D42121] transition-all backdrop-blur-sm shadow-sm"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>

                  {/* LEFT: IMAGE SECTION */}
                  <div
                    className="w-full md:w-[55%] bg-gray-50 relative flex items-center justify-center h-[350px] md:h-full select-none group border-b md:border-b-0 md:border-r border-gray-100"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                  >
                    {hasImages ? (
                      <>
                        {/* Image */}
                        <div
                          className="w-full h-full cursor-zoom-in flex items-center justify-center p-0 md:p-4"
                          onClick={() => setIsLightboxOpen(true)}
                        >
                          <img
                            src={currentImage!}
                            alt={item.title}
                            className="w-full h-full object-contain mix-blend-normal"
                          />
                        </div>

                        {/* Navigation Arrows (Desktop Only) */}
                        {item.images.length > 1 && (
                          <>
                            <button
                              onClick={prevImage}
                              className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-sm opacity-0 group-hover:opacity-100 transition-all border border-gray-100"
                            >
                              <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={nextImage}
                              className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-sm opacity-0 group-hover:opacity-100 transition-all border border-gray-100"
                            >
                              <ChevronRightIcon className="w-5 h-5" />
                            </button>
                          </>
                        )}

                        {/* Dots Indicator */}
                        {item.images.length > 1 && (
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                            {item.images.map((_, idx) => (
                              <div
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-all shadow-sm ${idx === activeImageIndex ? "bg-[#D42121] w-4" : "bg-gray-300"}`}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <CategoryIcon className="w-20 h-20 opacity-30" />
                        <p className="text-sm font-medium opacity-60">
                          No images
                        </p>
                      </div>
                    )}
                  </div>

                  {/* RIGHT: DETAILS SECTION */}
                  <div className="w-full md:w-[45%] flex flex-col h-full bg-white relative overflow-hidden">
                    {/* Clean background - Removed stripes as requested for cleaner design */}
                    <div className="absolute inset-0 bg-white z-0" />

                    {/* Scrollable Content Container */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide relative z-10">
                      {/* Header Block */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between gap-4 mb-2 pr-8">
                          <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                            {item.title}
                          </h2>
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="text-3xl font-bold text-[#D42121]">
                            ${item.price.toFixed(2)}
                          </div>

                          {/* Sold By */}
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-2 pb-2 border-b border-gray-100">
                            <span className="text-gray-400">Sold by</span>
                            <span className="font-bold text-gray-900">
                              {sellerName.split(" ")[0]}
                            </span>
                            {/* Dot Separator */}
                            <span className="w-1 h-1 rounded-full bg-gray-300 mx-1"></span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#D42121] uppercase tracking-wide bg-red-50 px-2 py-0.5 rounded-full">
                              <AcademicCapIcon className="w-3 h-3" />
                              Student
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-black text-white shadow-sm">
                          <CategoryIcon className="w-3.5 h-3.5" />
                          {item.category}
                        </span>
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-white text-gray-700 border border-gray-200 shadow-sm">
                          {item.condition}
                        </span>
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium text-gray-500">
                          Posted {timeAgo}
                        </span>
                      </div>

                      {/* Description - Card style for clean separation */}
                      <div className="mb-8">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pl-1">
                          Description
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <div className="text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fixed Footer Actions */}
                    <div className="p-4 bg-white/90 backdrop-blur-xl border-t border-gray-100 flex flex-col gap-3 relative z-20">
                      <div className="flex gap-3 items-center">
                        {/* Email Button - Flat Lighter Red (Red-500) */}
                        <a
                          href={`mailto:?subject=Regarding: ${item.title}&body=Hi, I am interested in your listing for ${item.title}.`}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-600 text-white px-6 py-3.5 rounded-full font-bold transition-colors text-sm md:text-base"
                        >
                          <EnvelopeIcon className="w-5 h-5" />
                          Email Seller
                        </a>

                        {/* Phone Actions - Circular */}
                        {item.display_phone && (
                          <>
                            <a
                              href={`sms:${item.display_phone}`}
                              className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-gray-700 hover:bg-gray-100 hover:text-black transition-all border border-gray-200 shadow-sm"
                              title="Text Seller"
                            >
                              <ChatBubbleLeftRightIcon className="w-5 h-5" />
                            </a>
                            <a
                              href={`tel:${item.display_phone}`}
                              className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-gray-700 hover:bg-gray-100 hover:text-black transition-all border border-gray-200 shadow-sm"
                              title="Call Seller"
                            >
                              <PhoneIcon className="w-5 h-5" />
                            </a>
                          </>
                        )}
                      </div>

                      {/* Report Button - Subtle Text */}
                      <button
                        onClick={handleReport}
                        className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors py-1"
                      >
                        <FlagIcon className="w-3 h-3" />
                        Report Listing
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* FULL SCREEN LIGHTBOX */}
      <Transition show={isLightboxOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-[100]"
          onClose={() => setIsLightboxOpen(false)}
        >
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-out duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/95 backdrop-blur-xl transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-hidden">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-out duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div
                className="flex min-h-full items-center justify-center p-0 w-full h-full"
                onClick={() => setIsLightboxOpen(false)}
              >
                {/* Close Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(false);
                  }}
                  className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-50 focus:outline-none backdrop-blur-md"
                >
                  <XMarkIcon className="w-8 h-8" />
                </button>

                {/* Desktop Nav Arrows */}
                {hasImages && item.images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                      className="hidden md:block absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all focus:outline-none z-50"
                    >
                      <ChevronLeftIcon className="w-10 h-10" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                      className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all focus:outline-none z-50"
                    >
                      <ChevronRightIcon className="w-10 h-10" />
                    </button>
                  </>
                )}

                {/* Main Image Container */}
                {currentImage && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-0 md:p-8">
                    <img
                      src={currentImage}
                      alt="Full screen view"
                      className="max-h-[85vh] max-w-full object-contain shadow-2xl select-none"
                      onClick={(e) => e.stopPropagation()}
                    />

                    {/* Dots */}
                    <div className="absolute bottom-10 flex gap-3 z-50">
                      {item.images.map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-2 h-2 rounded-full transition-all ${idx === activeImageIndex ? "bg-white scale-125" : "bg-white/40"}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export { ItemDetailsModal };
export default ItemDetailsModal;
