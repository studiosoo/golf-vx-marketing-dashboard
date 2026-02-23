import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";

export default function AnniversaryGiveaway() {
  const [, setLocation] = useLocation();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  
  const submitEntry = trpc.anniversaryGiveaway.submitEntry.useMutation({
    onSuccess: () => {
      // Store data in sessionStorage and navigate to application page
      sessionStorage.setItem('giveawayData', JSON.stringify({ firstName, email }));
      setLocation("/anniversary-giveaway-application");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    
    submitEntry.mutate({ firstName, email });
  };

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
            <div className="text-xs text-gray-400 tracking-widest">ARLINGTON HEIGHTS</div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[#3D3D3D] py-12">
        <div className="container max-w-5xl">
          <div className="border-t-[5px] border-[#FFC700] mb-8"></div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-[#FFC700] text-center mb-4">
            WIN 1-YEAR MEMBERSHIP
          </h1>
          
          <h2 className="text-2xl md:text-3xl text-white text-center mb-6">
            At Golf VX Arlington Heights
          </h2>
          
          <p className="text-white text-center max-w-3xl mx-auto leading-relaxed">
            Celebrating our 1st Anniversary with over $7,500 in premium rewards to thank our local golfers and find community ambassadors who want to play more, bring people together, and help grow the Golf VX culture in Arlington Heights and the Chicagoland area.
          </p>
          
          <div className="border-t-[5px] border-[#FFC700] mt-8"></div>
        </div>
      </section>

      {/* YouTube Video Section */}
      <section className="bg-white py-12">
        <div className="container max-w-4xl">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
              src="https://www.youtube.com/embed/1LeYIJj2OxM"
              title="Golf VX Anniversary Giveaway"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>

      {/* Prize Cards Section */}
      <section className="bg-white py-12">
        <div className="container max-w-6xl">
          <h2 className="text-4xl font-bold text-black text-center mb-12">
            THE ANNIVERSARY PRIZE SUITE
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Card 1: All-Access Ace Membership */}
            <div className="border-[3px] border-[#FFC700] bg-white p-6 rounded-lg">
              <div className="text-[#FFC700] font-bold text-xs mb-2 text-center">1 WINNER</div>
              <h3 className="text-2xl font-bold text-black text-center mb-4">
                All-Access Ace<br />Membership
              </h3>
              <p className="text-center text-gray-700 mb-4 text-sm">
                1-Year All-Access Ace Membership<br />
                (12 months × $325 = $3,900 Value)
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-[#FFC700] mr-2">▸</span>
                  <span>Full Day Access<br />(Mon to Sun, Open to Close)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FFC700] mr-2">▸</span>
                  <span>1 Free hour Daily Bay Usage<br />(2 hrs May-Sept)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FFC700] mr-2">▸</span>
                  <span>Bring up to 5 guests for FREE</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FFC700] mr-2">▸</span>
                  <span>PGA Pro Lesson Discounts</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FFC700] mr-2">▸</span>
                  <span>Priority Tournament Access</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FFC700] mr-2">▸</span>
                  <span>20% Off Food & Beverage</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FFC700] mr-2">▸</span>
                  <span>Daily Free Coffee</span>
                </li>
              </ul>
            </div>

            {/* Card 2: Swing Saver Membership */}
            <div className="border-[3px] border-[#FFC700] bg-white p-6 rounded-lg">
              <div className="text-[#FFC700] font-bold text-xs mb-2 text-center">1 WINNER</div>
              <h3 className="text-2xl font-bold text-black text-center mb-4">
                Swing Saver<br />Membership
              </h3>
              <p className="text-center text-gray-700 mb-4 text-sm">
                1-Year Swing Saver Membership<br />
                (12 months × $225 = $2,700 Value)
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-[#FFC700] mr-2">▸</span>
                  <span>Off-Peak Access<br />(Mon to Fri, Open to 6 PM)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FFC700] mr-2">▸</span>
                  <span>1 Free hour Daily Bay Usage<br />(2 hrs May-Sept)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FFC700] mr-2">▸</span>
                  <span>Bring up to 5 guests for FREE</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FFC700] mr-2">▸</span>
                  <span>PGA Pro Lesson Discounts</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FFC700] mr-2">▸</span>
                  <span>Priority Tournament Access</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FFC700] mr-2">▸</span>
                  <span>20% Off Food & Beverage</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FFC700] mr-2">▸</span>
                  <span>Daily Free Coffee</span>
                </li>
              </ul>
            </div>

            {/* Card 3: Gift Card */}
            <div className="border-[3px] border-[#FFC700] bg-white p-6 rounded-lg">
              <div className="text-[#FFC700] font-bold text-xs mb-2 text-center">3 WINNERS</div>
              <h3 className="text-2xl font-bold text-black text-center mb-4">
                Golf VX $300<br />Gift Card
              </h3>
              <p className="text-center text-gray-700 mb-4 text-sm">
                Experience Golf VX<br />
                (Bay Time and Dining)
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-[#FFC700] mr-2">▸</span>
                  <span>$45/hr Off-Peak</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FFC700] mr-2">▸</span>
                  <span>$65/hr Peak</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FFC700] mr-2">▸</span>
                  <span>Perfect for a Crew of 6</span>
                </li>
              </ul>
            </div>
          </div>

          <p className="text-center text-gray-600 text-sm max-w-2xl mx-auto">
            Open exclusively to Illinois residents.<br />
            All prizes are redeemable only at Golf VX Arlington Heights.<br />
            Gift cards are valid through March 31st, 2026. No cash value.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="bg-white py-16">
        <div className="container max-w-3xl">
          <div className="bg-[#FFD000] p-12 rounded-2xl">
          <h2 className="text-4xl md:text-5xl font-bold text-black text-center mb-4">
            START YOUR APPLICATION
          </h2>
          
          <p className="text-black text-center mb-8 max-w-2xl mx-auto">
            Open to Illinois residents ages 18+. No purchase necessary. All prizes are non-transferable and redeemable only at Golf VX Arlington Heights. Gift cards valid through March 31, 2026; no cash value.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-xs font-bold text-black uppercase mb-2">
                FIRST NAME
              </label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Soo Kim"
                required
                className="w-full h-16 text-lg bg-white border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-black uppercase mb-2">
                EMAIL ADDRESS
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="soo@studiosoo.com"
                required
                className="w-full h-16 text-lg bg-white border border-gray-300 rounded-lg"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-16 bg-black hover:bg-gray-900 text-white text-xl font-bold rounded-full mt-6 shadow-lg"
            >
              APPLY
            </Button>
          </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#3D3D3D] py-12 text-center">
        <div className="container">
          <div className="inline-flex flex-col items-center mb-6">
            <img 
              src="/logos/GolfVX-LogoHorizontal(ColorWhiteYellow).png" 
              alt="Golf VX" 
              className="h-8"
            />
          </div>
          
          <p className="text-white font-bold mb-2">Copyright © Golf VX Corp</p>
          <p className="text-gray-400 text-sm">644 E Rand Rd • Arlington Heights, IL 60004</p>
          <p className="text-gray-400 text-sm">arlingtonheights@playgolfvx.com</p>
          <p className="text-gray-400 text-sm">(847) 749-1054</p>
          
          <p className="text-gray-500 text-xs italic mt-6">
            Open exclusively to Illinois residents. All prizes redeemable only at Golf VX Arlington Heights.
          </p>
        </div>
      </footer>
    </div>
  );
}
