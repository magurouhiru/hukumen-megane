import { createFileRoute, Link } from "@tanstack/react-router";
import Card from "@/component/card";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="grid gap-4">
      <Link to="/otoge">
        <Card>
          <div>test</div>
        </Card>
      </Link>
    </div>
  );
}
