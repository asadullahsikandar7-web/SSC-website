import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { assets } from './assets';
import { cabinetMembers, type CabinetMember } from './cabinet';

/*
 * Full-screen presentation for the official website launch, served at /launch.
 * Keys: → / Space / PageDown = next, ← / PageUp = back, Home / End, F = full screen.
 */

const mainCabinet = cabinetMembers.filter((member) => member.category === 'main');
const executiveCabinet = cabinetMembers.filter((member) => member.category === 'executive');

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).slice(0, 2).join('');
}

function Portrait({ member, large = false }: { member: CabinetMember; large?: boolean }) {
  const size = large ? 'h-36 w-36 sm:h-44 sm:w-44 xl:h-52 xl:w-52' : 'h-20 w-20 sm:h-24 sm:w-24 xl:h-28 xl:w-28';
  return (
    <figure className="flex flex-col items-center text-center">
      <div className={`arch relative overflow-hidden bg-ivory/10 ring-2 ring-gold/60 ${size}`}>
        {member.image ? (
          <img src={member.image} alt={member.name} className="h-full w-full object-cover object-top" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-display text-3xl text-gold">{initials(member.name)}</span>
        )}
      </div>
      <figcaption className={large ? 'mt-4' : 'mt-2.5'}>
        <p className={`font-display leading-tight text-ivory ${large ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'}`}>{member.name}</p>
        <p className={`mt-1 uppercase tracking-[0.16em] text-gold ${large ? 'text-xs' : 'text-[10px]'}`}>{member.designation}</p>
      </figcaption>
    </figure>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold sm:text-sm">{children}</p>;
}

function Heading({ children }: { children: ReactNode }) {
  return <h2 className="mt-4 font-display text-4xl leading-[1.08] text-ivory sm:text-5xl xl:text-6xl">{children}</h2>;
}

const features = [
  { title: 'Events', text: 'Every mushaira, cultural night and seminar in one calendar, with online registration.' },
  { title: 'Poetry', text: 'A growing collection of Saraiki poetry with translations, readings and recitals.' },
  { title: 'Culture', text: 'Articles on our history, music, crafts and language, written by students.' },
  { title: 'Announcements', text: 'Official council news, published the moment it is decided.' },
  { title: 'Membership', text: 'Apply online and receive your member number by email once approved.' },
  { title: 'Member portal', text: 'Members track their event registrations and sign up to volunteer.' },
];

const joinSteps = [
  { step: '01', title: 'Apply', text: 'Fill in the membership form on the Join page.' },
  { step: '02', title: 'Review', text: 'The council reviews every application personally.' },
  { step: '03', title: 'Welcome', text: 'An email arrives with your member number, in your language.' },
  { step: '04', title: 'Take part', text: 'Set up your account, register for events and volunteer.' },
];

const councilTools = [
  'Publish and manage events, and see who registered',
  'Write announcements, articles and leader profiles',
  'Review membership applications and keep the member directory',
  'Post volunteer opportunities and accept volunteers',
  'Read and answer messages from the contact form',
];

function LaunchMoment() {
  const [launched, setLaunched] = useState(false);
  const siteUrl = typeof window !== 'undefined' ? window.location.host : '';

  return (
    <div className="flex flex-col items-center text-center">
      {!launched ? (
        <>
          <Eyebrow>The moment</Eyebrow>
          <Heading>Let us open the doors.</Heading>
          <p className="mx-auto mt-5 max-w-xl text-lg text-ivory/75">On behalf of the Saraiki Student Council, we invite our chief guest to launch the official website.</p>
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); setLaunched(true); }}
            className="launch-pulse mt-12 rounded-full bg-gold px-12 py-5 font-display text-2xl text-emerald shadow-2xl shadow-black/40 transition hover:scale-105 hover:bg-[#d8ba75] focus:outline-none focus-visible:ring-4 focus-visible:ring-ivory/60"
          >
            Launch the website
          </button>
        </>
      ) : (
        <div className="launch-reveal flex flex-col items-center">
          <div aria-hidden="true" className="launch-rings pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <span /><span /><span />
          </div>
          <img src={assets.logoLarge} alt="Saraiki Student Council emblem" className="mb-6 h-36 w-36 sm:h-44 sm:w-44" />
          <Eyebrow>Officially live</Eyebrow>
          <h2 className="mt-4 font-display text-5xl leading-tight text-ivory sm:text-7xl">The website is open.</h2>
          {siteUrl && <p className="mt-5 rounded-full bg-white/10 px-6 py-2.5 font-mono text-lg text-gold ring-1 ring-gold/40 sm:text-2xl">{siteUrl}</p>}
          <p className="mt-6 max-w-xl text-lg text-ivory/75">Thank you for being part of this day. Visit, join, and help us write the next chapter.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link to="/" className="rounded-full bg-gold px-8 py-3.5 font-semibold text-emerald transition hover:bg-[#d8ba75]">Enter the website</Link>
            <Link to="/join" className="rounded-full border border-ivory/40 px-8 py-3.5 font-semibold text-ivory transition hover:border-gold hover:text-gold">Become a member</Link>
          </div>
        </div>
      )}
    </div>
  );
}

