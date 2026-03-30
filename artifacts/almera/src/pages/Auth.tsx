import { useState } from 'react';
import { useLocation } from 'wouter';
import { useLogin, useRegister, useGetSession } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Auth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useGetSession();
  
  if (session?.isLoggedIn) {
    setLocation('/');
  }

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
          toast({ title: 'Welcome back!' });
          setLocation('/');
        },
        onError: (err: any) => {
          toast({ title: 'Login Failed', description: err.message || 'Invalid credentials', variant: 'destructive' });
        }
      }
    );
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(
      { data: { email, password, fullName } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
          toast({ title: 'Account created successfully!' });
          setLocation('/');
        },
        onError: (err: any) => {
          toast({ title: 'Registration Failed', description: err.message || 'Error creating account', variant: 'destructive' });
        }
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <UserCircle size={32} />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Welcome</h1>
            <p className="text-muted-foreground mt-2">Sign in or create an account</p>
          </div>

          <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-xl shadow-black/5">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-12 rounded-xl p-1 bg-muted">
                <TabsTrigger value="login" className="rounded-lg font-bold text-sm">Sign In</TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg font-bold text-sm">Create Account</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-0 outline-none">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                    <Input 
                      id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} 
                      placeholder="you@example.com" className="h-12 rounded-xl border-border bg-background px-4" required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</Label>
                      <a href="#" className="text-xs font-semibold text-primary hover:underline">Forgot password?</a>
                    </div>
                    <div className="relative">
                      <Input 
                        id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} 
                        placeholder="••••••••" className="h-12 rounded-xl border-border bg-background px-4" required 
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl gradient-gold text-primary-foreground font-bold shadow-lg hover:shadow-xl transition-all mt-2" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-0 outline-none">
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                    <Input 
                      id="reg-name" type="text" value={fullName} onChange={e => setFullName(e.target.value)} 
                      placeholder="Jane Doe" className="h-12 rounded-xl border-border bg-background px-4" required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                    <Input 
                      id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} 
                      placeholder="you@example.com" className="h-12 rounded-xl border-border bg-background px-4" required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</Label>
                    <div className="relative">
                      <Input 
                        id="reg-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} 
                        placeholder="••••••••" className="h-12 rounded-xl border-border bg-background px-4" required minLength={6}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl gradient-gold text-primary-foreground font-bold shadow-lg hover:shadow-xl transition-all mt-2" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
