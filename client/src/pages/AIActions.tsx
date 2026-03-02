import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle, AlertCircle, Play } from 'lucide-react';

// Assume trpc is configured and available globally or via context
// For this example, we'll mock the trpc hooks

// Mock tRPC hooks for demonstration purposes
const trpc = {
  autonomous: {
    getActions: {
      useQuery: () => ({
        data: [
          {
            id: '1',
            title: 'Optimize Ad Spend',
            description: 'Adjusted budget allocation for underperforming campaigns.',
            status: 'auto-executed',
            impact: 'High',
            timestamp: '2024-02-28T10:00:00Z',
          },
          {
            id: '2',
            title: 'A/B Test Landing Page',
            description: 'Proposed A/B test for landing page conversion rate.',
            status: 'awaiting-approval',
            impact: 'Medium',
            timestamp: '2024-02-28T09:30:00Z',
          },
          {
            id: '3',
            title: 'Monitor Competitor Pricing',
            description: 'Tracking competitor pricing changes for key products.',
            status: 'monitoring',
            impact: 'Low',
            timestamp: '2024-02-28T08:00:00Z',
          },
          {
            id: '4',
            title: 'Update SEO Keywords',
            description: 'Identified new high-volume keywords for SEO optimization.',
            status: 'awaiting-approval',
            impact: 'High',
            timestamp: '2024-02-27T16:00:00Z',
          },
        ] as any[],
        isLoading: false,
        isError: false,
        error: null,
      }),
    },
    approveAction: {
      useMutation: () => ({
        mutate: (id: string) => console.log(`Approving action: ${id}`),
        isLoading: false,
        isError: false,
        isSuccess: false,
      }),
    },
    runAnalysis: {
      useMutation: () => ({
        mutate: () => console.log('Running analysis...'),
        isLoading: false,
        isError: false,
        isSuccess: false,
      }),
    },
  },
};

interface ActionCardProps {
  action: any;
  onApprove?: (id: string) => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ action, onApprove }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'auto-executed':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Auto-Executed</Badge>;
      case 'awaiting-approval':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Awaiting Approval</Badge>;
      case 'monitoring':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Monitoring</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High':
        return 'text-red-500';
      case 'Medium':
        return 'text-orange-500';
      case 'Low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium text-yellow-400">{action.title}</CardTitle>
        {getStatusBadge(action.status)}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-400 mb-2">{action.description}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{new Date(action.timestamp).toLocaleString()}</span>
          </div>
          <div className="flex items-center">
            <span className="mr-1">Impact:</span>
            <span className={`font-semibold ${getImpactColor(action.impact)}`}>{action.impact}</span>
          </div>
        </div>
        {action.status === 'awaiting-approval' && onApprove && (
          <Button
            className="mt-4 w-full bg-yellow-400 hover:bg-yellow-500 text-black"
            onClick={() => onApprove(action.id)}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const AIActions: React.FC = () => {
  const { data: actions, isLoading, isError } = trpc.autonomous.getActions.useQuery();
  const { mutate: approveAction, isLoading: isApproving } = trpc.autonomous.approveAction.useMutation();
  const { mutate: runAnalysis, isLoading: isRunningAnalysis } = trpc.autonomous.runAnalysis.useMutation();

  const handleApprove = (id: string) => {
    approveAction(id);
  };

  const autoExecutedActions = actions?.filter((action: any) => action.status === 'auto-executed') || [];
  const awaitingApprovalActions = actions?.filter((action: any) => action.status === 'awaiting-approval') || [];
  const monitoringActions = actions?.filter((action: any) => action.status === 'monitoring') || [];

  if (isLoading) {
    return <div className="text-center text-yellow-400">Loading AI Actions...</div>;
  }

  if (isError) {
    return <div className="text-center text-red-500">Error loading AI Actions.</div>;
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-yellow-400">AI Autonomous Actions</h1>
        <Button
          className="bg-yellow-400 hover:bg-yellow-500 text-black"
          onClick={() => runAnalysis()}
          disabled={isRunningAnalysis}
        >
          {isRunningAnalysis ? 'Running Analysis...' : <><Play className="h-4 w-4 mr-2" />Run Analysis</>}
        </Button>
      </div>

      <Tabs defaultValue="awaiting-approval" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-b border-gray-700">
          <TabsTrigger value="auto-executed" className="text-yellow-400 data-[state=active]:bg-gray-700 data-[state=active]:text-yellow-400">Auto-Executed ({autoExecutedActions.length})</TabsTrigger>
          <TabsTrigger value="awaiting-approval" className="text-yellow-400 data-[state=active]:bg-gray-700 data-[state=active]:text-yellow-400">Awaiting Approval ({awaitingApprovalActions.length})</TabsTrigger>
          <TabsTrigger value="monitoring" className="text-yellow-400 data-[state=active]:bg-gray-700 data-[state=active]:text-yellow-400">Monitoring ({monitoringActions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="auto-executed" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {autoExecutedActions.length === 0 ? (
              <p className="text-gray-400 col-span-full">No auto-executed actions found.</p>
            ) : (
              autoExecutedActions.map((action: any) => (
                <ActionCard key={action.id} action={action} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="awaiting-approval" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {awaitingApprovalActions.length === 0 ? (
              <p className="text-gray-400 col-span-full">No actions awaiting approval.</p>
            ) : (
              awaitingApprovalActions.map((action: any) => (
                <ActionCard key={action.id} action={action} onApprove={handleApprove} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {monitoringActions.length === 0 ? (
              <p className="text-gray-400 col-span-full">No actions currently being monitored.</p>
            ) : (
              monitoringActions.map((action: any) => (
                <ActionCard key={action.id} action={action} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIActions;
