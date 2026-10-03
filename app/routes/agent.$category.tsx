import { redirect } from "react-router";
import type { Route } from "./+types/agent.$category";
import { isAgentCategoryRouteKey } from "~/lib/agent/content";

/** Legacy category URLs redirect into the unified /agent workspace. */
export function loader({ params }: Route.LoaderArgs) {
  if (params.category && isAgentCategoryRouteKey(params.category)) {
    return redirect("/agent");
  }
  return redirect("/agent");
}

export default function AgentCategoryRedirect() {
  return null;
}
