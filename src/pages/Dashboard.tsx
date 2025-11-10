import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useSafeNavigation } from "@/hooks/useSafeNavigation";
import UserDashboard from "@/components/dashboard/UserDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import { Button } from "@/components/ui/button";
import { LogOut, Upload } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { safeNavigate, resetNavigationState } = useSafeNavigation();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user && !hasNavigated) {
      setHasNavigated(true);
      safeNavigate("/auth", { replace: true });
      return;
    }

    const checkAdminStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (error) throw error;
        setIsAdmin(!!data);
      } catch (error: any) {
        console.error("Error checking admin status:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      checkAdminStatus();
    }
  }, [user, safeNavigate, hasNavigated]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setHasNavigated(false); // Reset navigation state
      resetNavigationState(); // Reset safe navigation state
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
      safeNavigate("/auth", { replace: true });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/5">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                MediaFlow
              </h1>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? "Admin Dashboard" : "User Dashboard"}
              </p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isAdmin ? <AdminDashboard user={user} /> : <UserDashboard user={user} />}
      </main>
    </div>
  );
};

export default Dashboard;
