import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

export function useAuth() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    loginUrl: getLoginUrl(),
  };
}
