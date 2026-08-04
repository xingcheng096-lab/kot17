import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';

const schema = z.object({
  email: z.string().email('អ៊ីមែលមិនត្រឹមត្រូវ / Invalid email'),
  password: z.string().min(6, 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហួស ៦ តួ / Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

const DEMO_ACCOUNTS = [
  { role: 'Admin (មេកុដិ)', email: 'admin@kot17.org', color: 'bg-primary' },
  { role: 'Treasurer (ហេរញ្ញិក)', email: 'treasurer@kot17.org', color: 'bg-secondary' },
  { role: 'Utility Officer', email: 'utility@kot17.org', color: 'bg-info' },
  { role: 'Food Officer', email: 'food@kot17.org', color: 'bg-success' },
];

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    const { error } = await signIn(data.email, data.password);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('ការចូលបានជោគជ័យ / Login successful');
    navigate('/');
  };

  const fillDemo = (email: string) => {
    setValue('email', email);
    setValue('password', 'password123');
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Brand panel */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-primary p-8 text-primary-foreground lg:w-1/2 lg:p-12">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary-foreground/10" />
        <div className="absolute -bottom-24 -left-10 h-80 w-80 rounded-full bg-secondary/20" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground shadow-lg">
            <span className="font-khmer text-2xl font-bold">១៧</span>
          </div>
          <div>
            <p className="font-khmer text-lg font-bold">កុដិលេខ ១៧</p>
            <p className="text-sm text-primary-foreground/80">KOT 17 Management System</p>
          </div>
        </div>

        <div className="relative z-10 my-12 lg:my-0">
          <h1 className="font-khmer text-3xl font-bold leading-tight lg:text-4xl">
            ប្រព័ន្ធគ្រប់គ្រង
            <br />
            រដ្ឋបាល និងហិរញ្ញវត្ថុ
          </h1>
          <p className="mt-4 max-w-md text-primary-foreground/80">
            Smart Administrative and Financial Management System for Wat Botumvatey
            Rajavararam, Cambodia.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium">
              Members
            </span>
            <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium">
              Donations
            </span>
            <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium">
              Expenses
            </span>
            <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium">
              Reports
            </span>
          </div>
        </div>

        <p className="relative z-10 text-xs text-primary-foreground/60">
          © 2025 Wat Botumvatey Rajavararam. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-background p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-foreground">Welcome Back</h2>
            <p className="font-khmer mt-1 text-sm text-muted-foreground">
              សូមចូលប្រើប្រព័ន្ធគ្រប់គ្រង
            </p>
          </div>

          <Card>
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Sign in to your account</h3>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email / អ៊ីមែល</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-9"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password / ពាក្យសម្ងាត់</Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="px-9"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in / ចូល'
                  )}
                </Button>
              </form>

              <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/30 p-3">
                <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
                  Demo accounts (click to fill) / គណនីសាកល្បង
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => fillDemo(acc.email)}
                      className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-left text-xs transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${acc.color}`} />
                      <span className="truncate">{acc.role}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  Password: <span className="font-mono font-medium">password123</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
