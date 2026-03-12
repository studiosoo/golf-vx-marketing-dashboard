import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save } from "lucide-react";
import { toast } from "sonner";

export default function SiteControl() {
  const [hero, setHero] = useState({ headline: "", subheadline: "", ctaText: "" });

  const handleSave = () => {
    toast.success("Content saved successfully");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#222222]">Site Control</h1>
          <p className="text-[#6F6F6B] text-sm mt-1">Manage website content and settings</p>
        </div>
        <Button size="sm" className="bg-[#F2DD48] text-black hover:bg-yellow-500" onClick={handleSave}>
          <Save size={14} />
          Save Changes
        </Button>
      </div>
      <Tabs defaultValue="hero">
        <TabsList className="bg-[#F1F1EF]">
          <TabsTrigger value="hero">Hero Content</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>
        <TabsContent value="hero" className="mt-4">
          <Card className="bg-white border-[#DEDEDA]">
            <CardHeader><CardTitle className="text-sm font-medium">Hero Section</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Headline</Label>
                <Input placeholder="Main headline text..." value={hero.headline}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHero({ ...hero, headline: e.target.value })}
                  className="mt-1" />
              </div>
              <div>
                <Label>Sub-headline</Label>
                <Input placeholder="Supporting text..." value={hero.subheadline}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHero({ ...hero, subheadline: e.target.value })}
                  className="mt-1" />
              </div>
              <div>
                <Label>CTA Button Text</Label>
                <Input placeholder="e.g. Book a Tour" value={hero.ctaText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHero({ ...hero, ctaText: e.target.value })}
                  className="mt-1" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="announcements" className="mt-4">
          <Card className="bg-white border-[#DEDEDA]">
            <CardHeader><CardTitle className="text-sm font-medium">Site Announcements</CardTitle></CardHeader>
            <CardContent>
              <Textarea placeholder="Enter announcement text to display on the website..." className="min-h-[120px]" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="promotions" className="mt-4">
          <Card className="bg-white border-[#DEDEDA]">
            <CardHeader><CardTitle className="text-sm font-medium">Active Promotions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Promotion Banner Text</Label>
                <Input placeholder="e.g. Join now and get first month free!" className="mt-1" />
              </div>
              <div>
                <Label>Promotion End Date</Label>
                <Input type="date" className="mt-1" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="seo" className="mt-4">
          <Card className="bg-white border-[#DEDEDA]">
            <CardHeader><CardTitle className="text-sm font-medium">SEO Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Page Title</Label>
                <Input placeholder="Golf VX Arlington Heights | Indoor Golf" className="mt-1" />
              </div>
              <div>
                <Label>Meta Description</Label>
                <Textarea placeholder="Brief description for search engines..." className="mt-1 min-h-[80px]" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
