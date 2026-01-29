import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Dashboard page placeholder component.
 *
 * This is a basic placeholder to verify the shell layout renders correctly.
 * Dashboard widgets and actual content will be implemented in future steps.
 */
export default function DashboardPage() {
  return (
    <div className={"space-y-6"}>
      {/* Page heading */}
      <div className={"space-y-1"}>
        <h1 className={"text-2xl font-semibold tracking-tight"}>Dashboard</h1>
        <p className={"text-muted-foreground"}>
          Welcome to your Clarify workspace.
        </p>
      </div>

      {/* Placeholder content area */}
      <div className={"grid gap-4 md:grid-cols-2 lg:grid-cols-3"}>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Dashboard widget placeholder</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={"text-sm text-muted-foreground"}>
              Quick action widgets will appear here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Dashboard widget placeholder</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={"text-sm text-muted-foreground"}>
              Recent activity feed will appear here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>Dashboard widget placeholder</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={"text-sm text-muted-foreground"}>
              Usage statistics will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
