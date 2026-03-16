import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { DollarSign, TrendingUp, TrendingDown, Plus, RefreshCw, Link as LinkIcon, Trash2, Edit } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function BudgetManager() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  
  const { data: campaigns, isLoading: campaignsLoading, refetch: refetchCampaigns } = trpc.campaigns.list.useQuery();
  const { data: budgetSummary, isLoading: summaryLoading, refetch: refetchSummary } = trpc.budgets.getCampaignBudgetSummary.useQuery(
    { campaignId: selectedCampaignId! },
    { enabled: !!selectedCampaignId }
  );
  const { data: expenses, isLoading: expensesLoading, refetch: refetchExpenses } = trpc.budgets.getCampaignExpenses.useQuery(
    { campaignId: selectedCampaignId! },
    { enabled: !!selectedCampaignId }
  );
  
  const syncMutation = trpc.budgets.syncMetaAdsBudgets.useMutation({
    onSuccess: (data) => {
      toast.success(`Synced ${data.syncedCampaigns.length} campaigns with Meta Ads`);
      refetchCampaigns();
      if (selectedCampaignId) refetchSummary();
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });
  
  const autoLinkMutation = trpc.budgets.autoLinkMetaAdsCampaigns.useMutation({
    onSuccess: (data) => {
      toast.success(`Linked ${data.linkedCampaigns.length} campaigns to Meta Ads`);
      refetchCampaigns();
    },
    onError: (error) => {
      toast.error(`Auto-link failed: ${error.message}`);
    },
  });
  
  const deleteExpenseMutation = trpc.budgets.deleteExpense.useMutation({
    onSuccess: () => {
      toast.success("Expense deleted");
      refetchExpenses();
      refetchSummary();
    },
  });
  
  const handleSync = async () => {
    setIsSyncing(true);
    await syncMutation.mutateAsync();
    setIsSyncing(false);
  };
  
  const handleAutoLink = async () => {
    setIsLinking(true);
    await autoLinkMutation.mutateAsync();
    setIsLinking(false);
  };
  
  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };
  
  // Calculate budget chart data
  const budgetChartData = selectedCampaignId && budgetSummary ? [
    {
      name: "Budget Status",
      "Planned Budget": parseFloat(budgetSummary.plannedBudget),
      "Meta Ads Spend": parseFloat(budgetSummary.metaAdsSpend || "0"),
      "Manual Expenses": parseFloat(budgetSummary.manualExpenses),
      "Remaining": parseFloat(budgetSummary.remaining),
    }
  ] : [];
  
  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Campaign Budget Manager</h1>
            <p className="text-[#6F6F6B]">
              Track budgets, sync Meta Ads spend, and log manual expenses
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAutoLink}
              disabled={isLinking}
              variant="outline"
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              {isLinking ? "Linking..." : "Auto-Link Meta Ads"}
            </Button>
            <Button
              onClick={handleSync}
              disabled={isSyncing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Meta Ads"}
            </Button>
          </div>
        </div>
        
        {/* Campaign Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Campaign</CardTitle>
            <CardDescription>Choose a campaign to view budget details and manage expenses</CardDescription>
          </CardHeader>
          <CardContent>
            {campaignsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedCampaignId?.toString() || ""}
                onValueChange={(value) => setSelectedCampaignId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign..." />
                </SelectTrigger>
                <SelectContent>
                  {campaigns?.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id.toString()}>
                      {campaign.name} ({campaign.status})
                      {campaign.metaAdsCampaignId && " 🔗"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
        
        {/* Budget Overview */}
        {selectedCampaignId && (
          <>
            {summaryLoading ? (
              <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : budgetSummary && (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Planned Budget</CardTitle>
                      <DollarSign className="h-4 w-4 text-[#6F6F6B]" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(budgetSummary.plannedBudget)}</div>
                      <p className="text-xs text-[#6F6F6B] mt-1">Total allocated</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Actual Spend</CardTitle>
                      <TrendingUp className="h-4 w-4 text-[#6F6F6B]" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(budgetSummary.totalActualSpend)}</div>
                      <p className="text-xs text-[#6F6F6B] mt-1">
                        Meta Ads: {formatCurrency(budgetSummary.metaAdsSpend || "0")} + 
                        Manual: {formatCurrency(budgetSummary.manualExpenses)}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Remaining</CardTitle>
                      <TrendingDown className="h-4 w-4 text-[#6F6F6B]" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(budgetSummary.remaining)}</div>
                      <p className="text-xs text-[#6F6F6B] mt-1">
                        {parseFloat(budgetSummary.remaining) >= 0 ? "Under budget" : "Over budget"}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
                      <DollarSign className="h-4 w-4 text-[#6F6F6B]" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{budgetSummary.utilization}%</div>
                      <p className="text-xs text-[#6F6F6B] mt-1">
                        {parseFloat(budgetSummary.utilization) > 100 ? "Exceeded" : "Of budget used"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Budget Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Budget Breakdown</CardTitle>
                    <CardDescription>Visual breakdown of budget allocation and spend</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={budgetChartData}>
                        <CartesianGrid strokeDasharray="4 4" strokeWidth={0.5} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Bar dataKey="Planned Budget" fill="#d4af37" />
                        <Bar dataKey="Meta Ads Spend" fill="#3b82f6" />
                        <Bar dataKey="Manual Expenses" fill="#10b981" />
                        <Bar dataKey="Remaining" fill="#6b7280" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
            
            {/* Expenses Table */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Manual Expenses</CardTitle>
                    <CardDescription>Track non-Meta Ads marketing expenses</CardDescription>
                  </div>
                  <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Expense
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <AddExpenseForm 
                        campaignId={selectedCampaignId}
                        onSuccess={() => {
                          setIsAddExpenseOpen(false);
                          refetchExpenses();
                          refetchSummary();
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {expensesLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : expenses && expenses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{formatDate(expense.date)}</TableCell>
                          <TableCell className="capitalize">{expense.category.replace("_", " ")}</TableCell>
                          <TableCell>{expense.description || "-"}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(expense.amount)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Delete this expense?")) {
                                  deleteExpenseMutation.mutate({ id: expense.id });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-[#6F6F6B]">
                    No manual expenses recorded yet. Click "Add Expense" to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
  );
}

function AddExpenseForm({ campaignId, onSuccess }: { campaignId: number; onSuccess: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("other");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  
  const addExpenseMutation = trpc.budgets.addExpense.useMutation({
    onSuccess: () => {
      toast.success("Expense added successfully");
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Failed to add expense: ${error.message}`);
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpenseMutation.mutate({
      campaignId,
      date: new Date(date),
      category: category as any,
      amount,
      description,
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add Manual Expense</DialogTitle>
        <DialogDescription>
          Record a marketing expense that's not tracked by Meta Ads
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="venue_rental">Venue Rental</SelectItem>
              <SelectItem value="food_beverage">Food & Beverage</SelectItem>
              <SelectItem value="promotional_materials">Promotional Materials</SelectItem>
              <SelectItem value="staff_costs">Staff Costs</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="amount">Amount ($)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Input
            id="description"
            placeholder="e.g., Catering for Super Bowl event"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={addExpenseMutation.isPending}>
          {addExpenseMutation.isPending ? "Adding..." : "Add Expense"}
        </Button>
      </DialogFooter>
    </form>
  );
}
