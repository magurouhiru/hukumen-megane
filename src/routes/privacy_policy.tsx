import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy_policy")({
  component: PrivacyPolicyComponent,
});

function PrivacyPolicyComponent() {
  return <div>Hello "/privacy_policy"!</div>;
}
