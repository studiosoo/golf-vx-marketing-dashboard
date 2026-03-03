import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Users, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function Duplicates() {
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [primaryId, setPrimaryId] = useState<number | null>(null);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);

  const { data: duplicateGroups, isLoading, refetch } = trpc.members.findDuplicates.useQuery();
  const mergeMutation = trpc.members.mergeMembers.useMutation({
    onSuccess: () => {
      toast.success('Members merged successfully');
      setMergeDialogOpen(false);
      setSelectedGroup(null);
      setPrimaryId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Merge failed: ${error.message}`);
    },
  });

  const handleMergeClick = (group: any[]) => {
    setSelectedGroup(group);
    setPrimaryId(group[0].id); // Default to first member as primary
    setMergeDialogOpen(true);
  };

  const handleConfirmMerge = () => {
    if (!primaryId || !selectedGroup) return;
    
    const duplicateIds = selectedGroup
      .filter((m: any) => m.id !== primaryId)
      .map((m: any) => m.id);
    
    mergeMutation.mutate({ primaryId, duplicateIds });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalDuplicates = duplicateGroups?.reduce((sum, group) => sum + group.length - 1, 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Duplicate Members</h1>
        <p className="text-muted-foreground mt-2">
          Review and merge duplicate member records to maintain clean data
        </p>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Duplicate Detection Summary
          </CardTitle>
          <CardDescription>
            Members with matching names or phone numbers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold">{duplicateGroups?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Duplicate Groups</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{totalDuplicates}</div>
              <div className="text-sm text-muted-foreground">Duplicate Records</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {duplicateGroups ? duplicateGroups.reduce((sum, g) => sum + g.length, 0) : 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Affected Members</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Duplicates Message */}
      {(!duplicateGroups || duplicateGroups.length === 0) && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            No duplicate members found. Your member database is clean!
          </AlertDescription>
        </Alert>
      )}

      {/* Duplicate Groups */}
      <div className="space-y-4">
        {duplicateGroups?.map((group, groupIndex) => (
          <Card key={groupIndex}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Duplicate Group #{groupIndex + 1}</CardTitle>
                  <CardDescription>
                    {group.length} members with matching information
                  </CardDescription>
                </div>
                <Button onClick={() => handleMergeClick(group)}>
                  Merge Members
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {group.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground space-y-1 mt-1">
                        {member.email && <div>Email: {member.email}</div>}
                        {member.phone && <div>Phone: {member.phone}</div>}
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{member.membershipTier}</Badge>
                          <Badge variant="outline">{member.acquisitionSource || 'Unknown source'}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm font-medium">
                        ${parseFloat(member.lifetimeValue || '0').toFixed(2)} LTV
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.totalVisits || 0} visits
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.totalLessons || 0} lessons
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Merge Confirmation Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Merge Duplicate Members</DialogTitle>
            <DialogDescription>
              Select the primary member to keep. All data from other members will be merged into this record.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-4">
            {selectedGroup?.map((member: any) => (
              <div
                key={member.id}
                className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                  primaryId === member.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-muted-foreground/50'
                }`}
                onClick={() => setPrimaryId(member.id)}
              >
                <input
                  type="radio"
                  checked={primaryId === member.id}
                  onChange={() => setPrimaryId(member.id)}
                  className="h-4 w-4"
                />
                <div className="flex-1">
                  <div className="font-medium">{member.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {member.email || 'No email'} • {member.phone || 'No phone'}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      ${parseFloat(member.lifetimeValue || '0').toFixed(2)} LTV
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {member.totalVisits || 0} visits
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {member.acquisitionSource || 'Unknown'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. All duplicate records will be deleted after merging their data
              into the primary member.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmMerge}
              disabled={!primaryId || mergeMutation.isPending}
            >
              {mergeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Merging...
                </>
              ) : (
                'Confirm Merge'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
