import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';

export const Signup: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    roleName: 'FLEET_MANAGER'
  });
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.auth.register(formData);
      toast.success('Registration successful! Please sign in.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
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
              Create an account to access the platform. You will be assigned to a tenant upon registration.
            </p>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">
          TransitOps © 2026 · Enterprise Transport Operations ERP
        </p>
      </div>

      {/* Right signup form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold">TO</div>
            <span className="font-bold text-sm">TransitOps ERP</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Create an account</h2>
            <p className="text-xs text-muted-foreground mt-1">Fill in the details below to register.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded text-xs flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Full Name</label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 bg-muted border border-border rounded-md text-sm outline-none focus:ring-1 focus:ring-ring transition-all"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Email Address</label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 bg-muted border border-border rounded-md text-sm outline-none focus:ring-1 focus:ring-ring transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Phone Number</label>
              <input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-3 bg-muted border border-border rounded-md text-sm outline-none focus:ring-1 focus:ring-ring transition-all"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Role</label>
              <select
                id="roleName"
                required
                value={formData.roleName}
                onChange={handleChange}
                className="w-full p-3 bg-muted border border-border rounded-md text-sm outline-none focus:ring-1 focus:ring-ring transition-all"
              >
                <option value="FLEET_MANAGER">Fleet Manager</option>
                <option value="DISPATCHER">Dispatcher</option>
                <option value="SAFETY_OFFICER">Safety Officer</option>
                <option value="FINANCIAL_ANALYST">Financial Analyst</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-foreground text-background rounded-md text-sm font-semibold hover:opacity-90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-background/30 border-t-background animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                'Sign Up'
              )}
            </button>
            
            <p className="text-center text-xs text-muted-foreground mt-4">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-foreground hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
