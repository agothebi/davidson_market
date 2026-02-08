"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { createClient } from "@/utils/supabase/client";
import {
  XMarkIcon,
  ChevronLeftIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

interface LoginModalProps {
  isOpen: boolean;
  closeModal: () => void;
  onLoginSuccess?: () => void;
}

export default function LoginModal({
  isOpen,
  closeModal,
  onLoginSuccess,
}: LoginModalProps) {
  const supabase = createClient();
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // --- LOGIC ---
  const [step, setStep] = useState<"EMAIL" | "CODE">("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    // Reset state slightly after close animation starts for smoother UX
    setTimeout(() => {
      setStep("EMAIL");
      setEmail("");
      setOtp("");
      setErrorMessage(null);
    }, 200);
    closeModal();
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mountedRef.current) return;

    setLoading(true);
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.endsWith("@davidson.edu")) {
      setErrorMessage("Please use your @davidson.edu email address.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { shouldCreateUser: true },
    });

    if (mountedRef.current) {
      if (error) {
        setErrorMessage(error.message);
      } else {
        setEmail(cleanEmail);
        setStep("CODE");
      }
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mountedRef.current) return;

    setLoading(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp.trim(),
      type: "email",
    });

    if (mountedRef.current) {
      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
      } else {
        // Success!
        setLoading(false);
        if (onLoginSuccess) onLoginSuccess();
        handleClose();
      }
    }
  };
  // --- END LOGIC ---

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={handleClose}>
        {/* Backdrop */}
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white/80 p-8 text-left align-middle shadow-2xl transition-all relative ring-1 ring-gray-100">
                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="absolute top-5 right-5 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>

                {/* Back Button (Step 2 Only) */}
                {step === "CODE" && (
                  <button
                    onClick={() => setStep("EMAIL")}
                    className="absolute top-5 left-5 text-gray-400 hover:text-gray-700 flex items-center text-sm font-medium transition-colors"
                  >
                    <ChevronLeftIcon className="w-4 h-4 mr-1" />
                    Back
                  </button>
                )}

                <div className="mt-2 text-center">
                  <Dialog.Title
                    as="h3"
                    className="text-3xl font-extrabold text-gray-900 tracking-tight"
                  >
                    {step === "EMAIL" ? "Welcome!" : "Check your email"}
                  </Dialog.Title>

                  <p className="mt-3 text-gray-500 font-medium">
                    {step === "EMAIL" ? (
                      "Enter your Davidson email to sign in."
                    ) : (
                      <span>
                        We sent a code to{" "}
                        <span className="font-semibold text-gray-900">
                          {email}
                        </span>
                      </span>
                    )}
                  </p>
                </div>

                <div className="mt-8">
                  {step === "EMAIL" ? (
                    /* --- FORM 1: EMAIL --- */
                    <form onSubmit={handleSendCode} className="space-y-5">
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <EnvelopeIcon className="h-5 w-5 text-gray-400 group-focus-within:text-[#D42121] transition-colors" />
                        </div>
                        <input
                          type="email"
                          autoComplete="email"
                          required
                          autoFocus
                          className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-transparent rounded-2xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-[#D42121] focus:ring-4 focus:ring-[#D42121]/10 transition-all font-medium text-lg outline-none"
                          placeholder="student@davidson.edu"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="
                          w-full rounded-full bg-[#D42121] px-4 py-4 text-white font-bold text-lg 
                          shadow-[0_4px_14px_-4px_rgba(212,33,33,0.5)]
                          hover:bg-[#b01b26] hover:shadow-[0_6px_20px_-4px_rgba(212,33,33,0.6)] 
                          hover:scale-[1.01] active:scale-[0.98]
                          transition-all duration-200 ease-out disabled:opacity-70 disabled:hover:scale-100
                        "
                      >
                        {loading ? "Sending Code..." : "Continue"}
                      </button>
                    </form>
                  ) : (
                    /* --- FORM 2: OTP CODE --- */
                    <form onSubmit={handleVerifyCode} className="space-y-6">
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <LockClosedIcon className="h-5 w-5 text-gray-400 group-focus-within:text-[#D42121] transition-colors" />
                        </div>
                        <input
                          type="text"
                          autoComplete="one-time-code"
                          required
                          autoFocus
                          maxLength={8}
                          className="block w-full text-center pl-8 tracking-[0.5em] bg-gray-50 border-transparent rounded-2xl text-gray-900 placeholder-gray-300 focus:bg-white focus:border-[#D42121] focus:ring-4 focus:ring-[#D42121]/10 transition-all font-mono text-2xl outline-none py-4"
                          placeholder="000000"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="
                          w-full rounded-full bg-[#D42121] px-4 py-4 text-white font-bold text-lg 
                          shadow-[0_4px_14px_-4px_rgba(212,33,33,0.5)]
                          hover:bg-[#b01b26] hover:shadow-[0_6px_20px_-4px_rgba(212,33,33,0.6)] 
                          hover:scale-[1.01] active:scale-[0.98]
                          transition-all duration-200 ease-out disabled:opacity-70 disabled:hover:scale-100
                        "
                      >
                        {loading ? "Verifying..." : "Verify Login"}
                      </button>
                    </form>
                  )}

                  {errorMessage && (
                    <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 text-red-700 animate-in slide-in-from-top-1 fade-in duration-200">
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
