import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import PublicLayout from "@/components/PublicLayout";

export default function TrialSession() {
  const trackEvent = trpc.public.trackPageEvent.useMutation();

  useEffect(() => {
    trackEvent.mutate({
      pageSlug: "trial-session",
      eventType: "page_view",
      eventData: {},
    });
  }, []);

  const handleBooking = (type: "off-peak" | "peak") => {
    trackEvent.mutate({
      pageSlug: "trial-session",
      eventType: "cta_click",
      eventData: { booking_type: type },
    });
    
    const acuityUrl = "https://app.acuityscheduling.com/schedule/b70b566e/?categories%5B%5D=Trial%20Sessions&utm_source=website&utm_medium=landing_page&utm_content=trial_session";
    window.open(acuityUrl, "_blank");
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-black text-white py-32 md:py-40">
        <div className="container max-w-5xl mx-auto px-6 text-center">
          <div className="inline-block bg-[#FFD700] text-black text-xs font-bold tracking-widest px-5 py-2 mb-10">
            FIRST-TIME GUESTS
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none mb-8">
            BOOK YOUR<br />
            <span className="text-[#FFD700]">TRIAL SESSION</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-20 max-w-2xl mx-auto font-light">
            Take your first swing at Golf VX with our 1-hour intro session
          </p>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Off-Peak */}
            <div className="bg-white text-black p-12">
              <div className="text-sm font-bold tracking-widest mb-4">OFF-PEAK</div>
              <div className="text-sm text-gray-500 mb-8">Mon–Fri before 6 PM</div>
              <div className="text-7xl font-black mb-10">$25</div>
              <button
                onClick={() => handleBooking("off-peak")}
                className="w-full bg-[#FFD700] text-black font-bold py-5 text-base tracking-widest hover:bg-[#FFD700]/90 transition-colors"
              >
                BOOK OFF-PEAK
              </button>
            </div>

            {/* Peak */}
            <div className="bg-white text-black p-12">
              <div className="text-sm font-bold tracking-widest mb-4">PEAK</div>
              <div className="text-sm text-gray-500 mb-8">After 6 PM + Weekends</div>
              <div className="text-7xl font-black mb-10">$35</div>
              <button
                onClick={() => handleBooking("peak")}
                className="w-full bg-black text-white font-bold py-5 text-base tracking-widest hover:bg-black/90 transition-colors"
              >
                BOOK PEAK
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-28 bg-white">
        <div className="container max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-center mb-20">
            WHAT'S INCLUDED
          </h2>
          
          <div className="grid md:grid-cols-3 gap-16 text-center mb-20">
            <div>
              <div className="text-3xl font-black mb-4">60 MIN</div>
              <p className="text-gray-600 leading-relaxed">
                Full hour in your private bay
              </p>
            </div>
            
            <div>
              <div className="text-3xl font-black mb-4">6 PEOPLE</div>
              <p className="text-gray-600 leading-relaxed">
                Bring up to 5 guests
              </p>
            </div>
            
            <div>
              <div className="text-3xl font-black mb-4">TRACKMAN</div>
              <p className="text-gray-600 leading-relaxed">
                Full access to all features
              </p>
            </div>
          </div>

          {/* Planning Note */}
          <div className="max-w-2xl mx-auto bg-gray-50 p-10 border-l-4 border-[#FFD700]">
            <p className="text-gray-700 leading-relaxed">
              One hour is usually enough for a solo player. Groups wanting to finish 18 holes should book 2+ hours.
            </p>
          </div>
        </div>
      </section>

      {/* Why Golf VX */}
      <section className="py-28 bg-gray-50">
        <div className="container max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-center mb-20">
            WHY GOLF VX
          </h2>
          
          <div className="space-y-6 max-w-2xl mx-auto">
            {[
              "Premium TrackMan simulators",
              "World-famous golf courses",
              "Instant swing feedback",
              "Full bar and lounge",
              "Private bays",
              "Expert staff"
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-5">
                <div className="w-1.5 h-1.5 bg-[#FFD700] mt-3 flex-shrink-0"></div>
                <p className="text-lg text-gray-700">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-black text-white py-28">
        <div className="container max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-8">
            READY TO SWING?
          </h2>
          
          <p className="text-xl text-gray-400 mb-14 font-light">
            No credit card required
          </p>
          
          <button
            onClick={() => handleBooking("off-peak")}
            className="bg-[#FFD700] text-black font-bold px-16 py-6 text-base tracking-widest hover:bg-[#FFD700]/90 transition-colors"
          >
            BOOK NOW
          </button>
        </div>
      </section>

      {/* Location */}
      <section className="py-20 bg-white">
        <div className="container max-w-4xl mx-auto px-6">
          <div className="text-center">
            <div className="text-sm font-bold tracking-widest mb-4 text-gray-500">LOCATION</div>
            <div className="text-3xl font-black mb-3">Golf VX Arlington Heights</div>
            <div className="text-gray-600">
              644 E Rand Rd, Arlington Heights, IL
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
