import { Button } from "@/components/ui/button";

export default function AnniversaryGiveawayThankYou() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#3D3D3D] py-6">
        <div className="container text-center">
          <div className="inline-flex flex-col items-center">
            <img 
              src="/logos/GolfVX-LogoHorizontal(ColorWhiteYellow).png" 
              alt="Golf VX" 
              className="h-8 mb-2"
            />
            <div className="text-xs text-[#888888] tracking-widest">ARLINGTON HEIGHTS</div>
          </div>
        </div>
      </header>

      {/* Thank You Hero Section */}
      <div className="container max-w-4xl py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-[#FFD000] mb-4">
          THANK YOU!
        </h1>
        <p className="text-2xl md:text-3xl font-bold mb-8">
          YOUR APPLICATION IS CONFIRMED.
        </p>
        <p className="text-xl font-bold mb-12">
          Winners announced March 31
        </p>
        <p className="text-lg mb-2">
          <strong>Save these now: (847) 749-1054 | arlingtonheights@playgolfvx.com</strong>
        </p>
      </div>

      {/* Yellow CTA Section */}
      <div className="bg-[#FFD000] py-12">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Don't just wait. Come play.
          </h2>
        </div>
      </div>

      {/* Offer Cards Section */}
      <div className="container max-w-6xl py-16">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Bay Trial Card */}
          <div className="bg-[#3D3D3D] rounded-2xl p-10 text-center">
            <h3 className="text-[#FFD000] text-3xl font-bold mb-4">
              BAY TRIAL
            </h3>
            <p className="text-[#888888] line-through text-lg mb-2">
              Regular rate: $45/hour
            </p>
            <p className="text-[#FFD000] text-5xl font-bold mb-6">
              ONE HOUR $9
            </p>
            <div className="text-white text-sm space-y-2 mb-6">
              <p>Play 200+ famous courses with swing tracking and</p>
              <p>Drag up to 5 friends for free</p>
              <p>$9 Off Peak (Mon-Fri until 5pm) | $18 Peak</p>
            </div>
            <p className="text-white text-sm font-bold mb-6">
              Valid through<br />March 27
            </p>
            <Button className="w-full bg-[#FFD000] hover:bg-[#E6C000] text-black font-bold h-14 rounded-full text-lg">
              BOOK NOW
            </Button>
          </div>

          {/* PGA Coaching Card */}
          <div className="bg-[#3D3D3D] rounded-2xl p-10 text-center">
            <h3 className="text-[#FFD000] text-3xl font-bold mb-4">
              PGA COACHING
            </h3>
            <p className="text-[#888888] line-through text-lg mb-2">
              Regular value: $200
            </p>
            <p className="text-[#FFD000] text-5xl font-bold mb-6">
              90 MIN $20
            </p>
            <div className="text-white text-sm space-y-2 mb-6">
              <p>90-minute hands-on clinic with PGA Coach Chuck Lynch and</p>
              <p>Play Better Golf Academy.</p>
              <p>Golf VX Members attend FREE</p>
            </div>
            <p className="text-white text-sm font-bold mb-6">
              Sundays: Feb 22, Mar 1, 22, 29<br />2:00-3:30 PM
            </p>
            <Button className="w-full bg-[#FFD000] hover:bg-[#E6C000] text-black font-bold h-14 rounded-full text-lg">
              LEARN MORE
            </Button>
          </div>
        </div>
      </div>

      {/* Membership Offer Section */}
      <div className="bg-[#3D3D3D] py-16">
        <div className="container max-w-4xl text-center">
          <p className="text-[#FFD000] text-sm font-bold mb-4">
            🎉 Anniversary Exclusive: Last Chance
          </p>
          <h2 className="text-white text-4xl md:text-5xl font-bold mb-4">
            1-YEAR SWING SAVER MEMBERSHIP
          </h2>
          <p className="text-[#FFD000] text-5xl md:text-6xl font-bold mb-2">
            TODAY $1,500
          </p>
          <p className="text-white text-2xl mb-8">
            (Reg $2,700)
          </p>
          <p className="text-white text-lg mb-6">
            Lock in our most popular membership at the lowest price we've ever offered.
          </p>
          <p className="text-white text-base mb-12">
            <strong>Available in-venue only. Expires February 28.</strong>
          </p>

          {/* Membership Benefits Box */}
          <div className="bg-white rounded-2xl p-8 mb-12 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-6">
              Swing Saver Annual Membership Includes:
            </h3>
            <div className="text-left space-y-3">
              <div className="flex items-start">
                <span className="text-[#FFD000] mr-3">✓</span>
                <p className="text-sm">
                  <strong>Up to 370 hours of bay time annually</strong> ($9,650 value)
                </p>
              </div>
              <div className="flex items-start">
                <span className="text-[#FFD000] mr-3">✓</span>
                <p className="text-sm">
                  <strong>FREE PGA coach clinics</strong> ($800+ value)
                </p>
              </div>
              <div className="flex items-start">
                <span className="text-[#FFD000] mr-3">✓</span>
                <p className="text-sm">
                  Discounted private PGA coaching
                </p>
              </div>
              <div className="flex items-start">
                <span className="text-[#FFD000] mr-3">✓</span>
                <p className="text-sm">
                  <strong>Bring 5 friends</strong> free anytime
                </p>
              </div>
              <div className="flex items-start">
                <span className="text-[#FFD000] mr-3">✓</span>
                <p className="text-sm">
                  <strong>20% off all food & beverage</strong> (save hundreds)
                </p>
              </div>
              <div className="flex items-start">
                <span className="text-[#FFD000] mr-3">✓</span>
                <p className="text-sm">
                  Priority tournament & league access
                </p>
              </div>
              <div className="flex items-start">
                <span className="text-[#FFD000] mr-3">✓</span>
                <p className="text-sm">
                  <strong>Free daily coffee</strong> ($300+ value)
                </p>
              </div>
            </div>
            <div className="border-t border-gray-300 my-6"></div>
            <p className="text-lg font-bold mb-2">
              Total value: $17,750+
            </p>
            <p className="text-3xl font-bold text-[#FFD000] mb-1">
              February Special: $1,500/year
            </p>
            <p className="text-sm text-gray-600 mb-4">
              (Regular Price: $225/month × 12 = $2,700)
            </p>
            <p className="text-base font-bold">
              That's Almost 5 Months FREE + Save $1,200
            </p>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="bg-[#FFD000] py-16">
        <div className="container max-w-3xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            READY TO JOIN?
          </h2>
          <p className="text-2xl font-bold mb-8">
            BOOK YOUR VISIT OR CALL (847) 749-1054
          </p>
          <div className="space-y-4 max-w-md mx-auto">
            <Button className="w-full bg-[#3D3D3D] hover:bg-black text-white font-bold h-16 rounded-full text-lg">
              BOOK YOUR $9 TRIAL ›
            </Button>
            <Button className="w-full bg-[#3D3D3D] hover:bg-black text-white font-bold h-16 rounded-full text-lg">
              LEARN MORE $20 CLINIC ›
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#3D3D3D] py-12 text-center">
        <div className="container">
          <div className="mb-6">
            <img 
              src="/logos/GolfVX-LogoHorizontal(ColorWhiteYellow).png" 
              alt="Golf VX" 
              className="h-10 mx-auto mb-4"
            />
          </div>
          <p className="text-white font-bold mb-2">Copyright © Golf VX Corp</p>
          <p className="text-[#888888] text-sm mb-1">644 E Rand Rd • Arlington Heights, IL 60004</p>
          <p className="text-[#888888] text-sm mb-1">arlingtonheights@playgolfvx.com</p>
          <p className="text-[#888888] text-sm">(847) 749-1054</p>
          <p className="text-gray-500 text-xs mt-4">
            Open exclusively to Illinois residents. All prizes redeemable only at Golf VX Arlington Heights.
          </p>
        </div>
      </footer>
    </div>
  );
}
