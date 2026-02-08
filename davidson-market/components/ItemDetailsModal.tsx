"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Item } from "./ItemCard";
import {
  XMarkIcon,
  ChatBubbleBottomCenterTextIcon,
  PhoneIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

interface ItemDetailsModalProps {
  item: Item | null;
  isOpen: boolean;
  closeModal: () => void;
  currentUserEmail?: string; // To prevent emailing yourself
}

export default function ItemDetailsModal({
  item,
  isOpen,
  closeModal,
}: ItemDetailsModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!item) return null;

  const handleEmail = () => {
    // Basic mailto protection
    window.location.href = `mailto:?subject=Interested in: ${item.title}&body=Hi! I saw your listing for "${item.title}" on Davidson Market. Is it still available?`;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[90]" onClose={closeModal}>
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" />

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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-3xl bg-white text-left align-middle shadow-2xl transition-all relative flex flex-col md:flex-row">
                {/* Close Button (Absolute) */}
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/50 backdrop-blur-md hover:bg-white text-gray-500 hover:text-gray-900 transition-all"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>

                {/* --- LEFT: IMAGES --- */}
                <div className="w-full md:w-1/2 bg-gray-100 relative">
                  {/* Main Image */}
                  <div className="aspect-square md:aspect-auto md:h-full w-full relative">
                    <img
                      src={item.images[activeImageIndex]}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Thumbnails (Only if > 1 image) */}
                  {item.images.length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4">
                      {item.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                            activeImageIndex === idx
                              ? "border-white scale-110 shadow-lg"
                              : "border-white/50 opacity-70"
                          }`}
                        >
                          <img
                            src={img}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* --- RIGHT: DETAILS --- */}
                <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col">
                  {/* Header */}
                  <div className="mb-6">
                    <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                      {item.category}
                    </span>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
                      {item.title}
                    </h2>
                    <p className="text-3xl font-bold text-[#D42121]">
                      ${item.price}
                    </p>
                  </div>

                  {/* Seller Info */}
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 mb-6">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                      🎓
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">
                        Sold By
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {item.seller?.full_name || "Davidson Student"}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="prose prose-sm text-gray-600 mb-8 flex-grow">
                    <p>{item.description}</p>
                  </div>

                  {/* Metadata Pills */}
                  <div className="flex flex-wrap gap-2 mb-8">
                    <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-bold text-gray-600 flex items-center gap-1">
                      Condition: {item.condition}
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-bold text-gray-600 flex items-center gap-1">
                      <MapPinIcon className="w-3.5 h-3.5" />
                      Davidson Campus
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-4 mt-auto">
                    {/* 1. Email Button (Always Available) */}
                    <button
                      onClick={handleEmail}
                      className="col-span-2 flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                    >
                      <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
                      Email Seller
                    </button>

                    {/* 2. Phone Button (Conditional) */}
                    {item.display_phone && (
                      <a
                        href={`sms:${item.display_phone}`}
                        className="col-span-2 md:col-span-2 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-bold text-base hover:bg-green-700 transition-all shadow-md active:scale-[0.98]"
                      >
                        <PhoneIcon className="w-5 h-5" />
                        Text {item.display_phone}
                      </a>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
