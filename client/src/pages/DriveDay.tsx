import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import PublicLayout from "@/components/PublicLayout";
import { VENUE_CONFIG } from "@/const";

export default function DriveDay() {
  const trackEvent = trpc.public.trackPageEvent.useMutation({ onError: () => {} });

  useEffect(() => {
    trackEvent.mutate({
      pageSlug: "drive-day",
      eventType: "page_view",
      eventData: {},
    });
  }, []);

  const handleBooking = () => {
    trackEvent.mutate({
      pageSlug: "drive-day",
      eventType: "cta_click",
      eventData: { program: "drive_day" },
    });
    
    window.open("https://ah.playgolfvx.com/drive-day-public", "_blank");
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-black text-white py-32 md:py-40">
        <div className="container max-w-5xl mx-auto px-6 text-center">
          <div className="inline-block bg-[#FFD700] text-black text-xs font-bold tracking-widest px-5 py-2 mb-10">
            SHORT GAME CLINIC
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none mb-8">
            DRIVE DAY<br />
            <span className="text-[#FFD700]">SHORT GAME</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-[#6F6F6B] mb-12 max-w-2xl mx-auto font-light">
            Master your short game with PGA-certified coach Chuck Lynch
          </p>

          <div className="text-7xl font-black mb-12">$20</div>
          <div className="text-sm text-[#6F6F6B] mb-16">PER PERSON (NON-MEMBERS)</div>

          <button
            onClick={handleBooking}
            className="bg-[#FFD700] text-black font-bold px-16 py-6 text-base tracking-widest hover:bg-[#FFD700]/90 transition-colors"
          >
            BOOK DRIVE DAY
          </button>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-28 bg-white">
        <div className="container max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-center mb-20">
            WHAT YOU'LL LEARN
          </h2>
          
          <div className="space-y-6 max-w-2xl mx-auto mb-20">
            {[
              "Grip fundamentals",
              "Stance and ball position",
              "Shaft lean technique",
              "Backswing path and arc",
              "Angle of attack through impact",
              "Leading edge vs bounce control"
            ].map((skill, index) => (
              <div key={index} className="flex items-start gap-5">
                <div className="w-1.5 h-1.5 bg-[#FFD700] mt-3 flex-shrink-0"></div>
                <p className="text-lg text-gray-700">{skill}</p>
              </div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto bg-gray-50 p-10 border-l-4 border-[#FFD700]">
            <p className="text-gray-700 leading-relaxed mb-4">
              Build reliable short-game mechanics through clear demonstrations and guided instruction.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Relaxed environment with high-level coaching. Non-golfers may observe.
            </p>
          </div>
        </div>
      </section>

      {/* Coach */}
      <section className="py-28 bg-gray-50">
        <div className="container max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-12">
            YOUR COACH
          </h2>
          
          <div className="text-3xl font-black mb-4">CHUCK LYNCH</div>
          <div className="text-lg text-gray-600 mb-8">PGA-Certified Coach</div>
          
          <p className="text-gray-700 leading-relaxed max-w-2xl mx-auto">
            Expert instruction focused on building confidence and consistency through proven short-game fundamentals.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-black text-white py-28">
        <div className="container max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-8">
            READY TO IMPROVE?
          </h2>
          
          <p className="text-xl text-[#6F6F6B] mb-14 font-light">
            Join our next Drive Day session
          </p>
          
          <button
            onClick={handleBooking}
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
              {VENUE_CONFIG.address}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
