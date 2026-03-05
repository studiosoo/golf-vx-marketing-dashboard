import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import PublicLayout from "@/components/PublicLayout";

export default function JuniorSummerCamp() {
  const trackEvent = trpc.public.trackPageEvent.useMutation({ onError: () => {} });

  useEffect(() => {
    trackEvent.mutate({
      pageSlug: "junior-summer-camp",
      eventType: "page_view",
      eventData: {},
    });
  }, []);

  const handleBooking = () => {
    trackEvent.mutate({
      pageSlug: "junior-summer-camp",
      eventType: "cta_click",
      eventData: { program: "junior_summer_camp" },
    });
    
    window.open("https://ah.playgolfvx.com/junior-summer-camp", "_blank");
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-black text-white py-32 md:py-40">
        <div className="container max-w-5xl mx-auto px-6 text-center">
          <div className="inline-block bg-[#FFD700] text-black text-xs font-bold tracking-widest px-5 py-2 mb-10">
            SUMMER 2026
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none mb-8">
            JUNIOR GOLF<br />
            <span className="text-[#FFD700]">SUMMER CAMP</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-[#888888] mb-20 max-w-2xl mx-auto font-light">
            Quality-first instruction by PBGA PGA-certified coaches
          </p>

          <button
            onClick={handleBooking}
            className="bg-[#FFD700] text-black font-bold px-16 py-6 text-base tracking-widest hover:bg-[#FFD700]/90 transition-colors"
          >
            REGISTER NOW
          </button>
        </div>
      </section>

      {/* Program Focus */}
      <section className="py-28 bg-white">
        <div className="container max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-center mb-20">
            PROGRAM FOCUS
          </h2>
          
          <div className="grid md:grid-cols-3 gap-16 text-center mb-20">
            <div>
              <div className="text-3xl font-black mb-4">CONFIDENCE</div>
              <p className="text-gray-600 leading-relaxed">
                Build lasting confidence through structured skill development
              </p>
            </div>
            
            <div>
              <div className="text-3xl font-black mb-4">CONSISTENCY</div>
              <p className="text-gray-600 leading-relaxed">
                Develop reliable mechanics with expert guidance
              </p>
            </div>
            
            <div>
              <div className="text-3xl font-black mb-4">LONG-TERM</div>
              <p className="text-gray-600 leading-relaxed">
                Focus on sustainable growth, not quick fixes
              </p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto bg-gray-50 p-10 border-l-4 border-[#FFD700]">
            <p className="text-gray-700 leading-relaxed font-medium mb-4">
              Quality-first group instruction model
            </p>
            <p className="text-gray-700 leading-relaxed">
              Not volume-driven. We prioritize proper technique and individual development over class size.
            </p>
          </div>
        </div>
      </section>

      {/* Coaching Staff */}
      <section className="py-28 bg-gray-50">
        <div className="container max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-center mb-20">
            COACHING STAFF
          </h2>
          
          <div className="space-y-6 max-w-2xl mx-auto">
            {[
              "Morning instruction by PBGA PGA-certified coaches",
              "Assistants support pacing, safety, and logistics",
              "Curriculum consistency across all sessions",
              "High-level coaching focused on fundamentals"
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-5">
                <div className="w-1.5 h-1.5 bg-[#FFD700] mt-3 flex-shrink-0"></div>
                <p className="text-lg text-gray-700">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Value */}
      <section className="py-28 bg-white">
        <div className="container max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-center mb-20">
            BEYOND SUMMER CAMP
          </h2>
          
          <div className="max-w-2xl mx-auto space-y-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              This program is a <span className="font-bold">conversion engine</span>, not a standalone camp.
            </p>
            
            <div className="space-y-6">
              {[
                "Junior lesson program conversion",
                "Membership enrollment (junior + family)",
                "Retention into leagues, academies, and seasonal programs",
                "Parent simulator usage during camp hours"
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-5">
                  <div className="w-1.5 h-1.5 bg-[#FFD700] mt-3 flex-shrink-0"></div>
                  <p className="text-lg text-gray-700">{benefit}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 p-10 border-l-4 border-[#FFD700] mt-12">
              <p className="text-gray-700 leading-relaxed font-medium">
                Families plan summer programs February–March. Timing is critical.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-black text-white py-28">
        <div className="container max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-8">
            SECURE YOUR SPOT
          </h2>
          
          <p className="text-xl text-[#888888] mb-14 font-light">
            Limited availability • Early registration recommended
          </p>
          
          <button
            onClick={handleBooking}
            className="bg-[#FFD700] text-black font-bold px-16 py-6 text-base tracking-widest hover:bg-[#FFD700]/90 transition-colors"
          >
            REGISTER NOW
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
