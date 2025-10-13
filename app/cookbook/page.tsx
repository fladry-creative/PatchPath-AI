import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { CookbookGrid } from '@/components/cookbook/CookbookGrid';

export const metadata = {
  title: 'Patch Cookbook - PatchPath AI',
  description:
    'Your personal library of modular synthesis patches. Browse, search, and rediscover your sonic creations.',
};

export default async function CookbookPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <DashboardHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-5xl font-bold text-white">🗂️ Your Patch Cookbook</h1>
            <p className="text-xl text-slate-300">
              All your sonic recipes in one place. Search, filter, and rediscover your patches.
            </p>
          </div>

          {/* Cookbook Grid Component */}
          <CookbookGrid userId={user.id} />
        </div>
      </main>
    </div>
  );
}
