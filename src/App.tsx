import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom';
import {
  getDirection,
  localeLabels,
  supportedLocales,
  translations,
  type Locale,
} from './i18n/translations';
import { assets } from './assets';

type StaffUser = { id: string; email: string; role: string };
type MemberProfile = { id: string; memberNumber?: string; fullName: string; studentId: string; department: string; semester: string; preferredLanguage: Locale };
type MemberRegistration = { id: string; registeredAt: string; event: { title: string; slug: string; startsAt: string; endsAt: string; venue: string; status: string } };
type VolunteerOpportunityView = { id: string; title: string; summary: string; details: string; areas: string[]; startsAt?: string; venue?: string; status: 'open' | 'closed'; signupStatus?: 'applied' | 'accepted' | 'declined' | 'withdrawn' };
type VolunteerSignupView = { id: string; status: 'applied' | 'accepted' | 'declined' | 'withdrawn'; note?: string; memberId: { fullName: string; studentId: string; department: string; semester: string } };
type ManagedVolunteerOpportunity = VolunteerOpportunityView & { signups: VolunteerSignupView[] };
type ContactMessageView = { id: string; fullName: string; email: string; subject: string; message: string; emailStatus: 'sent' | 'failed' | 'skipped'; readAt?: string; createdAt: string };

type CabinetMember = {
  id: string;
  name: string;
  designation: string;
  category: 'main' | 'executive';
  image?: string;
  notes?: string;
};

type CouncilEvent = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  startsAt: string;
  endsAt: string;
  venue: string;
  capacity?: number;
  registrationCount: number;
  registrationOpen: boolean;
  status: 'draft' | 'published' | 'cancelled';
  coverImage?: string;
};

type EventAttendee = { id: string; fullName: string; email: string; studentId: string; createdAt: string };

type CmsContent = {
  id: string;
  contentType: 'announcement' | 'article' | 'leader';
  slug: string;
  title: string;
  summary: string;
  body: string;
  locale: Locale;
  status: 'draft' | 'published';
  roleTitle?: string;
  imageUrl?: string;
  publishedAt?: string;
};

type MembershipApplication = {
  id: string;
  fullName: string;
  studentId: string;
  department: string;
  semester: string;
  universityEmail?: string;
  phoneNumber?: string;
  areasOfInterest: string[];
  motivationStatement?: string;
  preferredLanguage: Locale;
  status: 'pending' | 'approved' | 'rejected';
  emailNotificationStatus: 'not_sent' | 'sent' | 'failed' | 'skipped';
  accountSetupStatus?: 'not_required' | 'pending' | 'ready' | 'failed' | 'existing_staff_account';
  emailNotificationSentAt?: string;
  rejectionReason?: string;
  createdAt: string;
};

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const responseBody = await response.text();
  let result: { success: boolean; data?: T; message?: string };
  try {
    result = JSON.parse(responseBody) as { success: boolean; data?: T; message?: string };
  } catch {
    throw new Error(response.ok ? 'The server returned an unreadable response.' : 'The service is currently unavailable. Please try again shortly.');
  }

  if (!response.ok || !result.success || result.data === undefined) {
    throw new Error(result.message ?? 'The request could not be completed.');
  }

  return result.data;
}

function usePublicContent(contentType: CmsContent['contentType'], locale?: Locale) {
  const [items, setItems] = useState<CmsContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const localeQuery = locale ? `?locale=${locale}` : '';
    apiRequest<{ items: CmsContent[] }>(`/api/v1/content/${contentType}${localeQuery}`)
      .then((result) => { if (active) setItems(result.items); })
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : 'Content could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [contentType, locale]);

  return { items, loading, error };
}

const cabinetMembers: CabinetMember[] = [
  { id: 'amjad-amin', name: 'Amjad Amin', designation: 'Chairman', category: 'main', image: assets.amjad },
  { id: 'malik-zahid', name: 'Malik Zahid', designation: 'Vice Chairman', category: 'main', image: assets.malik },
  { id: 'sohail-majeed', name: 'Sohail Majeed', designation: 'President', category: 'main', image: assets.sohail },
  { id: 'meer-asmat-baloch', name: 'Meer Asmat Baloch', designation: 'General Secretary', category: 'executive', image: assets.meer },
  { id: 'ramish-khan', name: 'Ramish Khan', designation: 'Advisor to Council', category: 'executive', notes: 'No matching local portrait file found for Ramish Khan (expected ramish.* in src/assets).' },
  { id: 'muhammad-haris', name: 'Muhammad Haris', designation: 'Joint Secretary', category: 'executive', notes: 'No matching local portrait file found for Muhammad Haris (expected haris.* in src/assets).' },
  { id: 'zeeshan-chandia', name: 'Zeeshan Chandia', designation: 'Cultural Secretary', category: 'executive', image: assets.zeeshan },
  { id: 'adnan-zafar', name: 'Adnan Zafar', designation: 'Finance Secretary', category: 'executive', image: assets.adnan },
  { id: 'muhammad-ahmad', name: 'Muhammad Ahmad', designation: 'Information Secretary', category: 'executive', image: assets.ahmed },
  { id: 'asadullah', name: 'Asadullah', designation: 'Academic Secretary', category: 'executive', image: assets.asadullah },
  { id: 'zulfiqar-ahamd', name: 'Zulfiqar Ahamd', designation: 'Action Committee Head', category: 'executive', notes: 'No matching local portrait file found for Zulfiqar Ahamd (expected zulfiqar.* in src/assets). Please confirm the correct image and spelling before publishing.' },
  { id: 'malik-sheroz', name: 'Malik Sheroz', designation: 'Senior Event Organizer', category: 'executive', notes: 'No matching local portrait file found for Malik Sheroz (expected sheroz.* or malik-sheroz.* in src/assets).' },
  { id: 'hasnain-shafi', name: 'Hasnain Shafi', designation: 'Sports Secretary', category: 'executive', notes: 'No matching local portrait file found for Hasnain Shafi (expected hasnain.* in src/assets).' },
];

const galleryCards = [
  { title: 'Saraiki cultural illustration', image: assets.councilPortrait, portrait: true },
  { title: 'Heritage showcase', image: assets.heritageScene },
  { title: 'Student leadership', image: assets.eventSurface },
  { title: 'Community gathering', image: assets.heroVisual },
  { title: 'Cultural workshop', image: assets.heritageScene },
  { title: 'Campus celebration', image: assets.eventSurface },
];

const impactStats = [
  { value: '12+', label: 'student-led initiatives' },
  { value: '3', label: 'cultural pillars' },
  { value: '1', label: 'shared campus voice' },
];

function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="page-shell mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12">
      <div className="mb-10 border-b border-emerald/15 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Saraiki Student Council · Leads University</p>
        <h1 className="mt-3 font-display text-5xl leading-none text-emerald sm:text-6xl">{title}</h1>
      </div>
      {children}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8 max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gold">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl text-emerald sm:text-4xl">{title}</h2>
      <p className="mt-3 text-base text-charcoal/70">{description}</p>
    </div>
  );
}

function LanguageSwitcher({
  locale,
  onChange,
}: {
  locale: Locale;
  onChange: (value: Locale) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-emerald/20 bg-white/80 px-2 py-1 shadow-sm">
      <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald/70 sm:inline">
        {translations[locale].language}
      </span>
      <select
        aria-label={translations[locale].language}
        value={locale}
        onChange={(event) => onChange(event.target.value as Locale)}
        className="rounded-full border border-emerald/10 bg-transparent px-2 py-1 text-sm text-emerald outline-none ring-0 focus:border-gold"
      >
        {supportedLocales.map((value) => (
          <option key={value} value={value}>
            {localeLabels[value]}
          </option>
        ))}
      </select>
    </div>
  );
}

