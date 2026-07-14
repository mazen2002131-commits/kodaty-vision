import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { enforceBrowserSessionOnly } from "./lib/idle-logout";

export const getRouter = () => {
  if (typeof window !== "undefined") enforceBrowserSessionOnly();
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
