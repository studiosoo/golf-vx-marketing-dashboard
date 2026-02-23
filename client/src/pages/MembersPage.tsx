import DashboardLayout from "@/components/DashboardLayout";
import Members from "./Members";

export default function MembersPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Members</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Member management, SMS, membership status, and renewals
          </p>
        </div>
        <Members />
      </div>
    </DashboardLayout>
  );
}
