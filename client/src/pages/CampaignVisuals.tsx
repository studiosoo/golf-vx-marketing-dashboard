import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Upload, X, ExternalLink } from "lucide-react";
import { storagePut } from "@/lib/storage";

export default function CampaignVisuals() {

  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const { data: campaigns, isLoading } = trpc.campaigns.list.useQuery();
  const updateVisuals = trpc.campaigns.updateVisuals.useMutation({
    onSuccess: () => {
      toast.success("Campaign visuals updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFileUpload = async (
    file: File,
    type: "landingPage" | "poster" | "reel"
  ) => {
    if (!selectedCampaign) return;

    setUploading(true);
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split(".").pop();
      const filename = `campaign-${selectedCampaign}-${type}-${timestamp}.${extension}`;
      
      // Upload to S3
      const { url } = await storagePut(
        `campaigns/${filename}`,
        await file.arrayBuffer(),
        file.type
      );

      // Update campaign in database
      const updateData: any = { id: selectedCampaign };
      if (type === "landingPage") updateData.landingPageUrl = url;
      if (type === "poster") updateData.posterImageUrl = url;
      if (type === "reel") updateData.reelThumbnailUrl = url;

      await updateVisuals.mutateAsync(updateData);
      
      toast.success(`${type === "landingPage" ? "Landing page" : type === "poster" ? "Poster" : "Reel"} uploaded successfully`);
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlUpdate = async (
    url: string,
    type: "landingPage" | "poster" | "reel"
  ) => {
    if (!selectedCampaign) return;

    const updateData: any = { id: selectedCampaign };
    if (type === "landingPage") updateData.landingPageUrl = url;
    if (type === "poster") updateData.posterImageUrl = url;
    if (type === "reel") updateData.reelThumbnailUrl = url;

    await updateVisuals.mutateAsync(updateData);
  };

  const selectedCampaignData = campaigns?.find(c => c.id === selectedCampaign);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Campaign Visual Assets</h1>
        <p className="text-muted-foreground mt-2">
          Upload and manage visual assets for each campaign (landing pages, posters, reels)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Campaign</CardTitle>
          <CardDescription>Choose a campaign to manage its visual assets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {campaigns?.map((campaign) => (
              <button
                key={campaign.id}
                onClick={() => setSelectedCampaign(campaign.id)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  selectedCampaign === campaign.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-semibold">{campaign.name}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {campaign.category.replace("_", " ")}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedCampaignData && (
        <div className="grid gap-6 md:grid-cols-3">
          <VisualAssetCard
            title="Landing Page Screenshot"
            description="Screenshot or mockup of the campaign landing page"
            currentUrl={selectedCampaignData.landingPageUrl}
            onFileUpload={(file) => handleFileUpload(file, "landingPage")}
            onUrlUpdate={(url) => handleUrlUpdate(url, "landingPage")}
            uploading={uploading}
          />

          <VisualAssetCard
            title="Poster Image"
            description="Campaign poster or promotional image"
            currentUrl={selectedCampaignData.posterImageUrl}
            onFileUpload={(file) => handleFileUpload(file, "poster")}
            onUrlUpdate={(url) => handleUrlUpdate(url, "poster")}
            uploading={uploading}
          />

          <VisualAssetCard
            title="Reel Thumbnail"
            description="Thumbnail for campaign video or reel"
            currentUrl={selectedCampaignData.reelThumbnailUrl}
            onFileUpload={(file) => handleFileUpload(file, "reel")}
            onUrlUpdate={(url) => handleUrlUpdate(url, "reel")}
            uploading={uploading}
          />
        </div>
      )}
    </div>
  );
}

interface VisualAssetCardProps {
  title: string;
  description: string;
  currentUrl: string | null;
  onFileUpload: (file: File) => void;
  onUrlUpdate: (url: string) => void;
  uploading: boolean;
}

function VisualAssetCard({
  title,
  description,
  currentUrl,
  onFileUpload,
  onUrlUpdate,
  uploading,
}: VisualAssetCardProps) {
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onUrlUpdate(urlInput.trim());
      setUrlInput("");
      setShowUrlInput(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentUrl && (
          <div className="relative rounded-lg overflow-hidden border border-border">
            <img
              src={currentUrl}
              alt={title}
              className="w-full h-48 object-cover"
            />
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 right-2 p-2 bg-background/80 backdrop-blur-sm rounded-md hover:bg-background transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor={`file-${title}`} className="cursor-pointer">
            <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors">
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">
                {uploading ? "Uploading..." : "Upload Image"}
              </span>
            </div>
            <Input
              id={`file-${title}`}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </Label>

          {!showUrlInput ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUrlInput(true)}
              className="w-full"
            >
              Or paste URL
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
              />
              <Button onClick={handleUrlSubmit} size="sm">
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowUrlInput(false);
                  setUrlInput("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
