import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  subscribeEarningsByUserId,
  subscribeAllEarnings,
  Earning,
} from "@/lib/firestore";

/**
 * Hook to subscribe to real-time earnings updates.
 * Admins see all earnings, employees see only their own.
 */
export function useEarnings(): Earning[] {
  const { user, userRole } = useAuth();
  const [earnings, setEarnings] = useState<Earning[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe =
      userRole === "admin"
        ? subscribeAllEarnings(setEarnings)
        : subscribeEarningsByUserId(user.uid, setEarnings);
    return () => unsubscribe();
  }, [user, userRole]);

  return earnings;
}
