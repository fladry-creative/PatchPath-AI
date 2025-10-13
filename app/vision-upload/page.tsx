import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { VisionUploadWizard } from '@/components/vision/VisionUploadWizard';

export const metadata = {
  title: 'Upload Rack Photo - PatchPath AI',
  description: 'Upload a photo of your modular synth rack and let AI identify all modules',
};

export default async function VisionUploadPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Vision Upload</h1>
              <p className="mt-1 text-sm text-slate-400">
                Upload a photo and let AI identify your modules
              </p>
            </div>
            <a
              href="/dashboard"
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:border-white/20 hover:bg-white/10"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <VisionUploadWizard userId={user.id} />
        </div>
      </main>
    </div>
  );
}
