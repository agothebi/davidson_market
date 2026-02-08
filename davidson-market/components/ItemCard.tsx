"use client";

import { ClockIcon, TagIcon } from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns"; // You might need to install date-fns: npm install date-fns

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

export default function ItemCard({ item, onClick }: ItemCardProps) {
  const timeAgo = formatDistanceToNow(new Date(item.created_at), {
    addSuffix: true,
  });

  return (
    <div
      onClick={onClick}
      className="group relative aspect-[4/5] w-full cursor-pointer overflow-hidden rounded-3xl bg-gray-100 shadow-sm transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-[1.02]"
    >
      {/* 1. Main Image */}
      <img
        src={item.images[0] || "/placeholder.png"}
        alt={item.title}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
      />

      {/* 2. Status Badge (If Sold) */}
      {item.status === "Sold" && (
        <div className="absolute top-4 right-4 z-10 rounded-full bg-black/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
          SOLD
        </div>
      )}

      {/* 3. Glass Overlay Information */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="rounded-2xl bg-white/70 backdrop-blur-md p-4 border border-white/50 shadow-lg">
          {/* Top Row: Title & Price */}
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-gray-900 line-clamp-1 text-base">
              {item.title}
            </h3>
            <span className="shrink-0 rounded-full bg-[#D42121]/10 px-2 py-1 text-xs font-extrabold text-[#D42121]">
              ${item.price}
            </span>
          </div>

          {/* Bottom Row: Metadata */}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-600 font-medium">
            <div className="flex items-center gap-1">
              <TagIcon className="w-3.5 h-3.5" />
              <span>{item.condition}</span>
            </div>
            <div className="flex items-center gap-1 opacity-70">
              <ClockIcon className="w-3.5 h-3.5" />
              <span>{timeAgo.replace("about ", "")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
