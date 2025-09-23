import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  LogIn, LogOut, User, Shield, AlertCircle, 
  CheckCircle, Mail, Lock, UserPlus 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthComponentProps {
  className?: string;
}

export const AuthComponent = ({ className = '' }: AuthComponentProps) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  const { toast } = useToast();

  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(user);
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          toast({
            title: "Welcome!",
            description: "Successfully signed in. Enhanced features are now available.",
            variant: "default",
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed Out",
            description: "You have been signed out. Some features may be limited.",
            variant: "default",
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [toast]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Clear form
      setEmail('');
      setPassword('');
      
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Sign In Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      toast({
        title: "Check Your Email",
        description: "We've sent you a confirmation link to complete your registration.",
        variant: "default",
      });
      
      // Clear form
      setEmail('');
      setPassword('');
      
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        title: "Sign Up Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign Out Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={`border-primary/20 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Checking authentication...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Authenticated state
  if (user) {
    return (
      <Card className={`border-primary/20 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-primary" />
            <span>Authenticated User</span>
            <Badge variant="default" className="bg-success text-success-foreground">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <Alert className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
              <Shield className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">Professional OSINT Suite Active</AlertTitle>
              <AlertDescription>
                🔥 <strong>Full access unlocked:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li><strong>Real API Integration:</strong> Live SerpAPI, Hunter.io, and ScraperAPI access</li>
                  <li><strong>Professional Entity Extraction:</strong> Advanced algorithms with confidence scoring</li>
                  <li><strong>Secure Architecture:</strong> Edge functions eliminate CORS restrictions</li>
                  <li><strong>Comprehensive Analytics:</strong> Session tracking and cost monitoring</li>
                  <li><strong>Skip Tracing Database:</strong> Persistent results and entity verification</li>
                </ul>
              </AlertDescription>
            </Alert>

          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{user.email}</span>
              <Badge variant="default" className="text-xs bg-gradient-primary">Premium</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Enhanced OSINT Active • ID: {user.id.slice(0, 8)}...
            </p>
          </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              disabled={authLoading}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Unauthenticated state
  return (
    <Card className={`border-primary/20 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <LogIn className="h-5 w-5 text-primary" />
          <span>Authentication</span>
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            Required
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sign in to unlock enhanced OSINT features with secure API management
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as 'signin' | 'signup')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin" className="flex items-center space-x-2">
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Sign Up</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Sign In Benefits</AlertTitle>
              <AlertDescription>
                Access secure API management, bypass CORS restrictions, and get persistent search history.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password" className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Password</span>
                </Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={authLoading} className="w-full">
                {authLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <Alert>
              <UserPlus className="h-4 w-4" />
              <AlertTitle>Create Your Account</AlertTitle>
              <AlertDescription>
                Get started with secure OSINT tools and API management. Free account with email verification.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Password</span>
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Choose a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 6 characters required
                </p>
              </div>

              <Button type="submit" disabled={authLoading} className="w-full">
                {authLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating account...</span>
                  </div>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};