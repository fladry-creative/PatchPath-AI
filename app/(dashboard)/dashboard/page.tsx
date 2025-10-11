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
      <header className="border-b border-white/10 backdrop-blur-sm bg-black/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">🎸 PatchPath AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Welcome back, {user.firstName || 'Modular Enthusiast'}! 👋
            </h2>
            <p className="text-xl text-slate-300">
              Ready to explore your rack's infinite sonic possibilities?
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Generate Patch Card */}
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-8 hover:scale-105 transition-transform cursor-pointer">
              <div className="text-5xl mb-4">🎨</div>
              <h3 className="text-2xl font-bold text-white mb-2">Generate Patch</h3>
              <p className="text-slate-300 mb-4">
                Describe what you want and let AI create the perfect patch for your rack
              </p>
              <div className="flex items-center gap-2 text-purple-300 font-semibold">
                <span>Get Started</span>
                <span>→</span>
              </div>
            </div>

            {/* Cookbook Card */}
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-8 hover:scale-105 transition-transform cursor-pointer">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-2xl font-bold text-white mb-2">Your Cookbook</h3>
              <p className="text-slate-300 mb-4">
                Browse your saved patches and organize your favorite sonic recipes
              </p>
              <div className="flex items-center gap-2 text-blue-300 font-semibold">
                <span>View Patches</span>
                <span>→</span>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-white mb-6">Your Progress</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">0</div>
                <div className="text-sm text-slate-400">Patches Generated</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">0</div>
                <div className="text-sm text-slate-400">Saved Patches</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-pink-400 mb-2">0</div>
                <div className="text-sm text-slate-400">Techniques Tried</div>
              </div>
            </div>
          </div>

          {/* Getting Started */}
          <div className="mt-12 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-white mb-4">🚀 Next Steps</h3>
            <ol className="space-y-3 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-sm font-bold">1</span>
                <span>Paste your ModularGrid rack URL to analyze your modules</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-sm font-bold">2</span>
                <span>Describe the sound you're after (mood, genre, technique)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-sm font-bold">3</span>
                <span>Get a beautiful visual patch diagram with step-by-step instructions</span>
              </li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}
