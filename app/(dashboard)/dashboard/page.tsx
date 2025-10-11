import { UserButton } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

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
        <div className="mx-auto max-w-4xl">
          {/* Welcome Section */}
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white">
              Welcome back, {user.firstName || 'Modular Enthusiast'}! 👋
            </h2>
            <p className="text-xl text-slate-300">
              Ready to explore your rack&apos;s infinite sonic possibilities?
            </p>
          </div>

          {/* Quick Actions */}
          <div className="mb-12 grid gap-6 md:grid-cols-2">
            {/* Generate Patch Card */}
            <div className="cursor-pointer rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-8 transition-transform hover:scale-105">
              <div className="mb-4 text-5xl">🎨</div>
              <h3 className="mb-2 text-2xl font-bold text-white">Generate Patch</h3>
              <p className="mb-4 text-slate-300">
                Describe what you want and let AI create the perfect patch for your rack
              </p>
              <div className="flex items-center gap-2 font-semibold text-purple-300">
                <span>Get Started</span>
                <span>→</span>
              </div>
            </div>

            {/* Cookbook Card */}
            <div className="cursor-pointer rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-8 transition-transform hover:scale-105">
              <div className="mb-4 text-5xl">📚</div>
              <h3 className="mb-2 text-2xl font-bold text-white">Your Cookbook</h3>
              <p className="mb-4 text-slate-300">
                Browse your saved patches and organize your favorite sonic recipes
              </p>
              <div className="flex items-center gap-2 font-semibold text-blue-300">
                <span>View Patches</span>
                <span>→</span>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-8 backdrop-blur-sm">
            <h3 className="mb-6 text-xl font-bold text-white">Your Progress</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="mb-2 text-4xl font-bold text-purple-400">0</div>
                <div className="text-sm text-slate-400">Patches Generated</div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-4xl font-bold text-blue-400">0</div>
                <div className="text-sm text-slate-400">Saved Patches</div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-4xl font-bold text-pink-400">0</div>
                <div className="text-sm text-slate-400">Techniques Tried</div>
              </div>
            </div>
          </div>

          {/* Getting Started */}
          <div className="mt-12 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-8">
            <h3 className="mb-4 text-xl font-bold text-white">🚀 Next Steps</h3>
            <ol className="space-y-3 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-500 text-sm font-bold">
                  1
                </span>
                <span>Paste your ModularGrid rack URL to analyze your modules</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-500 text-sm font-bold">
                  2
                </span>
                <span>Describe the sound you&apos;re after (mood, genre, technique)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-500 text-sm font-bold">
                  3
                </span>
                <span>Get a beautiful visual patch diagram with step-by-step instructions</span>
              </li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}
