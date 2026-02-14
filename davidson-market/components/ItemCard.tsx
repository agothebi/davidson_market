"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  TicketIcon, // Tickets
  BookOpenIcon, // Books & Notes
  CpuChipIcon, // Electronics
  ShoppingBagIcon, // Clothing
  HomeIcon, // Furniture – closest literal representation
  WrenchScrewdriverIcon, // Services – represents work/service
  TagIcon,
} from "@heroicons/react/24/outline";
import { Table2Icon } from "lucide-react";

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

interface ItemCardProps {
  item: Item;
  onClick: () => void;
}

// Helper: Get Icon based on category, but FORCE the specific gray colors
const getPlaceholderAssets = (category: string) => {
  // 1. Define the specific gray colors you requested
  // #e2e8f0 = bg-slate-200
  // #475569 = text-slate-600
  const style = { bg: "bg-slate-200", color: "text-slate-600" };

  // 2. Select the icon
  let Icon;
  switch (category) {
    case "Tickets":
      Icon = TicketIcon;
      break;

    case "Books & Notes":
      Icon = BookOpenIcon;
      break;

    case "Electronics":
      Icon = CpuChipIcon;
      break;

    case "Clothing":
      Icon = ShoppingBagIcon;
      break;

    case "Furniture":
      Icon = HomeIcon; // visually represents furniture
      break;

    case "Services":
      Icon = WrenchScrewdriverIcon; // conveys “service/work”
      break;

    default:
      Icon = TagIcon;
      break;
  }

  return { ...style, icon: Icon };
};

export default function ItemCard({ item, onClick }: ItemCardProps) {
  const [imageError, setImageError] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(item.created_at), {
    addSuffix: true,
  });

  // LOGIC: Valid image check
  const rawImage =
    item.images && item.images.length > 0 ? item.images[0] : null;
  const hasValidImage = rawImage && rawImage.trim() !== "" && !imageError;

  const placeholder = getPlaceholderAssets(item.category);
  const Icon = placeholder.icon;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer flex flex-row md:flex-col w-full bg-white rounded-2xl border border-white/60 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-gray-300"
    >
      {/* 1. IMAGE CONTAINER */}
      <div
        className={`relative w-32 h-32 md:w-full md:h-auto md:aspect-square shrink-0 ${hasValidImage ? "bg-gray-100" : placeholder.bg}`}
      >
        {hasValidImage ? (
          <img
            src={rawImage}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          // ELEGANT GRAY PLACEHOLDER
          // Uses the exact slate colors to match your reference
          <div className="flex flex-col items-center justify-center h-full w-full gap-2 p-4">
            <Icon
              className={`w-14 h-14 md:w-17 md:h-17 ${placeholder.color} opacity-50`}
            />
          </div>
        )}

        {/* SOLD OVERLAY */}
        {item.status === "Sold" && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[2px] z-10">
            <span className="text-black font-bold tracking-wider text-[10px] border border-black px-2 py-0.5 uppercase">
              Sold
            </span>
          </div>
        )}
      </div>

      {/* 2. TEXT CONTAINER */}
      <div className="flex flex-col justify-center gap-1 p-3 md:p-4 min-w-0 flex-1">
        {/* Top Row: Title & Price */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1">
          <h3 className="text-sm md:text-[15px] font-bold text-gray-900 line-clamp-2 md:truncate leading-tight">
            {item.title}
          </h3>
          <span className="text-sm md:text-[15px] font-bold text-[#D42121] whitespace-nowrap">
            ${item.price}
          </span>
        </div>

        {/* Bottom Row: Metadata */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 md:mt-auto">
          <span className="bg-gray-100 px-2 py-0.5 rounded-md font-medium text-[10px] uppercase tracking-wide">
            {item.condition}
          </span>
          <span className="text-[10px] opacity-70">
            {timeAgo.replace("about ", "")}
          </span>
        </div>
      </div>
    </div>
  );
}
