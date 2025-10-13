import Link from 'next/link';
import { ArrowRight, Zap, Users, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'About - PatchPath AI',
  description:
    'The origin story of PatchPath AI: From Nashville warehouse raves to AI-powered synthesis tools. 28 years in the making.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">🎸 PatchPath AI</h1>
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-300 transition-all hover:border-purple-500/50 hover:bg-purple-500/20"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-5xl font-bold text-white sm:text-6xl">28 Years in the Making</h2>
          <p className="text-xl text-slate-300 sm:text-2xl">
            From Nashville warehouse raves to AI-powered synthesis.
            <br />
            This is the story of how chaos became code.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-12">
          {/* 1997 - The Meeting */}
          <div className="relative rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-8 backdrop-blur-sm">
            <div className="mb-4 inline-block rounded-full bg-cyan-500/20 px-4 py-1 text-sm font-bold text-cyan-300">
              1997 • Middle Tennessee State University
            </div>
            <h3 className="mb-4 text-3xl font-bold text-white">🎓 Where It All Started</h3>
            <p className="mb-4 text-lg leading-relaxed text-slate-300">
              <span className="text-orange-300">Robb Fladry</span> and{' '}
              <span className="text-cyan-300">Josh Smith</span> met at MTSU while the Nashville rave
              scene was exploding around them.
            </p>
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
                <p className="mb-2 font-semibold text-cyan-300">Josh: Blondie EtCetera</p>
                <p className="text-sm text-slate-400">
                  DJing and producing music. Released legendary mixtapes:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-400">
                  <li>
                    • <span className="italic">&quot;The Best of Vanilla Ice&quot;</span> (1997)
                  </li>
                  <li>
                    • <span className="italic">&quot;The Best of Milli Vanilli&quot;</span> (1998)
                  </li>
                  <li className="text-xs text-slate-500">Still legend in mixtape communities</li>
                </ul>
              </div>
              <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
                <p className="mb-2 font-semibold text-orange-300">Robb: Green 13</p>
                <p className="text-sm text-slate-400">
                  Learning graphic design on pirated Photoshop 4.0. Designing rave flyers that
                  defined the scene.
                </p>
              </div>
            </div>
            <p className="text-slate-400">
              Both heavily involved in the Nashville rave scene through their association with{' '}
              <span className="font-semibold text-cyan-300">King Funk Productions</span>. Both
              worked at <span className="font-semibold text-cyan-300">Faith Records</span>, the
              Nashville record store where the underground music community gathered.
            </p>
          </div>

          {/* 1999 - The Ghetto Headliners */}
          <div className="relative rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-red-500/10 p-8 backdrop-blur-sm">
            <div className="mb-4 inline-block rounded-full bg-orange-500/20 px-4 py-1 text-sm font-bold text-orange-300">
              1999 • Nashville, TN
            </div>
            <h3 className="mb-4 text-3xl font-bold text-white">🔊 The Ghetto Headliners Era</h3>
            <p className="mb-4 text-lg leading-relaxed text-slate-300">
              <span className="text-orange-300">Robb</span> and{' '}
              <span className="text-cyan-300">Josh</span> decided to come together as{' '}
              <span className="font-bold text-white">The Ghetto Headliners</span>. In the dark
              corners of Nashville warehouses, they pushed the limits of what electronic music could
              be.
            </p>
            <p className="mb-4 text-slate-400">
              The Ghetto Headliners threw legendary parties that the fire marshal definitely
              didn&apos;t approve of. No scripts. No rules. Just raw energy and the belief that if
              you patch it weird enough, something beautiful might happen.
            </p>
            <div className="rounded-lg border border-slate-500/20 bg-slate-500/5 p-4">
              <p className="mb-2 text-sm font-semibold text-slate-300">The Clarksville Apartment</p>
              <p className="text-sm text-slate-400">
                Robb and Josh lived together in a shitty two-bedroom apartment that had more
                computer, networking and A/V equipment than two early 20-somethings should have had.
                They installed Cat 5 networking <span className="italic">in the year 2000</span>. No
                one did that. They were one of the first apartments in town to have a cable modem.
                &quot;It was just a thing we did.&quot;
              </p>
            </div>
          </div>

          {/* 2000 - Lucky.13 */}
          <div className="relative rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-8 backdrop-blur-sm">
            <div className="mb-4 inline-block rounded-full bg-purple-500/20 px-4 py-1 text-sm font-bold text-purple-300">
              2000 • Lucky.13 at 8th Day Music Venue
            </div>
            <h3 className="mb-4 text-3xl font-bold text-white">🍀 The First Rave</h3>
            <p className="mb-4 text-lg leading-relaxed text-slate-300">
              <span className="font-bold text-purple-300">Lucky.13</span> was the first rave Robb
              and Josh threw together. The moment when The Ghetto Headliners became real.
            </p>
            <p className="mb-4 text-slate-400">
              Josh had an idea - and when Josh has ideas at 3am in a warehouse, things get weird.
              What started as &quot;wouldn&apos;t it be sick if...&quot; turned into a night that
              people still talk about on ModWiggler forums.
            </p>
            <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
              <p className="text-sm text-purple-300">
                📖{' '}
                <a
                  href="https://medium.com/the-riff/the-first-day-of-the-rest-of-my-life-was-a-party-i-didnt-go-to-3156393dc1bb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 transition-colors hover:text-purple-200"
                >
                  Read the Lucky.13 story on Medium
                </a>{' '}
                - the full tale of that legendary night.
              </p>
            </div>
            <p className="mt-4 text-sm text-slate-500 italic">
              The statute of limitations has expired. The fire marshal can&apos;t hurt us anymore.
            </p>
          </div>

          {/* 2004-2008 - Life Happens */}
          <div className="relative rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-8 backdrop-blur-sm">
            <div className="mb-4 inline-block rounded-full bg-blue-500/20 px-4 py-1 text-sm font-bold text-blue-300">
              2004-2008 • Life Happens
            </div>
            <h3 className="mb-4 text-3xl font-bold text-white">💫 Paths Diverge</h3>
            <p className="mb-4 text-lg leading-relaxed text-slate-300">
              <span className="text-orange-300">Robb</span> went off on a path of creativity and
              higher education, focusing on design, new media art, filmmaking, and where those
              things meet with spectacle and theatre magic. (
              <a
                href="https://robbfladry.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 underline underline-offset-4 transition-colors hover:text-orange-300"
              >
                robbfladry.com
              </a>
              )
            </p>
            <div className="mb-4 rounded-lg border border-pink-500/20 bg-pink-500/5 p-4">
              <p className="text-sm font-semibold text-pink-300">2004: Robb met Shelley</p>
              <p className="mt-2 text-sm font-semibold text-pink-300">
                July 7, 2007: They got married (Josh was in the wedding!)
              </p>
              <p className="mt-2 text-xs text-slate-500">Remember this date...</p>
            </div>
            <p className="mb-4 text-slate-300">
              <span className="text-cyan-300">Josh</span> moved to Los Angeles after 9/11 and ended
              up becoming a{' '}
              <span className="font-bold text-cyan-300">Grammy Award-winning engineer</span>. (
              <a
                href="https://jaxsta.com/profile/0850692c-4f12-4246-af60-efcb441b16a6/credits"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 underline underline-offset-4 transition-colors hover:text-cyan-300"
              >
                See credits
              </a>
              )
            </p>
            <p className="text-slate-400">
              <span className="font-semibold">July 2008:</span> Robb moved from Tennessee to
              Florida. Josh moved back to Nashville. Same month, different directions. This
              geographic split shaped everything that came next.
            </p>
          </div>

          {/* 2018-2020 - The Eurorack Renaissance */}
          <div className="relative rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-8 backdrop-blur-sm">
            <div className="mb-4 inline-block rounded-full bg-green-500/20 px-4 py-1 text-sm font-bold text-green-300">
              2018-2020 • The Eurorack Renaissance
            </div>
            <h3 className="mb-4 text-3xl font-bold text-white">🎛️ Machines Again</h3>
            <p className="mb-4 text-lg leading-relaxed text-slate-300">
              In <span className="font-semibold text-green-300">2018</span>, Josh got into Eurorack.
              That same year,{' '}
              <a
                href="https://trashteam.tv"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 underline underline-offset-4 transition-colors hover:text-cyan-300"
              >
                Trash Team
              </a>{' '}
              was born - Ghetto Headliners reborn after 20 years, a grown-up version that just built
              on what they&apos;d done in their professional lives.
            </p>
            <p className="mb-4 text-slate-400">
              In <span className="font-semibold">2019</span>, Josh introduced Robb to LZX modules
              (video synthesis). The machines were screaming again, but this time in full color.
            </p>
            <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
              <p className="mb-2 font-semibold text-green-300">2020: Trash Team Video Sync</p>
              <p className="text-sm text-slate-300">
                Randomly was something made to fill a need. Released on Etsy.{' '}
                <span className="font-bold text-green-300">Over 200 sold at cost.</span> Just two
                friends solving a problem for the community.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                <a
                  href="https://modulargrid.net/e/other-unknown-trash-team-video-sync"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 transition-colors hover:text-slate-400"
                >
                  See it on ModularGrid
                </a>
              </p>
            </div>
            <p className="text-slate-400">
              <span className="font-semibold">March 13, 2020:</span> The world shut down. Robb and
              Josh (and the rest of the world) communicated over Zoom. They decided to try to create
              a studio experience over Zoom. It was... basic.
            </p>
          </div>

          {/* 2025 - Everything Comes Together */}
          <div className="relative rounded-2xl border border-white/20 bg-gradient-to-br from-white/5 to-purple-500/20 p-8 backdrop-blur-sm">
            <div className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1 text-sm font-bold text-white">
              July 7, 2025 • Everything Comes Together
            </div>
            <h3 className="mb-4 text-3xl font-bold text-white">🚀 The Fladry Creative Ecosystem</h3>
            <p className="mb-4 text-lg leading-relaxed text-slate-300">
              <span className="font-bold text-purple-400">July 7, 2025</span> - exactly 18 years
              after Robb and Shelley&apos;s wedding - everything launched at once.
            </p>
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
                <p className="mb-2 font-bold text-purple-300">Fladry Creative</p>
                <p className="text-sm text-slate-300">
                  The brand ecosystem. The umbrella that houses it all.
                </p>
                <p className="mt-2 text-xs">
                  <a
                    href="https://fladrycreative.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 underline underline-offset-4 transition-colors hover:text-purple-300"
                  >
                    fladrycreative.com
                  </a>
                </p>
              </div>
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4">
                <p className="mb-2 font-bold text-cyan-300">The Fladry Creative Group</p>
                <p className="text-sm text-slate-300">
                  Boutique creative studio for small businesses. Development, creativity, AI-forward
                  at reasonable rates.
                </p>
                <p className="mt-2 text-xs">
                  <a
                    href="https://fladrycreative.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 underline underline-offset-4 transition-colors hover:text-cyan-300"
                  >
                    fladrycreative.co
                  </a>
                </p>
              </div>
            </div>
            <p className="mb-4 text-lg leading-relaxed text-slate-300">
              PatchPath AI is{' '}
              <span className="font-bold text-white">
                the weirdness when everything mixes together
              </span>
              . Our love for music + our love for creativity + our love for cutting-edge tech mixed
              with physical gear + obsession over craft.
            </p>
            <p className="mb-4 text-slate-300">
              It came together because{' '}
              <span className="italic">
                Robb and Josh have weird text conversations and sometimes you just have to see if
                you can do what you talk about
              </span>
              .
            </p>
            <p className="text-lg font-semibold text-purple-300">
              Here it is. A launching pad for what we do.
            </p>
          </div>

          {/* 2026 - The Future */}
          <div className="relative rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-8 backdrop-blur-sm">
            <div className="mb-4 inline-block rounded-full bg-yellow-500/20 px-4 py-1 text-sm font-bold text-yellow-300">
              2026 • What&apos;s Next
            </div>
            <h3 className="mb-4 text-3xl font-bold text-white">🎙️ Blackout Department</h3>
            <p className="mb-4 text-lg leading-relaxed text-slate-300">
              A weird sleeper music studio opening in Lakeland, FL. Run by Robb and Josh.
            </p>
            <p className="mb-4 text-slate-400">
              Josh still lives in LA. Robb in FL. Through technology, AI, and a little hard work -{' '}
              <span className="font-semibold text-cyan-300">
                The Fladry Creative Group provides the tech for Josh to run a studio across the
                country
              </span>
              .
            </p>
            <p className="text-sm text-slate-500">
              <a
                href="https://blackoutdepartment.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 transition-colors hover:text-slate-400"
              >
                blackoutdepartment.com
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-4xl font-bold text-white">Our Philosophy</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20">
                <Zap className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">No Gatekeeping</h3>
              <p className="text-slate-400">
                Synthesis knowledge should be free. We&apos;re not hiding tricks behind paywalls or
                making you dig through forum posts from 2003.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/20">
                <Users className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">Community First</h3>
              <p className="text-slate-400">
                Built by synth nerds, for synth nerds. Every feature request is read. Every bug
                matters. We&apos;re making this together.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/20">
                <Sparkles className="h-6 w-6 text-orange-400" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">Embrace the Chaos</h3>
              <p className="text-slate-400">
                The best sounds come from happy accidents. We celebrate the weird patches, the
                broken routings, and the &quot;wait, what?&quot; moments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-6 text-4xl font-bold text-white">Ready to Make Some Noise?</h2>
          <p className="mb-8 text-xl text-slate-300">
            Join us in keeping the warehouse rave spirit alive - one patch at a time.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 text-lg font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50"
          >
            Let&apos;s Patch
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-slate-500">
              © 2025 PatchPath AI • Built with chaos and Claude • Est. Lucky.13
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a
                href="https://fladrycreative.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 transition-colors hover:text-purple-300"
              >
                Fladry Creative
              </a>
              <span>×</span>
              <a
                href="https://trashteam.tv"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 transition-colors hover:text-cyan-300"
              >
                Trash Team
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
