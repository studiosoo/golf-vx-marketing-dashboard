import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Newspaper, Plus, Search } from "lucide-react";

export default function NewsManager() {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", content: "", category: "" });

  const { data: campaigns, isLoading } = trpc.campaigns.list.useQuery();
  const filtered = (campaigns as any[])?.filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">News Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage content and announcements</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-yellow-400 text-black hover:bg-yellow-500">
              <Plus size={14} />
              Add News
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>New News Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input placeholder="News title..." value={newItem.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({ ...newItem, title: e.target.value })}
                  className="mt-1" />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea placeholder="News content..." value={newItem.content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewItem({ ...newItem, content: e.target.value })}
                  className="mt-1 min-h-[100px]" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button className="bg-yellow-400 text-black hover:bg-yellow-500" onClick={() => setIsOpen(false)}>Publish</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search..." value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="pl-8" />
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-card rounded-xl animate-pulse border border-border" />
        ))}</div>
      ) : filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((item: any) => (
            <Card key={item.id} className="bg-card border-border">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground text-sm">{item.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs capitalize">{item.type?.replace(/_/g, " ")}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {item.startDate ? new Date(item.startDate).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </div>
                <Badge variant={item.status === "active" ? "default" : "secondary"} className="text-xs capitalize">
                  {item.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Newspaper size={40} className="mx-auto mb-3 opacity-30" />
          <p>No news items found</p>
        </div>
      )}
    </div>
  );
}
