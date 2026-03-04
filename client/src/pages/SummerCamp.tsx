import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Users, TrendingUp, Trophy } from "lucide-react";
import { VENUE_CONFIG } from "@/const";

export default function SummerCamp() {
  const scrollToBooking = () => {
    const bookingSection = document.getElementById("booking");
    bookingSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section 
        className="relative h-screen flex items-center justify-center text-white"
        style={{
          backgroundImage: "url(/landing-pages/summer-camp/facility-hero.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center max-w-4xl px-4">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight">
              GOLF<span className="text-yellow-400">VX</span>
            </h1>
            <p className="text-xl font-medium tracking-wide">{VENUE_CONFIG.shortName}</p>
          </div>

          {/* Main Headline */}
          <h2 className="text-4xl md:text-6xl font-black mb-4">
            JUNIOR SUMMER
            <br />
            CAMP 2026
          </h2>

          {/* PBGA Badge */}
          <div className="mb-6">
            <div className="inline-block bg-yellow-400 text-black px-8 py-2 rounded-full">
              <p className="text-2xl font-bold">with PBGA</p>
            </div>
            <p className="text-xl mt-2">Play Better Golf Academy</p>
          </div>

          {/* Details */}
          <div className="space-y-2 mb-8">
            <p className="text-lg">Ages 4-17 • Weekly Programs</p>
            <p className="text-lg">June 8th to August 7th</p>
            <p className="text-lg">Friday On-Course Experience</p>
          </div>

          {/* CTA Button */}
          <Button 
            onClick={scrollToBooking}
            size="lg"
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-lg px-12 py-6 rounded-full"
          >
            LEARN MORE ABOUT SUMMER CAMP
          </Button>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container max-w-4xl text-center">
          <p className="text-xl text-gray-700 leading-relaxed">
            Junior golf instruction led by PBGA PGA-certified coaches, hosted at Golf VX — 
            a tech-forward golf performance facility designed to help young players improve faster and build confidence.
          </p>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20 px-4">
        <div className="container">
          <h2 className="text-4xl font-black text-center mb-12">
            WHY CHOOSE GOLF VX JUNIOR SUMMER CAMP
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Elite Coaching */}
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-black" />
                </div>
                <CardTitle className="text-2xl">ELITE COACHING</CardTitle>
                <CardDescription className="text-base font-semibold text-black">
                  PGA-certified instruction from Play Better Golf Academy
                </CardDescription>
              </CardHeader>
              <CardContent className="text-left space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p>40+ years of PGA teaching experience</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p>18-time Illinois PGA Teacher of the Year nominee</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p>2006 Illinois PGA Teacher of the Year</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p>Former Golf Digest Top 10 Teacher in Illinois</p>
                </div>
              </CardContent>
            </Card>

            {/* Technology + Safety */}
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-black" />
                </div>
                <CardTitle className="text-2xl">TECHNOLOGY + SAFETY</CardTitle>
                <CardDescription className="text-base font-semibold text-black">
                  Data-driven training in a premium indoor facility
                </CardDescription>
              </CardHeader>
              <CardContent className="text-left space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p>Real-time swing feedback and performance tracking</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p>Data-driven instruction for faster improvement</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p>Climate-controlled, weather-proof setting</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p>Safe, comfortable environment for juniors</p>
                </div>
              </CardContent>
            </Card>

            {/* Real On-Course Experience */}
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-black" />
                </div>
                <CardTitle className="text-2xl">REAL ON-COURSE EXPERIENCE</CardTitle>
                <CardDescription className="text-base font-semibold text-black">
                  Weekly field days translate practice into performance
                </CardDescription>
              </CardHeader>
              <CardContent className="text-left space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p>Apply training to real golf situations every Friday</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p>Build course management and competitive skills</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p>Included for both Half-Day and Full-Day campers</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p>On-course play at Twin Lakes Golf Course</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Age Groups */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container max-w-4xl">
          <h2 className="text-4xl font-black text-center mb-4">AGE GROUPS</h2>
          <p className="text-center text-lg text-gray-600 mb-12">skill-based</p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold mb-2">Tots: Ages 4–6</h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold mb-2">Bogeys: Ages 7–10</h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold mb-2">Par Shooters: Ages 11–15</h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold mb-2">Junior Accelerated and High School Prep: Ages 12–17</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Limited Time Offers */}
      <section className="py-12 px-4 bg-yellow-400">
        <div className="container max-w-4xl">
          <h3 className="text-3xl font-black text-center mb-6">LIMITED TIME OFFERS</h3>
          <div className="space-y-3 text-center text-lg">
            <p>
              <strong>Early Bird:</strong> $50 OFF Full-Day Camp — use code{" "}
              <Badge className="bg-black text-yellow-400 font-mono text-base">EARLYBIRD50</Badge>{" "}
              (through March 31)
            </p>
            <p>
              <strong>Sibling Discount:</strong> $100 OFF Full-Day Camp for families enrolling 2+ children — use code{" "}
              <Badge className="bg-black text-yellow-400 font-mono text-base">SIBLING100</Badge>
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-4">
        <div className="container">
          <h2 className="text-4xl font-black text-center mb-12">CAMP OPTIONS</h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Tots Program */}
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">TOTS PROGRAM</CardTitle>
                <CardDescription className="text-base">
                  Ages 4–6<br />
                  9AM – 10AM
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  A fun, structured introduction to golf focused on movement, confidence, and fundamentals.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Games-based learning and motor skill development</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Putting, chipping, balance, and coordination</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Designed specifically for first-time golfers</span>
                  </li>
                </ul>
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">Weekly Rate</p>
                  <p className="text-4xl font-black">$249</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={scrollToBooking}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
                >
                  REGISTER NOW
                </Button>
              </CardFooter>
            </Card>

            {/* Half-Day Camp */}
            <Card className="border-2 border-yellow-400">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">HALF-DAY CAMP</CardTitle>
                <CardDescription className="text-base">
                  Ages 7–17<br />
                  9AM – 12PM
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  PGA-led instruction covering core fundamentals and skill progression.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Putting, chipping, pitching, and swing fundamentals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Small-group, skill-based training</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Friday on-course Field Day at Twin Lakes Golf Course</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Snack and drink included</span>
                  </li>
                </ul>
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">Weekly Rate</p>
                  <p className="text-4xl font-black">$499</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={scrollToBooking}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
                >
                  REGISTER NOW
                </Button>
              </CardFooter>
            </Card>

            {/* Full-Day Camp */}
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">FULL-DAY CAMP</CardTitle>
                <CardDescription className="text-base">
                  Ages 7–17<br />
                  9AM – 3PM · Lunch Included
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  The most immersive experience combining instruction, practice, and on-course play.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Morning PGA-led instruction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Afternoon guided practice & simulator play</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Friday on-course Field Day at Twin Lakes Golf Course</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Lunch, snack, and drink included</span>
                  </li>
                </ul>
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">Weekly Rate</p>
                  <p className="text-4xl font-black">$699</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={scrollToBooking}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
                >
                  REGISTER NOW
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Camp Dates */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container max-w-4xl">
          <h2 className="text-4xl font-black text-center mb-4">CAMP DATES</h2>
          <p className="text-center text-lg mb-8">STUDENTS MAY BOOK ANY LISTED WEEK</p>
          <p className="text-center text-gray-600 mb-12">
            Curriculum repeats weekly with increasing difficulty based on age and experience.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">June</h3>
              <ul className="space-y-2">
                <li>• June 8–12 — All Age Groups</li>
                <li>• June 15–19 — All Age Groups</li>
                <li>• June 22–26 — All Age Groups</li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4">July</h3>
              <ul className="space-y-2">
                <li>• July 6–10 — All Age Groups</li>
                <li>• July 13–17 — All Age Groups</li>
                <li>• July 20–24 — All Age Groups</li>
                <li>• July 27–31 — All Age Groups</li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4">August</h3>
              <ul className="space-y-2">
                <li>• August 3–7 — Junior Accelerated / High School Prep</li>
                <li className="text-sm text-gray-600">(High School Tryout Preparation Focus)</li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button 
              onClick={scrollToBooking}
              size="lg"
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-lg px-12 py-6"
            >
              CHECK AVAILABILITY & BOOK
            </Button>
          </div>
        </div>
      </section>

      {/* Coaching Team */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl">
          <h2 className="text-4xl font-black text-center mb-4">
            LED BY THE PLAY BETTER GOLF ACADEMY
          </h2>
          <h3 className="text-2xl font-bold text-center mb-8">COACHING TEAM</h3>

          <p className="text-center text-gray-700 max-w-4xl mx-auto mb-12">
            Instruction for PBGA Junior Summer Camp is delivered by the Play Better Golf Academy (PBGA) coaching team — 
            a group of PGA and PBGA-certified professionals with decades of combined experience in junior development, 
            instruction, and competitive golf.
          </p>

          <p className="text-center text-gray-600 max-w-4xl mx-auto mb-16">
            Coach assignments may vary by week, but all instruction follows PBGA's standardized curriculum and 
            Green-to-Tee methodology, ensuring consistency and quality across every camp.
          </p>

          {/* Coach Photos - Using uploaded image */}
          <div className="mb-12">
            <img 
              src="/landing-pages/summer-camp/coaches.png" 
              alt="PBGA Coaching Team" 
              className="w-full max-w-5xl mx-auto rounded-lg shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="booking" className="py-20 px-4 bg-yellow-400">
        <div className="container max-w-4xl text-center">
          <h2 className="text-4xl font-black mb-6">
            BOOK EARLY TO SECURE YOUR PREFERRED WEEK
          </h2>
          <p className="text-xl mb-4">
            Book early and save on Full-Day Camp.
          </p>
          <p className="text-lg mb-8">
            Early Bird and sibling discounts available.<br />
            Use <Badge className="bg-black text-yellow-400 font-mono">EARLYBIRD50</Badge> or{" "}
            <Badge className="bg-black text-yellow-400 font-mono">SIBLING100</Badge> at checkout.
          </p>

          <Button 
            size="lg"
            className="bg-black hover:bg-gray-900 text-yellow-400 font-bold text-xl px-16 py-8 rounded-full"
            onClick={() => window.open("https://acuityscheduling.com/schedule.php?owner=33868387", "_blank")}
          >
            BOOK SUMMER CAMP
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-white text-center">
        <p className="text-sm">Copyright © Golf VX Corp</p>
        <p className="text-sm mt-2">{VENUE_CONFIG.address}</p>
        <p className="text-sm mt-2">{VENUE_CONFIG.phone}</p>
      </footer>
    </div>
  );
}
