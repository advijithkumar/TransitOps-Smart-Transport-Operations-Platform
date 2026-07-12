import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.auth.forgotPassword(email);
      setIsSent(true);
      toast.success('Password reset link sent to your email.');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to send reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="h-10 w-10 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-lg mb-4">
              TO
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Reset your password</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Enter the email address associated with your account and we'll send you a link to reset your password.
            </p>
          </div>

          {!isSent ? (
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-foreground text-background rounded-md text-sm font-semibold hover:opacity-90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-background/30 border-t-background animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
              
              <p className="text-center text-xs text-muted-foreground mt-4">
                Remembered your password?{' '}
                <Link to="/login" className="font-semibold text-foreground hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 rounded-md text-sm">
                If an account exists for <b>{email}</b>, a password reset link has been sent.
              </div>
              <Link to="/login" className="block w-full py-3 border border-border rounded-md text-sm font-semibold hover:bg-muted transition-all">
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