const slides: Array<{ id: string; content: ReactNode }> = [
  {
    id: 'title',
    content: (
      <div className="flex flex-col items-center text-center">
        <img src={assets.logoLarge} alt="Saraiki Student Council emblem" className="h-40 w-40 sm:h-52 sm:w-52" />
        <p className="mt-8 font-display text-2xl text-gold sm:text-3xl" dir="rtl" lang="skr">سرائیکی طلبہ کونسل</p>
        <h1 className="mt-3 font-display text-5xl leading-[1.05] text-ivory sm:text-7xl">Saraiki Student Council</h1>
        <div className="mt-7 h-px w-24 bg-gold/70" />
        <p className="mt-7 text-lg uppercase tracking-[0.3em] text-ivory/80 sm:text-xl">Official Website Launch</p>
        <p className="mt-3 text-sm uppercase tracking-[0.24em] text-ivory/50">Lahore Leads University · Session 2026–2027</p>
      </div>
    ),
  },
  {
    id: 'why',
    content: (
      <div className="grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <Eyebrow>Why a website</Eyebrow>
          <Heading>Preserving culture, amplifying student leadership.</Heading>
          <ul className="mt-9 space-y-5 text-lg text-ivory/80 sm:text-xl">
            <li className="flex gap-4"><span className="mt-2.5 h-2 w-2 shrink-0 rotate-45 bg-gold" />One official home for the council, open to every student, every day.</li>
            <li className="flex gap-4"><span className="mt-2.5 h-2 w-2 shrink-0 rotate-45 bg-gold" />Our poetry, history and traditions, kept and shared for the next generation.</li>
            <li className="flex gap-4"><span className="mt-2.5 h-2 w-2 shrink-0 rotate-45 bg-gold" />Joining, events and news, all in one place instead of scattered groups.</li>
          </ul>
        </div>
        <div className="arch mx-auto hidden w-full max-w-sm overflow-hidden ring-2 ring-gold/50 lg:block">
          <img src={assets.heritageScene} alt="Saraiki heritage collage" className="aspect-[4/5] w-full object-cover object-top" />
        </div>
      </div>
    ),
  },
  {
    id: 'leadership',
    content: (
      <div className="w-full max-w-6xl text-center">
        <Eyebrow>Our leadership</Eyebrow>
        <Heading>The council that made it happen</Heading>
        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {mainCabinet.map((member) => <Portrait key={member.id} member={member} large />)}
        </div>
      </div>
    ),
  },
  {
    id: 'cabinet',
    content: (
      <div className="w-full max-w-6xl text-center">
        <Eyebrow>Executive cabinet</Eyebrow>
        <Heading>The team behind every event</Heading>
        <div className="mt-10 grid grid-cols-3 gap-x-4 gap-y-7 sm:grid-cols-5 xl:gap-x-8">
          {executiveCabinet.map((member) => <Portrait key={member.id} member={member} />)}
        </div>
      </div>
    ),
  },
  {
    id: 'features',
    content: (
      <div className="w-full max-w-6xl">
        <div className="text-center">
          <Eyebrow>What is inside</Eyebrow>
          <Heading>Everything the council does, in one place</Heading>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-3xl bg-white/[0.07] p-6 ring-1 ring-white/10">
              <p className="font-display text-2xl text-gold">{feature.title}</p>
              <p className="mt-2.5 text-base leading-7 text-ivory/75">{feature.text}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'languages',
    content: (
      <div className="w-full max-w-6xl text-center">
        <Eyebrow>It speaks our language</Eyebrow>
        <Heading>Three languages, one switch</Heading>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-ivory/75">The whole website, including the emails members receive, is available in:</p>
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {[
            { label: 'English', sample: 'Saraiki Student Council', dir: 'ltr' as const },
            { label: 'اردو', sample: 'سرائیکی طلبہ کونسل', dir: 'rtl' as const },
            { label: 'سرائیکی', sample: 'سرائیکی طلبہ کونسل', dir: 'rtl' as const },
          ].map((language) => (
            <div key={language.label} className="rounded-3xl bg-white/[0.07] px-6 py-10 ring-1 ring-gold/30">
              <p className="font-display text-4xl text-gold" dir={language.dir}>{language.label}</p>
              <p className="mt-4 text-lg text-ivory/80" dir={language.dir}>{language.sample}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'join',
    content: (
      <div className="w-full max-w-6xl">
        <div className="text-center">
          <Eyebrow>For students</Eyebrow>
          <Heading>Becoming a member takes four steps</Heading>
        </div>
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {joinSteps.map((item) => (
            <li key={item.step} className="rounded-3xl bg-white/[0.07] p-6 ring-1 ring-white/10">
              <p className="font-display text-5xl text-gold/80">{item.step}</p>
              <p className="mt-4 font-display text-2xl text-ivory">{item.title}</p>
              <p className="mt-2 text-base leading-7 text-ivory/75">{item.text}</p>
            </li>
          ))}
        </ol>
      </div>
    ),
  },
  {
    id: 'council-tools',
    content: (
      <div className="grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[0.9fr_1fr]">
        <div>
          <Eyebrow>Behind the scenes</Eyebrow>
          <Heading>A dashboard for the council</Heading>
          <p className="mt-5 text-lg text-ivory/75">Council members sign in to run the website themselves. No technical help is needed to keep it up to date.</p>
        </div>
        <ul className="space-y-3">
          {councilTools.map((tool) => (
            <li key={tool} className="flex items-center gap-4 rounded-2xl bg-white/[0.07] px-5 py-4 text-base text-ivory/85 ring-1 ring-white/10 sm:text-lg">
              <span className="h-2.5 w-2.5 shrink-0 rotate-45 bg-gold" />{tool}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  { id: 'launch', content: <LaunchMoment /> },
];

function slideFromHash() {
  const value = Number.parseInt(window.location.hash.replace('#', ''), 10);
  return Number.isFinite(value) && value >= 1 && value <= slides.length ? value - 1 : 0;
}

export default function LaunchPresentation() {
  const [index, setIndex] = useState(slideFromHash);
  const touchStart = useRef<number | null>(null);

  const go = useCallback((next: number) => {
    setIndex(Math.max(0, Math.min(slides.length - 1, next)));
  }, []);

  useEffect(() => {
    document.documentElement.dir = 'ltr';
    document.title = 'Website Launch · Saraiki Student Council';
  }, []);

  useEffect(() => {
    window.history.replaceState(null, '', `#${index + 1}`);
  }, [index]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('a')) return;
      if (['ArrowRight', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); setIndex((i) => Math.min(slides.length - 1, i + 1)); }
      else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); setIndex((i) => Math.max(0, i - 1)); }
      else if (event.key === 'Home') setIndex(0);
      else if (event.key === 'End') setIndex(slides.length - 1);
      else if (event.key.toLowerCase() === 'f') {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen?.().catch(() => undefined);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const slide = slides[index];

  return (
    <div
      className="pattern-ajrak fixed inset-0 overflow-hidden bg-emerald text-ivory"
      dir="ltr"
      onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const delta = event.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(delta) > 50) go(index + (delta < 0 ? 1 : -1));
        touchStart.current = null;
      }}
    >
      <div aria-hidden="true" className="absolute -right-32 -top-32 h-[32rem] w-[32rem] rounded-full bg-gold/20 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-40 -left-24 h-[32rem] w-[32rem] rounded-full bg-maroon/50 blur-3xl" />

      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4 sm:px-10 sm:py-6">
        <div className="flex items-center gap-3">
          <img src={assets.logo} alt="" className="h-9 w-9" />
          <span className="hidden text-xs font-semibold uppercase tracking-[0.24em] text-ivory/70 sm:inline">Saraiki Student Council</span>
        </div>
        <Link to="/" className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ivory/60 ring-1 ring-ivory/20 transition hover:text-gold hover:ring-gold/50">Exit</Link>
      </header>

      <main key={slide.id} className="launch-slide relative flex h-full flex-col overflow-y-auto px-5 pb-24 pt-20 sm:px-10">
        <div className="relative m-auto flex w-full justify-center">{slide.content}</div>
      </main>

      <footer className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-4 px-5 py-4 sm:px-10 sm:py-6">
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous slide" className="h-11 w-11 rounded-full text-xl ring-1 ring-ivory/25 transition hover:text-gold hover:ring-gold/60 disabled:opacity-30">‹</button>
        <div className="flex items-center gap-2" role="tablist" aria-label="Slides">
          {slides.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Slide ${i + 1}`}
              onClick={() => go(i)}
              className={`h-2 rounded-full transition-all ${i === index ? 'w-8 bg-gold' : 'w-2 bg-ivory/30 hover:bg-ivory/60'}`}
            />
          ))}
        </div>
        <button type="button" onClick={() => go(index + 1)} disabled={index === slides.length - 1} aria-label="Next slide" className="h-11 w-11 rounded-full text-xl ring-1 ring-ivory/25 transition hover:text-gold hover:ring-gold/60 disabled:opacity-30">›</button>
      </footer>
    </div>
  );
}
