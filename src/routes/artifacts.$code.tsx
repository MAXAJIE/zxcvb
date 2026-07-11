import { createFileRoute, redirect } from "@tanstack/react-router";
import { parseArtifactCode } from "@/lib/museum";

// Preset artifact URL — QR codes encode a payload like "keris-panjang|SN001"
// (or a full URL ending in "/artifacts/keris-panjang|SN001"). Both forms
// resolve to the artifact slug, and we redirect into the authenticated
// artifact detail page (which itself gates on sign-in via the layout).
export const Route = createFileRoute("/artifacts/$code")({
  beforeLoad: ({ params }) => {
    const id = parseArtifactCode(decodeURIComponent(params.code));
    if (!id) {
      throw redirect({ to: "/scan" });
    }
    throw redirect({ to: "/artifact/$id", params: { id } });
  },
  component: () => null,
});
