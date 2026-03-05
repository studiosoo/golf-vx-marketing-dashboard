import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Megaphone, Plus } from "lucide-react";

export default function Announcements() {
  const [isOpen, setIsOpen] = useState(false);
  const [newAnn, setNewAnn] = useState({ title: "", content: "" });

  const demoAnnouncements = [
    { id: 1, title: "Spring Season Kickoff", content: "Join us for the spring season opening event!", date: new Date(), recipients: "All Members", status: "sent" },
    { id: 2, title: "New Pro Shop Hours", content: "Updated hours starting next week.", date: new Date(Date.now() - 86400000 * 3), recipients: "All Members", status: "sent" },
    { id: 3, title: "Drive Day This Saturday", content: "Drive Day event this Saturday at 10am.", date: new Date(Date.now() - 86400000 * 7), recipients: "Trial Members", status: "sent" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground text-sm mt-1">Member communications and announcements</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-yellow-400 text-black hover:bg-yellow-500">
              <Plus size={14} />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input placeholder="Announcement title..." value={newAnn.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAnn({ ...newAnn, title: e.target.value })}
                  className="mt-1" />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea placeholder="Message content..." value={newAnn.content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewAnn({ ...newAnn, content: e.target.value })}
                  className="mt-1 min-h-[100px]" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button className="bg-yellow-400 text-black hover:bg-yellow-500" onClick={() => setIsOpen(false)}>Send</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-3">
        {demoAnnouncements.map((ann) => (
          <Card key={ann.id} className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-foreground">{ann.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{ann.content}</div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">{ann.date.toLocaleDateString()}</span>
                    <span className="text-xs text-muted-foreground">To: {ann.recipients}</span>
                  </div>
                </div>
                <Badge className="bg-[#3DB855]/20 text-[#3DB855] border-[#3DB855]/30 text-xs">{ann.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
