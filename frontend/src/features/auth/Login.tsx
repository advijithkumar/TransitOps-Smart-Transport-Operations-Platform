import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (attempts >= 5) {
      setError('Account temporarily locked. Too many failed attempts.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.auth.login({ email, password });
      login(res.accessToken, res.refreshToken, res.user);
      toast.success(`Welcome back, ${res.user.name}!`);
      navigate('/');
    } catch (err: any) {
      setAttempts(a => a + 1);
      setError(err.response?.data?.message || err.message || `Invalid credentials. ${5 - attempts - 1} attempts remaining.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-card border-r border-border flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-lg">
            TO
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight">TransitOps</h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Smart Transport Operations Platform</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight">
              Enterprise Fleet<br />Management ERP
            </h2>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-sm">
              A professional dispatch, tracking, and analytics platform built for transport companies, logistics operators, and government transport departments.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Live GPS Tracking', desc: 'MapLibre GL + Socket.IO real-time feed' },
              { label: 'RBAC Security', desc: '5 role-based access control levels' },
              { label: 'Dispatch Console', desc: 'Conflict-detection route scheduling' },
              { label: 'Fleet Analytics', desc: 'Cost-per-km, ROI, utilization rates' },
            ].map((f, i) => (
              <div key={i} className="p-4 border border-border rounded-lg bg-muted/30 space-y-1">
                <p className="text-xs font-bold text-foreground">{f.label}</p>
                <p className="text-[10px] text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">
          TransitOps © 2026 · Enterprise Transport Operations ERP · RBAC Enabled
        </p>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold">TO</div>
            <span className="font-bold text-sm">TransitOps ERP</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Sign in to your account</h2>
            <p className="text-xs text-muted-foreground mt-1">Enter your credentials to access the fleet management console.</p>
          </div>

          {/* Auth form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded text-xs flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Email Address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-muted border border-border rounded-md text-sm outline-none focus:ring-1 focus:ring-ring transition-all"
                placeholder="you@transitops.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pr-10 bg-muted border border-border rounded-md text-sm outline-none focus:ring-1 focus:ring-ring transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-border" />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground transition-colors font-semibold">
                Forgot password?
              </Link>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={isLoading || attempts >= 5}
              className="w-full py-3 bg-foreground text-background rounded-md text-sm font-semibold hover:opacity-90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-background/30 border-t-background animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
            
            <p className="text-center text-xs text-muted-foreground mt-4">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-foreground hover:underline">
                Sign up
              </Link>
            </p>
          </form>

          <p className="text-[10px] text-center text-muted-foreground">
            Access is scoped by role after login · Role permissions enforced server-side via JWT RBAC
          </p>
        </div>
      </div>
    </div>
  );
};
