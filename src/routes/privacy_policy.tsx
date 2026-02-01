import { createFileRoute } from "@tanstack/react-router";
import Layout from "@/component/common/layout";

export const Route = createFileRoute("/privacy_policy")({
  component: PrivacyPolicyComponent,
});

function PrivacyPolicyComponent() {
  return (
    <Layout>
      <div>Hello "/privacy_policy"!</div>
    </Layout>
  );
}
