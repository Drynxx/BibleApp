import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./supabase";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { Platform, Alert } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  inviteCode: string;
  longestStreak: number;
  preferredLanguage?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signInWithApple: () => Promise<{ error?: string }>;
  signInWithOtp: (email: string) => Promise<{ error?: string; message?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ error?: string }>;
  signInDemo: (displayName?: string, email?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateLanguage: (lang: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = "@inscribe_demo_user";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync Supabase Auth session on mount
  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        if (isSupabaseConfigured) {
          const { data } = await supabase.auth.getSession();
          if (mounted && data.session) {
            setSession(data.session);
            setUser(data.session.user);
            await fetchOrCreateProfile(data.session.user);
            setIsLoading(false);
            return;
          }
        }

        // Check local demo user session via AsyncStorage
        const stored = await AsyncStorage.getItem(DEMO_STORAGE_KEY);
        if (stored && mounted) {
          const parsed = JSON.parse(stored);
          setProfile(parsed);
          setUser({
            id: parsed.id,
            email: parsed.email,
            app_metadata: {},
            user_metadata: { full_name: parsed.displayName },
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as User);
        }
      } catch {
        // Fall through
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadSession();

    // Handle deep links from magic links
    const handleDeepLink = async (event: Linking.EventType) => {
      const url = event.url;
      if (url && (url.includes('#access_token=') || url.includes('#refresh_token='))) {
        const hashParams = url.split('#')[1];
        if (hashParams) {
          const params = new URLSearchParams(hashParams);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
          }
        }
      }
    };

    const linkSubscription = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    let authListener: { subscription: { unsubscribe: () => void } } | null = null;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange(
        async (_event, newSession) => {
          if (!mounted) return;
          setSession(newSession);
          setUser(newSession?.user || null);
          if (newSession?.user) {
            await fetchOrCreateProfile(newSession.user);
          } else {
            setProfile(null);
          }
          setIsLoading(false);
        }
      );
      authListener = data;
    }

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
      linkSubscription.remove();
    };
  }, []);

  async function fetchOrCreateProfile(currentUser: User) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (data) {
        setProfile({
          id: data.id,
          email: data.email,
          displayName: data.display_name || "Disciple",
          avatarUrl: data.avatar_url,
          inviteCode: data.invite_code || "INSC-7X9P",
          longestStreak: data.longest_streak || 0,
          preferredLanguage: data.preferred_language || "en",
        });
      } else {
        // Fallback default
        setProfile({
          id: currentUser.id,
          email: currentUser.email || "",
          displayName:
            currentUser.user_metadata?.full_name ||
            currentUser.email?.split("@")[0] ||
            "Disciple",
          inviteCode: `INSC-${currentUser.id.substring(0, 4).toUpperCase()}`,
          longestStreak: 0,
          preferredLanguage: "en",
        });
      }
    } catch {
      setProfile({
        id: currentUser.id,
        email: currentUser.email || "",
        displayName:
          currentUser.user_metadata?.full_name ||
          currentUser.email?.split("@")[0] ||
          "Disciple",
        inviteCode: "INSC-7X9P",
        longestStreak: 0,
      });
    }
  }

  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    try {
      if (!isSupabaseConfigured) {
        await signInDemo("Google User", "scholar@inscribe.app");
        return {};
      }
      
      const redirectTo = makeRedirectUri();
      
      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        });
        if (error) return { error: error.message };
      } else {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            skipBrowserRedirect: true,
          },
        });
        if (error) return { error: error.message };
        
        if (data?.url) {
          const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
          if (res.type === 'success' && res.url) {
            const hash = res.url.split('#')[1];
            if (hash) {
              const params = new URLSearchParams(hash);
              const access_token = params.get('access_token');
              const refresh_token = params.get('refresh_token');
              if (access_token && refresh_token) {
                await supabase.auth.setSession({ access_token, refresh_token });
              }
            }
          }
        }
      }
      return {};
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Google sign-in failed";
      return { error: msg };
    }
  };

  const signInWithApple = async (): Promise<{ error?: string }> => {
    try {
      if (!isSupabaseConfigured) {
        await signInDemo("Apple Pilgrim", "pilgrim@icloud.com");
        return {};
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
      });
      if (error) return { error: error.message };
      return {};
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Apple sign-in failed";
      return { error: msg };
    }
  };

  const signInWithOtp = async (email: string): Promise<{ error?: string; message?: string }> => {
    try {
      if (!isSupabaseConfigured) {
        // In demo mode, we pretend we sent an OTP
        return { message: "Demo mode: OTP sent (enter any 6 digits)" };
      }
      const redirectTo = makeRedirectUri();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });
      if (error) return { error: error.message };
      return { message: "Check your email for the login code or link." };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to send code";
      return { error: msg };
    }
  };

  const verifyOtp = async (email: string, token: string): Promise<{ error?: string }> => {
    try {
      if (!isSupabaseConfigured) {
        await signInDemo(email.split("@")[0], email);
        return {};
      }
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      if (error) return { error: error.message };
      return {};
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to verify code";
      return { error: msg };
    }
  };

  const signInDemo = async (
    displayName: string = "David (Scholar)",
    email: string = "david@inscribe.app"
  ) => {
    const demoProfile: UserProfile = {
      id: "usr-demo-777",
      email,
      displayName,
      inviteCode: "INSC-7X9P",
      longestStreak: 42,
    };
    try {
      await AsyncStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoProfile));
    } catch {}
    setProfile(demoProfile);
    setUser({
      id: demoProfile.id,
      email: demoProfile.email,
      app_metadata: {},
      user_metadata: { full_name: demoProfile.displayName },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User);
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem(DEMO_STORAGE_KEY);
    } catch {}
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateLanguage = async (lang: string) => {
    if (!user || !isSupabaseConfigured) return {};
    
    // Update local state optimistically
    if (profile) {
      setProfile({ ...profile, preferredLanguage: lang });
    }

    const { error } = await supabase
      .from('profiles')
      .update({ preferred_language: lang })
      .eq('id', user.id);
      
    if (error) {
       console.error("Error updating language in DB", error);
       return { error: error.message };
    }
    return {};
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signInWithGoogle,
        signInWithApple,
        signInWithOtp,
        verifyOtp,
        signInDemo,
        signOut,
        updateLanguage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
