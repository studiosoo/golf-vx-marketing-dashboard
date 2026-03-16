import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";

export default function AnniversaryGiveawayApplication() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    // Basic Information
    fullName: "",
    email: "",
    ageRange: "",
    gender: "",
    city: "",
    illinoisResident: false,
    
    // Golf Journey
    golfExperience: "",
    visitedBefore: "",
    howHeardAbout: "",
    firstVisit: "",
    visitFrequency: "",
    experienceHighlight: "",
    simulatorFamiliarity: "",
    interests: [] as string[],
    visitPurpose: [] as string[],
    
    // Community & Connection
    passionStory: "",
    communityGrowth: "",
    connectionMethods: [] as string[],
    socialHandle: "",
    communityGroups: "",
    
    // Final Details
    phone: "",
    bestTimeToCall: "",
    hearAboutOffer: [] as string[],
    hearAboutOfferOther: "",
    
    // Consent
    consentToContact: false,
  });

  useEffect(() => {
    const savedData = sessionStorage.getItem('giveawayData');
    if (savedData) {
      const { firstName, email } = JSON.parse(savedData);
      setFormData(prev => ({ ...prev, fullName: firstName, email }));
    }
  }, []);

  const submitApplication = trpc.anniversaryGiveaway.submitApplication.useMutation({
    onSuccess: () => {
      sessionStorage.setItem('giveawayApplicationData', JSON.stringify(formData));
      setLocation("/anniversary-giveaway-thank-you");
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and email.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.consentToContact) {
      toast({
        title: "Consent Required",
        description: "Please agree to be contacted by Golf VX Arlington Heights.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    submitApplication.mutate({
      email: formData.email,
      fullName: formData.fullName,
      ageRange: formData.ageRange,
      gender: formData.gender,
      city: formData.city,
      isIllinoisResident: formData.illinoisResident,
      golfExperience: formData.golfExperience,
      hasVisitedBefore: formData.visitedBefore,
      firstVisitMethod: formData.howHeardAbout,
      firstVisitTime: formData.firstVisit,
      visitFrequency: formData.visitFrequency,
      whatStoodOut: formData.experienceHighlight,
      simulatorFamiliarity: formData.simulatorFamiliarity,
      interests: formData.interests,
      visitPurpose: formData.visitPurpose,
      passionStory: formData.passionStory,
      communityGrowth: formData.communityGrowth,
      stayConnected: formData.connectionMethods,
      socialMediaHandle: formData.socialHandle,
      communityGroups: formData.communityGroups,
      phoneNumber: formData.phone,
      bestTimeToCall: formData.bestTimeToCall,
      hearAbout: formData.hearAboutOffer,
      hearAboutOther: formData.hearAboutOfferOther,
      consentToContact: formData.consentToContact,
    });
  };

  const toggleArrayValue = (field: keyof typeof formData, value: string) => {
    setFormData(prev => {
      const currentArray = prev[field] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value];
      return { ...prev, [field]: newArray };
    });
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
            <div className="text-xs text-[#6F6F6B] tracking-widest">ARLINGTON HEIGHTS</div>
          </div>
        </div>
      </header>

      {/* Hero Text */}
      <div className="container max-w-4xl py-12 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          ALMOST THERE!<br />
          TELL US YOUR STORY
        </h1>
        <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-4">
          We're looking for passionate golfers who want to build a thriving community at Golf VX - people who love the game and bring friends, family, and new players along for the ride.
        </p>
        <p className="text-gray-700 mb-4">
          <strong>You don't have to be a pro-level player to win.</strong> Whether you're a beginner or a regular, what matters most is your passion for the game and your social spirit. Your answers help us find the perfect ambassadors for our anniversary prizes.
        </p>
        <div className="border-t border-gray-300 w-64 mx-auto my-6"></div>
        <p className="text-gray-700 mb-2">
          Fill out the form below. Winners will be announced on social and contacted by phone on <strong>March 5th</strong>.
        </p>
        <p className="text-sm text-gray-500">⏱️ Takes about 4-5 minutes</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="pb-16">
        <div className="container max-w-4xl">
          {/* BASIC INFORMATION SECTION */}
          <div className="bg-[#FFD000] p-10 md:p-14 rounded-lg mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-10">
              <span className="mr-3">≫</span> BASIC INFORMATION
            </h2>

            <div className="space-y-6">
              {/* Question 1 */}
              <div className="bg-white p-6 rounded-lg">
                <Label className="text-sm font-bold text-black mb-2 block">
                  1. What is your full name?
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Full Name"
                  required
                  className="w-full h-12 bg-gray-100 border border-gray-300 rounded-md"
                />
              </div>

              {/* Question 2 */}
              <div className="bg-white p-6 rounded-lg">
                <Label className="text-sm font-bold text-black mb-2 block">
                  2. What is your email address?
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email"
                  required
                  className="w-full h-12 bg-gray-100 border border-gray-300 rounded-md"
                />
              </div>

              {/* Question 3 */}
              <div className="bg-white p-6 rounded-lg">
                <Label className="text-sm font-bold text-black mb-2 block">
                  3. What is your age range?
                </Label>
                <Select
                  value={formData.ageRange}
                  onValueChange={(value) => setFormData({ ...formData, ageRange: value })}
                  required
                >
                  <SelectTrigger className="w-full h-12 bg-gray-100">
                    <SelectValue placeholder="Please select an option below" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-25">Under 25</SelectItem>
                    <SelectItem value="25-34">25-34</SelectItem>
                    <SelectItem value="35-44">35-44</SelectItem>
                    <SelectItem value="45-54">45-54</SelectItem>
                    <SelectItem value="55+">55+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Question 4 */}
              <div className="bg-white p-6 rounded-lg">
                <Label className="text-sm font-bold text-black mb-2 block">
                  4. Gender
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  required
                >
                  <SelectTrigger className="w-full h-12 bg-gray-100">
                    <SelectValue placeholder="Please select an option below" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Question 5 */}
              <div className="bg-white p-6 rounded-lg">
                <Label className="text-sm font-bold text-black mb-2 block">
                  5. Which city do you currently live in?
                </Label>
                <Input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                  required
                  className="w-full h-12 bg-gray-100 border border-gray-300 rounded-md mb-4"
                />
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="illinoisResident"
                    checked={formData.illinoisResident}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, illinoisResident: checked as boolean })
                    }
                    required
                  />
                  <Label htmlFor="illinoisResident" className="text-sm leading-tight">
                    I confirm I am an Illinois resident aged 18 or older.
                    <br />
                    <span className="text-xs text-gray-700">(Required - Legal compliance for giveaway eligibility)</span>
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* YOUR GOLF JOURNEY SECTION */}
          <div className="bg-[#FFD000] p-10 md:p-14 rounded-lg mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-10">
              <span className="mr-3">≫</span> YOUR GOLF JOURNEY
            </h2>

            <div className="space-y-6">
              {/* Question 6 */}
              <div className="bg-white p-6 rounded-lg">
                <Label className="text-sm font-bold text-black mb-2 block">
                  6. How would you describe your golf experience?
                </Label>
                <Select
                  value={formData.golfExperience}
                  onValueChange={(value) => setFormData({ ...formData, golfExperience: value })}
                  required
                >
                  <SelectTrigger className="w-full h-12 bg-gray-100">
                    <SelectValue placeholder="New / Just starting my golf journey" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New / Just starting my golf journey</SelectItem>
                    <SelectItem value="beginner">Beginner (less than 1 year)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                    <SelectItem value="advanced">Advanced (3+ years)</SelectItem>
                    <SelectItem value="experienced">Experienced (5+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Question 7 */}
              <div className="bg-white p-6 rounded-lg">
                <Label className="text-sm font-bold text-black mb-2 block">
                  7. Have you visited Golf VX Arlington Heights before?
                </Label>
                <Select
                  value={formData.visitedBefore}
                  onValueChange={(value) => setFormData({ ...formData, visitedBefore: value })}
                  required
                >
                  <SelectTrigger className="w-full h-12 bg-gray-100">
                    <SelectValue placeholder="No" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>

                {/* Conditional Questions 7a-7d */}
                {formData.visitedBefore === "yes" && (
                  <div className="mt-6 pl-4 border-l-2 border-gray-300 space-y-6">
                    <p className="text-sm text-gray-700 italic mb-4">
                      If you selected <strong>Yes</strong> above, answer the next questions (7a-7d). If <strong>No</strong>, skip to Question 8.
                    </p>

                    {/* Question 7a */}
                    <div>
                      <Label className="text-sm font-bold text-black mb-2 block">
                        7a. How did you first hear about Golf VX Arlington Heights?
                        <br />
                        <span className="text-xs font-normal">(Select one)</span>
                      </Label>
                      <Select
                        value={formData.howHeardAbout}
                        onValueChange={(value) => setFormData({ ...formData, howHeardAbout: value })}
                      >
                        <SelectTrigger className="w-full h-12 bg-gray-100">
                          <SelectValue placeholder="Social media (Instagram, Facebook, TikTok)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="social-media">Social media (Instagram, Facebook, TikTok)</SelectItem>
                          <SelectItem value="word-of-mouth">Word of mouth</SelectItem>
                          <SelectItem value="drove-by">Drove by</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Question 7b */}
                    <div>
                      <Label className="text-sm font-bold text-black mb-2 block">
                        7b. When was your first visit to Golf VX Arlington Heights?
                        <br />
                        <span className="text-xs font-normal">(Select one)</span>
                      </Label>
                      <Select
                        value={formData.firstVisit}
                        onValueChange={(value) => setFormData({ ...formData, firstVisit: value })}
                      >
                        <SelectTrigger className="w-full h-12 bg-gray-100">
                          <SelectValue placeholder="6-12 months ago" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6-12-months">6-12 months ago</SelectItem>
                          <SelectItem value="3-6-months">3-6 months ago</SelectItem>
                          <SelectItem value="1-3-months">1-3 months ago</SelectItem>
                          <SelectItem value="within-month">Within the last month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Question 7c */}
                    <div>
                      <Label className="text-sm font-bold text-black mb-2 block">
                        7c. How often do you visit indoor golf facilities (Golf VX or other simulators)?
                        <br />
                        <span className="text-xs font-normal">(Select one)</span>
                      </Label>
                      <Select
                        value={formData.visitFrequency}
                        onValueChange={(value) => setFormData({ ...formData, visitFrequency: value })}
                      >
                        <SelectTrigger className="w-full h-12 bg-gray-100">
                          <SelectValue placeholder="Monthly (1-2 times per month)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly (1-2 times per month)</SelectItem>
                          <SelectItem value="weekly">Weekly (3-4 times per month)</SelectItem>
                          <SelectItem value="multiple-weekly">Multiple times per week</SelectItem>
                          <SelectItem value="rarely">Rarely</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Question 7d */}
                    <div>
                      <Label className="text-sm font-bold text-black mb-2 block">
                        7d. What stood out most about your experience at Golf VX?
                      </Label>
                      <Textarea
                        value={formData.experienceHighlight}
                        onChange={(e) => setFormData({ ...formData, experienceHighlight: e.target.value })}
                        placeholder="?"
                        className="w-full min-h-32 bg-gray-100 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Question 8 */}
              <div className="bg-white p-6 rounded-lg">
                <Label className="text-sm font-bold text-black mb-2 block">
                  8. How familiar are you with indoor golf simulators?
                </Label>
                <Select
                  value={formData.simulatorFamiliarity}
                  onValueChange={(value) => setFormData({ ...formData, simulatorFamiliarity: value })}
                  required
                >
                  <SelectTrigger className="w-full h-12 bg-gray-100">
                    <SelectValue placeholder="Play regularly at other facilities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never tried one</SelectItem>
                    <SelectItem value="tried-once">Tried once or twice</SelectItem>
                    <SelectItem value="play-regularly">Play regularly at other facilities</SelectItem>
                    <SelectItem value="enthusiast">Very familiar - I'm a simulator enthusiast</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Question 9 */}
              <div className="bg-white p-6 rounded-lg">
                <Label className="text-sm font-bold text-black mb-2 block">
                  9. What are you most interested in at Golf VX?
                  <br />
                  <span className="text-xs font-normal">(Select up to 2)</span>
                </Label>
                <div className="space-y-2">
                  {[
                    { value: "simulators", label: "Accurate, high-quality simulators" },
                    { value: "membership", label: "Membership options and perks" },
                    { value: "environment", label: "Environment and atmosphere" },
                    { value: "coaching", label: "Coaching and instruction" },
                    { value: "social", label: "Social / community experience" },
                  ].map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`interest-${option.value}`}
                        checked={formData.interests.includes(option.value)}
                        onCheckedChange={() => {
                          if (formData.interests.includes(option.value)) {
                            setFormData({
                              ...formData,
                              interests: formData.interests.filter(v => v !== option.value)
                            });
                          } else if (formData.interests.length < 2) {
                            setFormData({
                              ...formData,
                              interests: [...formData.interests, option.value]
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`interest-${option.value}`} className="text-sm">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question 10 */}
              <div className="bg-white p-6 rounded-lg">
                <Label className="text-sm font-bold text-black mb-2 block">
                  10. What would be your main purpose for visiting Golf VX?
                </Label>
                <div className="space-y-2">
                  {[
                    { value: "practice", label: "Practice and improvement" },
                    { value: "tournaments", label: "Tournaments or leagues" },
                    { value: "social", label: "Spending time with friends or family" },
                    { value: "all", label: "A mix of all of the above" },
                  ].map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`purpose-${option.value}`}
                        checked={formData.visitPurpose.includes(option.value)}
                        onCheckedChange={() => toggleArrayValue('visitPurpose', option.value)}
                      />
                      <Label htmlFor={`purpose-${option.value}`} className="text-sm">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* COMMUNITY & CONNECTION SECTION */}
          <div className="bg-[#FFD000] p-10 md:p-14 rounded-lg mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-10">
              <span className="mr-3">≫</span> COMMUNITY & CONNECTION
            </h2>

            <div className="space-y-6">
              {/* Question 11 */}
              <div className="bg-white p-6 rounded-lg">
                <Label className="text-sm font-bold text-black mb-2 block">
                  11. We believe passion beats professional skill every time!
                  <br />
                  Tell us about your love for the game - whether you're just starting out or a seasoned player, and why you're excited to join the Golf VX community!
                </Label>
                <Textarea
                  value={formData.passionStory}
                  onChange={(e) => setFormData({ ...formData, passionStory: e.target.value })}
                  placeholder="(300-500 words recommended)&#10;&#10;ok"
                  required
                  className="w-full min-h-40 bg-gray-100 border border-gray-300 rounded-md"
                />
              </div>

              {/* Question 12 */}
              <div className="bg-white p-6 rounded-lg">
                <Label className="text-sm font-bold text-black mb-2 block">
                  12. In what ways do you see yourself helping grow our local golf community?
                  <br />
                  (E.g., bringing friends, organizing group outings, sharing your indoor golf journey with others.)
                </Label>
                <Textarea
                  value={formData.communityGrowth}
                  onChange={(e) => setFormData({ ...formData, communityGrowth: e.target.value })}
                  placeholder="(300-500 words recommended)&#10;&#10;Give"
                  required
                  className="w-full min-h-40 bg-gray-100 border border-gray-300 rounded-md"
                />
              </div>

              {/* Question 13 */}
              <div className="bg-white p-6 rounded-lg">
                <Label className="text-sm font-bold text-black mb-2 block">
                  13. How do you usually stay connected or share experiences?
                  <br />
                  <span className="text-xs font-normal">(Select all that apply)</span>
                </Label>
                <div className="space-y-2">
                  {[
                    { value: "social-media", label: "I'm active on social media (Instagram, Facebook, TikTok)" },
                    { value: "word-of-mouth", label: "I prefer word-of-mouth and sharing with friends/family directly" },
                    { value: "community-groups", label: "I'm involved in local community or professional groups" },
                  ].map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`connection-${option.value}`}
                        checked={formData.connectionMethods.includes(option.value)}
                        onCheckedChange={() => toggleArrayValue('connectionMethods', option.value)}
                      />
                      <Label htmlFor={`connection-${option.value}`} className="text-sm">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question 14 */}
              <div className="bg-white p-6 rounded-lg">
                <Label className="text-sm font-bold text-black mb-2 block">
                  14. If you use social media, please share your primary handle:
                </Label>
                <Input
                  type="text"
                  value={formData.socialHandle}
                  onChange={(e) => setFormData({ ...formData, socialHandle: e.target.value })}
                  placeholder="Optional: Instagram/Facebook/TikTok&#10;&#10;test"
                  className="w-full h-12 bg-gray-100 border border-gray-300 rounded-md"
                />
              </div>

              {/* Question 15 */}
              <div className="bg-white p-6 rounded-lg">
                <Label className="text-sm font-bold text-black mb-2 block">
                  15. If you're involved in local communities, which groups do you engage with?
                </Label>
                <Input
                  type="text"
                  value={formData.communityGroups}
                  onChange={(e) => setFormData({ ...formData, communityGroups: e.target.value })}
                  placeholder="Optional: E.g., local clubs, neighborhood groups, hobby circles, or professional networks&#10;&#10;test"
                  className="w-full h-12 bg-gray-100 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* FINAL DETAILS & CONTACT SECTION */}
          <div className="bg-[#FFD000] p-10 md:p-14 rounded-lg mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-10">
              <span className="mr-3">≫</span> FINAL DETAILS & CONTACT
            </h2>

            <div className="space-y-6">
              {/* Question 16 */}
              <div className="bg-white p-6 rounded-lg">
                <Label className="text-sm font-bold text-black mb-2 block">
                  16. If you are selected as a finalist, we will reach out via phone to discuss the next steps.
                  <br />
                  Please provide the best phone number to reach you:
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone&#10;(312) 576-6517"
                  required
                  className="w-full h-12 bg-gray-100 border border-gray-300 rounded-md"
                />
              </div>

              {/* Question 17 */}
              <div className="bg-white p-6 rounded-lg">
                <Label className="text-sm font-bold text-black mb-2 block">
                  17. What is the best time to call you?
                  <br />
                  Note: Our team makes calls during business hours, Monday-Friday, 9:00 AM - 6:00 PM.
                </Label>
                <Textarea
                  value={formData.bestTimeToCall}
                  onChange={(e) => setFormData({ ...formData, bestTimeToCall: e.target.value })}
                  placeholder="(E.g., &quot;Weekdays after 4 PM&quot; or &quot;Lunch hours&quot;)&#10;&#10;4pm"
                  required
                  className="w-full min-h-24 bg-gray-100 border border-gray-300 rounded-md"
                />
              </div>

              {/* Question 18 */}
              <div className="bg-white p-6 rounded-lg">
                <Label className="text-sm font-bold text-black mb-2 block">
                  18. How did you hear about this offer?
                </Label>
                <div className="space-y-2">
                  {[
                    { value: "instagram", label: "Instagram" },
                    { value: "facebook", label: "Facebook" },
                    { value: "email", label: "Email" },
                    { value: "in-venue", label: "In-venue signage" },
                    { value: "friend", label: "Friend or referral" },
                    { value: "academy", label: "Play Better Golf Academy" },
                    { value: "other", label: "Other" },
                  ].map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`hear-${option.value}`}
                        checked={formData.hearAboutOffer.includes(option.value)}
                        onCheckedChange={() => toggleArrayValue('hearAboutOffer', option.value)}
                      />
                      <Label htmlFor={`hear-${option.value}`} className="text-sm">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {formData.hearAboutOffer.includes('other') && (
                  <Input
                    type="text"
                    value={formData.hearAboutOfferOther}
                    onChange={(e) => setFormData({ ...formData, hearAboutOfferOther: e.target.value })}
                    placeholder="(Please specify)"
                    className="w-full h-12 bg-gray-100 border border-gray-300 rounded-md mt-2"
                  />
                )}
              </div>
            </div>
          </div>

          {/* CONSENT & PRIVACY SECTION */}
          <div className="bg-[#FFD000] p-10 md:p-14 rounded-lg mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-10">
              <span className="mr-3">≫</span> CONSENT & PRIVACY
            </h2>

            <div className="bg-white p-6 rounded-lg">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="consentToContact"
                  checked={formData.consentToContact}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, consentToContact: checked as boolean })
                  }
                  required
                />
                <Label htmlFor="consentToContact" className="text-sm leading-tight">
                  <strong>I agree to be contacted by Golf VX Arlington Heights regarding:</strong>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>This giveaway application</li>
                    <li>Follow-up questions if I'm selected as a finalist</li>
                    <li>Occasional updates about Golf VX events and offers</li>
                  </ul>
                  <p className="mt-3 text-xs text-gray-700">
                    You can unsubscribe anytime. We respect your privacy and will never share your information with third parties.
                  </p>
                </Label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <Button
              type="submit"
              className="w-full max-w-md h-16 bg-[#3D3D3D] hover:bg-black text-white text-xl font-bold rounded-full shadow-lg"
            >
              SUBMIT APPLICATION
            </Button>
          </div>
        </div>
      </form>

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
          <p className="text-[#6F6F6B] text-sm mb-1">644 E Rand Rd • Arlington Heights, IL 60004</p>
          <p className="text-[#6F6F6B] text-sm mb-1">arlingtonheights@playgolfvx.com</p>
          <p className="text-[#6F6F6B] text-sm">(847) 749-1054</p>
          <p className="text-gray-500 text-xs mt-4">
            Open exclusively to Illinois residents. All prizes redeemable only at Golf VX Arlington Heights.
          </p>
        </div>
      </footer>
    </div>
  );
}
