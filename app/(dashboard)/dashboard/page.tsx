import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { PatchDashboard } from '@/components/patches/PatchDashboard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { QuickActions } from '@/components/dashboard/QuickActions';

const greetings = [
  'Ready to make some noise?',
  "Let's patch something weird.",
  'Time to explore infinite sonic possibilities.',
  'What chaos shall we create today?',
  'Your modules are waiting.',
];

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Random greeting for personality
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <DashboardHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-6xl">
          {/* Welcome Section */}
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white">
              Welcome back, {user.firstName || 'Patch Addict'}! 🎸
            </h2>
            <p className="text-xl text-slate-300">{greeting}</p>
          </div>

          {/* Quick Actions */}
          <QuickActions />

          {/* Patch Dashboard - THE REAL DEAL */}
          <div id="patch-form">
            <PatchDashboard />
          </div>
        </div>
      </main>
    </div>
  );
}
