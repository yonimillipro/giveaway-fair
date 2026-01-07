import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: 'user' | 'company' | 'admin' | null;
  loading: boolean;
  isEmailVerified: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resendVerificationEmail: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'company' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if email is verified (either confirmed via email or via Google OAuth)
  const isEmailVerified = user?.email_confirmed_at != null || 
    user?.app_metadata?.provider === 'google';

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      setUserRole(data.role as 'user' | 'company' | 'admin');
      return data.role as 'user' | 'company' | 'admin';
    }
    return 'user' as const;
  };

  // Unified redirect function based on role
  const redirectByRole = (role: 'user' | 'company' | 'admin' | null) => {
    if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'company') {
      navigate('/company');
    } else {
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    // Track if this is the initial session check
    let isInitialSession = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid deadlock with Supabase auth
          setTimeout(async () => {
            const role = await fetchUserRole(session.user.id);
            
            // Only redirect on actual sign-in, not on page refresh/return from external link
            // INITIAL_SESSION means session was restored from storage (page load/return)
            // SIGNED_IN with isInitialSession=false means fresh login
            if (event === 'SIGNED_IN' && !isInitialSession) {
              redirectByRole(role);
            }
            
            // After first auth state change, mark as not initial
            isInitialSession = false;
          }, 0);
        } else {
          setUserRole(null);
          isInitialSession = false;
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        }
      }
    });

    if (!error && data.user) {
      await supabase
        .from('user_roles')
        .insert({ user_id: data.user.id, role: 'user' });
      
      setUserRole('user');
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      const role = await fetchUserRole(data.user.id);
      redirectByRole(role);
    }

    return { error };
  };

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      }
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    navigate('/');
  };

  const resendVerificationEmail = async () => {
    if (!user?.email) {
      return { error: { message: 'No email address found' } };
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      }
    });

    return { error };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      userRole, 
      loading, 
      isEmailVerified,
      signUp, 
      signIn, 
      signInWithGoogle,
      signOut,
      resendVerificationEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
