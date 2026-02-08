"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { createClient } from "@/utils/supabase/client";
import {
  UserCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  // We don't provide a standard 'closeModal' because this step is effectively mandatory if triggered
}

export default function OnboardingModal({
  isOpen,
  onComplete,
}: OnboardingModalProps) {
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const name = fullName.trim();
    if (name.length < 2) {
      setErrorMessage("Please enter your real full name.");
      setLoading(false);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No user found.");

      // Update the profile
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: name })
        .eq("id", user.id);

      if (error) throw error;

      // Success
      onComplete();
    } catch (error: any) {
      setErrorMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[70]" onClose={() => {} } >
        {/* Backdrop - Non-clickable (mandatory feel) */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm" />
        </Transition.Child>

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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white/40 p-8 text-left align-middle shadow-3xl transition-all relative ring-1 ring-gray-200/30">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white mb-6">
                    <UserCircleIcon
                      className="h-10 w-10 text-[#D42121]"
                      aria-hidden="true"
                    />
                  </div>

                  <Dialog.Title
                    as="h3"
                    className="text-3xl font-extrabold text-gray-900 tracking-tight"
                  >
                    Welcome!
                  </Dialog.Title>

                  <p className="mt-3 text-gray-500 font-medium">
                    We don't recognize this email yet. To keep the market
                    trusted, please enter your full name.
                  </p>
                </div>

                <div className="mt-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-2 ml-1"
                      >
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        autoFocus
                        className="block w-full px-4 py-3 bg-gray-50 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-[#D42121] focus:ring-2 focus:ring-[#D42121]/20 transition-all outline-none font-medium"
                        placeholder="e.g. Stephen Curry"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="
                        w-full rounded-full bg-[#D42121] px-4 py-3.5 text-white font-bold text-lg 
                        shadow-[0_4px_14px_-4px_rgba(212,33,33,0.5)]
                        hover:bg-[#b01b26] hover:shadow-[0_6px_20px_-4px_rgba(212,33,33,0.6)] 
                        hover:scale-[1.01] active:scale-[0.98]
                        transition-all duration-200 ease-out disabled:opacity-70 disabled:hover:scale-100
                      "
                    >
                      {loading ? "Saving..." : "Get Started"}
                    </button>
                  </form>

                  {errorMessage && (
                    <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-red-50 text-red-700">
                      <ExclamationCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium">{errorMessage}</p>
                    </div>
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
