import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function InstagramSync() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    followersCount: '',
    followingCount: '',
    mediaCount: '',
    impressions: '',
    reach: '',
    profileViews: '',
    websiteClicks: '',
    engagementRate: '',
  });

  const syncMutation = trpc.instagram.syncInsights.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Instagram insights synced successfully!',
      });
      // Reset form
      setFormData({
        ...formData,
        date: new Date().toISOString().split('T')[0],
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    syncMutation.mutate({
      date: formData.date,
      followersCount: parseInt(formData.followersCount),
      followingCount: formData.followingCount ? parseInt(formData.followingCount) : undefined,
      mediaCount: formData.mediaCount ? parseInt(formData.mediaCount) : undefined,
      impressions: formData.impressions ? parseInt(formData.impressions) : undefined,
      reach: formData.reach ? parseInt(formData.reach) : undefined,
      profileViews: formData.profileViews ? parseInt(formData.profileViews) : undefined,
      websiteClicks: formData.websiteClicks ? parseInt(formData.websiteClicks) : undefined,
      engagementRate: formData.engagementRate ? parseFloat(formData.engagementRate) : undefined,
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Instagram Data Sync</h1>
        <p className="text-muted-foreground">
          Manually sync Instagram Business Insights data to track performance over time
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Sync Instagram Insights</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="followersCount">Followers Count *</Label>
              <Input
                id="followersCount"
                type="number"
                value={formData.followersCount}
                onChange={(e) => setFormData({ ...formData, followersCount: e.target.value })}
                required
                placeholder="e.g., 1250"
              />
            </div>

            <div>
              <Label htmlFor="followingCount">Following Count</Label>
              <Input
                id="followingCount"
                type="number"
                value={formData.followingCount}
                onChange={(e) => setFormData({ ...formData, followingCount: e.target.value })}
                placeholder="e.g., 450"
              />
            </div>

            <div>
              <Label htmlFor="mediaCount">Media Count (Total Posts)</Label>
              <Input
                id="mediaCount"
                type="number"
                value={formData.mediaCount}
                onChange={(e) => setFormData({ ...formData, mediaCount: e.target.value })}
                placeholder="e.g., 320"
              />
            </div>

            <div>
              <Label htmlFor="impressions">Impressions (Last 7 Days)</Label>
              <Input
                id="impressions"
                type="number"
                value={formData.impressions}
                onChange={(e) => setFormData({ ...formData, impressions: e.target.value })}
                placeholder="e.g., 5420"
              />
            </div>

            <div>
              <Label htmlFor="reach">Reach (Last 7 Days)</Label>
              <Input
                id="reach"
                type="number"
                value={formData.reach}
                onChange={(e) => setFormData({ ...formData, reach: e.target.value })}
                placeholder="e.g., 3210"
              />
            </div>

            <div>
              <Label htmlFor="profileViews">Profile Views (Last 7 Days)</Label>
              <Input
                id="profileViews"
                type="number"
                value={formData.profileViews}
                onChange={(e) => setFormData({ ...formData, profileViews: e.target.value })}
                placeholder="e.g., 890"
              />
            </div>

            <div>
              <Label htmlFor="websiteClicks">Website Clicks (Last 7 Days)</Label>
              <Input
                id="websiteClicks"
                type="number"
                value={formData.websiteClicks}
                onChange={(e) => setFormData({ ...formData, websiteClicks: e.target.value })}
                placeholder="e.g., 120"
              />
            </div>

            <div>
              <Label htmlFor="engagementRate">Engagement Rate (%)</Label>
              <Input
                id="engagementRate"
                type="number"
                step="0.01"
                value={formData.engagementRate}
                onChange={(e) => setFormData({ ...formData, engagementRate: e.target.value })}
                placeholder="e.g., 4.25"
              />
            </div>

            <Button type="submit" className="w-full" disabled={syncMutation.isPending}>
              {syncMutation.isPending ? 'Syncing...' : 'Sync Data'}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">How to Get Instagram Insights</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">📱 On Instagram App:</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Go to your profile</li>
                <li>Tap the menu (☰) → Insights</li>
                <li>View "Accounts reached" for the last 7 days</li>
                <li>Note down: Reach, Impressions, Profile visits, Website taps</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">💻 On Meta Business Suite:</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Go to business.facebook.com</li>
                <li>Select your Instagram account</li>
                <li>Click "Insights" in the left sidebar</li>
                <li>View detailed metrics for the last 7/28/90 days</li>
              </ol>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">💡 Pro Tip:</h3>
              <p className="text-muted-foreground">
                Sync data weekly (every Monday) to track trends over time. The AI will analyze your
                performance and generate content recommendations based on what works best.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">🤖 Coming Soon:</h3>
              <p className="text-muted-foreground">
                Browser bookmarklet to automatically extract and sync Instagram data with one click!
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