function Header({ locale, onLocaleChange }: { locale: Locale; onLocaleChange: (value: Locale) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = useMemo(
    () => [
      { to: '/', label: translations[locale].home },
      { to: '/about', label: translations[locale].about },
      { to: '/leadership', label: translations[locale].leadership },
      { to: '/cabinet', label: translations[locale].cabinet },
      { to: '/events', label: translations[locale].events },
      { to: '/culture', label: translations[locale].culture },
      { to: '/announcements', label: translations[locale].announcements },
      { to: '/join', label: translations[locale].join },
      { to: '/contact', label: translations[locale].contact },
    ],
    [locale],
  );

  return (
    <header className="site-header sticky top-0 z-20 border-b border-emerald/15 bg-ivory/95 backdrop-blur-md" dir={getDirection(locale)}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-3 py-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 xl:w-auto">
            <div className="min-w-0">
              <NavLink to="/" className="block whitespace-nowrap font-display text-xl text-emerald sm:text-2xl">
                {translations[locale].siteName}
              </NavLink>
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.26em] text-emerald/65 sm:text-[10px]">{translations[locale].subtitle}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto sm:gap-3">
              <LanguageSwitcher locale={locale} onChange={onLocaleChange} />
              <button
                type="button"
                className="rounded-full border border-emerald/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald xl:hidden"
                aria-controls="site-navigation"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? translations[locale].close : translations[locale].menu}
              </button>
            </div>
          </div>

          <nav
            id="site-navigation"
            aria-label={translations[locale].navLabel}
            className={`${menuOpen ? 'grid' : 'hidden'} w-full grid-cols-2 gap-x-4 gap-y-3 border-t border-emerald/10 py-4 text-left xl:flex xl:w-auto xl:items-center xl:justify-between xl:gap-4 xl:border-0 xl:py-2`}
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `whitespace-nowrap text-sm font-medium transition ${
                    isActive ? 'text-gold' : 'text-emerald hover:text-gold'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-10 border-t border-emerald/10 bg-emerald text-ivory">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <h2 className="font-display text-2xl">Saraiki Student Council</h2>
          <p className="mt-3 text-sm text-ivory/80">A heritage-minded student leadership platform for campus life and community voice.</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Explore</h3>
          <ul className="mt-4 space-y-2 text-sm text-ivory/80">
            <li><NavLink to="/about">About Us</NavLink></li>
            <li><NavLink to="/events">Events</NavLink></li>
            <li><NavLink to="/culture">Culture</NavLink></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Get involved</h3>
          <ul className="mt-4 space-y-2 text-sm text-ivory/80">
            <li><NavLink to="/join">Join the Council</NavLink></li>
            <li><NavLink to="/member">Member portal</NavLink></li>
            <li><NavLink to="/contact">Contact</NavLink></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Policy</h3>
          <ul className="mt-4 space-y-2 text-sm text-ivory/80">
            <li><NavLink to="/privacy">Privacy Policy</NavLink></li>
            <li><NavLink to="/terms">Terms of Use</NavLink></li>
            <li><NavLink to="/council/review">Council staff portal</NavLink></li>
            <li><NavLink to="/council/events">Event manager</NavLink></li>
            <li><NavLink to="/council/content">Content desk</NavLink></li>
            <li><NavLink to="/council/volunteers">Volunteer desk</NavLink></li>
            <li><NavLink to="/council/inbox">Council inbox</NavLink></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

function AnnouncementStrip({ locale }: { locale: Locale }) {
  const { items } = usePublicContent('announcement', locale);
  const notices = items.slice(0, 3);
  if (!notices.length) return null;

  return (
    <div className="border-b border-emerald/10 bg-maroon text-ivory">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-1 px-5 py-2 text-center text-[10px] leading-4 sm:grid-cols-3 sm:gap-4 sm:px-8 sm:py-3 sm:text-[11px] sm:leading-5 lg:px-12">
        {notices.map((item) => (
          <Link key={item.id} to={`/announcements/${item.slug}`} className="hover:text-gold">{item.title}</Link>
        ))}
      </div>
    </div>
  );
}

function HomePage({ locale }: { locale: Locale }) {
  const t = translations[locale];
  const { items: announcements } = usePublicContent('announcement', locale);
  const { items: articles } = usePublicContent('article', locale);
  const { items: leaders } = usePublicContent('leader', locale);
  const [events, setEvents] = useState<CouncilEvent[]>([]);

  useEffect(() => {
    let active = true;
    apiRequest<{ events: CouncilEvent[] }>('/api/v1/events')
      .then((result) => { if (active) setEvents(result.events.slice(0, 3)); })
      .catch(() => { if (active) setEvents([]); });
    return () => { active = false; };
  }, []);

  return (
    <>
      <AnnouncementStrip locale={locale} />
      <main className="home-main mx-auto max-w-7xl space-y-20 px-5 py-10 sm:px-8 lg:space-y-24 lg:px-12 lg:py-14">
        <section className="relative overflow-hidden rounded-sm border-y border-emerald/15 bg-white/65 py-7 sm:py-10 lg:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(197,164,93,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(23,61,53,0.14),transparent_40%)]" />
          <div className="relative grid items-center gap-7 lg:grid-cols-2 lg:gap-14">
            <div className="order-2 max-w-xl py-2 lg:order-1 lg:py-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">{t.home} <span className="mx-2 text-emerald/35">/</span> Leads University, Lahore</p>
              <h2 className="mt-4 font-display text-4xl leading-[1.02] text-emerald sm:text-6xl xl:text-6xl">
                {t.heroTitle}
              </h2>
              <p className="mt-6 max-w-lg text-base leading-7 text-charcoal/75 sm:text-lg">{t.heroText}</p>

              <div className="mt-8 flex flex-wrap gap-4">
                <NavLink to="/join" className="rounded-full bg-emerald px-6 py-3 font-semibold text-ivory transition hover:-translate-y-0.5 hover:bg-emerald/90">
                  {t.joinUs}
                </NavLink>
                <NavLink to="/events" className="rounded-full border border-emerald/20 bg-white px-6 py-3 font-semibold text-emerald transition hover:border-gold hover:text-gold">
                  {t.exploreEvents}
                </NavLink>
              </div>

              <div className="mt-7 grid grid-cols-3 gap-2 border-t border-emerald/15 pt-4 sm:gap-3">
                {impactStats.map((item) => (
                  <div key={item.label} className="py-1">
                    <p className="font-display text-3xl text-emerald">{item.value}</p>
                    <p className="mt-1 text-[9px] uppercase leading-4 tracking-[0.12em] text-charcoal/60 sm:text-[10px] sm:tracking-[0.16em]">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative order-1 lg:order-2">
              <div className="image-shell overflow-hidden rounded-sm border border-emerald/10 bg-[#e9e3d6] shadow-soft">
                <img src={assets.heroVisual} alt="Saraiki Student Council visual identity" className="aspect-[4/3] w-full object-contain" />
              </div>

              <div className="absolute bottom-4 left-4 right-4 border border-white/45 bg-emerald/90 p-4 text-ivory shadow-soft backdrop-blur-sm sm:bottom-7 sm:left-7 sm:right-auto sm:w-72">
                <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Our council</p>
                <p className="mt-2 font-display text-xl">Culture, voice, and belonging.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow="Programs"
            title={t.upcomingEvents}
            description="Curated campus experiences that bring students together around culture, service, and leadership."
          />
          {events.length === 0 ? (
            <p className="border-y border-emerald/10 py-7 text-sm text-charcoal/60">New events will be announced here.</p>
          ) : <div className="grid gap-6 md:grid-cols-3">
            {events.map((event) => (
              <article key={event.id} className="overflow-hidden border-b border-emerald/20 bg-white/60 transition hover:-translate-y-1 hover:shadow-xl">
                <div className="h-40 overflow-hidden">
                  <img
                    src={event.coverImage || assets.eventSurface}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{new Date(event.startsAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                  <h3 className="mt-3 text-2xl font-semibold text-emerald">{event.title}</h3>
                  <p className="mt-3 text-sm text-charcoal/70">{event.summary}</p>
                  <Link to={`/events/${event.slug}`} className="mt-5 inline-flex text-sm font-semibold text-maroon underline-offset-4 hover:underline">
                    View details
                  </Link>
                </div>
              </article>
            ))}
          </div>}
        </section>

        <section className="grid gap-8 rounded-[2rem] bg-emerald p-8 text-ivory shadow-soft lg:grid-cols-2 lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Mission & vision</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">Student leadership rooted in shared values.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-5">
              <h3 className="text-xl font-semibold">Our mission</h3>
              <p className="mt-2 text-sm text-ivory/80">To create a vibrant, inclusive student community that values heritage, service, and cooperation.</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-5">
              <h3 className="text-xl font-semibold">Our vision</h3>
              <p className="mt-2 text-sm text-ivory/80">To strengthen student agency through culturally grounded leadership and informed participation.</p>
            </div>
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow="Heritage"
            title={t.heritageFeature}
            description="A living archive of stories, language, and cultural continuity that connects students to one another and their heritage."
          />
          {articles.length === 0 ? <p className="border-y border-emerald/10 py-7 text-sm text-charcoal/60">Cultural stories will appear here as the council publishes them.</p> : (
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              {articles[0] && <article className="overflow-hidden border border-emerald/10 bg-white shadow-soft">
                {articles[0].imageUrl ? <img src={articles[0].imageUrl} alt="" className="h-72 w-full object-cover" /> : <div className="h-56 bg-emerald" />}
                <div className="p-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Feature article</p><h3 className="mt-3 font-display text-3xl text-emerald">{articles[0].title}</h3><p className="mt-4 text-charcoal/75">{articles[0].summary}</p><Link to={`/culture/${articles[0].slug}`} className="mt-5 inline-flex font-semibold text-maroon underline-offset-4 hover:underline">Read story</Link></div>
              </article>}
              <div className="space-y-4">{articles.slice(1, 4).map((article) => <article key={article.id} className="border-b border-emerald/15 bg-white p-5 shadow-soft"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Culture</p><h3 className="mt-2 font-display text-xl text-emerald">{article.title}</h3><p className="mt-2 text-sm text-charcoal/70">{article.summary}</p><Link to={`/culture/${article.slug}`} className="mt-4 inline-flex text-sm font-semibold text-maroon hover:underline">Read article</Link></article>)}</div>
            </div>
          )}
        </section>

        <section>
          <SectionHeader
            eyebrow="People"
            title={t.leadershipPreview}
            description="The council brings together students, mentors, and volunteers dedicated to belonging, representation, and cultural stewardship."
          />
          {leaders.length === 0 ? <p className="border-y border-emerald/10 py-7 text-sm text-charcoal/60">Council profiles will be added as they are approved for publication.</p> : <div className="grid gap-6 md:grid-cols-3">{leaders.slice(0, 3).map((profile) => <article key={profile.id} className="overflow-hidden border-b border-emerald/15 bg-white shadow-soft">{profile.imageUrl ? <img src={profile.imageUrl} alt="" className="h-48 w-full object-cover" /> : <div className="flex h-32 items-end bg-emerald p-5"><span className="font-display text-4xl text-gold">{profile.title.slice(0, 1)}</span></div>}<div className="p-6"><p className="text-xs uppercase tracking-[0.16em] text-gold">{profile.roleTitle || 'Council member'}</p><h3 className="mt-2 font-display text-2xl text-emerald">{profile.title}</h3><p className="mt-3 text-sm text-charcoal/70">{profile.summary}</p></div></article>)}</div>}
        </section>

        <section>
          <SectionHeader
            eyebrow="News"
            title={t.recentAnnouncements}
            description="A clear channel for updates, volunteer opportunities, and important campus announcements."
          />
          <div className="space-y-4">
            {announcements.length === 0 ? <p className="border-y border-emerald/10 py-7 text-sm text-charcoal/60">Council announcements will appear here when published.</p> : announcements.slice(0, 3).map((item) => (
              <article key={item.id} className="border-b border-emerald/15 bg-white/80 p-6 shadow-soft">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Announcement</p>
                    <h3 className="mt-2 text-xl font-semibold text-emerald">{item.title}</h3>
                  </div>
                  <Link to={`/announcements/${item.slug}`} className="text-sm font-semibold text-maroon hover:underline">Read update</Link>
                </div>
                <p className="mt-3 text-sm text-charcoal/70">{item.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow="Gallery"
            title={t.eventGallery}
            description="Moments from student gatherings, heritage showcases, and council-led community programming."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleryCards.map((item, index) => (
              <div key={item.title} className={`overflow-hidden rounded-[1.5rem] border border-emerald/10 bg-white shadow-soft ${item.portrait ? 'sm:row-span-2' : ''}`}>
                <div className={`${item.portrait ? 'h-[26rem] bg-[#e9e3d6]' : 'h-52'} overflow-hidden`}>
                  <img src={item.image} alt={item.title} className={`h-full w-full transition duration-500 hover:scale-105 ${item.portrait ? 'object-contain' : 'object-cover'}`} />
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-emerald">{item.title}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gold">{String(index + 1).padStart(2, '0')} / {String(galleryCards.length).padStart(2, '0')}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-8 shadow-soft lg:p-10">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">{t.contact}</p>
              <h2 className="mt-3 font-display text-3xl text-emerald">Connect with the council</h2>
              <p className="mt-3 text-charcoal/75">For enquiries, collaborations, and student outreach, we welcome your message and partnership.</p>
            </div>
            <div className="space-y-3 text-sm text-charcoal/75">
              <p><strong>Email:</strong> hello@saraikistudentcouncil.org</p>
              <p><strong>Instagram:</strong> @saraikistudentcouncil</p>
              <p><strong>Location:</strong> Leads University, Lahore</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function AboutPage() {
  return (
    <PageShell title="About Us">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-[2rem] bg-white p-8 shadow-soft">
          <h2 className="font-display text-3xl text-emerald">Our story</h2>
          <p className="mt-4 text-charcoal/75">The council exists to strengthen student voice, celebrate heritage, and build a more connected campus culture.</p>
          <p className="mt-4 text-charcoal/75">It brings together students who care about leadership, scholarship, service, and the continuity of cultural traditions.</p>
        </div>
        <div className="rounded-[2rem] bg-emerald p-8 text-ivory shadow-soft">
          <h2 className="font-display text-3xl">Mission & vision</h2>
          <p className="mt-4 text-ivory/80">We aim to create a welcoming, inclusive, and culturally rooted platform for university leadership and community life.</p>
        </div>
      </div>
    </PageShell>
  );
}

function LeaderCard({ member, featured = false }: { member: CabinetMember; featured?: boolean }) {
  const initials = member.name.split(' ').map((part) => part[0]).join('').slice(0, 2);

  return (
    <article className={featured ? 'overflow-hidden border border-gold/20 bg-white shadow-soft' : 'overflow-hidden border border-emerald/10 bg-white shadow-soft'}>
      <div className={featured ? 'relative h-[26rem] overflow-hidden bg-[#edf2ef]' : 'relative h-72 overflow-hidden bg-[#edf2ef]'}>
        {member.image ? (
          <img src={member.image} alt={member.name} className="h-full w-full object-cover object-center transition duration-300 hover:scale-[1.02]" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald to-[#d8c58a] text-4xl font-display text-ivory">
            {initials}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#091f1b]/80 via-[#091f1b]/30 to-transparent p-4 text-ivory">
          <p className="text-[10px] uppercase tracking-[0.18em] text-gold">{member.designation}</p>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <h2 className={featured ? 'font-display text-3xl text-emerald' : 'font-display text-2xl text-emerald'}>{member.name}</h2>
        {member.notes ? <p className="mt-2 text-xs uppercase tracking-[0.12em] text-maroon">Portrait pending</p> : <p className="mt-2 text-sm leading-6 text-charcoal/70">{member.designation}</p>}
      </div>
    </article>
  );
}

function LeadershipPage({ locale }: { locale: Locale }) {
  const featuredLeaders = cabinetMembers.filter((member) => member.category === 'main');
  const executiveLeaders = cabinetMembers.filter((member) => member.category === 'executive');

  return (
    <PageShell title="Leadership">
      <div className="space-y-12">
        <div className="rounded-[2rem] border border-emerald/15 bg-white p-7 shadow-soft sm:p-8">
          <p className="text-xs uppercase tracking-[0.18em] text-gold">Council leadership</p>
          <h2 className="mt-3 font-display text-4xl text-emerald sm:text-5xl">Cabinet 2026–2027</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-charcoal/75">The Saraiki Student Council brings together students, community leaders, and cultural ambassadors to strengthen representation, leadership, and student belonging across campus life.</p>
          <Link to="/cabinet" className="mt-6 inline-flex text-sm font-semibold text-maroon underline-offset-4 hover:underline">View the complete cabinet</Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-3">
          {featuredLeaders.map((member) => (
            <div key={member.id} className={member.name === 'Amjad Amin' ? 'lg:col-span-1 lg:row-span-2' : ''}>
              <LeaderCard member={member} featured={member.name === 'Amjad Amin'} />
            </div>
          ))}
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-emerald/15 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gold">Executive cabinet</p>
              <h2 className="mt-2 font-display text-3xl text-emerald">Leadership in action</h2>
            </div>
            <Link to="/cabinet" className="text-sm font-semibold text-maroon underline-offset-4 hover:underline">Open cabinet directory</Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {executiveLeaders.map((member) => <LeaderCard key={member.id} member={member} />)}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function CabinetPage() {
  return (
    <PageShell title="Cabinet 2026–2027">
      <div className="mb-8 flex items-center justify-between gap-4 border-b border-emerald/15 pb-4">
        <p className="text-sm text-charcoal/65">Official council cabinet and leadership roster.</p>
        <Link to="/leadership" className="text-sm font-semibold text-maroon underline-offset-4 hover:underline">Back to leadership</Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cabinetMembers.map((member) => (
          <LeaderCard key={member.id} member={member} />
        ))}
      </div>
    </PageShell>
  );
}

function EventsPage() {
  const [events, setEvents] = useState<CouncilEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest<{ events: CouncilEvent[] }>('/api/v1/events')
      .then((result) => { if (active) setEvents(result.events); })
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : 'Could not load events.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <PageShell title="Events">
      {error && <p role="alert" className="mb-6 border-l-2 border-maroon bg-white px-4 py-3 text-sm text-maroon">{error}</p>}
      {loading ? <p className="py-12 text-center text-sm text-charcoal/60">Loading events…</p> : events.length === 0 ? (
        <div className="border-y border-emerald/15 py-14 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Council calendar</p>
          <h2 className="mt-3 font-display text-3xl text-emerald">The next gathering is taking shape.</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-charcoal/65">Published events will appear here with details and registration information.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <article key={event.id} className="overflow-hidden border-b border-emerald/20 bg-white/70 shadow-soft">
              <div className="h-52 overflow-hidden bg-ivory">
                <img src={event.coverImage || assets.eventSurface} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{new Date(event.startsAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                <h2 className="mt-3 font-display text-2xl text-emerald">{event.title}</h2>
                <p className="mt-3 text-sm leading-6 text-charcoal/70">{event.summary}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.12em] text-charcoal/55">{event.venue}</p>
                <Link to={`/events/${event.slug}`} className="mt-5 inline-flex text-sm font-semibold text-maroon underline-offset-4 hover:underline">Event details and registration</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function EventDetailPage() {
  const { slug = '' } = useParams();
  const [event, setEvent] = useState<CouncilEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiRequest<{ event: CouncilEvent }>(`/api/v1/events/${slug}`)
      .then((result) => { if (active) setEvent(result.event); })
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : 'Event not found.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  async function register(eventValue: FormEvent<HTMLFormElement>) {
    eventValue.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const result = await apiRequest<{ registration: { eventTitle: string } }>(`/api/v1/events/${slug}/registrations`, {
        method: 'POST',
        body: JSON.stringify({ fullName, email, studentId, privacyAcknowledged }),
      });
      setMessage(`Your place for ${result.registration.eventTitle} is confirmed.`);
      setEvent((current) => current ? { ...current, registrationCount: current.registrationCount + 1 } : current);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Registration could not be completed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell title="Event detail">
      {loading ? <p className="text-sm text-charcoal/60">Loading event…</p> : !event ? (
        <div role="alert" className="border-l-2 border-maroon bg-white p-6 text-maroon">{error || 'Event not found.'}</div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div>
            <div className="h-64 overflow-hidden bg-ivory sm:h-96"><img src={event.coverImage || assets.eventSurface} alt="" className="h-full w-full object-cover" /></div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-gold">{new Date(event.startsAt).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}</p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-emerald sm:text-5xl">{event.title}</h2>
            <p className="mt-5 text-base leading-7 text-charcoal/75">{event.description}</p>
            <div className="mt-7 grid gap-4 border-t border-emerald/15 pt-5 sm:grid-cols-2">
              <div><p className="text-xs uppercase tracking-[0.16em] text-charcoal/50">Venue</p><p className="mt-1 text-sm text-charcoal/80">{event.venue}</p></div>
              <div><p className="text-xs uppercase tracking-[0.16em] text-charcoal/50">Places</p><p className="mt-1 text-sm text-charcoal/80">{event.capacity ? `${Math.max(event.capacity - event.registrationCount, 0)} of ${event.capacity} remaining` : 'Open registration'}</p></div>
            </div>
          </div>
          <aside className="h-fit border border-emerald/15 bg-white p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Registration</p>
            <h3 className="mt-3 font-display text-3xl text-emerald">Save your place.</h3>
            {message ? <p role="status" className="mt-5 border-l-2 border-emerald bg-emerald/5 px-4 py-3 text-sm text-emerald">{message}</p> : event.registrationOpen && (!event.capacity || event.registrationCount < event.capacity) ? (
              <form onSubmit={register} className="mt-6 space-y-4">
                <label className="block text-sm font-medium text-emerald">Full name<input required autoComplete="name" className="mt-2 w-full border border-emerald/20 px-3 py-3 text-sm outline-none focus:border-gold" value={fullName} onChange={(input) => setFullName(input.target.value)} /></label>
                <label className="block text-sm font-medium text-emerald">University email<input required type="email" autoComplete="email" className="mt-2 w-full border border-emerald/20 px-3 py-3 text-sm outline-none focus:border-gold" value={email} onChange={(input) => setEmail(input.target.value)} /></label>
                <label className="block text-sm font-medium text-emerald">Student ID<input required className="mt-2 w-full border border-emerald/20 px-3 py-3 text-sm outline-none focus:border-gold" value={studentId} onChange={(input) => setStudentId(input.target.value)} /></label>
                <label className="flex items-start gap-3 text-xs leading-5 text-charcoal/70"><input required type="checkbox" checked={privacyAcknowledged} onChange={(input) => setPrivacyAcknowledged(input.target.checked)} className="mt-1 accent-emerald" /><span>I agree that the council may use these details to manage my event registration.</span></label>
                {error && <p role="alert" className="text-sm text-maroon">{error}</p>}
                <button disabled={submitting} className="w-full bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ivory disabled:opacity-50">{submitting ? 'Confirming…' : 'Register for event'}</button>
              </form>
            ) : <p className="mt-5 text-sm leading-6 text-charcoal/70">Registration is currently closed or this event is full.</p>}
          </aside>
        </div>
      )}
    </PageShell>
  );
}

function EventManagementPage() {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [events, setEvents] = useState<CouncilEvent[]>([]);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', summary: '', description: '', startsAt: '', endsAt: '', venue: '', capacity: '', coverImage: '', registrationOpen: true, status: 'published' as 'draft' | 'published' });

  useEffect(() => {
    let active = true;
    apiRequest<{ user: StaffUser }>('/api/v1/auth/me')
      .then((result) => { if (active) setStaff(result.user); })
      .catch(() => { if (active) setStaff(null); })
      .finally(() => { if (active) setAuthChecked(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!staff || !['admin', 'event_manager'].includes(staff.role)) return;
    let active = true;
    setLoading(true);
    apiRequest<{ events: CouncilEvent[] }>('/api/v1/events?manage=true')
      .then((result) => { if (active) setEvents(result.events); })
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : 'Could not load events.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [staff]);

  async function signIn(eventValue: FormEvent<HTMLFormElement>) {
    eventValue.preventDefault();
    setError('');
    try {
      const result = await apiRequest<{ user: StaffUser }>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setStaff(result.user);
      setPassword('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Sign-in failed.');
    }
  }

  async function createEvent(eventValue: FormEvent<HTMLFormElement>) {
    eventValue.preventDefault();
    setError('');
    setMessage('');
    const slug = form.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    try {
      const result = await apiRequest<{ event: CouncilEvent }>('/api/v1/events', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          slug,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
          capacity: form.capacity ? Number(form.capacity) : undefined,
          coverImage: form.coverImage || undefined,
        }),
      });
      setEvents((current) => [...current, result.event].sort((left, right) => left.startsAt.localeCompare(right.startsAt)));
      setForm({ title: '', summary: '', description: '', startsAt: '', endsAt: '', venue: '', capacity: '', coverImage: '', registrationOpen: true, status: 'published' });
      setMessage('Event created.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Event could not be created.');
    }
  }

  async function viewAttendees(slug: string) {
    setSelectedSlug(slug);
    setError('');
    try {
      const result = await apiRequest<{ registrations: EventAttendee[] }>(`/api/v1/events/${slug}/registrations`);
      setAttendees(result.registrations);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Attendee list could not be loaded.');
    }
  }

  async function signOut() {
    try { await apiRequest('/api/v1/auth/logout', { method: 'POST' }); }
    finally { setStaff(null); setEvents([]); setAttendees([]); }
  }

  const inputClass = 'mt-2 w-full border border-emerald/20 bg-white px-3 py-3 text-sm outline-none focus:border-gold';

  return (
    <PageShell title="Event Management">
      {!authChecked ? <p className="text-sm text-charcoal/60">Checking staff session…</p> : !staff ? (
        <div className="mx-auto max-w-xl border border-emerald/15 bg-white p-7 shadow-soft">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Event team</p>
          <h2 className="mt-3 font-display text-3xl text-emerald">Sign in to manage events</h2>
          <form onSubmit={signIn} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-emerald">Email<input required type="email" className={inputClass} value={email} onChange={(input) => setEmail(input.target.value)} /></label>
            <label className="block text-sm font-medium text-emerald">Password<input required type="password" className={inputClass} value={password} onChange={(input) => setPassword(input.target.value)} /></label>
            {error && <p role="alert" className="text-sm text-maroon">{error}</p>}
            <button className="w-full bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ivory">Sign in</button>
          </form>
        </div>
      ) : !['admin', 'event_manager'].includes(staff.role) ? (
        <div className="border-l-2 border-maroon bg-white p-6"><h2 className="font-display text-2xl text-emerald">Event management is not enabled for this account.</h2><button type="button" onClick={() => void signOut()} className="mt-4 text-sm text-maroon underline">Sign out</button></div>
      ) : (
        <div className="grid gap-10 xl:grid-cols-[0.9fr_1.1fr]">
          <section>
            <div className="mb-6 flex items-end justify-between gap-4 border-b border-emerald/15 pb-4">
              <div><p className="text-xs uppercase tracking-[0.16em] text-charcoal/55">Signed in · {staff.email}</p><h2 className="mt-2 font-display text-3xl text-emerald">Create an event</h2></div>
              <button type="button" onClick={() => void signOut()} className="text-sm font-semibold text-maroon underline">Sign out</button>
            </div>
            <form onSubmit={createEvent} className="space-y-4 border border-emerald/10 bg-white p-5 shadow-soft sm:p-7">
              <label className="block text-sm font-medium text-emerald">Title<input required minLength={3} maxLength={140} className={inputClass} value={form.title} onChange={(input) => setForm((current) => ({ ...current, title: input.target.value }))} /></label>
              <label className="block text-sm font-medium text-emerald">Short summary<input required minLength={10} maxLength={280} className={inputClass} value={form.summary} onChange={(input) => setForm((current) => ({ ...current, summary: input.target.value }))} /></label>
              <label className="block text-sm font-medium text-emerald">Description<textarea required minLength={10} maxLength={5000} rows={4} className={inputClass} value={form.description} onChange={(input) => setForm((current) => ({ ...current, description: input.target.value }))} /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-emerald">Starts<input required type="datetime-local" className={inputClass} value={form.startsAt} onChange={(input) => setForm((current) => ({ ...current, startsAt: input.target.value }))} /></label>
                <label className="block text-sm font-medium text-emerald">Ends<input required type="datetime-local" className={inputClass} value={form.endsAt} onChange={(input) => setForm((current) => ({ ...current, endsAt: input.target.value }))} /></label>
              </div>
              <label className="block text-sm font-medium text-emerald">Venue<input required minLength={2} className={inputClass} value={form.venue} onChange={(input) => setForm((current) => ({ ...current, venue: input.target.value }))} /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-emerald">Capacity <span className="font-normal text-charcoal/50">(blank means unlimited)</span><input type="number" min="1" step="1" className={inputClass} value={form.capacity} onChange={(input) => setForm((current) => ({ ...current, capacity: input.target.value }))} /></label>
                <label className="block text-sm font-medium text-emerald">Cover image URL <span className="font-normal text-charcoal/50">(optional)</span><input type="url" className={inputClass} value={form.coverImage} onChange={(input) => setForm((current) => ({ ...current, coverImage: input.target.value }))} /></label>
              </div>
              <div className="flex flex-wrap items-center gap-5 border-t border-emerald/10 pt-4">
                <label className="flex items-center gap-2 text-sm text-charcoal/75"><input type="checkbox" checked={form.registrationOpen} onChange={(input) => setForm((current) => ({ ...current, registrationOpen: input.target.checked }))} className="accent-emerald" /> Open registration</label>
                <label className="flex items-center gap-2 text-sm text-charcoal/75"><input type="checkbox" checked={form.status === 'published'} onChange={(input) => setForm((current) => ({ ...current, status: input.target.checked ? 'published' : 'draft' }))} className="accent-emerald" /> Publish immediately</label>
              </div>
              {error && <p role="alert" className="text-sm text-maroon">{error}</p>}
              {message && <p role="status" className="text-sm text-emerald">{message}</p>}
              <button className="bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-ivory">Create event</button>
            </form>
          </section>
          <section>
            <div className="border-b border-emerald/15 pb-4"><p className="text-xs uppercase tracking-[0.16em] text-charcoal/55">{staff.role}</p><h2 className="mt-2 font-display text-3xl text-emerald">Calendar and attendees</h2></div>
            {loading ? <p className="py-8 text-sm text-charcoal/60">Loading calendar…</p> : events.length === 0 ? <p className="py-8 text-sm text-charcoal/60">No events created yet.</p> : (
              <div className="mt-4 divide-y divide-emerald/10">
                {events.map((event) => (
                  <article key={event.id} className="py-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div><p className="text-xs uppercase tracking-[0.15em] text-gold">{event.status} · {event.registrationOpen ? 'registration open' : 'registration closed'}</p><h3 className="mt-2 font-display text-xl text-emerald">{event.title}</h3><p className="mt-1 text-sm text-charcoal/65">{new Date(event.startsAt).toLocaleString()} · {event.venue}</p></div>
                      <span className="text-sm text-charcoal/60">{event.registrationCount}{event.capacity ? ` / ${event.capacity}` : ''} registered</span>
                    </div>
                    <button type="button" onClick={() => void viewAttendees(event.slug)} className="mt-3 text-sm font-semibold text-maroon underline">{selectedSlug === event.slug ? 'Refresh attendee list' : 'View attendees'}</button>
                    {selectedSlug === event.slug && <div className="mt-3 border-l-2 border-gold pl-4">{attendees.length ? attendees.map((attendee) => <div key={attendee.id} className="py-2 text-sm"><strong className="text-emerald">{attendee.fullName}</strong><span className="text-charcoal/60"> · {attendee.studentId} · {attendee.email}</span></div>) : <p className="py-2 text-sm text-charcoal/60">No registrations yet.</p>}</div>}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </PageShell>
  );
}

function ContentManagementPage() {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contentType, setContentType] = useState<CmsContent['contentType']>('announcement');
  const [items, setItems] = useState<CmsContent[]>([]);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const emptyForm = { title: '', summary: '', body: '', locale: 'en' as Locale, roleTitle: '', imageUrl: '', status: 'draft' as 'draft' | 'published' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    let active = true;
    apiRequest<{ user: StaffUser }>('/api/v1/auth/me')
      .then((result) => { if (active) setStaff(result.user); })
      .catch(() => { if (active) setStaff(null); })
      .finally(() => { if (active) setAuthChecked(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!staff || !['admin', 'editor'].includes(staff.role)) return;
    let active = true;
    setLoading(true);
    apiRequest<{ items: CmsContent[] }>(`/api/v1/content/manage/${contentType}`)
      .then((result) => { if (active) setItems(result.items); })
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : 'Could not load content.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [staff, contentType]);

  async function signIn(eventValue: FormEvent<HTMLFormElement>) {
    eventValue.preventDefault();
    setError('');
    try {
      const result = await apiRequest<{ user: StaffUser }>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setStaff(result.user);
      setPassword('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Sign-in failed.');
    }
  }

  function startEditing(item: CmsContent) {
    setEditingId(item.id);
    setForm({ title: item.title, summary: item.summary, body: item.body, locale: item.locale, roleTitle: item.roleTitle ?? '', imageUrl: item.imageUrl ?? '', status: item.status });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveContent(eventValue: FormEvent<HTMLFormElement>) {
    eventValue.preventDefault();
    setError('');
    setMessage('');
    const slug = form.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const payload = { ...form, slug, contentType, roleTitle: form.roleTitle || undefined, imageUrl: form.imageUrl || undefined };
    try {
      const result = editingId
        ? await apiRequest<{ item: CmsContent }>(`/api/v1/content/manage/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) })
        : await apiRequest<{ item: CmsContent }>('/api/v1/content/manage', { method: 'POST', body: JSON.stringify(payload) });
      setItems((current) => editingId ? current.map((item) => item.id === editingId ? result.item : item) : [result.item, ...current]);
      setForm(emptyForm);
      setEditingId('');
      setMessage(editingId ? 'Changes saved.' : 'Content created.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Content could not be saved.');
    }
  }

  async function changeContentStatus(item: CmsContent) {
    const status = item.status === 'published' ? 'draft' : 'published';
    setError('');
    try {
      const result = await apiRequest<{ item: CmsContent }>(`/api/v1/content/manage/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setItems((current) => current.map((currentItem) => currentItem.id === item.id ? result.item : currentItem));
      setMessage(status === 'published' ? 'Content published.' : 'Content moved back to draft.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The status could not be changed.');
    }
  }

  async function signOut() {
    try { await apiRequest('/api/v1/auth/logout', { method: 'POST' }); }
    finally { setStaff(null); setItems([]); }
  }

  const inputClass = 'mt-2 w-full border border-emerald/20 bg-white px-3 py-3 text-sm outline-none focus:border-gold';

  return (
    <PageShell title="Content Desk">
      {!authChecked ? <p className="text-sm text-charcoal/60">Checking staff session…</p> : !staff ? (
        <div className="mx-auto max-w-xl border border-emerald/15 bg-white p-7 shadow-soft"><p className="text-xs uppercase tracking-[0.2em] text-gold">Editorial team</p><h2 className="mt-3 font-display text-3xl text-emerald">Sign in to manage council content</h2><form onSubmit={signIn} className="mt-6 space-y-4"><label className="block text-sm font-medium text-emerald">Email<input required type="email" className={inputClass} value={email} onChange={(input) => setEmail(input.target.value)} /></label><label className="block text-sm font-medium text-emerald">Password<input required type="password" className={inputClass} value={password} onChange={(input) => setPassword(input.target.value)} /></label>{error && <p role="alert" className="text-sm text-maroon">{error}</p>}<button className="w-full bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ivory">Sign in</button></form></div>
      ) : !['admin', 'editor'].includes(staff.role) ? (
        <div className="border-l-2 border-maroon bg-white p-6"><h2 className="font-display text-2xl text-emerald">Content editing is not enabled for this account.</h2><button type="button" onClick={() => void signOut()} className="mt-4 text-sm text-maroon underline">Sign out</button></div>
      ) : (
        <div className="grid gap-10 xl:grid-cols-[0.92fr_1.08fr]">
          <section>
            <div className="mb-5 flex items-end justify-between gap-4 border-b border-emerald/15 pb-4"><div><p className="text-xs uppercase tracking-[0.16em] text-charcoal/55">Signed in · {staff.email}</p><h2 className="mt-2 font-display text-3xl text-emerald">{editingId ? 'Edit content' : 'Create content'}</h2></div><button type="button" onClick={() => void signOut()} className="text-sm text-maroon underline">Sign out</button></div>
            <form onSubmit={saveContent} className="space-y-4 border border-emerald/10 bg-white p-5 shadow-soft sm:p-7">
              <label className="block text-sm font-medium text-emerald">Section<select disabled={Boolean(editingId)} className={inputClass} value={contentType} onChange={(input) => setContentType(input.target.value as CmsContent['contentType'])}><option value="announcement">Announcement</option><option value="article">Culture article</option><option value="leader">Leadership profile</option></select></label>
              <label className="block text-sm font-medium text-emerald">Title<input required minLength={2} maxLength={180} className={inputClass} value={form.title} onChange={(input) => setForm((current) => ({ ...current, title: input.target.value }))} /></label>
              <label className="block text-sm font-medium text-emerald">Summary<input required minLength={8} maxLength={360} className={inputClass} value={form.summary} onChange={(input) => setForm((current) => ({ ...current, summary: input.target.value }))} /></label>
              <label className="block text-sm font-medium text-emerald">Full text / biography<textarea required rows={7} minLength={8} maxLength={12000} className={inputClass} value={form.body} onChange={(input) => setForm((current) => ({ ...current, body: input.target.value }))} /></label>
              <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-emerald">Language<select className={inputClass} value={form.locale} onChange={(input) => setForm((current) => ({ ...current, locale: input.target.value as Locale }))}>{supportedLocales.map((locale) => <option key={locale} value={locale}>{localeLabels[locale]}</option>)}</select></label><label className="block text-sm font-medium text-emerald">Status<select className={inputClass} value={form.status} onChange={(input) => setForm((current) => ({ ...current, status: input.target.value as 'draft' | 'published' }))}><option value="draft">Draft</option><option value="published">Published</option></select></label></div>
              {contentType === 'leader' && <label className="block text-sm font-medium text-emerald">Council role<input maxLength={120} className={inputClass} value={form.roleTitle} onChange={(input) => setForm((current) => ({ ...current, roleTitle: input.target.value }))} /></label>}
              <label className="block text-sm font-medium text-emerald">Image URL <span className="font-normal text-charcoal/50">(optional)</span><input type="url" className={inputClass} value={form.imageUrl} onChange={(input) => setForm((current) => ({ ...current, imageUrl: input.target.value }))} /></label>
              {error && <p role="alert" className="text-sm text-maroon">{error}</p>}{message && <p role="status" className="text-sm text-emerald">{message}</p>}
              <div className="flex flex-wrap gap-3"><button className="bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-ivory">{editingId ? 'Save changes' : 'Create item'}</button>{editingId && <button type="button" onClick={() => { setEditingId(''); setForm(emptyForm); }} className="border border-emerald/20 px-5 py-3 text-sm text-emerald">Cancel edit</button>}</div>
            </form>
          </section>
          <section>
            <div className="flex flex-col gap-4 border-b border-emerald/15 pb-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-charcoal/55">{staff.role} · editorial</p><h2 className="mt-2 font-display text-3xl text-emerald">Manage published work</h2></div><label className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald">Section<select aria-label="Content section filter" className="ml-2 border border-emerald/20 bg-white px-3 py-2 text-sm normal-case tracking-normal" value={contentType} onChange={(input) => { setContentType(input.target.value as CmsContent['contentType']); setEditingId(''); setForm(emptyForm); }}><option value="announcement">Announcements</option><option value="article">Culture stories</option><option value="leader">Leadership</option></select></label></div>
            {loading ? <p className="py-8 text-sm text-charcoal/60">Loading editorial items…</p> : items.length === 0 ? <div className="py-12 text-center"><p className="text-sm text-charcoal/60">No items in this section yet.</p></div> : <div className="divide-y divide-emerald/10">{items.map((item) => <article key={item.id} className="py-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs uppercase tracking-[0.14em] text-gold">{item.status} · {localeLabels[item.locale]}</p><h3 className="mt-1 font-display text-xl text-emerald">{item.title}</h3><p className="mt-1 text-sm text-charcoal/65">{item.summary}</p></div><div className="flex shrink-0 gap-3"><button type="button" onClick={() => startEditing(item)} className="text-sm font-semibold text-emerald underline">Edit</button><button type="button" onClick={() => void changeContentStatus(item)} className="text-sm font-semibold text-maroon underline">{item.status === 'published' ? 'Unpublish' : 'Publish'}</button></div></div></article>)}</div>}
          </section>
        </div>
      )}
    </PageShell>
  );
}

function VolunteerManagementPage() {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [opportunities, setOpportunities] = useState<ManagedVolunteerOpportunity[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ title: '', summary: '', details: '', areas: '', startsAt: '', venue: '' });
  const inputClass = 'mt-2 w-full border border-emerald/20 bg-white px-3 py-3 text-sm outline-none focus:border-gold';

  async function loadOpportunities() {
    const result = await apiRequest<{ opportunities: ManagedVolunteerOpportunity[] }>('/api/v1/volunteers/manage');
    setOpportunities(result.opportunities);
  }

  useEffect(() => {
    let active = true;
    apiRequest<{ user: StaffUser }>('/api/v1/auth/me')
      .then(async (result) => {
        if (!active) return;
        setStaff(result.user);
        if (['admin', 'event_manager'].includes(result.user.role)) {
          try { await loadOpportunities(); }
          catch (requestError) { if (active) setError(requestError instanceof Error ? requestError.message : 'Could not load volunteer opportunities.'); }
        }
      })
      .catch(() => { if (active) setStaff(null); })
      .finally(() => { if (active) setAuthChecked(true); });
    return () => { active = false; };
  }, []);

  async function signIn(eventValue: FormEvent<HTMLFormElement>) {
    eventValue.preventDefault();
    setError('');
    try {
      const result = await apiRequest<{ user: StaffUser }>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setStaff(result.user);
      setPassword('');
      if (['admin', 'event_manager'].includes(result.user.role)) await loadOpportunities();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Sign-in failed.');
    }
  }

  async function createOpportunity(eventValue: FormEvent<HTMLFormElement>) {
    eventValue.preventDefault();
    setError('');
    setMessage('');
    try {
      await apiRequest('/api/v1/volunteers/manage', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          summary: form.summary,
          details: form.details,
          areas: form.areas.split(',').map((area) => area.trim()).filter(Boolean),
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
          venue: form.venue || undefined,
        }),
      });
      setForm({ title: '', summary: '', details: '', areas: '', startsAt: '', venue: '' });
      await loadOpportunities();
      setMessage('Volunteer opportunity opened.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Opportunity could not be created.');
    }
  }

  async function changeOpportunityStatus(opportunity: ManagedVolunteerOpportunity) {
    try {
      await apiRequest(`/api/v1/volunteers/manage/${opportunity.id}`, { method: 'PATCH', body: JSON.stringify({ status: opportunity.status === 'open' ? 'closed' : 'open' }) });
      await loadOpportunities();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Opportunity status could not be changed.');
    }
  }

  async function decideSignup(signupId: string, status: 'accepted' | 'declined') {
    setError('');
    try {
      await apiRequest(`/api/v1/volunteers/manage/signups/${signupId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await loadOpportunities();
      setMessage(status === 'accepted' ? 'Volunteer accepted.' : 'Volunteer application declined.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Volunteer decision could not be saved.');
    }
  }

  async function signOut() {
    try { await apiRequest('/api/v1/auth/logout', { method: 'POST' }); }
    finally { setStaff(null); setOpportunities([]); }
  }

  return (
    <PageShell title="Volunteer Desk">
      {!authChecked ? <p className="text-sm text-charcoal/60">Checking staff session…</p> : !staff ? (
        <div className="mx-auto max-w-xl border border-emerald/15 bg-white p-7 shadow-soft"><p className="text-xs uppercase tracking-[0.18em] text-gold">Community team</p><h2 className="mt-3 font-display text-3xl text-emerald">Sign in to manage volunteers</h2><form onSubmit={signIn} className="mt-6 space-y-4"><label className="block text-sm font-medium text-emerald">Email<input required type="email" className={inputClass} value={email} onChange={(input) => setEmail(input.target.value)} /></label><label className="block text-sm font-medium text-emerald">Password<input required type="password" className={inputClass} value={password} onChange={(input) => setPassword(input.target.value)} /></label>{error && <p role="alert" className="text-sm text-maroon">{error}</p>}<button className="w-full bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ivory">Sign in</button></form></div>
      ) : !['admin', 'event_manager'].includes(staff.role) ? (
        <div className="border-l-2 border-maroon bg-white p-6"><h2 className="font-display text-2xl text-emerald">Volunteer management is not enabled for this account.</h2><button type="button" onClick={() => void signOut()} className="mt-4 text-sm text-maroon underline">Sign out</button></div>
      ) : (
        <div>
          <div className="mb-8 flex flex-col gap-4 border-b border-emerald/15 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-charcoal/55">Signed in · {staff.email}</p><h2 className="mt-2 font-display text-3xl text-emerald">Create an opportunity</h2></div><button type="button" onClick={() => void signOut()} className="text-sm font-semibold text-maroon underline">Sign out</button></div>
          <form onSubmit={createOpportunity} className="grid gap-4 border border-emerald/10 bg-white p-5 shadow-soft md:grid-cols-2 sm:p-7">
            <label className="block text-sm font-medium text-emerald">Title<input required minLength={3} maxLength={140} className={inputClass} value={form.title} onChange={(input) => setForm((current) => ({ ...current, title: input.target.value }))} /></label>
            <label className="block text-sm font-medium text-emerald">Focus areas <span className="font-normal text-charcoal/50">(comma separated)</span><input className={inputClass} value={form.areas} onChange={(input) => setForm((current) => ({ ...current, areas: input.target.value }))} /></label>
            <label className="block text-sm font-medium text-emerald md:col-span-2">Summary<input required minLength={10} maxLength={280} className={inputClass} value={form.summary} onChange={(input) => setForm((current) => ({ ...current, summary: input.target.value }))} /></label>
            <label className="block text-sm font-medium text-emerald md:col-span-2">Details<textarea required minLength={10} maxLength={3000} rows={4} className={inputClass} value={form.details} onChange={(input) => setForm((current) => ({ ...current, details: input.target.value }))} /></label>
            <label className="block text-sm font-medium text-emerald">Date and time <span className="font-normal text-charcoal/50">(optional)</span><input type="datetime-local" className={inputClass} value={form.startsAt} onChange={(input) => setForm((current) => ({ ...current, startsAt: input.target.value }))} /></label>
            <label className="block text-sm font-medium text-emerald">Location <span className="font-normal text-charcoal/50">(optional)</span><input className={inputClass} value={form.venue} onChange={(input) => setForm((current) => ({ ...current, venue: input.target.value }))} /></label>
            {error && <p role="alert" className="text-sm text-maroon md:col-span-2">{error}</p>}{message && <p role="status" className="text-sm text-emerald md:col-span-2">{message}</p>}
            <div className="md:col-span-2"><button className="bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-ivory">Open volunteer call</button></div>
          </form>
          <section className="mt-12"><div className="border-b border-emerald/15 pb-4"><p className="text-xs uppercase tracking-[0.16em] text-gold">Applications</p><h2 className="mt-2 font-display text-3xl text-emerald">Open and recent opportunities</h2></div>{opportunities.length === 0 ? <p className="py-8 text-sm text-charcoal/60">No volunteer calls have been created yet.</p> : <div className="mt-4 divide-y divide-emerald/10">{opportunities.map((opportunity) => <article key={opportunity.id} className="py-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs uppercase tracking-[0.15em] text-gold">{opportunity.status} · {opportunity.signups.length} applications</p><h3 className="mt-2 font-display text-2xl text-emerald">{opportunity.title}</h3><p className="mt-2 text-sm text-charcoal/65">{opportunity.summary}</p></div><button type="button" onClick={() => void changeOpportunityStatus(opportunity)} className="w-fit text-sm font-semibold text-maroon underline">{opportunity.status === 'open' ? 'Close call' : 'Reopen call'}</button></div>{opportunity.signups.length > 0 && <div className="mt-4 divide-y divide-emerald/10 border-l-2 border-gold pl-4">{opportunity.signups.map((signup) => <div key={signup.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs uppercase tracking-[0.12em] text-charcoal/50">{signup.status}</p><p className="mt-1 text-sm font-semibold text-emerald">{signup.memberId.fullName} · {signup.memberId.studentId}</p><p className="text-xs text-charcoal/60">{signup.memberId.department} · semester {signup.memberId.semester}{signup.note ? ` · ${signup.note}` : ''}</p></div>{signup.status === 'applied' && <div className="flex gap-3"><button type="button" onClick={() => void decideSignup(signup.id, 'accepted')} className="text-sm font-semibold text-emerald underline">Accept</button><button type="button" onClick={() => void decideSignup(signup.id, 'declined')} className="text-sm font-semibold text-maroon underline">Decline</button></div>}</div>)}</div>}</article>)}</div>}</section>
        </div>
      )}
    </PageShell>
  );
}

function ContactInboxPage() {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [messages, setMessages] = useState<ContactMessageView[]>([]);
  const [error, setError] = useState('');

  async function loadMessages() {
    const result = await apiRequest<{ messages: ContactMessageView[] }>('/api/v1/contact/manage');
    setMessages(result.messages);
  }

  useEffect(() => {
    let active = true;
    apiRequest<{ user: StaffUser }>('/api/v1/auth/me')
      .then(async (result) => {
        if (!active) return;
        setStaff(result.user);
        if (['admin', 'editor'].includes(result.user.role)) {
          try { await loadMessages(); }
          catch (requestError) { if (active) setError(requestError instanceof Error ? requestError.message : 'Inbox could not be loaded.'); }
        }
      })
      .catch(() => { if (active) setStaff(null); })
      .finally(() => { if (active) setAuthChecked(true); });
    return () => { active = false; };
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      const result = await apiRequest<{ user: StaffUser }>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setStaff(result.user);
      setPassword('');
      if (['admin', 'editor'].includes(result.user.role)) await loadMessages();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Sign-in failed.');
    }
  }

  async function markRead(messageId: string) {
    try {
      await apiRequest(`/api/v1/contact/${messageId}/read`, { method: 'PATCH' });
      setMessages((current) => current.map((message) => message.id === messageId ? { ...message, readAt: new Date().toISOString() } : message));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Message could not be updated.');
    }
  }

  async function signOut() {
    try { await apiRequest('/api/v1/auth/logout', { method: 'POST' }); }
    finally { setStaff(null); setMessages([]); }
  }

  return (
    <PageShell title="Council Inbox">
      {!authChecked ? <p className="text-sm text-charcoal/60">Checking staff session…</p> : !staff ? (
        <div className="mx-auto max-w-xl border border-emerald/15 bg-white p-7 shadow-soft"><p className="text-xs uppercase tracking-[0.18em] text-gold">Staff access</p><h2 className="mt-3 font-display text-3xl text-emerald">Sign in to read enquiries</h2><form onSubmit={signIn} className="mt-6 space-y-4"><label className="block text-sm font-medium text-emerald">Email<input required type="email" className="mt-2 w-full border border-emerald/20 px-3 py-3 text-sm outline-none focus:border-gold" value={email} onChange={(input) => setEmail(input.target.value)} /></label><label className="block text-sm font-medium text-emerald">Password<input required type="password" className="mt-2 w-full border border-emerald/20 px-3 py-3 text-sm outline-none focus:border-gold" value={password} onChange={(input) => setPassword(input.target.value)} /></label>{error && <p role="alert" className="text-sm text-maroon">{error}</p>}<button className="w-full bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ivory">Sign in</button></form></div>
      ) : !['admin', 'editor'].includes(staff.role) ? (
        <div className="border-l-2 border-maroon bg-white p-6"><h2 className="font-display text-2xl text-emerald">Inbox access is not enabled for this account.</h2><button type="button" onClick={() => void signOut()} className="mt-4 text-sm text-maroon underline">Sign out</button></div>
      ) : (
        <div><div className="flex flex-col gap-4 border-b border-emerald/15 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-charcoal/55">Signed in · {staff.email}</p><h2 className="mt-2 font-display text-3xl text-emerald">Public enquiries</h2></div><div className="flex gap-4"><button type="button" onClick={() => void loadMessages()} className="text-sm font-semibold text-emerald underline">Refresh</button><button type="button" onClick={() => void signOut()} className="text-sm font-semibold text-maroon underline">Sign out</button></div></div>{error && <p role="alert" className="mt-4 text-sm text-maroon">{error}</p>}{messages.length === 0 ? <p className="py-12 text-center text-sm text-charcoal/60">The council inbox is clear.</p> : <div className="divide-y divide-emerald/10">{messages.map((message) => <article key={message.id} className={`py-6 ${message.readAt ? 'opacity-70' : ''}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs uppercase tracking-[0.14em] text-gold">{message.readAt ? 'Read' : 'New'} · {new Date(message.createdAt).toLocaleString()}</p><h3 className="mt-2 font-display text-2xl text-emerald">{message.subject}</h3><p className="mt-1 text-sm text-charcoal/65">{message.fullName} · <a className="text-maroon underline" href={`mailto:${message.email}`}>{message.email}</a></p></div>{!message.readAt && <button type="button" onClick={() => void markRead(message.id)} className="w-fit text-sm font-semibold text-maroon underline">Mark as read</button>}</div><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-charcoal/80">{message.message}</p>{message.emailStatus !== 'sent' && <p className="mt-3 text-xs text-maroon">Email notification: {message.emailStatus}. The message remains safely stored here.</p>}</article>)}</div>}</div>
      )}
    </PageShell>
  );
}

function CulturePage({ locale }: { locale: Locale }) {
  const { items, loading, error } = usePublicContent('article', locale);

  return (
    <PageShell title="Culture & Heritage">
      {error && <p role="alert" className="mb-5 text-sm text-maroon">{error}</p>}
      {loading ? <p className="py-10 text-sm text-charcoal/60">Loading stories…</p> : items.length === 0 ? (
        <div className="border-y border-emerald/15 py-14 text-center"><p className="text-xs uppercase tracking-[0.18em] text-gold">Living heritage</p><h2 className="mt-3 font-display text-3xl text-emerald">Stories from language, memory, and community.</h2><p className="mt-3 text-sm text-charcoal/65">New cultural stories will appear here when published.</p></div>
      ) : <div className="grid gap-6 lg:grid-cols-2">{items.map((article) => (
        <article key={article.id} className="overflow-hidden border-b border-emerald/15 bg-white shadow-soft">
          {article.imageUrl && <img src={article.imageUrl} alt="" className="h-56 w-full object-cover" />}
          <div className="p-6"><p className="text-xs uppercase tracking-[0.18em] text-gold">{article.locale.toUpperCase()} · Cultural article</p><h2 className="mt-3 font-display text-3xl text-emerald">{article.title}</h2><p className="mt-3 leading-6 text-charcoal/70">{article.summary}</p><Link to={`/culture/${article.slug}`} className="mt-5 inline-flex text-sm font-semibold text-maroon hover:underline">Read story</Link></div>
        </article>
      ))}</div>}
    </PageShell>
  );
}

function ArticleDetailPage() {
  const { slug = '' } = useParams();
  const [article, setArticle] = useState<CmsContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiRequest<{ item: CmsContent }>(`/api/v1/content/article/${slug}`)
      .then((result) => { if (active) setArticle(result.item); })
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : 'Story not found.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  return (
    <PageShell title={article?.title ?? 'Culture story'}>
      {loading ? <p className="text-sm text-charcoal/60">Loading story…</p> : !article ? <p role="alert" className="border-l-2 border-maroon bg-white p-5 text-sm text-maroon">{error || 'Story not found.'}</p> : (
        <article className="mx-auto max-w-3xl">
          {article.imageUrl && <img src={article.imageUrl} alt="" className="mb-8 max-h-[34rem] w-full object-cover" />}
          <p className="text-xs uppercase tracking-[0.18em] text-gold">{article.locale.toUpperCase()} · Culture & heritage</p>
          <p className="mt-4 font-display text-2xl leading-relaxed text-emerald">{article.summary}</p>
          <div className="mt-8 whitespace-pre-wrap border-t border-emerald/15 pt-7 text-base leading-8 text-charcoal/80">{article.body}</div>
        </article>
      )}
    </PageShell>
  );
}

function AnnouncementsPage({ locale }: { locale: Locale }) {
  const { items, loading, error } = usePublicContent('announcement', locale);

  return (
    <PageShell title="Announcements">
      {error && <p role="alert" className="mb-5 text-sm text-maroon">{error}</p>}
      {loading ? <p className="py-10 text-sm text-charcoal/60">Loading announcements…</p> : items.length === 0 ? (
        <div className="border-y border-emerald/15 py-14 text-center"><p className="text-xs uppercase tracking-[0.18em] text-gold">Council notices</p><h2 className="mt-3 font-display text-3xl text-emerald">No new notices at the moment.</h2><p className="mt-3 text-sm text-charcoal/65">Official council updates will be shared here.</p></div>
      ) : <div className="divide-y divide-emerald/15">{items.map((item) => (
        <article key={item.id} className="grid gap-4 py-7 sm:grid-cols-[10rem_1fr]">
          <p className="text-xs uppercase tracking-[0.16em] text-gold">{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Council update'}</p>
          <div><h2 className="font-display text-2xl text-emerald">{item.title}</h2><p className="mt-2 text-sm leading-6 text-charcoal/70">{item.summary}</p></div>
        </article>
      ))}</div>}
    </PageShell>
  );
}

function AnnouncementDetailPage() {
  const { slug = '' } = useParams();
  const [announcement, setAnnouncement] = useState<CmsContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiRequest<{ item: CmsContent }>(`/api/v1/content/announcement/${slug}`)
      .then((result) => { if (active) setAnnouncement(result.item); })
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : 'Announcement not found.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  return (
    <PageShell title={announcement?.title ?? 'Council announcement'}>
      {loading ? <p className="text-sm text-charcoal/60">Loading announcement…</p> : !announcement ? (
        <p role="alert" className="border-l-2 border-maroon bg-white p-5 text-sm text-maroon">{error || 'Announcement not found.'}</p>
      ) : (
        <article className="mx-auto max-w-3xl">
          <p className="text-xs uppercase tracking-[0.18em] text-gold">{announcement.publishedAt ? new Date(announcement.publishedAt).toLocaleDateString(undefined, { dateStyle: 'full' }) : 'Council update'}</p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-emerald sm:text-5xl">{announcement.title}</h2>
          <p className="mt-5 font-display text-2xl leading-relaxed text-emerald/80">{announcement.summary}</p>
          <div className="mt-7 whitespace-pre-wrap border-t border-emerald/15 pt-6 text-base leading-8 text-charcoal/80">{announcement.body}</div>
        </article>
      )}
    </PageShell>
  );
}

function JoinPage({ locale }: { locale: Locale }) {
  const interests = ['Cultural events', 'Saraiki language', 'Community outreach', 'Student leadership', 'Media and design', 'Research and archive'];
  const [form, setForm] = useState({
    fullName: '',
    studentId: '',
    department: '',
    semester: '',
    universityEmail: '',
    phoneNumber: '',
    areasOfInterest: [] as string[],
    motivationStatement: '',
    privacyAcknowledged: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [applicationId, setApplicationId] = useState('');

  function updateField(field: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleInterest(interest: string) {
    setForm((current) => ({
      ...current,
      areasOfInterest: current.areasOfInterest.includes(interest)
        ? current.areasOfInterest.filter((item) => item !== interest)
        : [...current.areasOfInterest, interest],
    }));
  }

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const result = await apiRequest<{ application: { id: string } }>('/api/v1/membership/applications', {
        method: 'POST',
        body: JSON.stringify({ ...form, preferredLanguage: locale }),
      });
      setApplicationId(result.application.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Your application could not be sent.');
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass = 'mt-2 w-full rounded-sm border border-emerald/20 bg-white px-3 py-3 text-sm text-charcoal outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20';

  return (
    <PageShell title="Join the Council">
      <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
        <aside className="border-l-2 border-gold pl-5 lg:sticky lg:top-32 lg:h-fit">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Membership</p>
          <h2 className="mt-3 font-display text-3xl leading-tight text-emerald">Bring your voice. Help shape campus life.</h2>
          <p className="mt-4 text-sm leading-6 text-charcoal/70">Tell us a little about yourself and how you would like to contribute. The council team will review your application and follow up using the contact details you provide.</p>
          <div className="mt-8 border-t border-emerald/15 pt-5">
            <p className="text-xs uppercase tracking-[0.16em] text-charcoal/55">What happens next</p>
            <ol className="mt-4 space-y-4 text-sm text-charcoal/75">
              <li className="flex gap-3"><span className="font-display text-lg text-gold">01</span><span>Submit your student details and interests.</span></li>
              <li className="flex gap-3"><span className="font-display text-lg text-gold">02</span><span>The council reviews your application.</span></li>
              <li className="flex gap-3"><span className="font-display text-lg text-gold">03</span><span>We contact you about the next steps.</span></li>
            </ol>
          </div>
        </aside>

        <section className="min-w-0 border-t border-emerald/15 pt-6">
          {applicationId ? (
            <div role="status" className="border border-emerald/15 bg-white p-7 sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Application received</p>
              <h2 className="mt-3 font-display text-3xl text-emerald">Thank you for stepping forward.</h2>
              <p className="mt-3 text-sm leading-6 text-charcoal/70">Your application is in the council review queue. Keep this reference for your records.</p>
              <p className="mt-5 border-t border-emerald/10 pt-4 text-xs uppercase tracking-[0.16em] text-charcoal/60">Reference: <span className="font-semibold text-emerald">{applicationId}</span></p>
            </div>
          ) : (
            <form onSubmit={submitApplication} className="space-y-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">01 / Your details</p>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <label className="text-sm font-medium text-emerald sm:col-span-2">Full name
                    <input required minLength={2} maxLength={120} autoComplete="name" className={fieldClass} value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} />
                  </label>
                  <label className="text-sm font-medium text-emerald">Student ID
                    <input required minLength={3} maxLength={40} className={fieldClass} value={form.studentId} onChange={(event) => updateField('studentId', event.target.value)} />
                  </label>
                  <label className="text-sm font-medium text-emerald">Department
                    <input required minLength={2} maxLength={120} className={fieldClass} value={form.department} onChange={(event) => updateField('department', event.target.value)} />
                  </label>
                  <label className="text-sm font-medium text-emerald">Current semester
                    <select required className={fieldClass} value={form.semester} onChange={(event) => updateField('semester', event.target.value)}>
                      <option value="">Select semester</option>
                      {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={String(index + 1)}>Semester {index + 1}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-emerald">University email
                    <input required type="email" maxLength={254} autoComplete="email" className={fieldClass} value={form.universityEmail} onChange={(event) => updateField('universityEmail', event.target.value)} />
                  </label>
                  <label className="text-sm font-medium text-emerald sm:col-span-2">Phone number <span className="font-normal text-charcoal/50">(optional)</span>
                    <input type="tel" maxLength={40} autoComplete="tel" className={fieldClass} value={form.phoneNumber} onChange={(event) => updateField('phoneNumber', event.target.value)} />
                  </label>
                </div>
              </div>

              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">02 / Areas of interest</legend>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {interests.map((interest) => (
                    <label key={interest} className="flex cursor-pointer items-center gap-3 border border-emerald/10 bg-white px-3 py-3 text-sm text-charcoal/80 transition hover:border-gold/60">
                      <input type="checkbox" checked={form.areasOfInterest.includes(interest)} onChange={() => toggleInterest(interest)} className="h-4 w-4 accent-emerald" />
                      {interest}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="block text-sm font-medium text-emerald">Why would you like to join? <span className="font-normal text-charcoal/50">(optional)</span>
                <textarea rows={4} maxLength={1200} className={`${fieldClass} resize-y`} value={form.motivationStatement} onChange={(event) => updateField('motivationStatement', event.target.value)} />
                <span className="mt-1 block text-right text-xs text-charcoal/50">{form.motivationStatement.length}/1200</span>
              </label>

              <label className="flex items-start gap-3 border-t border-emerald/15 pt-5 text-sm leading-6 text-charcoal/75">
                <input required type="checkbox" checked={form.privacyAcknowledged} onChange={(event) => updateField('privacyAcknowledged', event.target.checked)} className="mt-1 h-4 w-4 accent-emerald" />
                <span>I agree that the council may use these details to review and respond to my membership application.</span>
              </label>

              {error && <p role="alert" className="border-l-2 border-maroon bg-maroon/5 px-4 py-3 text-sm text-maroon">{error}</p>}
              <button type="submit" disabled={submitting} className="w-full bg-emerald px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-ivory transition hover:bg-emerald/90 disabled:cursor-wait disabled:opacity-60 sm:w-auto">
                {submitting ? 'Sending application…' : 'Submit application'}
              </button>
            </form>
          )}
        </section>
      </div>
    </PageShell>
  );
}

function MemberSetupPage() {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');

  async function activate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest('/api/v1/membership/setup-account', { method: 'POST', body: JSON.stringify({ token, password }) });
      setComplete(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The account could not be activated.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell title="Activate member access">
      {!token ? <p role="alert" className="border-l-2 border-maroon bg-white p-5 text-sm text-maroon">This activation link is missing its secure token. Use the link from your council email.</p> : complete ? (
        <div role="status" className="mx-auto max-w-xl border border-emerald/15 bg-white p-7 shadow-soft"><p className="text-xs uppercase tracking-[0.18em] text-gold">Account ready</p><h2 className="mt-3 font-display text-3xl text-emerald">Your member access is active.</h2><p className="mt-3 text-sm text-charcoal/70">Sign in with your university email and the password you just created.</p><Link to="/member" className="mt-6 inline-flex bg-emerald px-5 py-3 text-sm font-semibold text-ivory">Go to member portal</Link></div>
      ) : (
        <div className="mx-auto max-w-xl border border-emerald/15 bg-white p-7 shadow-soft"><p className="text-xs uppercase tracking-[0.18em] text-gold">Secure member setup</p><h2 className="mt-3 font-display text-3xl text-emerald">Choose your password.</h2><p className="mt-3 text-sm leading-6 text-charcoal/70">Use at least 12 characters. This activation link can be used once and expires after 48 hours.</p><form onSubmit={activate} className="mt-6 space-y-4"><label className="block text-sm font-medium text-emerald">New password<input required minLength={12} maxLength={200} type="password" autoComplete="new-password" className="mt-2 w-full border border-emerald/20 px-3 py-3 text-sm outline-none focus:border-gold" value={password} onChange={(event) => setPassword(event.target.value)} /></label><label className="block text-sm font-medium text-emerald">Confirm password<input required minLength={12} maxLength={200} type="password" autoComplete="new-password" className="mt-2 w-full border border-emerald/20 px-3 py-3 text-sm outline-none focus:border-gold" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>{error && <p role="alert" className="text-sm text-maroon">{error}</p>}<button disabled={submitting} className="w-full bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ivory disabled:opacity-50">{submitting ? 'Activating…' : 'Activate account'}</button></form></div>
      )}
    </PageShell>
  );
}

function MemberPortalPage() {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [registrations, setRegistrations] = useState<MemberRegistration[]>([]);
  const [opportunities, setOpportunities] = useState<VolunteerOpportunityView[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function loadMember(user: StaffUser) {
    setStaff(user);
    if (user.role !== 'member') return;
    try {
      const [profile, eventHistory, volunteerList] = await Promise.all([
        apiRequest<{ member: MemberProfile }>('/api/v1/members/me'),
        apiRequest<{ registrations: MemberRegistration[] }>('/api/v1/members/me/registrations'),
        apiRequest<{ opportunities: VolunteerOpportunityView[] }>('/api/v1/volunteers'),
      ]);
      setMember(profile.member);
      setRegistrations(eventHistory.registrations);
      setOpportunities(volunteerList.opportunities);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Member profile could not be loaded.');
    }
  }

  useEffect(() => {
    let active = true;
    apiRequest<{ user: StaffUser }>('/api/v1/auth/me')
      .then((result) => { if (active) void loadMember(result.user); })
      .catch(() => { if (active) setStaff(null); })
      .finally(() => { if (active) setAuthChecked(true); });
    return () => { active = false; };
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      const result = await apiRequest<{ user: StaffUser }>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      await loadMember(result.user);
      setPassword('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Sign-in failed.');
    }
  }

  async function signOut() {
    try { await apiRequest('/api/v1/auth/logout', { method: 'POST' }); }
    finally { setStaff(null); setMember(null); setRegistrations([]); setOpportunities([]); }
  }

  async function updateVolunteerSignup(opportunityId: string, action: 'apply' | 'withdraw') {
    setError('');
    try {
      await apiRequest(`/api/v1/volunteers/${opportunityId}/signup`, {
        method: action === 'apply' ? 'POST' : 'DELETE',
        ...(action === 'apply' ? { body: JSON.stringify({}) } : {}),
      });
      const response = await apiRequest<{ opportunities: VolunteerOpportunityView[] }>('/api/v1/volunteers');
      setOpportunities(response.opportunities);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Volunteer signup could not be updated.');
    }
  }

  return (
    <PageShell title="Member Portal">
      {!authChecked ? <p className="text-sm text-charcoal/60">Checking member session…</p> : !staff ? (
        <div className="mx-auto max-w-xl border border-emerald/15 bg-white p-7 shadow-soft"><p className="text-xs uppercase tracking-[0.18em] text-gold">Member access</p><h2 className="mt-3 font-display text-3xl text-emerald">Welcome back.</h2><p className="mt-3 text-sm text-charcoal/65">Activate your account from the approval email before signing in.</p><form onSubmit={signIn} className="mt-6 space-y-4"><label className="block text-sm font-medium text-emerald">University email<input required type="email" autoComplete="username" className="mt-2 w-full border border-emerald/20 px-3 py-3 text-sm outline-none focus:border-gold" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="block text-sm font-medium text-emerald">Password<input required type="password" autoComplete="current-password" className="mt-2 w-full border border-emerald/20 px-3 py-3 text-sm outline-none focus:border-gold" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p role="alert" className="text-sm text-maroon">{error}</p>}<button className="w-full bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ivory">Sign in</button></form></div>
      ) : staff.role !== 'member' ? (
        <div className="border-l-2 border-maroon bg-white p-6"><h2 className="font-display text-2xl text-emerald">This area is for active council members.</h2><button type="button" onClick={() => void signOut()} className="mt-4 text-sm text-maroon underline">Sign out</button></div>
      ) : error && !member ? <p role="alert" className="border-l-2 border-maroon bg-white p-5 text-sm text-maroon">{error}</p> : !member ? <p className="text-sm text-charcoal/60">Loading your profile…</p> : (
        <div>
          <div className="flex flex-col gap-5 border-b border-emerald/15 pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[0.18em] text-gold">Member account</p><h2 className="mt-2 font-display text-4xl text-emerald">Welcome, {member.fullName.split(' ')[0]}.</h2><p className="mt-2 text-sm text-charcoal/65">Your council membership at a glance.</p></div><button type="button" onClick={() => void signOut()} className="text-sm font-semibold text-maroon underline">Sign out</button></div>
          <div className="mt-7 grid gap-4 sm:grid-cols-3"><div className="border border-emerald/10 bg-white p-5"><p className="text-xs uppercase tracking-[0.14em] text-charcoal/50">Member number</p><p className="mt-2 font-display text-2xl text-emerald">{member.memberNumber || 'Active'}</p></div><div className="border border-emerald/10 bg-white p-5"><p className="text-xs uppercase tracking-[0.14em] text-charcoal/50">Student ID</p><p className="mt-2 text-lg font-semibold text-emerald">{member.studentId}</p></div><div className="border border-emerald/10 bg-white p-5"><p className="text-xs uppercase tracking-[0.14em] text-charcoal/50">Department · semester</p><p className="mt-2 text-sm font-semibold text-emerald">{member.department} · {member.semester}</p></div></div>
          <section className="mt-10"><div className="border-b border-emerald/15 pb-4"><p className="text-xs uppercase tracking-[0.18em] text-gold">Your participation</p><h3 className="mt-2 font-display text-3xl text-emerald">Event registrations</h3></div>{registrations.length === 0 ? <p className="py-8 text-sm text-charcoal/60">Your event registrations will appear here.</p> : <div className="divide-y divide-emerald/10">{registrations.map((registration) => <article key={registration.id} className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h4 className="font-display text-xl text-emerald">{registration.event.title}</h4><p className="mt-1 text-sm text-charcoal/65">{new Date(registration.event.startsAt).toLocaleString()} · {registration.event.venue}</p></div><Link to={`/events/${registration.event.slug}`} className="text-sm font-semibold text-maroon underline">Event details</Link></article>)}</div>}</section>
          <section className="mt-10"><div className="border-b border-emerald/15 pb-4"><p className="text-xs uppercase tracking-[0.18em] text-gold">Give your time</p><h3 className="mt-2 font-display text-3xl text-emerald">Volunteer opportunities</h3></div>{opportunities.length === 0 ? <p className="py-8 text-sm text-charcoal/60">New opportunities will appear here when the council opens them.</p> : <div className="grid gap-4 pt-5 lg:grid-cols-2">{opportunities.map((opportunity) => <article key={opportunity.id} className="border border-emerald/10 bg-white p-5"><p className="text-xs uppercase tracking-[0.15em] text-gold">{opportunity.startsAt ? new Date(opportunity.startsAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Ongoing'}{opportunity.venue ? ` · ${opportunity.venue}` : ''}</p><h4 className="mt-2 font-display text-xl text-emerald">{opportunity.title}</h4><p className="mt-2 text-sm leading-6 text-charcoal/70">{opportunity.summary}</p>{opportunity.areas.length > 0 && <p className="mt-3 text-xs text-charcoal/55">{opportunity.areas.join(' · ')}</p>}<div className="mt-4">{opportunity.signupStatus === 'applied' ? <button type="button" onClick={() => void updateVolunteerSignup(opportunity.id, 'withdraw')} className="text-sm font-semibold text-maroon underline">Application pending · withdraw</button> : opportunity.signupStatus ? <span className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald">{opportunity.signupStatus}</span> : <button type="button" onClick={() => void updateVolunteerSignup(opportunity.id, 'apply')} className="bg-emerald px-4 py-2 text-sm font-semibold text-ivory">Apply to volunteer</button>}</div></article>)}</div>}</section>
          {error && <p role="alert" className="mt-6 text-sm text-maroon">{error}</p>}
        </div>
      )}
    </PageShell>
  );
}

function MembershipReviewPage() {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('pending');
  const [applications, setApplications] = useState<MembershipApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [rejectingId, setRejectingId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest<{ user: StaffUser }>('/api/v1/auth/me')
      .then((result) => { if (active) setStaff(result.user); })
      .catch(() => { if (active) setStaff(null); })
      .finally(() => { if (active) setAuthChecked(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!staff || !['admin', 'editor'].includes(staff.role)) return;
    let active = true;
    setLoading(true);
    setError('');
    apiRequest<{ applications: MembershipApplication[] }>(`/api/v1/membership/applications?status=${status}`)
      .then((result) => { if (active) setApplications(result.applications); })
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : 'Could not load applications.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [staff, status]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      const result = await apiRequest<{ user: StaffUser }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setStaff(result.user);
      setPassword('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Sign-in failed.');
    }
  }

  async function reviewApplication(applicationId: string, decision: 'approved' | 'rejected') {
    setBusyId(applicationId);
    setError('');
    setMessage('');
    try {
      await apiRequest(`/api/v1/membership/applications/${applicationId}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ decision, ...(decision === 'rejected' ? { rejectionReason } : {}) }),
      });
      setApplications((current) => current.filter((application) => application.id !== applicationId));
      setRejectingId('');
      setRejectionReason('');
      setMessage(decision === 'approved' ? 'Application approved.' : 'Application declined and reason recorded.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The decision could not be saved.');
    } finally {
      setBusyId('');
    }
  }

  async function retryNotification(applicationId: string) {
    setBusyId(applicationId);
    setError('');
    setMessage('');
    try {
      const result = await apiRequest<{ emailNotificationStatus: MembershipApplication['emailNotificationStatus'] }>(
        `/api/v1/membership/applications/${applicationId}/notification`,
        { method: 'POST' },
      );
      setApplications((current) => current.map((application) => (
        application.id === applicationId
          ? { ...application, emailNotificationStatus: result.emailNotificationStatus }
          : application
      )));
      setMessage(result.emailNotificationStatus === 'sent' ? 'Decision email sent.' : 'The email could not be delivered. Check SMTP settings and retry.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The email could not be sent.');
    } finally {
      setBusyId('');
    }
  }

  async function signOut() {
    try {
      await apiRequest('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      setStaff(null);
      setApplications([]);
    }
  }

  return (
    <PageShell title="Application Review">
      {!authChecked ? (
        <p className="text-sm text-charcoal/65">Checking staff session…</p>
      ) : !staff ? (
        <div className="mx-auto max-w-xl border border-emerald/15 bg-white p-6 shadow-soft sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Council staff</p>
          <h2 className="mt-3 font-display text-3xl text-emerald">Sign in to review applications</h2>
          <form onSubmit={signIn} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-emerald">Email
              <input required type="email" autoComplete="username" className="mt-2 w-full border border-emerald/20 px-3 py-3 text-sm outline-none focus:border-gold" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="block text-sm font-medium text-emerald">Password
              <input required type="password" autoComplete="current-password" className="mt-2 w-full border border-emerald/20 px-3 py-3 text-sm outline-none focus:border-gold" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {error && <p role="alert" className="text-sm text-maroon">{error}</p>}
            <button className="w-full bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ivory">Sign in</button>
          </form>
        </div>
      ) : !['admin', 'editor'].includes(staff.role) ? (
        <div className="border-l-2 border-maroon bg-white p-6">
          <h2 className="font-display text-2xl text-emerald">Review access is not enabled for this account.</h2>
          <button type="button" onClick={() => void signOut()} className="mt-4 text-sm font-semibold text-maroon underline">Sign out</button>
        </div>
      ) : (
        <div>
          <div className="flex flex-col gap-4 border-b border-emerald/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-charcoal/55">Signed in as {staff.email}</p>
              <p className="mt-1 text-sm text-charcoal/70">Review each application once. Decisions are recorded with your staff account.</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="sr-only" htmlFor="application-status">Filter applications</label>
              <select id="application-status" value={status} onChange={(event) => setStatus(event.target.value)} className="border border-emerald/20 bg-white px-3 py-2 text-sm text-emerald">
                <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All statuses</option>
              </select>
              <button type="button" onClick={() => void signOut()} className="text-sm font-semibold text-maroon underline">Sign out</button>
            </div>
          </div>

          {message && <p role="status" className="mt-5 border-l-2 border-emerald bg-emerald/5 px-4 py-3 text-sm text-emerald">{message}</p>}
          {error && <p role="alert" className="mt-5 border-l-2 border-maroon bg-maroon/5 px-4 py-3 text-sm text-maroon">{error}</p>}
          {loading ? <p className="py-10 text-sm text-charcoal/65">Loading applications…</p> : applications.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-gold">{status} applications</p>
              <h2 className="mt-2 font-display text-3xl text-emerald">Nothing to review here.</h2>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {applications.map((application) => (
                <article key={application.id} className="border border-emerald/10 bg-white p-5 shadow-soft sm:p-7">
                  <div className="flex flex-col gap-4 border-b border-emerald/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-gold">{application.status} · {new Date(application.createdAt).toLocaleDateString()}</p>
                      <h2 className="mt-2 font-display text-2xl text-emerald">{application.fullName}</h2>
                      <p className="mt-1 text-sm text-charcoal/65">{application.studentId} · {application.department} · Semester {application.semester}</p>
                    </div>
                    <span className="w-fit border border-emerald/10 px-3 py-1 text-xs uppercase tracking-[0.12em] text-charcoal/65">{localeLabels[application.preferredLanguage]}</span>
                  </div>
                  <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                    <div><p className="text-xs uppercase tracking-[0.14em] text-charcoal/50">Contact</p><p className="mt-1 text-charcoal/80">{application.universityEmail || 'No email provided'}{application.phoneNumber ? ` · ${application.phoneNumber}` : ''}</p></div>
                    <div><p className="text-xs uppercase tracking-[0.14em] text-charcoal/50">Interests</p><p className="mt-1 text-charcoal/80">{application.areasOfInterest.join(', ') || 'Not specified'}</p></div>
                  </div>
                  {application.motivationStatement && <p className="mt-4 border-l border-gold pl-4 text-sm leading-6 text-charcoal/75">{application.motivationStatement}</p>}
                  {application.rejectionReason && <p className="mt-4 text-sm text-maroon">Decision note: {application.rejectionReason}</p>}
                  {application.status !== 'pending' && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-charcoal/60">
                      <span>Email: <strong className={application.emailNotificationStatus === 'sent' ? 'text-emerald' : 'text-maroon'}>{application.emailNotificationStatus.replace('_', ' ')}</strong></span>
                      {application.status === 'approved' && application.accountSetupStatus && <span>Account: <strong className={application.accountSetupStatus === 'ready' ? 'text-emerald' : 'text-charcoal/70'}>{application.accountSetupStatus.split('_').join(' ')}</strong></span>}
                      {application.emailNotificationStatus !== 'sent' && application.universityEmail && (
                        <button type="button" disabled={Boolean(busyId)} onClick={() => void retryNotification(application.id)} className="font-semibold text-maroon underline disabled:opacity-50">
                          Retry decision email
                        </button>
                      )}
                    </div>
                  )}
                  {application.status === 'pending' && (
                    <div className="mt-5 flex flex-wrap items-start gap-3 border-t border-emerald/10 pt-4">
                      <button type="button" disabled={Boolean(busyId)} onClick={() => void reviewApplication(application.id, 'approved')} className="bg-emerald px-4 py-2 text-sm font-semibold text-ivory disabled:opacity-50">Approve</button>
                      {rejectingId === application.id ? (
                        <form className="flex min-w-[min(100%,24rem)] flex-1 flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); void reviewApplication(application.id, 'rejected'); }}>
                          <input required maxLength={500} aria-label="Reason for declining" placeholder="Reason for declining" className="min-w-0 flex-1 border border-emerald/20 px-3 py-2 text-sm outline-none focus:border-gold" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} />
                          <button type="submit" disabled={Boolean(busyId)} className="bg-maroon px-4 py-2 text-sm font-semibold text-ivory disabled:opacity-50">Confirm decline</button>
                        </form>
                      ) : (
                        <button type="button" onClick={() => { setRejectingId(application.id); setRejectionReason(''); }} className="border border-maroon/30 px-4 py-2 text-sm font-semibold text-maroon">Decline</button>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}

function ContactPage() {
  const [form, setForm] = useState({ fullName: '', email: '', subject: '', message: '', website: '', privacyAcknowledged: false });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'sent' | 'failed' | 'skipped' | ''>('');
  const [error, setError] = useState('');

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError('');
    try {
      const result = await apiRequest<{ id: string; emailStatus: 'sent' | 'failed' | 'skipped' }>('/api/v1/contact', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setEmailStatus(result.emailStatus);
      setSent(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Your message could not be sent.');
    } finally {
      setSending(false);
    }
  }

  const inputClass = 'mt-2 w-full border border-emerald/20 bg-white px-3 py-3 text-sm text-charcoal outline-none focus:border-gold focus:ring-2 focus:ring-gold/20';

  return (
    <PageShell title="Contact">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <aside className="border-l-2 border-gold pl-5"><p className="text-xs uppercase tracking-[0.2em] text-gold">Start a conversation</p><h2 className="mt-3 font-display text-3xl leading-tight text-emerald">We welcome thoughtful questions and collaborations.</h2><p className="mt-4 text-sm leading-6 text-charcoal/70">Send a message to the council. Your enquiry is stored securely for follow-up, and we will reply to the email address you provide.</p><p className="mt-7 border-t border-emerald/15 pt-4 text-xs uppercase tracking-[0.14em] text-charcoal/55">Leads University · Lahore</p></aside>
        <section className="border-t border-emerald/15 pt-6">
          {sent ? <div role="status" className="border border-emerald/15 bg-white p-7 shadow-soft"><p className="text-xs uppercase tracking-[0.18em] text-gold">Message recorded</p><h2 className="mt-3 font-display text-3xl text-emerald">Thank you for getting in touch.</h2><p className="mt-3 text-sm leading-6 text-charcoal/70">Your enquiry has been added to the council inbox. {emailStatus === 'sent' ? 'The council inbox was notified by email.' : 'Email delivery is temporarily unavailable, but staff can still retrieve your message from the inbox.'}</p></div> : <form onSubmit={sendMessage} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-medium text-emerald">Full name<input required minLength={2} maxLength={120} autoComplete="name" className={inputClass} value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} /></label><label className="block text-sm font-medium text-emerald">Email<input required type="email" maxLength={254} autoComplete="email" className={inputClass} value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label></div>
            <label className="block text-sm font-medium text-emerald">Subject<input required minLength={3} maxLength={160} className={inputClass} value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} /></label>
            <label className="block text-sm font-medium text-emerald">Message<textarea required minLength={10} maxLength={5000} rows={6} className={`${inputClass} resize-y`} value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} /></label>
            <label aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} /></label>
            <label className="flex items-start gap-3 border-t border-emerald/15 pt-5 text-sm leading-6 text-charcoal/70"><input required type="checkbox" checked={form.privacyAcknowledged} onChange={(event) => setForm((current) => ({ ...current, privacyAcknowledged: event.target.checked }))} className="mt-1 accent-emerald" /><span>I agree that the council may use my details to respond to this enquiry.</span></label>
            {error && <p role="alert" className="text-sm text-maroon">{error}</p>}
            <button disabled={sending} className="bg-emerald px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ivory disabled:opacity-50">{sending ? 'Sending…' : 'Send message'}</button>
          </form>}
        </section>
      </div>
    </PageShell>
  );
}

function PrivacyPage() {
  return (
    <PageShell title="Privacy Policy">
      <div className="rounded-[2rem] bg-white p-8 shadow-soft">
        <p className="text-charcoal/75">The council will document its privacy notice, consent standards, retention periods, and allowable disclosures in the compliance and governance stages.</p>
      </div>
    </PageShell>
  );
}

function TermsPage() {
  return (
    <PageShell title="Terms of Use">
      <div className="rounded-[2rem] bg-white p-8 shadow-soft">
        <p className="text-charcoal/75">The use of this platform is governed by the final terms and policies reviewed by the council and university stakeholders.</p>
      </div>
    </PageShell>
  );
}

function NotFoundPage() {
  return (
    <PageShell title="Page not found">
      <div className="rounded-[2rem] bg-white p-8 shadow-soft">
        <p className="text-charcoal/75">The requested page could not be found.</p>
      </div>
    </PageShell>
  );
}

export default function App() {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = getDirection(locale);
  }, [locale]);

  return (
    <div dir={getDirection(locale)} className="min-h-screen bg-ivory text-charcoal">
      <Header locale={locale} onLocaleChange={setLocale} />
      <Routes>
        <Route path="/" element={<HomePage locale={locale} />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/leadership" element={<LeadershipPage locale={locale} />} />
        <Route path="/cabinet" element={<CabinetPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:slug" element={<EventDetailPage />} />
        <Route path="/council/events" element={<EventManagementPage />} />
        <Route path="/council/content" element={<ContentManagementPage />} />
        <Route path="/council/volunteers" element={<VolunteerManagementPage />} />
        <Route path="/council/inbox" element={<ContactInboxPage />} />
        <Route path="/culture" element={<CulturePage locale={locale} />} />
        <Route path="/culture/:slug" element={<ArticleDetailPage />} />
        <Route path="/announcements" element={<AnnouncementsPage locale={locale} />} />
        <Route path="/announcements/:slug" element={<AnnouncementDetailPage />} />
        <Route path="/join" element={<JoinPage locale={locale} />} />
        <Route path="/council/review" element={<MembershipReviewPage />} />
        <Route path="/member/setup" element={<MemberSetupPage />} />
        <Route path="/member" element={<MemberPortalPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </div>
  );
}
