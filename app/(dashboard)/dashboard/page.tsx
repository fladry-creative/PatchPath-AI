import { UserButton } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { PatchDashboard } from '@/components/patches/PatchDashboard';

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">🎸 PatchPath AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-10 h-10',
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-6xl">
          {/* Welcome Section */}
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white">
              Welcome back, {user.firstName || 'Modular Enthusiast'}! 👋
            </h2>
            <p className="text-xl text-slate-300">
              Ready to explore your rack&apos;s infinite sonic possibilities?
            </p>
          </div>

          {/* Patch Dashboard - THE REAL DEAL */}
          <PatchDashboard />
        </div>
      </main>
    </div>
  );
}
