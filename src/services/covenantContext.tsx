import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase, isSupabaseConfigured } from "./supabase";
import { useAuth } from "./authContext";

export interface Covenant {
  id: string;
  user_1_id: string;
  user_2_id: string | null;
  invite_code: string;
  shared_streak: number;
  longest_streak: number;
  freeze_reserves: number;
  status: "pending" | "active" | "paused" | "broken";
  last_streak_date: string | null;
}

export interface DailyReview {
  id: string;
  covenant_id: string;
  user_id: string;
  review_date: string;
  status: "completed" | "freeze_applied" | "skipped";
}

export interface PartnerProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface CovenantContextType {
  activeCovenant: Covenant | null;
  partnerProfile: PartnerProfile | null;
  myTodayReview: DailyReview | null;
  partnerTodayReview: DailyReview | null;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  completeDailyReview: () => Promise<{ success: boolean; error?: string }>;
}

const CovenantContext = createContext<CovenantContextType | undefined>(undefined);

export const CovenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeCovenant, setActiveCovenant] = useState<Covenant | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
  const [myTodayReview, setMyTodayReview] = useState<DailyReview | null>(null);
  const [partnerTodayReview, setPartnerTodayReview] = useState<DailyReview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCovenantData = async () => {
    if (!user || !isSupabaseConfigured) {
      setActiveCovenant(null);
      setPartnerProfile(null);
      setMyTodayReview(null);
      setPartnerTodayReview(null);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch user's active covenant
      const { data: covenants, error: covError } = await supabase
        .from("covenants")
        .select("*")
        .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)
        .neq("status", "broken")
        .limit(1);

      if (covError) throw covError;

      const covenant = covenants && covenants.length > 0 ? covenants[0] : null;
      setActiveCovenant(covenant);

      if (covenant) {
        // 2. Fetch Partner Profile
        const partnerId = covenant.user_1_id === user.id ? covenant.user_2_id : covenant.user_1_id;
        
        if (partnerId) {
          const { data: pProfile } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url")
            .eq("id", partnerId)
            .single();
          
          setPartnerProfile(pProfile || null);
        } else {
          setPartnerProfile(null);
        }

        // 3. Fetch Today's Reviews
        const todayStr = new Date().toISOString().split('T')[0];
        
        const { data: reviews } = await supabase
          .from("covenant_daily_reviews")
          .select("*")
          .eq("covenant_id", covenant.id)
          .eq("review_date", todayStr);

        if (reviews) {
          const mine = reviews.find((r) => r.user_id === user.id);
          const partners = partnerId ? reviews.find((r) => r.user_id === partnerId) : null;
          
          setMyTodayReview(mine || null);
          setPartnerTodayReview(partners || null);
        } else {
          setMyTodayReview(null);
          setPartnerTodayReview(null);
        }
      } else {
        setPartnerProfile(null);
        setMyTodayReview(null);
        setPartnerTodayReview(null);
      }
    } catch (err) {
      console.error("Error fetching covenant data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCovenantData();

    if (!user || !isSupabaseConfigured) return;

    // Set up Realtime subscriptions
    const channel = supabase
      .channel('covenant_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'covenants' },
        (payload) => {
          if (
            payload.new && 
            ((payload.new as any).user_1_id === user.id || (payload.new as any).user_2_id === user.id)
          ) {
            fetchCovenantData();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'covenant_daily_reviews' },
        (payload) => {
          // Re-fetch on any review updates to keep UI perfectly in sync
          fetchCovenantData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const completeDailyReview = async () => {
    if (!activeCovenant || !user || !isSupabaseConfigured) return { success: false, error: "Not configured or no covenant" };
    
    try {
      const { data, error } = await supabase.rpc('complete_daily_review', {
        p_covenant_id: activeCovenant.id,
        p_duration_seconds: 60,
        p_stage: 4
      });

      if (error) throw error;
      
      // Refresh local data to show completion
      await fetchCovenantData();
      
      return { success: true };
    } catch (err: any) {
      console.error("Error completing review:", err);
      return { success: false, error: err.message };
    }
  };

  return (
    <CovenantContext.Provider
      value={{
        activeCovenant,
        partnerProfile,
        myTodayReview,
        partnerTodayReview,
        isLoading,
        refreshData: fetchCovenantData,
        completeDailyReview,
      }}
    >
      {children}
    </CovenantContext.Provider>
  );
};

export const useCovenant = () => {
  const context = useContext(CovenantContext);
  if (!context) {
    throw new Error("useCovenant must be used within a CovenantProvider");
  }
  return context;
};
