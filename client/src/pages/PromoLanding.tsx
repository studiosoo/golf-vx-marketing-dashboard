import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle2, AlertCircle, Tag } from "lucide-react";

// ─── Offer type label ─────────────────────────────────────────────────────────

const OFFER_LABELS: Record<string, string> = {
  free_session: "Free Session",
  discount: "Discount Offer",
  gift_card: "Gift Card",
  trial: "Trial Offer",
  event: "Event Access",
  other: "Special Offer",
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PromoLanding() {
  const { slug } = useParams<{ slug: string }>();

  const { data: promo, isLoading, isError } = trpc.promos.getPublic.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );

  const submitMutation = trpc.promos.submitLead.useMutation();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    termsAccepted: false,
    marketingConsent: false,
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !form.termsAccepted) return;
    submitMutation.mutate(
      {
        slug,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        email: form.email,
      },
      { onSuccess: () => setSubmitted(true) }
    );
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#222222] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#F2DD48]" />
      </div>
    );
  }

  // ── Not found / expired ──────────────────────────────────────────────────
  if (isError || !promo) {
    return (
      <div className="min-h-screen bg-[#222222] flex flex-col items-center justify-center px-6 text-center">
        <AlertCircle className="h-12 w-12 text-[#F2DD48] mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Promotion Not Found</h1>
        <p className="text-[#6F6F6B] text-sm">This promotion may have ended or the link is invalid.</p>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#222222] flex flex-col items-center justify-center px-6 text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="text-[#F2DD48] text-3xl font-black tracking-tight">
            GOLF <span className="text-white">VX</span>
          </div>
        </div>
        <CheckCircle2 className="h-16 w-16 text-[#72B84A] mb-5" />
        <h1 className="text-2xl font-bold text-white mb-2">You're all set!</h1>
        <p className="text-[#6F6F6B] text-sm leading-relaxed max-w-xs">
          We've saved your offer. Our team will be in touch with details. See you at Golf VX!
        </p>
        <div className="mt-8 text-[11px] text-[#555555]">644 E Rand Rd, Arlington Heights, IL 60004</div>
      </div>
    );
  }

  const offerLabel = OFFER_LABELS[promo.offerType] ?? "Special Offer";

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#222222] flex flex-col items-center justify-center px-5 py-10">
      {/* Logo */}
      <div className="mb-7">
        <div className="text-[#F2DD48] text-3xl font-black tracking-tight">
          GOLF <span className="text-white">VX</span>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-2xl border border-[#2A2A2A]">
        {/* Offer banner */}
        <div className="bg-[#F2DD48] px-5 py-4 flex items-center gap-3">
          <Tag className="h-5 w-5 text-[#222222] shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-[#222222]/60 uppercase tracking-wide">{offerLabel}</p>
            <h1 className="text-[18px] font-black text-[#222222] leading-tight">{promo.title}</h1>
          </div>
        </div>

        {/* Description */}
        {promo.description && (
          <p className="px-5 pt-4 text-[13px] text-[#A8A8A3] leading-relaxed">{promo.description}</p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 pt-4 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-[#666666] uppercase tracking-wide block mb-1">
                First Name *
              </label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full h-10 bg-[#222222] border border-[#333333] rounded-lg px-3 text-[13px] text-white placeholder:text-[#444444] focus:outline-none focus:border-[#F2DD48]"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#666666] uppercase tracking-wide block mb-1">
                Last Name *
              </label>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full h-10 bg-[#222222] border border-[#333333] rounded-lg px-3 text-[13px] text-white placeholder:text-[#444444] focus:outline-none focus:border-[#F2DD48]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-[#666666] uppercase tracking-wide block mb-1">
              Phone
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 (847) ..."
              className="w-full h-10 bg-[#222222] border border-[#333333] rounded-lg px-3 text-[13px] text-white placeholder:text-[#444444] focus:outline-none focus:border-[#F2DD48]"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-[#666666] uppercase tracking-wide block mb-1">
              Email *
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full h-10 bg-[#222222] border border-[#333333] rounded-lg px-3 text-[13px] text-white placeholder:text-[#444444] focus:outline-none focus:border-[#F2DD48]"
            />
          </div>

          {/* Consents */}
          <div className="space-y-2 pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.termsAccepted}
                onChange={(e) => setForm({ ...form, termsAccepted: e.target.checked })}
                className="mt-0.5 accent-[#F2DD48]"
              />
              <span className="text-[11px] text-[#6F6F6B] leading-relaxed">
                I have read and accept the <span className="text-[#F2DD48]">terms of use</span>.
              </span>
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.marketingConsent}
                onChange={(e) => setForm({ ...form, marketingConsent: e.target.checked })}
                className="mt-0.5 accent-[#F2DD48]"
              />
              <span className="text-[11px] text-[#6F6F6B] leading-relaxed">
                I agree that my personal data can be used for direct marketing purposes.
              </span>
            </label>
          </div>

          {/* Error */}
          {submitMutation.isError && (
            <p className="text-[12px] text-red-400 text-center">
              {submitMutation.error?.message ?? "Something went wrong. Please try again."}
            </p>
          )}

          <button
            type="submit"
            disabled={!form.termsAccepted || submitMutation.isPending}
            className="w-full h-12 bg-[#F2DD48] rounded-xl text-[#222222] text-[15px] font-bold hover:brightness-95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
          >
            {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Get the offer
          </button>
        </form>
      </div>

      <p className="mt-6 text-[11px] text-[#555555] text-center">
        Golf VX Arlington Heights · 644 E Rand Rd, Arlington Heights, IL
      </p>
    </div>
  );
}
