import React, { useState } from 'react';
import { PlusCircle, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Assume trpc client is configured and available
// import { trpc } from '@/utils/trpc'; // Adjust path as necessary

// Mock trpc for demonstration purposes
const trpc = {
  campaigns: {
    getAll: {
      useQuery: () => {
        const [data, setData] = useState<any | null>(null);
        const [isLoading, setIsLoading] = useState(true);
        const [isError, setIsError] = useState(false);

        React.useEffect(() => {
          setTimeout(() => {
            const mockCampaigns = [
              {
                id: '1',
                name: 'Summer Sale 2024',
                status: 'active',
                category: 'Promotional',
                budget: 10000,
                actualSpend: 7500,
                roas: 3.5,
              },
              {
                id: '2',
                name: 'New Product Launch',
                status: 'paused',
                category: 'Product Launch',
                budget: 5000,
                actualSpend: 2000,
                roas: 2.1,
              },
              {
                id: '3',
                name: 'Holiday Campaign',
                status: 'completed',
                category: 'Seasonal',
                budget: 15000,
                actualSpend: 15000,
                roas: 4.2,
              },
              {
                id: '4',
                name: 'Brand Awareness Q1',
                status: 'active',
                category: 'Branding',
                budget: 8000,
                actualSpend: 6000,
                roas: 1.8,
              },
              {
                id: '5',
                name: 'Spring Collection',
                status: 'paused',
                category: 'Promotional',
                budget: 7000,
                actualSpend: 3500,
                roas: 2.5,
              },
            ];
            setData(mockCampaigns);
            setIsLoading(false);
          }, 1500);
        }, []);

        return { data, isLoading, isError };
      },
    },
  },
};

type CampaignStatus = 'active' | 'paused' | 'completed';

interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  category: string;
  budget: number;
  actualSpend: number;
  roas: number;
}

const Campaigns: React.FC = () => {
  const { data: campaigns, isLoading, isError } = trpc.campaigns.getAll.useQuery();
  const [activeTab, setActiveTab] = useState<CampaignStatus | 'all'>('all');

  const filteredCampaigns = campaigns?.filter((campaign: Campaign) => {
    if (activeTab === 'all') return true;
    return campaign.status === activeTab;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-gray-500">Loading campaigns...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-red-500">Error loading campaigns. Please try again later.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Campaigns</h2>
          <div className="flex items-center space-x-2">
            <Button className="bg-yellow-400 text-black hover:bg-yellow-500">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </div>
        </div>
        <Separator />
        <Tabs defaultValue="all" className="space-y-4" onValueChange={(value) => setActiveTab(value as CampaignStatus | 'all')}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="paused">Paused</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <div className="relative ml-auto flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search campaigns..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
              />
            </div>
          </div>
          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCampaigns && filteredCampaigns.length > 0 ? (
                filteredCampaigns.map((campaign: Campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))
              ) : (
                <p className="text-muted-foreground">No campaigns found.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="active" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCampaigns && filteredCampaigns.length > 0 ? (
                filteredCampaigns.map((campaign: Campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))
              ) : (
                <p className="text-muted-foreground">No active campaigns found.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="paused" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCampaigns && filteredCampaigns.length > 0 ? (
                filteredCampaigns.map((campaign: Campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))
              ) : (
                <p className="text-muted-foreground">No paused campaigns found.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="completed" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCampaigns && filteredCampaigns.length > 0 ? (
                filteredCampaigns.map((campaign: Campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))
              ) : (
                <p className="text-muted-foreground">No completed campaigns found.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
};

interface CampaignCardProps {
  campaign: Campaign;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign }) => {
  const spendPercentage = (campaign.actualSpend / campaign.budget) * 100;

  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{campaign.name}</CardTitle>
        <Badge className={`${getStatusColor(campaign.status)} text-white capitalize`}>
          {campaign.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">Category: {campaign.category}</p>
        <div className="text-sm">
          <p>Budget: ${campaign.budget.toLocaleString()}</p>
          <p>Actual Spend: ${campaign.actualSpend.toLocaleString()}</p>
          <Progress value={spendPercentage} className="w-[100%] h-2 mt-1" />
        </div>
        <p className="text-2xl font-bold text-yellow-400">ROAS: {campaign.roas.toFixed(2)}</p>
      </CardContent>
    </Card>
  );
};

export default Campaigns;
