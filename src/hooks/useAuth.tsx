import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_USERS } from '@/lib/constants';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithNationalId: (nationalId: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithNationalId = async (nationalId: string) => {
    // Check if this is a demo user
    const demoUser = DEMO_USERS[nationalId];
    
    if (!demoUser) {
      return { error: new Error('رقم الهوية غير مسجل في النظام') };
    }

    // Use national ID as email for Supabase auth
    const email = `${nationalId}@sanad.local`;
    const password = nationalId; // Using national ID as password for demo

    // Try to sign in first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // If sign in fails, try to sign up
      if (signInError.message.includes('Invalid login')) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: demoUser.fullName,
              national_id: demoUser.nationalId,
            },
          },
        });

        if (signUpError) {
          return { error: signUpError as Error };
        }

        // Update profile with demo data after signup
        setTimeout(async () => {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            await supabase.from('profiles').update({
              full_name: demoUser.fullName,
              national_id: demoUser.nationalId,
              birth_date_gregorian: demoUser.birthDateGregorian,
              birth_date_hijri: demoUser.birthDateHijri,
              nationality: demoUser.nationality,
              city: demoUser.city,
              occupation: demoUser.occupation,
              marital_status: demoUser.maritalStatus,
              national_id_expiry: demoUser.nationalIdExpiry,
              phone: demoUser.phone,
            }).eq('user_id', currentUser.id);
          }
        }, 1000);

        return { error: null };
      }
      return { error: signInError as Error };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithNationalId, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
