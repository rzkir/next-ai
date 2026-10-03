import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/agent/prompt", "routes/api.agent.prompt.ts"),
  ...prefix("agent", [
    layout("routes/agent-layout.tsx", [
      index("routes/agent._index.tsx"),
      route("setting", "routes/agent.setting.tsx"),
      route("builds/:id", "routes/agent.builds.$id.tsx"),
      route(":category", "routes/agent.$category.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
