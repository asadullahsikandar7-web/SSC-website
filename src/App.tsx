import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom';
import {
  getDirection,
  localeLabels,
  supportedLocales,
  translations,
  type Locale,
} from './i18n/translations';
import { assets } from './assets';
import { dateLocale, setActiveLocale, tr } from './i18n/tr';
import { poems, type Poem } from './poetry';

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
    throw new Error(response.ok ? tr('The server returned an unreadable response.') : tr('The service is currently unavailable. Please try again shortly.'));
  }

  if (!response.ok || !result.success || result.data === undefined) {
    throw new Error(result.message ? tr(result.message) : tr('The request could not be completed.'));
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
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : tr('Content could not be loaded.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [contentType, locale]);

  return { items, loading, error };
}

const cabinetMembers: CabinetMember[] = [
  { id: 'amjad-amin', name: 'Amjad Amin', designation: 'Chairman', category: 'main', image: assets.amjad },
  { id: 'malik-zahid', name: 'Malik Zahid', designation: 'Vice Chairman', category: 'main', image: assets.malik },
  { id: 'sohail-majeed', name: 'Sohail Majeed', designation: 'President', category: 'main', image: assets.sohail },
  { id: 'meer-asmat-baloch', name: 'Meer Asmat Baloch', designation: 'General Secretary', category: 'main', image: assets.meer },
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

const cabinetPortraits: Record<string, string | undefined> = Object.fromEntries(cabinetMembers.map((member) => [member.name, member.image]));

const galleryCards: Array<{ title: string; image?: string; span: string; position?: string }> = [
  { title: 'Saraiki cultural illustration', image: assets.heritageScene, span: 'sm:row-span-2', position: 'object-top' },
  { title: 'Student leadership on stage', image: assets.amjad, span: 'lg:col-span-2', position: 'object-[center_25%]' },
  { title: 'A living heritage', span: '' },
  { title: 'A wall of council memories', image: assets.memoryWall, span: '' },
  { title: 'Campus gatherings', image: assets.malik, span: 'lg:col-span-2', position: 'object-[center_30%]' },
];

const impactStats = [
  { value: '12+', label: 'student-led initiatives' },
  { value: '3', label: 'cultural pillars' },
  { value: '1', label: 'shared campus voice' },
];

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}

function StarMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect x="8" y="8" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="8" y="8" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(45 20 20)" />
      <circle cx="20" cy="20" r="4.5" fill="currentColor" />
    </svg>
  );
}

const LOGO_PREVIEW_EVENT = 'ssc:logo-preview';

function Logo({ className = 'h-11 w-11', label }: { className?: string; label?: string }) {
  // The emblem has a transparent background and reads on both light and dark surfaces.
  return (
    <button
      type="button"
      aria-label={label ?? tr('View the council emblem')}
      onClick={(event) => { event.preventDefault(); event.stopPropagation(); window.dispatchEvent(new Event(LOGO_PREVIEW_EVENT)); }}
      className={`logo-button grid shrink-0 cursor-zoom-in place-items-center rounded-full transition duration-300 hover:scale-105 active:scale-95 ${className}`}
    >
      <img src={assets.logo} alt="" className="h-full w-full object-contain drop-shadow-[0_3px_6px_rgba(9,31,27,0.28)]" />
    </button>
  );
}

function LogoPreview() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(LOGO_PREVIEW_EVENT, show);
    return () => window.removeEventListener(LOGO_PREVIEW_EVENT, show);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label={tr('Saraiki Student Council emblem')} className="fixed inset-0 z-50 grid place-items-center p-5">
      <button type="button" aria-label={tr('Close preview')} onClick={() => setOpen(false)} className="sheet-backdrop pattern-ajrak absolute inset-0 cursor-zoom-out bg-[#091f1b]/90 backdrop-blur-md" />
      <figure className="preview-pop pointer-events-none relative flex max-h-full w-full max-w-xl flex-col items-center">
        <img src={assets.logoLarge} alt={tr('Saraiki Student Council emblem')} className="max-h-[70vh] w-auto max-w-full object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.55)]" />
        <figcaption className="mt-6 text-center text-ivory">
          <p className="font-display text-2xl sm:text-3xl">{tr('Saraiki Student Council')}</p>
          <p className="mt-1.5 text-[11px] uppercase tracking-[0.24em] text-gold">{tr('Lahore Leads University')}</p>
        </figcaption>
      </figure>
      <button type="button" autoFocus onClick={() => setOpen(false)} aria-label={tr('Close preview')} className="absolute end-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-ivory ring-1 ring-white/20 transition hover:bg-gold hover:text-[#0f2b25] active:scale-95 sm:end-6 sm:top-6">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
    </div>
  );
}

function ArrowIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={`arrow-icon ${className}`} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

function ScrollChrome() {
  const { pathname } = useLocation();
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    // jsdom (the test environment) has no scrolling.
    if (navigator.userAgent.includes('jsdom')) return;
    const target = window.location.hash ? document.getElementById(decodeURIComponent(window.location.hash.slice(1))) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0);
      setShowTop(window.scrollY > 700);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[3px]">
        <div className="h-full origin-left bg-gradient-to-r from-gold via-[#e2c98a] to-maroon" style={{ transform: `scaleX(${progress})` }} />
      </div>
      <button
        type="button"
        aria-label={tr('Back to top')}
        tabIndex={showTop ? 0 : -1}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-24 end-4 z-20 grid h-12 w-12 lg:bottom-6 lg:end-6 place-items-center rounded-full bg-emerald text-gold shadow-soft ring-1 ring-gold/40 transition duration-300 hover:-translate-y-1 hover:bg-[#0f2b25] ${showTop ? 'opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
      >
        <ArrowIcon className="h-5 w-5 -rotate-90" />
      </button>
    </>
  );
}

const councilContacts = {
  email: 'advocateamjadameen786@gmail.com',
  chairmanPhone: '+92 306 5847515',
  facebook: 'https://www.facebook.com/share/193EQSpR2h/',
  tiktok: 'https://www.tiktok.com/@leadsuniversitystudents',
  tiktokHandle: '@leadsuniversitystudents',
};

function ContactIcon({ name, className = 'h-5 w-5' }: { name: 'phone' | 'facebook' | 'tiktok' | 'email' | 'location'; className?: string }) {
  if (name === 'facebook') return <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor"><path d="M13.5 21v-7.5h2.6l.4-3.1h-3V8.5c0-.9.3-1.5 1.6-1.5h1.5V4.2c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.3H7.8v3.1h2.6V21h3.1z" /></svg>;
  if (name === 'tiktok') return <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor"><path d="M16.5 3c.3 2.1 1.5 3.5 3.5 3.7v2.9c-1.3 0-2.5-.4-3.5-1.1v6.1c0 3.3-2.5 5.4-5.3 5.4-2.7 0-5.2-2-5.2-5.2 0-3.3 2.8-5.6 6.1-5.1v3c-1.5-.4-3.1.5-3.1 2.1 0 1.3 1 2.2 2.2 2.2 1.4 0 2.3-1 2.3-2.6V3h3z" /></svg>;
  const paths = {
    phone: 'M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5L16 14l4 1.5V19a1.5 1.5 0 0 1-1.5 1.5C10.5 20.5 3.5 13.5 3.5 5.5A1.5 1.5 0 0 1 5 4z',
    email: 'M3.5 6.5h17v11h-17zM3.5 7l8.5 6.5L20.5 7',
    location: 'M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21zM12 12.5a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z',
  };
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}

function ContactChannels() {
  const rows: Array<{ icon: 'phone' | 'facebook' | 'tiktok' | 'email' | 'location'; label: string; value: string; href?: string; external?: boolean }> = [
    { icon: 'phone', label: 'Chairman', value: councilContacts.chairmanPhone, href: `tel:${councilContacts.chairmanPhone.replace(/\s/g, '')}` },
    { icon: 'email', label: 'Email', value: councilContacts.email, href: `mailto:${councilContacts.email}` },
    { icon: 'facebook', label: 'Facebook', value: 'Saraiki Student Council', href: councilContacts.facebook, external: true },
    { icon: 'tiktok', label: 'TikTok', value: councilContacts.tiktokHandle, href: councilContacts.tiktok, external: true },
    { icon: 'location', label: 'Location', value: 'Lahore Leads University' },
  ];

  return (
    <dl className="grid grid-cols-1 gap-3 text-sm">
      {rows.map((row) => {
        const content = (
          <>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald text-gold"><ContactIcon name={row.icon} /></span>
            <span className="min-w-0 flex-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{tr(row.label)}</dt>
              <dd className="mt-0.5 break-words font-medium leading-snug text-emerald [overflow-wrap:anywhere]"><bdi dir={row.icon === 'location' || row.icon === 'facebook' ? undefined : 'ltr'}>{tr(row.value)}</bdi></dd>
            </span>
            {row.href && <ArrowIcon className="h-4 w-4 shrink-0 text-emerald/40" />}
          </>
        );
        const rowClass = 'link-arrow flex items-center gap-4 rounded-2xl bg-emerald/[0.05] px-4 py-3 transition';
        return row.href
          ? <a key={row.label} href={row.href} {...(row.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={`${rowClass} hover:bg-emerald/[0.1]`}>{content}</a>
          : <div key={row.label} className={rowClass}>{content}</div>;
      })}
    </dl>
  );
}

function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="page-shell mx-auto max-w-7xl px-4 pb-14 pt-4 sm:px-8 sm:pt-6 lg:px-12">
      <div className="pattern-ajrak relative mb-10 overflow-hidden rounded-[1.75rem] bg-emerald px-5 py-8 text-ivory shadow-soft sm:px-10 sm:py-14">
        <div aria-hidden="true" className="absolute -end-16 -top-20 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-24 start-1/3 h-56 w-56 rounded-full bg-maroon/40 blur-3xl" />
        <div className="relative">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
            <StarMark className="h-4 w-4" />
            {tr('Saraiki Student Council · Leads University')}
          </p>
          <h1 className="mt-3 max-w-4xl break-words font-display text-[2.1rem] leading-[1.08] text-ivory sm:mt-4 sm:text-6xl">{title}</h1>
        </div>
      </div>
      <div className="page-enter">{children}</div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Reveal className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between [&>a]:sm:self-end">
      <div className="max-w-2xl">
        <p className="eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-gold">{eyebrow}</p>
        <h2 className="mt-3 font-display text-3xl leading-tight text-emerald sm:text-[2.6rem]">{title}</h2>
        <p className="mt-3 text-base leading-7 text-charcoal/70">{description}</p>
      </div>
      {action}
    </Reveal>
  );
}

function SectionLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="link-arrow inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-emerald/20 bg-white/70 px-5 py-2.5 text-sm font-semibold text-emerald transition hover:border-gold hover:bg-white">
      {children}
      <ArrowIcon className="h-4 w-4" />
    </Link>
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
    <div className="flex items-center gap-1.5 rounded-full border border-emerald/15 bg-white/80 py-1 pe-1 ps-2.5 shadow-sm sm:gap-2 sm:ps-3">
      <svg viewBox="0 0 20 20" className="hidden h-4 w-4 text-emerald/60 min-[420px]:block" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="10" cy="10" r="7.5" />
        <path d="M2.5 10h15M10 2.5c2.2 2.1 3.2 4.6 3.2 7.5s-1 5.4-3.2 7.5c-2.2-2.1-3.2-4.6-3.2-7.5s1-5.4 3.2-7.5z" />
      </svg>
      <select
        aria-label={translations[locale].language}
        value={locale}
        onChange={(event) => onChange(event.target.value as Locale)}
        className="cursor-pointer rounded-full bg-transparent px-1 py-1 text-sm font-medium text-emerald outline-none focus-visible:ring-2 focus-visible:ring-gold"
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

function TabIcon({ name, className = 'h-6 w-6' }: { name: 'home' | 'events' | 'join' | 'culture' | 'poetry' | 'menu' | 'close' | 'people' | 'news' | 'about' | 'member'; className?: string }) {
  const paths: Record<string, string> = {
    home: 'M4 11.5 12 4l8 7.5M6.5 10v9.5h4v-5h3v5h4V10',
    events: 'M5 6.5h14v13H5zM5 10.5h14M9 4v4M15 4v4',
    join: 'M12 5v14M5 12h14',
    culture: 'M12 6.5c-2-1.300-4.500-1.500-7-1v12.500c2.500-.5 5-.300 7 1 2-1.300 4.500-1.500 7-1V5.500c-2.500-.5-5-.300-7 1zM12 6.500V19',
    poetry: 'M19 4.500c-6 0-10.500 4-11.500 11l-1 4M7.500 15.500c4 0 7-1.500 8.500-4.500M10 11.500c2.500 0 4.500-.800 6-2.500',
    menu: 'M5 7h14M5 12h14M5 17h9',
    close: 'M6 6l12 12M18 6 6 18',
    people: 'M9 11.500a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.500 19c.500-3 2.700-4.500 5.500-4.500s5 1.500 5.500 4.500M16 11.500a2.500 2.500 0 1 0 0-5M17 14.700c1.900.400 3.100 1.800 3.500 4.300',
    news: 'M4.500 9.500v5l3 .5 5.500 3.500v-13L7.500 9zM16 9.500c1 .700 1.500 1.500 1.500 2.500s-.5 1.800-1.500 2.500',
    about: 'M12 20.500a8.500 8.500 0 1 0 0-17 8.500 8.500 0 0 0 0 17zM12 11v5.500M12 7.800v.2',
    member: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.500 20c.800-3.500 3.700-5 7.500-5s6.700 1.500 7.500 5',
  };
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name].replace(/(\.\d)00(?!\d)/g, '$1')} /></svg>;
}

function Header({ locale, onLocaleChange }: { locale: Locale; onLocaleChange: (value: Locale) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const t = translations[locale];
  const navItems = useMemo(
    () => [
      { to: '/', label: translations[locale].home, icon: 'home' as const },
      { to: '/about', label: translations[locale].about, icon: 'about' as const },
      { to: '/leadership', label: translations[locale].leadership, icon: 'people' as const },
      { to: '/cabinet', label: translations[locale].cabinet, icon: 'people' as const },
      { to: '/events', label: translations[locale].events, icon: 'events' as const },
      { to: '/culture', label: translations[locale].culture, icon: 'culture' as const },
      { to: '/poetry', label: translations[locale].poetry, icon: 'poetry' as const },
      { to: '/announcements', label: translations[locale].announcements, icon: 'news' as const },
      { to: '/contact', label: translations[locale].contact, icon: 'about' as const },
    ],
    [locale],
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const tabClass = ({ isActive }: { isActive: boolean }) => `tab-item flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition ${isActive ? 'is-active text-emerald' : 'text-emerald/55'}`;

  return (
    <>
      <header className={`site-header sticky top-0 z-20 border-b backdrop-blur-xl transition-all duration-300 ${scrolled ? 'is-scrolled border-emerald/10 bg-ivory/90' : 'border-transparent bg-ivory/70'}`} dir={getDirection(locale)}>
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between gap-3 py-2.5 sm:py-3">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <Logo className="h-11 w-11 sm:h-[3.25rem] sm:w-[3.25rem]" />
              <NavLink to="/" className="min-w-0">
                <span className="block truncate font-display text-[0.98rem] leading-tight text-emerald sm:text-xl">{t.siteName}</span>
                <span className="mt-0.5 block truncate text-[9px] uppercase tracking-[0.2em] text-emerald/60 sm:text-[10px] sm:tracking-[0.24em]">{t.subtitle}</span>
              </NavLink>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <LanguageSwitcher locale={locale} onChange={onLocaleChange} />
              <NavLink to="/join" className="hidden rounded-full bg-emerald px-5 py-2.5 text-sm font-semibold text-ivory shadow-sm transition hover:-translate-y-0.5 hover:bg-maroon lg:inline-flex">
                {t.join}
              </NavLink>
            </div>
          </div>

          <nav id="site-navigation" aria-label={t.navLabel} className="hidden border-t border-emerald/10 py-2 lg:flex lg:flex-wrap lg:items-center lg:gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition ${isActive ? 'is-active bg-emerald/[0.07] text-emerald' : 'text-emerald/75 hover:bg-emerald/[0.05] hover:text-emerald'}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Phone and tablet: app-style tab bar */}
      <nav aria-label={t.navLabel} dir={getDirection(locale)} className="tab-bar fixed inset-x-0 bottom-0 z-30 border-t border-emerald/10 bg-ivory/90 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex h-16 max-w-lg items-stretch px-2">
          <NavLink to="/" end className={tabClass}><TabIcon name="home" /><span>{t.home}</span></NavLink>
          <NavLink to="/events" className={tabClass}><TabIcon name="events" /><span>{t.events}</span></NavLink>
          <NavLink to="/join" className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold text-emerald">
            <span className="-mt-7 grid h-14 w-14 place-items-center rounded-full bg-gold text-[#0f2b25] shadow-lg shadow-emerald/30 ring-4 ring-ivory transition active:scale-95"><TabIcon name="join" className="h-7 w-7" /></span>
            <span>{tr('Join')}</span>
          </NavLink>
          <NavLink to="/culture" className={tabClass}><TabIcon name="culture" /><span>{tr('Culture')}</span></NavLink>
          <button type="button" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)} className="tab-item flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold text-emerald/55">
            <TabIcon name="menu" /><span>{t.menu}</span>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div role="dialog" aria-modal="true" aria-label={t.menu} dir={getDirection(locale)} className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label={t.close} onClick={() => setMenuOpen(false)} className="sheet-backdrop absolute inset-0 bg-[#091f1b]/60 backdrop-blur-sm" />
          <div className="sheet-panel pattern-ajrak absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[2rem] bg-emerald text-ivory shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-emerald/95 px-5 pb-3 pt-3 backdrop-blur">
              <span aria-hidden="true" className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-ivory/25" />
              <p className="mt-3 flex items-center gap-3 font-display text-2xl"><Logo className="h-10 w-10" />{t.menu}</p>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label={t.close} className="mt-3 grid h-11 w-11 place-items-center rounded-full bg-white/10 ring-1 ring-white/15 active:scale-95"><TabIcon name="close" className="h-5 w-5" /></button>
            </div>

            <div className="px-5 pb-8">
              <div className="grid grid-cols-2 gap-3">
                {navItems.map((item) => (
                  <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMenuOpen(false)} className={({ isActive }) => `flex min-h-[4.5rem] flex-col justify-between gap-2 rounded-2xl p-4 text-sm font-semibold ring-1 transition active:scale-[0.98] ${isActive ? 'bg-gold text-[#0f2b25] ring-gold' : 'bg-white/[0.07] text-ivory ring-white/10'}`}>
                    <TabIcon name={item.icon} className="h-5 w-5 opacity-80" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <NavLink to="/join" onClick={() => setMenuOpen(false)} className="flex min-h-[3.25rem] items-center justify-center gap-2 rounded-2xl bg-gold px-4 text-sm font-semibold text-[#0f2b25] active:scale-[0.98]"><TabIcon name="join" className="h-5 w-5" />{t.join}</NavLink>
                <NavLink to="/member" onClick={() => setMenuOpen(false)} className="flex min-h-[3.25rem] items-center justify-center gap-2 rounded-2xl bg-white/[0.07] px-4 text-sm font-semibold ring-1 ring-white/10 active:scale-[0.98]"><TabIcon name="member" className="h-5 w-5" />{tr('Member portal')}</NavLink>
              </div>

              <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{t.language}</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {supportedLocales.map((value) => (
                  <button key={value} type="button" aria-pressed={locale === value} onClick={() => onLocaleChange(value)} className={`min-h-[3rem] rounded-2xl text-sm font-semibold ring-1 transition active:scale-[0.98] ${locale === value ? 'bg-ivory text-emerald ring-ivory' : 'bg-white/[0.07] text-ivory ring-white/10'}`}>
                    {localeLabels[value]}
                  </button>
                ))}
              </div>

              <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{tr('Reach us directly')}</p>
              <div className="mt-3 flex items-center gap-3">
                <a href={`tel:${councilContacts.chairmanPhone.replace(/\s/g, '')}`} className="flex min-h-[3rem] flex-1 items-center justify-center gap-2 rounded-2xl bg-white/[0.07] px-4 text-sm font-semibold ring-1 ring-white/10 active:scale-[0.98]"><ContactIcon name="phone" className="h-4 w-4" /><bdi dir="ltr">{councilContacts.chairmanPhone}</bdi></a>
                <a href={councilContacts.facebook} target="_blank" rel="noopener noreferrer" aria-label={tr('Council on Facebook')} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/[0.07] ring-1 ring-white/10 active:scale-95"><ContactIcon name="facebook" /></a>
                <a href={councilContacts.tiktok} target="_blank" rel="noopener noreferrer" aria-label={tr('Council on TikTok')} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/[0.07] ring-1 ring-white/10 active:scale-95"><ContactIcon name="tiktok" /></a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Footer() {
  const linkClass = 'footer-link inline-block text-ivory/75 transition hover:text-gold';
  return (
    <footer className="mt-16 bg-[#0f2b25] text-ivory">
      <div aria-hidden="true" className="pattern-ajrak h-3 bg-gold/80" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 gap-x-6 gap-y-9 py-12 sm:py-14 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-10">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <Logo className="h-14 w-14" />
              <h2 className="font-display text-2xl">{tr('Saraiki Student Council')}</h2>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-ivory/70">{tr('A heritage-minded student leadership platform for campus life and community voice.')}</p>
            <p className="mt-5 text-xs uppercase tracking-[0.22em] text-gold">{tr('Lahore Leads University')}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href={councilContacts.facebook} target="_blank" rel="noopener noreferrer" aria-label={tr('Council on Facebook')} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-ivory ring-1 ring-white/15 transition hover:-translate-y-0.5 hover:bg-gold hover:text-[#0f2b25]"><ContactIcon name="facebook" /></a>
              <a href={councilContacts.tiktok} target="_blank" rel="noopener noreferrer" aria-label={tr('Council on TikTok')} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-ivory ring-1 ring-white/15 transition hover:-translate-y-0.5 hover:bg-gold hover:text-[#0f2b25]"><ContactIcon name="tiktok" /></a>
              <a href={`tel:${councilContacts.chairmanPhone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm text-ivory ring-1 ring-white/15 transition hover:-translate-y-0.5 hover:bg-gold hover:text-[#0f2b25]"><ContactIcon name="phone" className="h-4 w-4" /><span>{tr('Chairman')}:</span> <bdi dir="ltr">{councilContacts.chairmanPhone}</bdi></a>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">{tr('Explore')}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><NavLink className={linkClass} to="/about">{tr('About Us')}</NavLink></li>
              <li><NavLink className={linkClass} to="/cabinet">{tr('Cabinet')}</NavLink></li>
              <li><NavLink className={linkClass} to="/events">{tr('Events')}</NavLink></li>
              <li><NavLink className={linkClass} to="/culture">{tr('Culture')}</NavLink></li>
              <li><NavLink className={linkClass} to="/poetry">{tr('Poetry')}</NavLink></li>
              <li><NavLink className={linkClass} to="/announcements">{tr('Announcements')}</NavLink></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">{tr('Get involved')}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><NavLink className={linkClass} to="/join">{tr('Join the Council')}</NavLink></li>
              <li><NavLink className={linkClass} to="/member">{tr('Member portal')}</NavLink></li>
              <li><NavLink className={linkClass} to="/contact">{tr('Contact')}</NavLink></li>
              <li><NavLink className={linkClass} to="/privacy">{tr('Privacy Policy')}</NavLink></li>
              <li><NavLink className={linkClass} to="/terms">{tr('Terms of Use')}</NavLink></li>
            </ul>
          </div>
          <div className="col-span-2 lg:col-span-1">
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">{tr('Council staff')}</h3>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm lg:block lg:space-y-2.5">
              <li><NavLink className={linkClass} to="/council/review">{tr('Council staff portal')}</NavLink></li>
              <li><NavLink className={linkClass} to="/council/members">{tr('Council members')}</NavLink></li>
              <li><NavLink className={linkClass} to="/council/events">{tr('Event manager')}</NavLink></li>
              <li><NavLink className={linkClass} to="/council/content">{tr('Content desk')}</NavLink></li>
              <li><NavLink className={linkClass} to="/council/volunteers">{tr('Volunteer desk')}</NavLink></li>
              <li><NavLink className={linkClass} to="/council/inbox">{tr('Council inbox')}</NavLink></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-ivory/10 py-6 text-xs text-ivory/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {tr('Saraiki Student Council, Lahore Leads University.')}</p>
          <p className="font-display text-sm italic text-gold/80">{tr('A living heritage. A shared future.')}</p>
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
    <div className="bg-maroon text-ivory">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5 text-xs sm:gap-6 sm:px-8 lg:px-12">
        <span className="flex shrink-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
          <span className="live-dot" aria-hidden="true" />
          {tr('Latest')}
        </span>
        <div className="no-scrollbar flex min-w-0 flex-1 snap-x gap-6 overflow-x-auto whitespace-nowrap">
          {notices.map((item) => (
            <Link key={item.id} to={`/announcements/${item.slug}`} className="shrink-0 snap-start text-ivory/90 underline-offset-4 hover:text-gold hover:underline lg:shrink lg:truncate">{item.title}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const coverTones = [
  'from-emerald via-[#1f4f45] to-[#0f2b25]',
  'from-maroon via-[#8a3a4d] to-[#4f1d2a]',
  'from-[#1e3a6e] via-[#27498a] to-[#132647]',
];

function EventCover({ event, index = 0, className = 'h-48' }: { event: CouncilEvent; index?: number; className?: string }) {
  const starts = new Date(event.startsAt);
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {event.coverImage ? (
        <img src={event.coverImage} alt="" loading="lazy" className="zoom-target h-full w-full object-cover" />
      ) : (
        <div className={`pattern-ajrak zoom-target h-full w-full bg-gradient-to-br ${coverTones[index % coverTones.length]}`}>
          <StarMark className="absolute -bottom-10 -end-8 h-44 w-44 text-white/[0.07]" />
        </div>
      )}
      <div className="absolute start-4 top-4 rounded-2xl bg-ivory px-3.5 py-2 text-center shadow-lg ring-1 ring-black/5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-maroon">{starts.toLocaleDateString(dateLocale(), { month: 'short' })}</p>
        <p className="font-display text-2xl leading-none text-emerald">{starts.getDate()}</p>
      </div>
      {!event.registrationOpen || new Date(event.endsAt).getTime() < Date.now() ? null : (
        <span className="absolute end-4 top-4 rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ivory ring-1 ring-white/30 backdrop-blur">{tr('Registration open')}</span>
      )}
    </div>
  );
}

const heritageWords = ['Kafi', 'Jhumar', 'Ajrak', 'Rohi', 'Mushaira', 'Kashi kari', 'Sohan halwa', 'Dhol', 'Wasaib'];

function HomePage({ locale }: { locale: Locale }) {
  const t = translations[locale];
  const { items: announcements } = usePublicContent('announcement', locale);
  const { items: articles } = usePublicContent('article', locale);
  const { items: leaders } = usePublicContent('leader', locale);
  const [events, setEvents] = useState<CouncilEvent[]>([]);

  useEffect(() => {
    let active = true;
    apiRequest<{ events: CouncilEvent[] }>('/api/v1/events')
      .then((result) => { if (active) setEvents(result.events.filter((event) => new Date(event.endsAt).getTime() >= Date.now()).slice(0, 3)); })
      .catch(() => { if (active) setEvents([]); });
    return () => { active = false; };
  }, []);

  const nextEvent = events[0];

  return (
    <>
      <AnnouncementStrip locale={locale} />
      <main className="home-main mx-auto max-w-7xl space-y-16 px-4 pb-10 pt-4 sm:space-y-24 sm:px-8 sm:pt-6 lg:space-y-28 lg:px-12">
        <section className="pattern-ajrak relative overflow-hidden rounded-[2rem] bg-emerald text-ivory shadow-soft">
          <div aria-hidden="true" className="absolute -end-24 -top-24 h-96 w-96 rounded-full bg-gold/25 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-32 -start-20 h-96 w-96 rounded-full bg-maroon/50 blur-3xl" />
          <div className="relative grid items-center gap-9 px-5 pb-8 pt-7 sm:gap-10 sm:px-10 sm:py-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:px-14 lg:py-16">
            <div className="hero-enter order-2 lg:order-1">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold ring-1 ring-white/15">
                <StarMark className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.home} <span className="text-ivory/40">/</span></span> {tr('Lahore Leads University')}
              </p>
              <h1 className="mt-5 font-display text-[2.35rem] leading-[1.06] text-ivory sm:mt-6 sm:text-6xl xl:text-[4.25rem]">
                {t.heroTitle}
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-ivory/75 sm:text-lg">{t.heroText}</p>

              <div className="mt-8 flex flex-wrap gap-3 sm:mt-9 sm:gap-4 [&>a]:flex-1 [&>a]:justify-center sm:[&>a]:flex-none">
                <NavLink to="/join" className="btn-shine inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-gold px-5 py-3.5 text-sm font-semibold text-[#0f2b25] sm:px-7 sm:text-base shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#d8ba75]">
                  {t.joinUs}
                </NavLink>
                <NavLink to="/events" className="link-arrow inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-ivory/30 px-5 py-3.5 text-sm font-semibold text-ivory sm:px-7 sm:text-base transition hover:border-gold hover:text-gold">
                  {t.exploreEvents}
                  <ArrowIcon className="h-4 w-4" />
                </NavLink>
              </div>

              {nextEvent && (
                <Link to={`/events/${nextEvent.slug}`} className="link-arrow mt-6 flex items-center gap-3 rounded-2xl bg-white/10 p-3.5 ring-1 ring-white/15 active:scale-[0.99] sm:hidden">
                  <span className="rounded-xl bg-ivory px-3 py-1.5 text-center text-emerald">
                    <span className="block text-[9px] font-semibold uppercase tracking-[0.16em] text-maroon">{new Date(nextEvent.startsAt).toLocaleDateString(dateLocale(), { month: 'short' })}</span>
                    <span className="block font-display text-xl leading-none">{new Date(nextEvent.startsAt).getDate()}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold"><span className="live-dot" aria-hidden="true" />{tr('Next up')}</span>
                    <span className="mt-0.5 block truncate font-display text-base">{tr(nextEvent.title)}</span>
                  </span>
                  <ArrowIcon className="h-4 w-4 shrink-0 text-gold" />
                </Link>
              )}

              <div className="mt-8 grid max-w-lg grid-cols-3 gap-3 border-t border-ivory/15 pt-6 sm:mt-10">
                {impactStats.map((item) => (
                  <div key={item.label}>
                    <p className="font-display text-4xl text-gold">{item.value}</p>
                    <p className="mt-1.5 text-[10px] uppercase leading-4 tracking-[0.14em] text-ivory/60">{tr(item.label)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-enter-late relative order-1 mx-auto w-full max-w-[16.5rem] sm:max-w-sm lg:order-2 lg:max-w-md">
              <div aria-hidden="true" className="arch absolute -inset-3 border border-gold/50" />
              <div className="arch float-slow relative overflow-hidden bg-[#e9e3d6] shadow-2xl shadow-black/40 ring-1 ring-gold/40">
                <img src={assets.heritageScene} alt={tr('Collage of Saraiki heritage: ajrak, Multani blue pottery, shrine architecture, and music')} className="aspect-[4/5] w-full object-cover object-top" />
              </div>

              <div className="absolute -bottom-5 -start-6 flex max-w-[15rem] items-center gap-3 rounded-2xl bg-ivory p-3 text-emerald shadow-xl ring-1 ring-black/5 sm:-start-8 sm:max-w-[18rem] sm:p-3.5">
                <Logo className="h-14 w-14 sm:h-16 sm:w-16" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-maroon">{tr('Our council')}</p>
                  <p className="mt-1 font-display text-base leading-snug sm:text-lg">{tr('Culture, voice, and belonging.')}</p>
                </div>
              </div>

              {nextEvent && (
                <Link to={`/events/${nextEvent.slug}`} className="absolute -end-2 top-[38%] hidden max-w-[13rem] rounded-2xl bg-maroon p-4 text-ivory shadow-xl ring-1 ring-white/15 transition hover:-translate-y-1 sm:block lg:-end-6">
                  <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold"><span className="live-dot" aria-hidden="true" />{tr('Next up')}</p>
                  <p className="mt-1.5 font-display text-base leading-snug">{tr(nextEvent.title)}</p>
                  <p className="mt-1 text-xs text-ivory/70">{new Date(nextEvent.startsAt).toLocaleDateString(dateLocale(), { dateStyle: 'medium' })}</p>
                </Link>
              )}
            </div>
          </div>

          <div aria-hidden="true" className="relative overflow-hidden border-t border-ivory/10 bg-black/15 py-3" dir="ltr">
            <div className="marquee flex w-max gap-10 whitespace-nowrap font-display text-sm italic text-ivory/60">
              {[...heritageWords, ...heritageWords].map((word, index) => (
                <span key={`${word}-${index}`} className="flex items-center gap-10">{tr(word)}<StarMark className="h-3 w-3 text-gold/70" /></span>
              ))}
            </div>
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow={tr('Programs')}
            title={t.upcomingEvents}
            description={tr('Curated campus experiences that bring students together around culture, service, and leadership.')}
            action={<SectionLink to="/events">{tr('All events')}</SectionLink>}
          />
          {events.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-emerald/20 bg-white/50 px-6 py-10 text-center text-sm text-charcoal/60">{tr('New events will be announced here.')}</p>
          ) : <div className="mobile-carousel grid gap-6 md:grid-cols-3">
            {events.map((event, index) => (
              <Reveal key={event.id} delay={index * 90}>
                <article className="card-lift group flex h-full flex-col overflow-hidden rounded-3xl border border-emerald/10 bg-white">
                  <EventCover event={event} index={index} />
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{new Date(event.startsAt).toLocaleDateString(dateLocale(), { dateStyle: 'medium' })}</p>
                    <h3 className="mt-2 font-display text-2xl leading-snug text-emerald">{tr(event.title)}</h3>
                    <p className="mt-3 flex-1 text-sm leading-6 text-charcoal/70">{tr(event.summary)}</p>
                    <p className="mt-4 truncate text-xs text-charcoal/55">{tr(event.venue)}</p>
                    <Link to={`/events/${event.slug}`} className="link-arrow mt-5 inline-flex items-center gap-2 text-sm font-semibold text-maroon">
                      {tr('View details')}
                      <ArrowIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>}
        </section>

        <Reveal>
          <section className="pattern-ajrak relative grid gap-8 overflow-hidden rounded-[2rem] bg-[#0f2b25] p-8 text-ivory shadow-soft lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:p-12">
            <div aria-hidden="true" className="absolute -end-20 bottom-0 h-72 w-72 rounded-full bg-gold/15 blur-3xl" />
            <div className="relative">
              <p className="eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-gold">{tr('Mission & vision')}</p>
              <h2 className="mt-3 font-display text-3xl leading-tight sm:text-[2.6rem]">{tr('Student leadership rooted in shared values.')}</h2>
            </div>
            <div className="relative grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/[0.07] p-6 ring-1 ring-white/10 transition hover:bg-white/[0.11]">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-gold/15 text-gold"><StarMark className="h-5 w-5" /></span>
                <h3 className="mt-4 font-display text-xl">{tr('Our mission')}</h3>
                <p className="mt-2 text-sm leading-6 text-ivory/75">{tr('To create a vibrant, inclusive student community that values heritage, service, and cooperation.')}</p>
              </div>
              <div className="rounded-3xl bg-white/[0.07] p-6 ring-1 ring-white/10 transition hover:bg-white/[0.11]">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-gold/15 text-gold">
                  <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10z" /><circle cx="10" cy="10" r="2.5" /></svg>
                </span>
                <h3 className="mt-4 font-display text-xl">{tr('Our vision')}</h3>
                <p className="mt-2 text-sm leading-6 text-ivory/75">{tr('To strengthen student agency through culturally grounded leadership and informed participation.')}</p>
              </div>
            </div>
          </section>
        </Reveal>

        <section>
          <SectionHeader
            eyebrow={tr('Heritage')}
            title={t.heritageFeature}
            description={tr('A living archive of stories, language, and cultural continuity that connects students to one another and their heritage.')}
            action={<SectionLink to="/culture">{tr('All stories')}</SectionLink>}
          />
          {articles.length === 0 ? <p className="rounded-2xl border border-dashed border-emerald/20 bg-white/50 px-6 py-10 text-center text-sm text-charcoal/60">{tr('Cultural stories will appear here as the council publishes them.')}</p> : (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              {articles[0] && <Reveal><article className="card-lift group relative h-full min-h-[26rem] overflow-hidden rounded-3xl bg-emerald text-ivory">
                <img src={articles[0].imageUrl || assets.heritageScene} alt="" loading="lazy" className="zoom-target absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#091f1b] via-[#091f1b]/70 to-transparent" />
                <div className="relative flex h-full flex-col justify-end p-7 sm:p-9"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">{tr('Feature article')}</p><h3 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">{articles[0].title}</h3><p className="mt-3 max-w-xl text-sm leading-6 text-ivory/80">{articles[0].summary}</p><Link to={`/culture/${articles[0].slug}`} className="link-arrow mt-5 inline-flex items-center gap-2 font-semibold text-gold">{tr('Read story')}<ArrowIcon className="h-4 w-4" /></Link></div>
              </article></Reveal>}
              <div className="space-y-4">{articles.slice(1, 4).map((article, index) => <Reveal key={article.id} delay={index * 90}><article className="card-lift group flex gap-5 rounded-3xl border border-emerald/10 bg-white p-6"><span className="font-display text-3xl text-gold/70">{String(index + 2).padStart(2, '0')}</span><div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{tr('Culture')}</p><h3 className="mt-1.5 font-display text-xl leading-snug text-emerald">{article.title}</h3><p className="mt-2 text-sm leading-6 text-charcoal/70">{article.summary}</p><Link to={`/culture/${article.slug}`} className="link-arrow mt-3 inline-flex items-center gap-2 text-sm font-semibold text-maroon">{tr('Read article')}<ArrowIcon className="h-4 w-4" /></Link></div></article></Reveal>)}</div>
            </div>
          )}
        </section>

        <PoetrySpotlight />

        <section>
          <SectionHeader
            eyebrow={tr('People')}
            title={t.leadershipPreview}
            description={tr('The council brings together students, mentors, and volunteers dedicated to belonging, representation, and cultural stewardship.')}
            action={<SectionLink to="/cabinet">{tr('Full cabinet')}</SectionLink>}
          />
          {leaders.length === 0 ? <p className="rounded-2xl border border-dashed border-emerald/20 bg-white/50 px-6 py-10 text-center text-sm text-charcoal/60">{tr('Council profiles will be added as they are approved for publication.')}</p> : <div className="mobile-carousel grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{leaders.slice(0, 4).map((profile, index) => <Reveal key={profile.id} delay={index * 90}><article className="card-lift group relative h-[26rem] overflow-hidden rounded-3xl bg-emerald text-ivory">{profile.imageUrl || cabinetPortraits[profile.title] ? <img src={profile.imageUrl || cabinetPortraits[profile.title]} alt="" loading="lazy" className="zoom-target absolute inset-0 h-full w-full object-cover object-top" /> : <div className="pattern-ajrak absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald to-[#0f2b25]"><span className="font-display text-7xl text-gold">{profile.title.slice(0, 1)}</span></div>}<div className="absolute inset-0 bg-gradient-to-t from-[#091f1b] via-[#091f1b]/35 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-6"><p className="inline-block rounded-full bg-gold px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0f2b25]">{tr(profile.roleTitle || 'Council member')}</p><h3 className="mt-3 font-display text-2xl">{tr(profile.title)}</h3><p className="mt-1.5 text-sm leading-6 text-ivory/75">{tr(profile.summary)}</p></div></article></Reveal>)}</div>}
        </section>

        <section>
          <SectionHeader
            eyebrow={tr('News')}
            title={t.recentAnnouncements}
            description={tr('A clear channel for updates, volunteer opportunities, and important campus announcements.')}
            action={<SectionLink to="/announcements">{tr('All announcements')}</SectionLink>}
          />
          <div className="space-y-4">
            {announcements.length === 0 ? <p className="rounded-2xl border border-dashed border-emerald/20 bg-white/50 px-6 py-10 text-center text-sm text-charcoal/60">{tr('Council announcements will appear here when published.')}</p> : announcements.slice(0, 3).map((item, index) => (
              <Reveal key={item.id} delay={index * 80}>
                <article className="card-lift group relative grid gap-4 rounded-3xl border border-emerald/10 bg-white p-6 sm:grid-cols-[5.5rem_1fr_auto] sm:items-center sm:gap-6">
                  <div className="hidden rounded-2xl bg-emerald/[0.06] px-3 py-3 text-center sm:block">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-maroon">{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString(dateLocale(), { month: 'short' }) : tr('New')}</p>
                    <p className="font-display text-2xl leading-none text-emerald">{item.publishedAt ? new Date(item.publishedAt).getDate() : '·'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{tr('Announcement')}</p>
                    <h3 className="mt-1.5 font-display text-xl leading-snug text-emerald">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-charcoal/70">{item.summary}</p>
                  </div>
                  <Link to={`/announcements/${item.slug}`} className="link-arrow inline-flex items-center gap-2 text-sm font-semibold text-maroon after:absolute after:inset-0">{tr('Read update')}<ArrowIcon className="h-4 w-4" /></Link>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow={tr('Gallery')}
            title={t.eventGallery}
            description={tr('Moments from student gatherings, heritage showcases, and council-led community programming.')}
          />
          <Reveal>
            <div className="mobile-carousel gallery-row grid auto-rows-[13rem] gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {galleryCards.map((item) => (
                <figure key={item.title} className={`group relative overflow-hidden rounded-3xl bg-emerald shadow-soft ${item.span}`}>
                  {item.image ? <img src={item.image} alt={tr(item.title)} loading="lazy" className={`zoom-target h-full w-full object-cover ${item.position ?? ''}`} /> : (
                    <div className="pattern-ajrak flex h-full w-full flex-col justify-between bg-gradient-to-br from-maroon to-[#4f1d2a] p-6 text-ivory">
                      <StarMark className="h-8 w-8 text-gold" />
                      <p className="font-display text-2xl leading-snug">{tr('A living heritage.')}<br />{tr('A shared future.')}</p>
                    </div>
                  )}
                  {item.image && <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#091f1b]/90 to-transparent p-5 pt-12 text-sm font-medium text-ivory">{tr(item.title)}</figcaption>}
                </figure>
              ))}
            </div>
          </Reveal>
        </section>

        <Reveal>
          <section className="relative overflow-hidden rounded-[2rem] border border-emerald/10 bg-white p-5 shadow-soft sm:p-8 lg:p-12">
            <StarMark className="absolute -end-10 -top-10 h-56 w-56 text-emerald/[0.04]" />
            <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center [&>*]:min-w-0">
              <div>
                <p className="eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-gold">{t.contact}</p>
                <h2 className="mt-3 font-display text-3xl leading-tight text-emerald sm:text-[2.6rem]">{tr('Connect with the council')}</h2>
                <p className="mt-3 max-w-lg leading-7 text-charcoal/75">{tr('For enquiries, collaborations, and student outreach, we welcome your message and partnership.')}</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link to="/contact" className="rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-ivory transition hover:-translate-y-0.5 hover:bg-maroon">{tr('Send a message')}</Link>
                  <Link to="/join" className="rounded-full border border-emerald/20 px-6 py-3 text-sm font-semibold text-emerald transition hover:border-gold hover:text-maroon">{tr('Become a member')}</Link>
                </div>
              </div>
              <ContactChannels />
            </div>
          </section>
        </Reveal>
      </main>
    </>
  );
}

function AboutPage() {
  const values = [
    { title: 'Heritage', text: 'We keep the Saraiki language, poetry, craft, and music present in campus life.' },
    { title: 'Voice', text: 'We represent students and make sure their concerns and ideas are heard.' },
    { title: 'Service', text: 'We organise volunteers for events, outreach, and support for new students.' },
    { title: 'Belonging', text: 'We welcome every student of the university, whatever their department or mother tongue.' },
  ];

  return (
    <PageShell title={tr('About Us')}>
      <div className="grid gap-6 md:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-[2rem] border border-emerald/10 bg-white p-8 shadow-soft sm:p-10">
            <Logo label={tr('Saraiki Student Council emblem')} className="float-end mb-3 ms-4 h-24 w-24 sm:h-32 sm:w-32" />
            <p className="eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-gold">{tr('Who we are')}</p>
            <h2 className="mt-3 font-display text-3xl text-emerald sm:text-4xl">{tr('Our story')}</h2>
            <p className="mt-5 leading-7 text-charcoal/75">{tr('The council exists to strengthen student voice, celebrate heritage, and build a more connected campus culture.')}</p>
            <p className="mt-4 leading-7 text-charcoal/75">{tr('It brings together students who care about leadership, scholarship, service, and the continuity of cultural traditions.')}</p>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="pattern-ajrak relative h-full overflow-hidden rounded-[2rem] bg-emerald p-8 text-ivory shadow-soft sm:p-10">
            <div aria-hidden="true" className="absolute -bottom-16 -end-16 h-56 w-56 rounded-full bg-gold/20 blur-3xl" />
            <div className="relative">
              <p className="eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-gold">{tr('What guides us')}</p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl">{tr('Mission & vision')}</h2>
              <p className="mt-5 leading-7 text-ivory/80">{tr('We aim to create a welcoming, inclusive, and culturally rooted platform for university leadership and community life.')}</p>
            </div>
          </div>
        </Reveal>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((value, index) => (
          <Reveal key={value.title} delay={index * 80}>
            <div className="card-lift h-full rounded-3xl border border-emerald/10 bg-white p-6">
              <span className="font-display text-3xl text-gold/70">{String(index + 1).padStart(2, '0')}</span>
              <h3 className="mt-3 font-display text-xl text-emerald">{tr(value.title)}</h3>
              <p className="mt-2 text-sm leading-6 text-charcoal/70">{tr(value.text)}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/join" className="rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-ivory transition hover:-translate-y-0.5 hover:bg-maroon">{tr('Join the Council')}</Link>
        <SectionLink to="/cabinet">{tr('Meet the cabinet')}</SectionLink>
      </div>
    </PageShell>
  );
}

function LeaderCard({ member, featured = false }: { member: CabinetMember; featured?: boolean }) {
  const initials = member.name.split(' ').map((part) => part[0]).join('').slice(0, 2);

  return (
    <article className={`card-lift group relative overflow-hidden rounded-3xl bg-emerald text-ivory ${featured ? 'h-[26rem] sm:h-[30rem]' : 'h-60 sm:h-[24rem]'}`}>
      {member.image ? (
        <img src={member.image} alt={tr(member.name)} loading="lazy" className="zoom-target absolute inset-0 h-full w-full object-cover object-top" />
      ) : (
        <div className="pattern-ajrak absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald to-[#0f2b25] pb-16 font-display text-5xl text-gold sm:text-6xl">
          {initials}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#091f1b] via-[#091f1b]/30 to-transparent" />
      <div className={`absolute inset-x-0 bottom-0 ${featured ? 'p-5' : 'p-3.5'} sm:p-6`}>
        <p className={`inline-block rounded-full bg-gold font-semibold uppercase text-[#0f2b25] ${featured ? 'px-3 py-1 text-[10px] tracking-[0.16em]' : 'px-2 py-0.5 text-[8.5px] tracking-[0.08em] sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.16em]'}`}>{tr(member.designation)}</p>
        <h2 className={`font-display ${featured ? 'mt-3 text-3xl' : 'mt-2 text-lg leading-tight sm:mt-3 sm:text-2xl'}`}>{tr(member.name)}</h2>
      </div>
    </article>
  );
}

function LeadershipPage({ locale }: { locale: Locale }) {
  const featuredLeaders = cabinetMembers.filter((member) => member.category === 'main');
  const executiveLeaders = cabinetMembers.filter((member) => member.category === 'executive');

  return (
    <PageShell title={tr('Leadership')}>
      <div className="space-y-12">
        <div className="rounded-[2rem] border border-emerald/10 bg-white p-7 shadow-soft sm:p-10">
          <p className="eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-gold">{tr('Council leadership')}</p>
          <h2 className="mt-3 font-display text-4xl text-emerald sm:text-5xl">{tr('Cabinet 2026–2027')}</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-charcoal/75">{tr('The Saraiki Student Council brings together students, community leaders, and cultural ambassadors to strengthen representation, leadership, and student belonging across campus life.')}</p>
          <Link to="/cabinet" className="link-arrow mt-6 inline-flex items-center gap-2 text-sm font-semibold text-maroon">{tr('View the complete cabinet')}<ArrowIcon className="h-4 w-4" /></Link>
        </div>

        <section className="mobile-carousel grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredLeaders.map((member, index) => (
            <Reveal key={member.id} delay={index * 90}>
              <LeaderCard member={member} featured />
            </Reveal>
          ))}
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-emerald/15 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gold">{tr('Executive cabinet')}</p>
              <h2 className="mt-2 font-display text-3xl text-emerald">{tr('Leadership in action')}</h2>
            </div>
            <Link to="/cabinet" className="text-sm font-semibold text-maroon underline-offset-4 hover:underline">{tr('Open cabinet directory')}</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-6 xl:grid-cols-4">
            {executiveLeaders.map((member, index) => <Reveal key={member.id} delay={(index % 4) * 70}><LeaderCard member={member} /></Reveal>)}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function CabinetPage() {
  return (
    <PageShell title={tr('Cabinet 2026–2027')}>
      <div className="mb-8 flex items-center justify-between gap-4 border-b border-emerald/15 pb-4">
        <p className="text-sm text-charcoal/65">{tr('Official council cabinet and leadership roster.')}</p>
        <Link to="/leadership" className="text-sm font-semibold text-maroon underline-offset-4 hover:underline">{tr('Back to leadership')}</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-6 xl:grid-cols-4">
        {cabinetMembers.map((member, index) => (
          <Reveal key={member.id} delay={(index % 4) * 70}><LeaderCard member={member} /></Reveal>
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
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : tr('Could not load events.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <PageShell title={tr('Events')}>
      {error && <p role="alert" className="mb-6 border-l-2 border-maroon bg-white px-4 py-3 text-sm text-maroon">{error}</p>}
      {loading ? <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" role="status"><span className="sr-only">{tr('Loading events…')}</span>{[0, 1, 2].map((item) => <div key={item} className="skeleton h-96" />)}</div> : events.length === 0 ? (
        <div className="border-y border-emerald/15 py-14 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">{tr('Council calendar')}</p>
          <h2 className="mt-3 font-display text-3xl text-emerald">{tr('The next gathering is taking shape.')}</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-charcoal/65">{tr('Published events will appear here with details and registration information.')}</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event, index) => (
            <Reveal key={event.id} delay={(index % 3) * 90}>
              <article className="card-lift group flex h-full flex-col overflow-hidden rounded-3xl border border-emerald/10 bg-white">
                <EventCover event={event} index={index} className="h-52" />
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{new Date(event.startsAt).toLocaleDateString(dateLocale(), { dateStyle: 'long' })}</p>
                  <h2 className="mt-3 font-display text-2xl leading-snug text-emerald">{tr(event.title)}</h2>
                  <p className="mt-3 flex-1 text-sm leading-6 text-charcoal/70">{tr(event.summary)}</p>
                  <p className="mt-4 text-xs uppercase tracking-[0.12em] text-charcoal/55">{tr(event.venue)}</p>
                  <Link to={`/events/${event.slug}`} className="link-arrow mt-5 inline-flex items-center gap-2 text-sm font-semibold text-maroon">{tr('Event details and registration')}<ArrowIcon className="h-4 w-4" /></Link>
                </div>
              </article>
            </Reveal>
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
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : tr('Event not found.')); })
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
      setMessage(tr('Your place for {title} is confirmed.', { title: tr(result.registration.eventTitle) }));
      setEvent((current) => current ? { ...current, registrationCount: current.registrationCount + 1 } : current);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : tr('Registration could not be completed.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell title={tr('Event detail')}>
      {loading ? <p className="text-sm text-charcoal/60">{tr('Loading event…')}</p> : !event ? (
        <div role="alert" className="border-l-2 border-maroon bg-white p-6 text-maroon">{error || tr('Event not found.')}</div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div>
            <EventCover event={event} className="h-52 rounded-3xl shadow-soft sm:h-96" />
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-gold">{new Date(event.startsAt).toLocaleString(dateLocale(), { dateStyle: 'full', timeStyle: 'short' })}</p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-emerald sm:text-5xl">{tr(event.title)}</h2>
            <p className="mt-5 whitespace-pre-line text-base leading-7 text-charcoal/75">{tr(event.description)}</p>
            <div className="mt-7 grid gap-4 border-t border-emerald/15 pt-5 sm:grid-cols-2">
              <div><p className="text-xs uppercase tracking-[0.16em] text-charcoal/50">{tr('Venue')}</p><p className="mt-1 text-sm text-charcoal/80">{tr(event.venue)}</p></div>
              <div><p className="text-xs uppercase tracking-[0.16em] text-charcoal/50">{tr('Places')}</p><p className="mt-1 text-sm text-charcoal/80">{event.capacity ? tr('{remaining} of {capacity} remaining', { remaining: Math.max(event.capacity - event.registrationCount, 0), capacity: event.capacity }) : tr('Open registration')}</p></div>
            </div>
          </div>
          <aside id="register" className="h-fit scroll-mt-24 rounded-3xl border border-emerald/10 bg-white p-5 shadow-soft sm:p-8 lg:sticky lg:top-36">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{tr('Registration')}</p>
            <h3 className="mt-3 font-display text-3xl text-emerald">{tr('Save your place.')}</h3>
            {message ? <p role="status" className="mt-5 border-l-2 border-emerald bg-emerald/5 px-4 py-3 text-sm text-emerald">{message}</p> : event.registrationOpen && new Date(event.endsAt).getTime() >= Date.now() && (!event.capacity || event.registrationCount < event.capacity) ? (
              <form onSubmit={register} className="mt-6 space-y-4">
                <label className="block text-sm font-medium text-emerald">{tr('Full name')}<input required autoComplete="name" className="mt-2 w-full border border-emerald/20 px-3 py-3 text-sm outline-none focus:border-gold" value={fullName} onChange={(input) => setFullName(input.target.value)} /></label>
                <label className="block text-sm font-medium text-emerald">{tr('University email')}<input required type="email" autoComplete="email" className="mt-2 w-full border border-emerald/20 px-3 py-3 text-sm outline-none focus:border-gold" value={email} onChange={(input) => setEmail(input.target.value)} /></label>
                <label className="block text-sm font-medium text-emerald">{tr('Student ID')}<input required className="mt-2 w-full border border-emerald/20 px-3 py-3 text-sm outline-none focus:border-gold" value={studentId} onChange={(input) => setStudentId(input.target.value)} /></label>
                <label className="flex items-start gap-3 text-xs leading-5 text-charcoal/70"><input required type="checkbox" checked={privacyAcknowledged} onChange={(input) => setPrivacyAcknowledged(input.target.checked)} className="mt-1 accent-emerald" /><span>{tr('I agree that the council may use these details to manage my event registration.')}</span></label>
                {error && <p role="alert" className="text-sm text-maroon">{error}</p>}
                <button disabled={submitting} className="w-full bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ivory disabled:opacity-50">{submitting ? tr('Confirming…') : tr('Register for event')}</button>
              </form>
            ) : <p className="mt-5 text-sm leading-6 text-charcoal/70">{new Date(event.endsAt).getTime() < Date.now() ? tr('This event has already taken place.') : tr('Registration is currently closed or this event is full.')}</p>}
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
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : tr('Could not load events.')); })
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
      setError(requestError instanceof Error ? requestError.message : tr('Sign-in failed.'));
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
      setMessage(tr('Event created.'));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : tr('Event could not be created.'));
    }
  }

  async function viewAttendees(slug: string) {
    setSelectedSlug(slug);
    setError('');
    try {
      const result = await apiRequest<{ registrations: EventAttendee[] }>(`/api/v1/events/${slug}/registrations`);
      setAttendees(result.registrations);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : tr('Attendee list could not be loaded.'));
    }
  }

  async function signOut() {
    try { await apiRequest('/api/v1/auth/logout', { method: 'POST' }); }
    finally { setStaff(null); setEvents([]); setAttendees([]); }
  }

  const inputClass = 'mt-2 w-full border border-emerald/20 bg-white px-3 py-3 text-sm outline-none focus:border-gold';

  return (
    <PageShell title={tr('Event Management')}>
      {!authChecked ? <p className="text-sm text-charcoal/60">{tr('Checking staff session…')}</p> : !staff ? (
        <div className="mx-auto max-w-xl border border-emerald/15 bg-white p-7 shadow-soft">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">{tr('Event team')}</p>
          <h2 className="mt-3 font-display text-3xl text-emerald">{tr('Sign in to manage events')}</h2>
          <form onSubmit={signIn} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-emerald">{tr('Email')}<input required type="email" className={inputClass} value={email} onChange={(input) => setEmail(input.target.value)} /></label>
            <label className="block text-sm font-medium text-emerald">{tr('Password')}<input required type="password" className={inputClass} value={password} onChange={(input) => setPassword(input.target.value)} /></label>
            {error && <p role="alert" className="text-sm text-maroon">{error}</p>}
            <button className="w-full bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ivory">{tr('Sign in')}</button>
          </form>
        </div>
      ) : !['admin', 'event_manager'].includes(staff.role) ? (
        <div className="border-l-2 border-maroon bg-white p-6"><h2 className="font-display text-2xl text-emerald">{tr('Event management is not enabled for this account.')}</h2><button type="button" onClick={() => void signOut()} className="mt-4 text-sm text-maroon underline">{tr('Sign out')}</button></div>
      ) : (
        <div className="grid gap-10 xl:grid-cols-[0.9fr_1.1fr]">
          <section>
            <div className="mb-6 flex items-end justify-between gap-4 border-b border-emerald/15 pb-4">
              <div><p className="text-xs uppercase tracking-[0.16em] text-charcoal/55">{tr('Signed in ·')} {staff.email}</p><h2 className="mt-2 font-display text-3xl text-emerald">{tr('Create an event')}</h2></div>
              <button type="button" onClick={() => void signOut()} className="text-sm font-semibold text-maroon underline">{tr('Sign out')}</button>
            </div>
            <form onSubmit={createEvent} className="space-y-4 border border-emerald/10 bg-white p-5 shadow-soft sm:p-7">
              <label className="block text-sm font-medium text-emerald">{tr('Title')}<input required minLength={3} maxLength={140} className={inputClass} value={form.title} onChange={(input) => setForm((current) => ({ ...current, title: input.target.value }))} /></label>
              <label className="block text-sm font-medium text-emerald">{tr('Short summary')}<input required minLength={10} maxLength={280} className={inputClass} value={form.summary} onChange={(input) => setForm((current) => ({ ...current, summary: input.target.value }))} /></label>
              <label className="block text-sm font-medium text-emerald">{tr('Description')}<textarea required minLength={10} maxLength={5000} rows={4} className={inputClass} value={form.description} onChange={(input) => setForm((current) => ({ ...current, description: input.target.value }))} /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-emerald">{tr('Starts')}<input required type="datetime-local" className={inputClass} value={form.startsAt} onChange={(input) => setForm((current) => ({ ...current, startsAt: input.target.value }))} /></label>
                <label className="block text-sm font-medium text-emerald">{tr('Ends')}<input required type="datetime-local" className={inputClass} value={form.endsAt} onChange={(input) => setForm((current) => ({ ...current, endsAt: input.target.value }))} /></label>
              </div>
              <label className="block text-sm font-medium text-emerald">{tr('Venue')}<input required minLength={2} className={inputClass} value={form.venue} onChange={(input) => setForm((current) => ({ ...current, venue: input.target.value }))} /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-emerald">{tr('Capacity')} <span className="font-normal text-charcoal/50">{tr('(blank means unlimited)')}</span><input type="number" min="1" step="1" className={inputClass} value={form.capacity} onChange={(input) => setForm((current) => ({ ...current, capacity: input.target.value }))} /></label>
                <label className="block text-sm font-medium text-emerald">{tr('Cover image URL')} <span className="font-normal text-charcoal/50">{tr('(optional)')}</span><input type="url" className={inputClass} value={form.coverImage} onChange={(input) => setForm((current) => ({ ...current, coverImage: input.target.value }))} /></label>
              </div>
              <div className="flex flex-wrap items-center gap-5 border-t border-emerald/10 pt-4">
                <label className="flex items-center gap-2 text-sm text-charcoal/75"><input type="checkbox" checked={form.registrationOpen} onChange={(input) => setForm((current) => ({ ...current, registrationOpen: input.target.checked }))} className="accent-emerald" /> {tr('Open registration')}</label>
                <label className="flex items-center gap-2 text-sm text-charcoal/75"><input type="checkbox" checked={form.status === 'published'} onChange={(input) => setForm((current) => ({ ...current, status: input.target.checked ? 'published' : 'draft' }))} className="accent-emerald" /> {tr('Publish immediately')}</label>
              </div>
              {error && <p role="alert" className="text-sm text-maroon">{error}</p>}
              {message && <p role="status" className="text-sm text-emerald">{message}</p>}
              <button className="bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-ivory">{tr('Create event')}</button>
            </form>
          </section>
          <section>
            <div className="border-b border-emerald/15 pb-4"><p className="text-xs uppercase tracking-[0.16em] text-charcoal/55">{tr(staff.role)}</p><h2 className="mt-2 font-display text-3xl text-emerald">{tr('Calendar and attendees')}</h2></div>
            {loading ? <p className="py-8 text-sm text-charcoal/60">{tr('Loading calendar…')}</p> : events.length === 0 ? <p className="py-8 text-sm text-charcoal/60">{tr('No events created yet.')}</p> : (
              <div className="mt-4 divide-y divide-emerald/10">
                {events.map((event) => (
                  <article key={event.id} className="py-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div><p className="text-xs uppercase tracking-[0.15em] text-gold">{tr(event.status)} · {event.registrationOpen ? tr('registration open') : tr('registration closed')}</p><h3 className="mt-2 font-display text-xl text-emerald">{tr(event.title)}</h3><p className="mt-1 text-sm text-charcoal/65">{new Date(event.startsAt).toLocaleString()} · {tr(event.venue)}</p></div>
                      <span className="text-sm text-charcoal/60">{event.registrationCount}{event.capacity ? ` / ${event.capacity}` : ''} {tr('registered')}</span>
                    </div>
                    <button type="button" onClick={() => void viewAttendees(event.slug)} className="mt-3 text-sm font-semibold text-maroon underline">{selectedSlug === event.slug ? tr('Refresh attendee list') : tr('View attendees')}</button>
                    {selectedSlug === event.slug && <div className="mt-3 border-l-2 border-gold pl-4">{attendees.length ? attendees.map((attendee) => <div key={attendee.id} className="py-2 text-sm"><strong className="text-emerald">{attendee.fullName}</strong><span className="text-charcoal/60"> · {attendee.studentId} · {attendee.email}</span></div>) : <p className="py-2 text-sm text-charcoal/60">{tr('No registrations yet.')}</p>}</div>}
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
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : tr('Could not load content.')); })
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
      setError(requestError instanceof Error ? requestError.message : tr('Sign-in failed.'));
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
      setMessage(editingId ? tr('Changes saved.') : tr('Content created.'));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : tr('Content could not be saved.'));
    }
  }

  async function changeContentStatus(item: CmsContent) {
    const status = item.status === 'published' ? 'draft' : 'published';
    setError('');
    try {
      const result = await apiRequest<{ item: CmsContent }>(`/api/v1/content/manage/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setItems((current) => current.map((currentItem) => currentItem.id === item.id ? result.item : currentItem));
      setMessage(status === 'published' ? tr('Content published.') : tr('Content moved back to draft.'));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : tr('The status could not be changed.'));
    }
  }

  async function signOut() {
    try { await apiRequest('/api/v1/auth/logout', { method: 'POST' }); }
    finally { setStaff(null); setItems([]); }
  }

  const inputClass = 'mt-2 w-full border border-emerald/20 bg-white px-3 py-3 text-sm outline-none focus:border-gold';

  return (
    <PageShell title={tr('Content Desk')}>
      {!authChecked ? <p className="text-sm text-charcoal/60">{tr('Checking staff session…')}</p> : !staff ? (
        <div className="mx-auto max-w-xl border border-emerald/15 bg-white p-7 shadow-soft"><p className="text-xs uppercase tracking-[0.2em] text-gold">{tr('Editorial team')}</p><h2 className="mt-3 font-display text-3xl text-emerald">{tr('Sign in to manage council content')}</h2><form onSubmit={signIn} className="mt-6 space-y-4"><label className="block text-sm font-medium text-emerald">{tr('Email')}<input required type="email" className={inputClass} value={email} onChange={(input) => setEmail(input.target.value)} /></label><label className="block text-sm font-medium text-emerald">{tr('Password')}<input required type="password" className={inputClass} value={password} onChange={(input) => setPassword(input.target.value)} /></label>{error && <p role="alert" className="text-sm text-maroon">{error}</p>}<button className="w-full bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ivory">{tr('Sign in')}</button></form></div>
      ) : !['admin', 'editor'].includes(staff.role) ? (
        <div className="border-l-2 border-maroon bg-white p-6"><h2 className="font-display text-2xl text-emerald">{tr('Content editing is not enabled for this account.')}</h2><button type="button" onClick={() => void signOut()} className="mt-4 text-sm text-maroon underline">{tr('Sign out')}</button></div>
      ) : (
        <div className="grid gap-10 xl:grid-cols-[0.92fr_1.08fr]">
          <section>
            <div className="mb-5 flex items-end justify-between gap-4 border-b border-emerald/15 pb-4"><div><p className="text-xs uppercase tracking-[0.16em] text-charcoal/55">{tr('Signed in ·')} {staff.email}</p><h2 className="mt-2 font-display text-3xl text-emerald">{editingId ? tr('Edit content') : tr('Create content')}</h2></div><button type="button" onClick={() => void signOut()} className="text-sm text-maroon underline">{tr('Sign out')}</button></div>
            <form onSubmit={saveContent} className="space-y-4 border border-emerald/10 bg-white p-5 shadow-soft sm:p-7">
              <label className="block text-sm font-medium text-emerald">{tr('Section')}<select disabled={Boolean(editingId)} className={inputClass} value={contentType} onChange={(input) => setContentType(input.target.value as CmsContent['contentType'])}><option value="announcement">{tr('Announcement')}</option><option value="article">{tr('Culture article')}</option><option value="leader">{tr('Leadership profile')}</option></select></label>
              <label className="block text-sm font-medium text-emerald">{tr('Title')}<input required minLength={2} maxLength={180} className={inputClass} value={form.title} onChange={(input) => setForm((current) => ({ ...current, title: input.target.value }))} /></label>
              <label className="block text-sm font-medium text-emerald">{tr('Summary')}<input required minLength={8} maxLength={360} className={inputClass} value={form.summary} onChange={(input) => setForm((current) => ({ ...current, summary: input.target.value }))} /></label>
              <label className="block text-sm font-medium text-emerald">{tr('Full text / biography')}<textarea required rows={7} minLength={8} maxLength={12000} className={inputClass} value={form.body} onChange={(input) => setForm((current) => ({ ...current, body: input.target.value }))} /></label>
              <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-emerald">{tr('Language')}<select className={inputClass} value={form.locale} onChange={(input) => setForm((current) => ({ ...current, locale: input.target.value as Locale }))}>{supportedLocales.map((locale) => <option key={locale} value={locale}>{localeLabels[locale]}</option>)}</select></label><label className="block text-sm font-medium text-emerald">{tr('Status')}<select className={inputClass} value={form.status} onChange={(input) => setForm((current) => ({ ...current, status: input.target.value as 'draft' | 'published' }))}><option value="draft">{tr('Draft')}</option><option value="published">{tr('Published')}</option></select></label></div>
              {contentType === 'leader' && <label className="block text-sm font-medium text-emerald">{tr('Council role')}<input maxLength={120} className={inputClass} value={form.roleTitle} onChange={(input) => setForm((current) => ({ ...current, roleTitle: input.target.value }))} /></label>}
              <label className="block text-sm font-medium text-emerald">{tr('Image URL')} <span className="font-normal text-charcoal/50">{tr('(optional)')}</span><input type="url" className={inputClass} value={form.imageUrl} onChange={(input) => setForm((current) => ({ ...current, imageUrl: input.target.value }))} /></label>
              {error && <p role="alert" className="text-sm text-maroon">{error}</p>}{message && <p role="status" className="text-sm text-emerald">{message}</p>}
              <div className="flex flex-wrap gap-3"><button className="bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-ivory">{editingId ? tr('Save changes') : tr('Create item')}</button>{editingId && <button type="button" onClick={() => { setEditingId(''); setForm(emptyForm); }} className="border border-emerald/20 px-5 py-3 text-sm text-emerald">{tr('Cancel edit')}</button>}</div>
            </form>
          </section>
          <section>
            <div className="flex flex-col gap-4 border-b border-emerald/15 pb-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-charcoal/55">{tr(staff.role)} {tr('· editorial')}</p><h2 className="mt-2 font-display text-3xl text-emerald">{tr('Manage published work')}</h2></div><label className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald">{tr('Section')}<select aria-label={tr('Content section filter')} className="ml-2 border border-emerald/20 bg-white px-3 py-2 text-sm normal-case tracking-normal" value={contentType} onChange={(input) => { setContentType(input.target.value as CmsContent['contentType']); setEditingId(''); setForm(emptyForm); }}><option value="announcement">{tr('Announcements')}</option><option value="article">{tr('Culture stories')}</option><option value="leader">{tr('Leadership')}</option></select></label></div>
            {loading ? <p className="py-8 text-sm text-charcoal/60">{tr('Loading editorial items…')}</p> : items.length === 0 ? <div className="py-12 text-center"><p className="text-sm text-charcoal/60">{tr('No items in this section yet.')}</p></div> : <div className="divide-y divide-emerald/10">{items.map((item) => <article key={item.id} className="py-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs uppercase tracking-[0.14em] text-gold">{tr(item.status)} · {localeLabels[item.locale]}</p><h3 className="mt-1 font-display text-xl text-emerald">{item.title}</h3><p className="mt-1 text-sm text-charcoal/65">{item.summary}</p></div><div className="flex shrink-0 gap-3"><button type="button" onClick={() => startEditing(item)} className="text-sm font-semibold text-emerald underline">{tr('Edit')}</button><button type="button" onClick={() => void changeContentStatus(item)} className="text-sm font-semibold text-maroon underline">{item.status === 'published' ? tr('Unpublish') : tr('Publish')}</button></div></div></article>)}</div>}
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
          catch (requestError) { if (active) setError(requestError instanceof Error ? requestError.message : tr('Could not load volunteer opportunities.')); }
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
      setError(requestError instanceof Error ? requestError.message : tr('Sign-in failed.'));
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
      setMessage(tr('Volunteer opportunity opened.'));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : tr('Opportunity could not be created.'));
    }
  }

  async function changeOpportunityStatus(opportunity: ManagedVolunteerOpportunity) {
    try {
      await apiRequest(`/api/v1/volunteers/manage/${opportunity.id}`, { method: 'PATCH', body: JSON.stringify({ status: opportunity.status === 'open' ? 'closed' : 'open' }) });
      await loadOpportunities();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : tr('Opportunity status could not be changed.'));
    }
  }

  async function decideSignup(signupId: string, status: 'accepted' | 'declined') {
    setError('');
    try {
      await apiRequest(`/api/v1/volunteers/manage/signups/${signupId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await loadOpportunities();
      setMessage(status === 'accepted' ? tr('Volunteer accepted.') : tr('Volunteer application declined.'));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : tr('Volunteer decision could not be saved.'));
    }
  }

  async function signOut() {
    try { await apiRequest('/api/v1/auth/logout', { method: 'POST' }); }
    finally { setStaff(null); setOpportunities([]); }
  }

  return (
    <PageShell title={tr('Volunteer Desk')}>
      {!authChecked ? <p className="text-sm text-charcoal/60">{tr('Checking staff session…')}</p> : !staff ? (
        <div className="mx-auto max-w-xl border border-emerald/15 bg-white p-7 shadow-soft"><p className="text-xs uppercase tracking-[0.18em] text-gold">{tr('Community team')}</p><h2 className="mt-3 font-display text-3xl text-emerald">{tr('Sign in to manage volunteers')}</h2><form onSubmit={signIn} className="mt-6 space-y-4"><label className="block text-sm font-medium text-emerald">{tr('Email')}<input required type="email" className={inputClass} value={email} onChange={(input) => setEmail(input.target.value)} /></label><label className="block text-sm font-medium text-emerald">{tr('Password')}<input required type="password" className={inputClass} value={password} onChange={(input) => setPassword(input.target.value)} /></label>{error && <p role="alert" className="text-sm text-maroon">{error}</p>}<button className="w-full bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ivory">{tr('Sign in')}</button></form></div>
      ) : !['admin', 'event_manager'].includes(staff.role) ? (
        <div className="border-l-2 border-maroon bg-white p-6"><h2 className="font-display text-2xl text-emerald">{tr('Volunteer management is not enabled for this account.')}</h2><button type="button" onClick={() => void signOut()} className="mt-4 text-sm text-maroon underline">{tr('Sign out')}</button></div>
      ) : (
        <div>
          <div className="mb-8 flex flex-col gap-4 border-b border-emerald/15 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-charcoal/55">{tr('Signed in ·')} {staff.email}</p><h2 className="mt-2 font-display text-3xl text-emerald">{tr('Create an opportunity')}</h2></div><button type="button" onClick={() => void signOut()} className="text-sm font-semibold text-maroon underline">{tr('Sign out')}</button></div>
          <form onSubmit={createOpportunity} className="grid gap-4 border border-emerald/10 bg-white p-5 shadow-soft md:grid-cols-2 sm:p-7">
            <label className="block text-sm font-medium text-emerald">{tr('Title')}<input required minLength={3} maxLength={140} className={inputClass} value={form.title} onChange={(input) => setForm((current) => ({ ...current, title: input.target.value }))} /></label>
            <label className="block text-sm font-medium text-emerald">{tr('Focus areas')} <span className="font-normal text-charcoal/50">{tr('(comma separated)')}</span><input className={inputClass} value={form.areas} onChange={(input) => setForm((current) => ({ ...current, areas: input.target.value }))} /></label>
            <label className="block text-sm font-medium text-emerald md:col-span-2">{tr('Summary')}<input required minLength={10} maxLength={280} className={inputClass} value={form.summary} onChange={(input) => setForm((current) => ({ ...current, summary: input.target.value }))} /></label>
            <label className="block text-sm font-medium text-emerald md:col-span-2">{tr('Details')}<textarea required minLength={10} maxLength={3000} rows={4} className={inputClass} value={form.details} onChange={(input) => setForm((current) => ({ ...current, details: input.target.value }))} /></label>
            <label className="block text-sm font-medium text-emerald">{tr('Date and time')} <span className="font-normal text-charcoal/50">{tr('(optional)')}</span><input type="datetime-local" className={inputClass} value={form.startsAt} onChange={(input) => setForm((current) => ({ ...current, startsAt: input.target.value }))} /></label>
            <label className="block text-sm font-medium text-emerald">{tr('Location')} <span className="font-normal text-charcoal/50">{tr('(optional)')}</span><input className={inputClass} value={form.venue} onChange={(input) => setForm((current) => ({ ...current, venue: input.target.value }))} /></label>
            {error && <p role="alert" className="text-sm text-maroon md:col-span-2">{error}</p>}{message && <p role="status" className="text-sm text-emerald md:col-span-2">{message}</p>}
            <div className="md:col-span-2"><button className="bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-ivory">{tr('Open volunteer call')}</button></div>
          </form>
          <section className="mt-12"><div className="border-b border-emerald/15 pb-4"><p className="text-xs uppercase tracking-[0.16em] text-gold">{tr('Applications')}</p><h2 className="mt-2 font-display text-3xl text-emerald">{tr('Open and recent opportunities')}</h2></div>{opportunities.length === 0 ? <p className="py-8 text-sm text-charcoal/60">{tr('No volunteer calls have been created yet.')}</p> : <div className="mt-4 divide-y divide-emerald/10">{opportunities.map((opportunity) => <article key={opportunity.id} className="py-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs uppercase tracking-[0.15em] text-gold">{tr(opportunity.status)} · {opportunity.signups.length} {tr('applications')}</p><h3 className="mt-2 font-display text-2xl text-emerald">{tr(opportunity.title)}</h3><p className="mt-2 text-sm text-charcoal/65">{tr(opportunity.summary)}</p></div><button type="button" onClick={() => void changeOpportunityStatus(opportunity)} className="w-fit text-sm font-semibold text-maroon underline">{opportunity.status === 'open' ? tr('Close call') : tr('Reopen call')}</button></div>{opportunity.signups.length > 0 && <div className="mt-4 divide-y divide-emerald/10 border-l-2 border-gold pl-4">{opportunity.signups.map((signup) => <div key={signup.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs uppercase tracking-[0.12em] text-charcoal/50">{tr(signup.status)}</p><p className="mt-1 text-sm font-semibold text-emerald">{signup.memberId.fullName} · {signup.memberId.studentId}</p><p className="text-xs text-charcoal/60">{signup.memberId.department} {tr('· semester')} {signup.memberId.semester}{signup.note ? ` · ${signup.note}` : ''}</p></div>{signup.status === 'applied' && <div className="flex gap-3"><button type="button" onClick={() => void decideSignup(signup.id, 'accepted')} className="text-sm font-semibold text-emerald underline">{tr('Accept')}</button><button type="button" onClick={() => void decideSignup(signup.id, 'declined')} className="text-sm font-semibold text-maroon underline">{tr('Decline')}</button></div>}</div>)}</div>}</article>)}</div>}</section>
        </div>
      )}
    </PageShell>
  );
}

type MemberRecord = {
  id: string;
  memberNumber?: string;
  fullName: string;
  studentId: string;
  department: string;
  semester: string;
  preferredLanguage: Locale;
  isActive: boolean;
  email?: string;
  phoneNumber?: string;
  areasOfInterest: string[];
  motivationStatement?: string;
  accountSetupStatus?: string;
  emailNotificationStatus?: string;
  appliedAt?: string;
  joinedAt: string;
  eventRegistrations: number;
  volunteerApplications: number;
};

function downloadMembersCsv(members: MemberRecord[]) {
  const columns: Array<[string, (member: MemberRecord) => string | number | undefined]> = [
    ['Member number', (member) => member.memberNumber],
    ['Full name', (member) => member.fullName],
    ['Student ID', (member) => member.studentId],
    ['Department', (member) => member.department],
    ['Semester', (member) => member.semester],
    ['Email', (member) => member.email],
    ['Phone', (member) => member.phoneNumber],
    ['Areas of interest', (member) => member.areasOfInterest.join('; ')],
    ['Preferred language', (member) => localeLabels[member.preferredLanguage]],
    ['Account', (member) => member.accountSetupStatus === 'ready' ? 'Activated' : 'Awaiting activation'],
    ['Joined', (member) => new Date(member.joinedAt).toISOString().slice(0, 10)],
    ['Event registrations', (member) => member.eventRegistrations],
    ['Volunteer applications', (member) => member.volunteerApplications],
    ['Why they joined', (member) => member.motivationStatement],
  ];
  const cell = (value: string | number | undefined) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const rows = [columns.map(([label]) => cell(label)).join(','), ...members.map((member) => columns.map(([, read]) => cell(read(member))).join(','))];
  // The byte-order mark lets Excel read Urdu and Saraiki text correctly.
  const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `ssc-members-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function MembersDirectoryPage() {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const allowed = staff && ['admin', 'editor'].includes(staff.role);

  async function loadMembers() {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest<{ members: MemberRecord[] }>('/api/v1/membership/members');
      setMembers(result.members);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : tr('Members could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    apiRequest<{ user: StaffUser }>('/api/v1/auth/me')
      .then(async (result) => {
        if (!active) return;
        setStaff(result.user);
        if (['admin', 'editor'].includes(result.user.role)) await loadMembers();
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
      if (['admin', 'editor'].includes(result.user.role)) await loadMembers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : tr('Sign-in failed.'));
    }
  }

  async function signOut() {
    try { await apiRequest('/api/v1/auth/logout', { method: 'POST' }); }
    finally { setStaff(null); setMembers([]); }
  }

  const departments = useMemo(() => [...new Set(members.map((member) => member.department))].sort((a, b) => a.localeCompare(b)), [members]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return members.filter((member) => (department === 'all' || member.department === department)
      && (!needle || [member.fullName, member.studentId, member.email, member.memberNumber, member.department, member.phoneNumber].some((value) => value?.toLowerCase().includes(needle))));
  }, [members, query, department]);

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const stats = [
    { label: tr('Members'), value: members.length },
    { label: tr('Accounts activated'), value: members.filter((member) => member.accountSetupStatus === 'ready').length },
    { label: tr('Awaiting activation'), value: members.filter((member) => member.accountSetupStatus !== 'ready').length },
    { label: tr('Joined this month'), value: members.filter((member) => new Date(member.joinedAt).getTime() >= startOfMonth).length },
  ];
  const fieldClass = 'w-full rounded-xl border border-emerald/20 bg-white px-4 py-3 text-sm outline-none focus:border-gold';

  return (
    <PageShell title={tr('Council Members')}>
      {!authChecked ? <p className="text-sm text-charcoal/60">{tr('Checking staff session…')}</p> : !staff ? (
        <div className="mx-auto max-w-xl rounded-3xl border border-emerald/15 bg-white p-7 shadow-soft"><p className="text-xs uppercase tracking-[0.18em] text-gold">{tr('Staff access')}</p><h2 className="mt-3 font-display text-3xl text-emerald">{tr('Sign in to view council members')}</h2><form onSubmit={signIn} className="mt-6 space-y-4"><label className="block text-sm font-medium text-emerald">{tr('Email')}<input required type="email" autoComplete="username" className={`mt-2 ${fieldClass}`} value={email} onChange={(input) => setEmail(input.target.value)} /></label><label className="block text-sm font-medium text-emerald">{tr('Password')}<input required type="password" autoComplete="current-password" className={`mt-2 ${fieldClass}`} value={password} onChange={(input) => setPassword(input.target.value)} /></label>{error && <p role="alert" className="text-sm text-maroon">{error}</p>}<button className="w-full bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ivory">{tr('Sign in')}</button></form></div>
      ) : !allowed ? (
        <div className="rounded-2xl border-s-2 border-maroon bg-white p-6"><h2 className="font-display text-2xl text-emerald">{tr('Member records are not available for this account.')}</h2><button type="button" onClick={() => void signOut()} className="mt-4 text-sm text-maroon underline">{tr('Sign out')}</button></div>
      ) : (
        <div>
          <div className="flex flex-col gap-4 border-b border-emerald/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs uppercase tracking-[0.16em] text-charcoal/55">{tr('Signed in ·')} {staff.email}</p><h2 className="mt-2 font-display text-3xl text-emerald">{tr('Member directory')}</h2></div>
            <div className="flex flex-wrap gap-3">
              <Link to="/council/review" className="rounded-full border border-emerald/20 bg-white px-4 py-2.5 text-sm font-semibold text-emerald">{tr('Review applications')}</Link>
              <button type="button" disabled={!members.length} onClick={() => downloadMembersCsv(visible)} className="rounded-full bg-emerald px-4 py-2.5 text-sm font-semibold text-ivory disabled:opacity-40">{tr('Download spreadsheet')}</button>
              <button type="button" onClick={() => void signOut()} className="px-2 text-sm font-semibold text-maroon underline">{tr('Sign out')}</button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-emerald/10 bg-white p-5 shadow-soft">
                <p className="font-display text-4xl text-emerald">{stat.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-charcoal/55">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_16rem]">
            <label className="block"><span className="sr-only">{tr('Search members')}</span><input type="search" placeholder={tr('Search by name, student ID, email or member number')} className={fieldClass} value={query} onChange={(input) => setQuery(input.target.value)} /></label>
            <label className="block"><span className="sr-only">{tr('Department')}</span><select className={fieldClass} value={department} onChange={(input) => setDepartment(input.target.value)}><option value="all">{tr('All departments')}</option>{departments.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          </div>

          {error && <p role="alert" className="mt-4 text-sm text-maroon">{error}</p>}
          {loading ? <div className="mt-6 grid gap-3 sm:grid-cols-2" role="status"><span className="sr-only">{tr('Loading members…')}</span>{[0, 1, 2, 3].map((item) => <div key={item} className="skeleton h-36" />)}</div> : visible.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-emerald/20 bg-white/60 px-6 py-12 text-center text-sm text-charcoal/60">{members.length ? tr('No members match this search.') : tr('No members yet. Approved applications appear here.')}</p>
          ) : (
            <>
              <p className="mt-6 text-xs text-charcoal/55">{tr('Showing {shown} of {total} members', { shown: visible.length, total: members.length })}</p>
              <div className="mt-3 grid gap-4 lg:grid-cols-2">
                {visible.map((member) => {
                  const open = openId === member.id;
                  const activated = member.accountSetupStatus === 'ready';
                  return (
                    <article key={member.id} className="overflow-hidden rounded-3xl border border-emerald/10 bg-white shadow-soft">
                      <button type="button" aria-expanded={open} onClick={() => setOpenId(open ? null : member.id)} className="flex w-full items-center gap-4 p-5 text-start">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald font-display text-lg text-gold">{member.fullName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display text-xl text-emerald">{member.fullName}</span>
                          <span className="mt-0.5 block truncate text-xs text-charcoal/60">{member.department} · {tr('Semester')} {member.semester}</span>
                          <span className="mt-2 flex flex-wrap gap-1.5">
                            {member.memberNumber && <span dir="ltr" className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#7a5f22]">{member.memberNumber}</span>}
                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${activated ? 'bg-emerald/10 text-emerald' : 'bg-maroon/10 text-maroon'}`}>{activated ? tr('Account active') : tr('Awaiting activation')}</span>
                          </span>
                        </span>
                        <svg viewBox="0 0 20 20" className={`h-5 w-5 shrink-0 text-emerald/50 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 7.5l5 5 5-5" /></svg>
                      </button>
                      {open && (
                        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 border-t border-emerald/10 bg-ivory/50 p-5 text-sm sm:grid-cols-2">
                          {[
                            [tr('Student ID'), member.studentId],
                            [tr('Email'), member.email ? <a className="text-maroon underline [overflow-wrap:anywhere]" href={`mailto:${member.email}`}>{member.email}</a> : '—'],
                            [tr('Phone number'), member.phoneNumber ? <a dir="ltr" className="text-maroon underline" href={`tel:${member.phoneNumber}`}>{member.phoneNumber}</a> : '—'],
                            [tr('Language'), localeLabels[member.preferredLanguage]],
                            [tr('Applied'), member.appliedAt ? new Date(member.appliedAt).toLocaleDateString(dateLocale(), { dateStyle: 'medium' }) : '—'],
                            [tr('Joined'), new Date(member.joinedAt).toLocaleDateString(dateLocale(), { dateStyle: 'medium' })],
                            [tr('Event registrations'), member.eventRegistrations],
                            [tr('Volunteer applications'), member.volunteerApplications],
                          ].map(([label, value]) => (
                            <div key={String(label)} className="min-w-0"><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">{label}</dt><dd className="mt-1 text-charcoal/85">{value}</dd></div>
                          ))}
                          <div className="sm:col-span-2"><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">{tr('Interests')}</dt><dd className="mt-1.5 flex flex-wrap gap-1.5">{member.areasOfInterest.length ? member.areasOfInterest.map((area) => <span key={area} className="rounded-full bg-emerald/[0.07] px-2.5 py-1 text-xs text-emerald">{tr(area)}</span>) : <span className="text-charcoal/60">{tr('Not specified')}</span>}</dd></div>
                          {member.motivationStatement && <div className="sm:col-span-2"><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">{tr('Why they joined')}</dt><dd className="mt-1 whitespace-pre-wrap leading-6 text-charcoal/80">{member.motivationStatement}</dd></div>}
                        </dl>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
          )}
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
          catch (requestError) { if (active) setError(requestError instanceof Error ? requestError.message : tr('Inbox could not be loaded.')); }
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
      setError(requestError instanceof Error ? requestError.message : tr('Sign-in failed.'));
    }
  }

  async function markRead(messageId: string) {
    try {
      await apiRequest(`/api/v1/contact/${messageId}/read`, { method: 'PATCH' });
      setMessages((current) => current.map((message) => message.id === messageId ? { ...message, readAt: new Date().toISOString() } : message));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : tr('Message could not be updated.'));
    }
  }

  async function signOut() {
    try { await apiRequest('/api/v1/auth/logout', { method: 'POST' }); }
    finally { setStaff(null); setMessages([]); }
  }

  return (
    <PageShell title={tr('Council Inbox')}>
      {!authChecked ? <p className="text-sm text-charcoal/60">{tr('Checking staff session…')}</p> : !staff ? (
        <div className="mx-auto max-w-xl border border-emerald/15 bg-white p-7 shadow-soft"><p className="text-xs uppercase tracking-[0.18em] text-gold">{tr('Staff access')}</p><h2 className="mt-3 font-display text-3xl text-emerald">{tr('Sign in to read enquiries')}</h2><form onSubmit={signIn} className="mt-6 space-y-4"><label className="block text-sm font-medium text-emerald">{tr('Email')}<input required type="email" className="mt-2 w-full border border-emerald/20 px-3 py-3 text-sm outline-none focus:border-gold" value={email} onChange={(input) => setEmail(input.target.value)} /></label><label className="block text-sm font-medium text-emerald">{tr('Password')}<input required type="password" className="mt-2 w-full border border-emerald/20 px-3 py-3 text-sm outline-none focus:border-gold" value={password} onChange={(input) => setPassword(input.target.value)} /></label>{error && <p role="alert" className="text-sm text-maroon">{error}</p>}<button className="w-full bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ivory">{tr('Sign in')}</button></form></div>
      ) : !['admin', 'editor'].includes(staff.role) ? (
        <div className="border-l-2 border-maroon bg-white p-6"><h2 className="font-display text-2xl text-emerald">{tr('Inbox access is not enabled for this account.')}</h2><button type="button" onClick={() => void signOut()} className="mt-4 text-sm text-maroon underline">{tr('Sign out')}</button></div>
      ) : (
        <div><div className="flex flex-col gap-4 border-b border-emerald/15 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-charcoal/55">{tr('Signed in ·')} {staff.email}</p><h2 className="mt-2 font-display text-3xl text-emerald">{tr('Public enquiries')}</h2></div><div className="flex gap-4"><button type="button" onClick={() => void loadMessages()} className="text-sm font-semibold text-emerald underline">{tr('Refresh')}</button><button type="button" onClick={() => void signOut()} className="text-sm font-semibold text-maroon underline">{tr('Sign out')}</button></div></div>{error && <p role="alert" className="mt-4 text-sm text-maroon">{error}</p>}{messages.length === 0 ? <p className="py-12 text-center text-sm text-charcoal/60">{tr('The council inbox is clear.')}</p> : <div className="divide-y divide-emerald/10">{messages.map((message) => <article key={message.id} className={`py-6 ${message.readAt ? 'opacity-70' : ''}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs uppercase tracking-[0.14em] text-gold">{message.readAt ? tr('Read') : tr('New')} · {new Date(message.createdAt).toLocaleString()}</p><h3 className="mt-2 font-display text-2xl text-emerald">{message.subject}</h3><p className="mt-1 text-sm text-charcoal/65">{message.fullName} · <a className="text-maroon underline" href={`mailto:${message.email}`}>{message.email}</a></p></div>{!message.readAt && <button type="button" onClick={() => void markRead(message.id)} className="w-fit text-sm font-semibold text-maroon underline">{tr('Mark as read')}</button>}</div><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-charcoal/80">{message.message}</p>{message.emailStatus !== 'sent' && <p className="mt-3 text-xs text-maroon">{tr('Email notification:')} {tr(message.emailStatus)}{tr('. The message remains safely stored here.')}</p>}</article>)}</div>}</div>
      )}
    </PageShell>
  );
}

const poemTones = [
  { card: 'from-emerald via-[#1f4f45] to-[#0f2b25]', chip: 'bg-emerald' },
  { card: 'from-maroon via-[#8a3a4d] to-[#4f1d2a]', chip: 'bg-maroon' },
  { card: 'from-[#1e3a6e] via-[#27498a] to-[#132647]', chip: 'bg-[#1e3a6e]' },
];

function VerseDivider() {
  return (
    <div aria-hidden="true" className="my-1 flex items-center justify-center gap-3 text-gold/60">
      <span className="h-px w-8 bg-current" />
      <StarMark className="h-3 w-3" />
      <span className="h-px w-8 bg-current" />
    </div>
  );
}

function PoemCard({ poem, index }: { poem: Poem; index: number }) {
  const [copied, setCopied] = useState(false);
  const tone = poemTones[index % poemTones.length];

  async function share() {
    const text = `${poem.poet}\n\n${poem.couplets.map((couplet) => couplet.join('\n')).join('\n\n')}`;
    const url = `${window.location.origin}/poetry#${poem.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: poem.poet, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch { /* sharing was dismissed */ }
  }

  return (
    <article id={poem.id} className={`pattern-ajrak relative mb-6 scroll-mt-28 break-inside-avoid overflow-hidden rounded-[2rem] bg-gradient-to-br ${tone.card} text-ivory shadow-soft`}>
      <StarMark className="absolute -end-10 -top-10 h-44 w-44 text-white/[0.06]" />
      <span aria-hidden="true" className="verse absolute -top-4 start-5 text-[7rem] leading-none text-white/10">”</span>

      <header dir="rtl" lang="skr" className="relative flex items-start justify-between gap-4 px-6 pt-7 sm:px-8">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-gold ring-1 ring-white/15">
            <span className="font-display">{String(index + 1).padStart(2, '0')}</span>
            <span aria-hidden="true">·</span>
            <span className="verse-label">{poem.form}</span>
          </p>
          <h2 className="verse mt-3 text-[1.7rem] leading-[2.1] text-ivory sm:text-3xl">{poem.poet}</h2>
          <p dir="ltr" className="mt-1.5 text-end text-[11px] uppercase tracking-[0.18em] text-ivory/55">{poem.poetLatin}</p>
          {poem.note && <p className="verse-label mt-2 text-xs text-gold/90">{poem.note}</p>}
        </div>
      </header>

      <div dir="rtl" lang="skr" className="relative px-5 pb-3 pt-4 sm:px-8">
        {poem.couplets.map((couplet, coupletIndex) => {
          const closing = coupletIndex === poem.couplets.length - 1;
          return (
            <div key={couplet[0]}>
              {coupletIndex > 0 && <VerseDivider />}
              <p className={`verse py-1 text-center text-[1.22rem] leading-[2.5] sm:text-[1.4rem] ${closing ? 'rounded-2xl bg-black/20 px-3 text-gold ring-1 ring-gold/25' : 'text-ivory/95'}`}>
                <span className="block">{couplet[0]}</span>
                <span className="block">{couplet[1]}</span>
              </p>
            </div>
          );
        })}
      </div>

      <footer className="relative flex items-center justify-between gap-3 border-t border-white/10 px-6 py-4 sm:px-8">
        <span className="text-[11px] uppercase tracking-[0.18em] text-ivory/50">{tr('Saraiki poetry')}</span>
        <button type="button" onClick={share} className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold text-ivory ring-1 ring-white/15 transition hover:bg-gold hover:text-[#0f2b25] active:scale-95">
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10 12.5V3M6.5 6 10 2.5 13.5 6M4 10v6.5h12V10" /></svg>
          {copied ? tr('Copied') : tr('Share')}
        </button>
      </footer>
    </article>
  );
}

function PoetryPage() {
  return (
    <PageShell title={tr('Poetry')}>
      <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <p className="eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-gold">{tr('Voices of the Wasaib')}</p>
          <h2 className="mt-3 font-display text-3xl leading-tight text-emerald sm:text-[2.6rem]">{tr('Verses in our mother tongue.')}</h2>
          <p className="mt-3 max-w-2xl leading-7 text-charcoal/70">{tr('Ghazals in Saraiki from poets of many faiths and walks of life, gathered by the council. Each closing couplet carries the poet’s pen name.')}</p>
        </div>
        <p className="text-sm text-charcoal/55 lg:text-end">{tr('{count} poems', { count: poems.length })}</p>
      </div>

      <section className="pattern-ajrak relative mb-10 overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald via-[#1f4f45] to-[#0f2b25] px-5 py-9 text-ivory shadow-soft sm:px-10">
        <div className="grid items-center gap-9 md:grid-cols-[1fr_auto] md:gap-12">
          <div>
            <p className="eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-gold">{tr('Recital')}</p>
            <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">{tr('Hear it in the poet’s own voice.')}</h2>
            <p className="mt-3 max-w-md leading-7 text-ivory/75">{tr('Saraiki verse is written to be spoken aloud. Play the recital and turn the sound on.')}</p>
          </div>
          <RecitalVideo className="md:w-[17rem]" />
        </div>
      </section>

      <nav aria-label={tr('Poets')} dir="rtl" className="no-scrollbar -mx-4 mb-8 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {poems.map((poem, index) => (
          <a key={poem.id} href={`#${poem.id}`} lang="skr" className={`verse-label shrink-0 snap-start rounded-full px-4 py-2 text-sm text-ivory transition hover:-translate-y-0.5 active:scale-95 ${poemTones[index % poemTones.length].chip}`}>{poem.poet}</a>
        ))}
      </nav>

      <div className="lg:columns-2 lg:gap-6">
        {poems.map((poem, index) => <PoemCard key={poem.id} poem={poem} index={index} />)}
      </div>
    </PageShell>
  );
}

function RecitalVideo({ className = '' }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  // Once the visitor pauses it themselves, scrolling no longer restarts it.
  const pausedByVisitor = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !pausedByVisitor.current) void video.play().catch(() => undefined);
        else if (!entry.isIntersecting) video.pause();
      },
      { threshold: 0.55 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      pausedByVisitor.current = false;
      void video.play().catch(() => undefined);
    } else {
      pausedByVisitor.current = true;
      video.pause();
    }
  }

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted && video.paused) {
      pausedByVisitor.current = false;
      void video.play().catch(() => undefined);
    }
  }

  return (
    <figure className={`relative mx-auto w-full max-w-[17rem] ${className}`}>
      <div aria-hidden="true" className="absolute -inset-2.5 rounded-[2.4rem] border border-gold/45" />
      <div className="relative overflow-hidden rounded-[2rem] bg-black shadow-2xl shadow-black/50 ring-1 ring-gold/40">
        <video
          ref={videoRef}
          src={assets.recitalVideo}
          poster={assets.recitalPoster}
          muted
          loop
          playsInline
          preload="none"
          aria-label={tr('Saraiki poetry recital')}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(event) => { const video = event.currentTarget; setProgress(video.duration ? video.currentTime / video.duration : 0); }}
          onClick={togglePlay}
          className="aspect-[9/16] w-full cursor-pointer object-cover"
        />

        {!playing && (
          <button type="button" onClick={togglePlay} aria-label={tr('Play video')} className="absolute inset-0 grid place-items-center bg-black/25">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-gold text-[#0f2b25] shadow-xl ring-4 ring-white/25 transition active:scale-95">
              <svg viewBox="0 0 24 24" className="ms-1 h-7 w-7" aria-hidden="true" fill="currentColor"><path d="M7 4.5v15l13-7.5z" /></svg>
            </span>
          </button>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-3 pt-12">
          <div className="pointer-events-auto flex items-center justify-between gap-2" dir="ltr">
            <button type="button" onClick={togglePlay} aria-label={playing ? tr('Pause video') : tr('Play video')} className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-ivory ring-1 ring-white/25 backdrop-blur transition active:scale-95">
              {playing
                ? <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
                : <svg viewBox="0 0 24 24" className="ms-0.5 h-4 w-4" aria-hidden="true" fill="currentColor"><path d="M7 4.5v15l13-7.5z" /></svg>}
            </button>
            <button type="button" onClick={toggleSound} aria-pressed={!muted} className={`inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-xs font-semibold ring-1 backdrop-blur transition active:scale-95 ${muted ? 'bg-gold text-[#0f2b25] ring-gold' : 'bg-white/15 text-ivory ring-white/25'}`}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor" stroke="none" />
                {muted ? <path d="M16 9.5l5 5M21 9.5l-5 5" /> : <path d="M15.5 9c1 .8 1.5 1.8 1.5 3s-.5 2.2-1.5 3M18 6.5c1.7 1.4 2.5 3.2 2.5 5.5s-.8 4.1-2.5 5.5" />}
              </svg>
              <span>{muted ? tr('Tap for sound') : tr('Sound on')}</span>
            </button>
          </div>
          <div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-white/20" dir="ltr">
            <div className="h-full origin-left bg-gold transition-transform duration-200" style={{ transform: `scaleX(${progress})` }} />
          </div>
        </div>
      </div>
      <figcaption dir="rtl" lang="skr" className="mt-5 text-center">
        <span className="verse-label block text-[11px] text-gold">{tr('Recital')}</span>
        <span className="verse mt-1 block text-lg leading-[2] text-current">ظہیر مہاروی</span>
      </figcaption>
    </figure>
  );
}

function PoetrySpotlight() {
  // A different poem leads each day.
  const poem = poems[Math.floor(Date.now() / 86_400_000) % poems.length];
  return (
    <Reveal>
      <section className="pattern-ajrak relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-maroon via-[#8a3a4d] to-[#4f1d2a] px-5 py-9 text-ivory shadow-soft sm:px-10 sm:py-12">
        <StarMark className="absolute -end-12 -top-12 h-56 w-56 text-white/[0.06]" />
        <div className="relative grid gap-10 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-12">
          <div>
            <p className="eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-gold">{tr('Poetry')}</p>
            <h2 className="mt-3 font-display text-3xl leading-tight sm:text-[2.6rem]">{tr('Verses in our mother tongue.')}</h2>
            <p className="mt-3 max-w-md leading-7 text-ivory/75">{tr('Ghazals in Saraiki from poets of many faiths and walks of life, gathered by the council. Each closing couplet carries the poet’s pen name.')}</p>
            <Link to="/poetry" className="btn-shine link-arrow mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-[#0f2b25] transition hover:-translate-y-0.5">{tr('Read the poetry')}<ArrowIcon className="h-4 w-4" /></Link>
          </div>
          <RecitalVideo className="lg:w-[17rem]" />
          <Link to={`/poetry#${poem.id}`} dir="rtl" lang="skr" className="block rounded-3xl bg-black/20 px-4 py-6 text-center ring-1 ring-white/15 transition hover:bg-black/30 sm:px-8">
            <p className="verse text-[1.3rem] leading-[2.5] text-ivory sm:text-[1.6rem]">
              <span className="block">{poem.couplets[0][0]}</span>
              <span className="block">{poem.couplets[0][1]}</span>
            </p>
            <VerseDivider />
            <p className="verse mt-2 text-base leading-[2.2] text-gold">{poem.poet}</p>
          </Link>
        </div>
      </section>
    </Reveal>
  );
}

function CulturePage({ locale }: { locale: Locale }) {
  const { items, loading, error } = usePublicContent('article', locale);

  return (
    <PageShell title={tr('Culture & Heritage')}>
      {error && <p role="alert" className="mb-5 text-sm text-maroon">{error}</p>}
      {loading ? <p className="py-10 text-sm text-charcoal/60">{tr('Loading stories…')}</p> : items.length === 0 ? (
        <div className="border-y border-emerald/15 py-14 text-center"><p className="text-xs uppercase tracking-[0.18em] text-gold">{tr('Living heritage')}</p><h2 className="mt-3 font-display text-3xl text-emerald">{tr('Stories from language, memory, and community.')}</h2><p className="mt-3 text-sm text-charcoal/65">{tr('New cultural stories will appear here when published.')}</p></div>
      ) : <div className="grid gap-6 lg:grid-cols-2">{items.map((article, index) => (
        <Reveal key={article.id} delay={(index % 2) * 90}>
          <article className="card-lift group flex h-full flex-col overflow-hidden rounded-3xl border border-emerald/10 bg-white">
            {article.imageUrl ? <div className="h-56 overflow-hidden"><img src={article.imageUrl} alt="" loading="lazy" className="zoom-target h-full w-full object-cover" /></div> : (
              <div className={`pattern-ajrak relative h-28 overflow-hidden bg-gradient-to-br ${coverTones[index % coverTones.length]}`}>
                <span className="absolute bottom-3 start-6 font-display text-5xl text-white/25">{String(index + 1).padStart(2, '0')}</span>
                <StarMark className="absolute -end-6 -top-6 h-28 w-28 text-white/10" />
              </div>
            )}
            <div className="flex flex-1 flex-col p-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{localeLabels[article.locale]} {tr('· Cultural article')}</p><h2 className="mt-3 font-display text-3xl leading-tight text-emerald">{article.title}</h2><p className="mt-3 flex-1 leading-7 text-charcoal/70">{article.summary}</p><Link to={`/culture/${article.slug}`} className="link-arrow mt-5 inline-flex items-center gap-2 text-sm font-semibold text-maroon">{tr('Read story')}<ArrowIcon className="h-4 w-4" /></Link></div>
          </article>
        </Reveal>
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
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : tr('Story not found.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  return (
    <PageShell title={article?.title ?? tr('Culture story')}>
      {loading ? <p className="text-sm text-charcoal/60">{tr('Loading story…')}</p> : !article ? <p role="alert" className="border-l-2 border-maroon bg-white p-5 text-sm text-maroon">{error || tr('Story not found.')}</p> : (
        <article className="mx-auto max-w-3xl">
          {article.imageUrl && <img src={article.imageUrl} alt="" className="mb-8 max-h-[34rem] w-full object-cover" />}
          <p className="text-xs uppercase tracking-[0.18em] text-gold">{localeLabels[article.locale]} {tr('· Culture & heritage')}</p>
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
    <PageShell title={tr('Announcements')}>
      {error && <p role="alert" className="mb-5 text-sm text-maroon">{error}</p>}
      {loading ? <p className="py-10 text-sm text-charcoal/60">{tr('Loading announcements…')}</p> : items.length === 0 ? (
        <div className="border-y border-emerald/15 py-14 text-center"><p className="text-xs uppercase tracking-[0.18em] text-gold">{tr('Council notices')}</p><h2 className="mt-3 font-display text-3xl text-emerald">{tr('No new notices at the moment.')}</h2><p className="mt-3 text-sm text-charcoal/65">{tr('Official council updates will be shared here.')}</p></div>
      ) : <div className="space-y-4">{items.map((item, index) => (
        <Reveal key={item.id} delay={Math.min(index, 4) * 70}>
          <article className="card-lift group relative grid gap-4 rounded-3xl border border-emerald/10 bg-white p-6 sm:grid-cols-[5.5rem_1fr_auto] sm:items-center sm:gap-6">
            <div className="hidden rounded-2xl bg-emerald/[0.06] px-3 py-3 text-center sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-maroon">{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString(dateLocale(), { month: 'short' }) : tr('New')}</p>
              <p className="font-display text-2xl leading-none text-emerald">{item.publishedAt ? new Date(item.publishedAt).getDate() : '·'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold sm:hidden">{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString(dateLocale(), { dateStyle: 'medium' }) : tr('Council update')}</p>
              <h2 className="font-display text-2xl leading-snug text-emerald">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-charcoal/70">{item.summary}</p>
            </div>
            <Link to={`/announcements/${item.slug}`} className="link-arrow inline-flex items-center gap-2 text-sm font-semibold text-maroon after:absolute after:inset-0">{tr('Read update')}<ArrowIcon className="h-4 w-4" /></Link>
          </article>
        </Reveal>
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
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : tr('Announcement not found.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  return (
    <PageShell title={announcement?.title ?? tr('Council announcement')}>
      {loading ? <p className="text-sm text-charcoal/60">{tr('Loading announcement…')}</p> : !announcement ? (
        <p role="alert" className="border-l-2 border-maroon bg-white p-5 text-sm text-maroon">{error || tr('Announcement not found.')}</p>
      ) : (
        <article className="mx-auto max-w-3xl">
          <p className="text-xs uppercase tracking-[0.18em] text-gold">{announcement.publishedAt ? new Date(announcement.publishedAt).toLocaleDateString(dateLocale(), { dateStyle: 'full' }) : tr('Council update')}</p>
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
      setError(requestError instanceof Error ? requestError.message : tr('Your application could not be sent.'));
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass = 'mt-2 w-full rounded-sm border border-emerald/20 bg-white px-3 py-3 text-sm text-charcoal outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20';

  return (
    <PageShell title={tr('Join the Council')}>
      <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
        <aside className="border-l-2 border-gold pl-5 lg:sticky lg:top-32 lg:h-fit">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">{tr('Membership')}</p>
          <h2 className="mt-3 font-display text-3xl leading-tight text-emerald">{tr('Bring your voice. Help shape campus life.')}</h2>
          <p className="mt-4 text-sm leading-6 text-charcoal/70">{tr('Tell us a little about yourself and how you would like to contribute. The council team will review your application and follow up using the contact details you provide.')}</p>
          <div className="mt-8 border-t border-emerald/15 pt-5">
            <p className="text-xs uppercase tracking-[0.16em] text-charcoal/55">{tr('What happens next')}</p>
            <ol className="mt-4 space-y-4 text-sm text-charcoal/75">
              <li className="flex gap-3"><span className="font-display text-lg text-gold">01</span><span>{tr('Submit your student details and interests.')}</span></li>
              <li className="flex gap-3"><span className="font-display text-lg text-gold">02</span><span>{tr('The council reviews your application.')}</span></li>
              <li className="flex gap-3"><span className="font-display text-lg text-gold">03</span><span>{tr('We contact you about the next steps.')}</span></li>
            </ol>
          </div>
        </aside>

        <section className="min-w-0 border-t border-emerald/15 pt-6">
          {applicationId ? (
            <div role="status" className="border border-emerald/15 bg-white p-7 sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">{tr('Application received')}</p>
              <h2 className="mt-3 font-display text-3xl text-emerald">{tr('Thank you for stepping forward.')}</h2>
              <p className="mt-3 text-sm leading-6 text-charcoal/70">{tr('Your application is in the council review queue. Keep this reference for your records.')}</p>
              <p className="mt-5 border-t border-emerald/10 pt-4 text-xs uppercase tracking-[0.16em] text-charcoal/60">{tr('Reference:')} <span className="font-semibold text-emerald">{applicationId}</span></p>
            </div>
          ) : (
            <form onSubmit={submitApplication} className="space-y-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{tr('01 / Your details')}</p>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <label className="text-sm font-medium text-emerald sm:col-span-2">{tr('Full name')}
                    <input required minLength={2} maxLength={120} autoComplete="name" className={fieldClass} value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} />
                  </label>
                  <label className="text-sm font-medium text-emerald">{tr('Student ID')}
                    <input required minLength={3} maxLength={40} className={fieldClass} value={form.studentId} onChange={(event) => updateField('studentId', event.target.value)} />
                  </label>
                  <label className="text-sm font-medium text-emerald">{tr('Department')}
                    <input required minLength={2} maxLength={120} className={fieldClass} value={form.department} onChange={(event) => updateField('department', event.target.value)} />
                  </label>
                  <label className="text-sm font-medium text-emerald">{tr('Current semester')}
                    <select required className={fieldClass} value={form.semester} onChange={(event) => updateField('semester', event.target.value)}>
                      <option value="">{tr('Select semester')}</option>
                      {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={String(index + 1)}>{tr('Semester')} {index + 1}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-emerald">{tr('University email')}
                    <input required type="email" maxLength={254} autoComplete="email" className={fieldClass} value={form.universityEmail} onChange={(event) => updateField('universityEmail', event.target.value)} />
                  </label>
                  <label className="text-sm font-medium text-emerald sm:col-span-2">{tr('Phone number')} <span className="font-normal text-charcoal/50">{tr('(optional)')}</span>
                    <input type="tel" maxLength={40} autoComplete="tel" className={fieldClass} value={form.phoneNumber} onChange={(event) => updateField('phoneNumber', event.target.value)} />
                  </label>
                </div>
              </div>

              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{tr('02 / Areas of interest')}</legend>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {interests.map((interest) => (
                    <label key={interest} className="flex cursor-pointer items-center gap-3 border border-emerald/10 bg-white px-3 py-3 text-sm text-charcoal/80 transition hover:border-gold/60">
                      <input type="checkbox" checked={form.areasOfInterest.includes(interest)} onChange={() => toggleInterest(interest)} className="h-4 w-4 accent-emerald" />
                      {tr(interest)}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="block text-sm font-medium text-emerald">{tr('Why would you like to join?')} <span className="font-normal text-charcoal/50">{tr('(optional)')}</span>
                <textarea rows={4} maxLength={1200} className={`${fieldClass} resize-y`} value={form.motivationStatement} onChange={(event) => updateField('motivationStatement', event.target.value)} />
                <span className="mt-1 block text-right text-xs text-charcoal/50">{form.motivationStatement.length}/1200</span>
              </label>

              <label className="flex items-start gap-3 border-t border-emerald/15 pt-5 text-sm leading-6 text-charcoal/75">
                <input required type="checkbox" checked={form.privacyAcknowledged} onChange={(event) => updateField('privacyAcknowledged', event.target.checked)} className="mt-1 h-4 w-4 accent-emerald" />
                <span>{tr('I agree that the council may use these details to review and respond to my membership application.')}</span>
              </label>

              {error && <p role="alert" className="border-l-2 border-maroon bg-maroon/5 px-4 py-3 text-sm text-maroon">{error}</p>}
              <button type="submit" disabled={submitting} className="w-full bg-emerald px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-ivory transition hover:bg-emerald/90 disabled:cursor-wait disabled:opacity-60 sm:w-auto">
                {submitting ? tr('Sending application…') : tr('Submit application')}
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
      setError(tr('The passwords do not match.'));
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest('/api/v1/membership/setup-account', { method: 'POST', body: JSON.stringify({ token, password }) });
      setComplete(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : tr('The account could not be activated.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell title={tr('Activate member access')}>
      {!token ? <p role="alert" className="border-l-2 border-maroon bg-white p-5 text-sm text-maroon">{tr('This activation link is missing its secure token. Use the link from your council email.')}</p> : complete ? (
        <div role="status" className="mx-auto max-w-xl border border-emerald/15 bg-white p-7 shadow-soft"><p className="text-xs uppercase tracking-[0.18em] text-gold">{tr('Account ready')}</p><h2 className="mt-3 font-display text-3xl text-emerald">{tr('Your member access is active.')}</h2><p className="mt-3 text-sm text-charcoal/70">{tr('Sign in with your university email and the password you just created.')}</p><Link to="/member" className="mt-6 inline-flex bg-emerald px-5 py-3 text-sm font-semibold text-ivory">{tr('Go to member portal')}</Link></div>
      ) : (
        <div className="mx-auto max-w-xl border border-emerald/15 bg-white p-7 shadow-soft"><p className="text-xs uppercase tracking-[0.18em] text-gold">{tr('Secure member setup')}</p><h2 className="mt-3 font-display text-3xl text-emerald">{tr('Choose your password.')}</h2><p className="mt-3 text-sm leading-6 text-charcoal/70">{tr('Use at least 12 characters. This activation link can be used once and expires after 48 hours.')}</p><form onSubmit={activate} className="mt-6 space-y-4"><label className="block text-sm font-medium text-emerald">{tr('New password')}<input required minLength={12} maxLength={200} type="password" autoComplete="new-password" className="mt-2 w-full border border-emerald/20 px-3 py-3 text-sm outline-none focus:border-gold" value={password} onChange={(event) => setPassword(event.target.value)} /></label><label className="block text-sm font-medium text-emerald">{tr('Confirm password')}<input required minLength={12} maxLength={200} type="password" autoComplete="new-password" className="mt-2 w-full border border-emerald/20 px-3 py-3 text-sm outline-none focus:border-gold" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>{error && <p role="alert" className="text-sm text-maroon">{error}</p>}<button disabled={submitting} className="w-full bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ivory disabled:opacity-50">{submitting ? tr('Activating…') : tr('Activate account')}</button></form></div>
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
      setError(requestError instanceof Error ? requestError.message : tr('Member profile could not be loaded.'));
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
      setError(requestError instanceof Error ? requestError.message : tr('Sign-in failed.'));
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
      setError(requestError instanceof Error ? requestError.message : tr('Volunteer signup could not be updated.'));
    }
  }

  return (
    <PageShell title={tr('Member Portal')}>
      {!authChecked ? <p className="text-sm text-charcoal/60">{tr('Checking member session…')}</p> : !staff ? (
        <div className="mx-auto max-w-xl border border-emerald/15 bg-white p-7 shadow-soft"><p className="text-xs uppercase tracking-[0.18em] text-gold">{tr('Member access')}</p><h2 className="mt-3 font-display text-3xl text-emerald">{tr('Welcome back.')}</h2><p className="mt-3 text-sm text-charcoal/65">{tr('Activate your account from the approval email before signing in.')}</p><form onSubmit={signIn} className="mt-6 space-y-4"><label className="block text-sm font-medium text-emerald">{tr('University email')}<input required type="email" autoComplete="username" className="mt-2 w-full border border-emerald/20 px-3 py-3 text-sm outline-none focus:border-gold" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="block text-sm font-medium text-emerald">{tr('Password')}<input required type="password" autoComplete="current-password" className="mt-2 w-full border border-emerald/20 px-3 py-3 text-sm outline-none focus:border-gold" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p role="alert" className="text-sm text-maroon">{error}</p>}<button className="w-full bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ivory">{tr('Sign in')}</button></form></div>
      ) : staff.role !== 'member' ? (
        <div className="border-l-2 border-maroon bg-white p-6"><h2 className="font-display text-2xl text-emerald">{tr('This area is for active council members.')}</h2><button type="button" onClick={() => void signOut()} className="mt-4 text-sm text-maroon underline">{tr('Sign out')}</button></div>
      ) : error && !member ? <p role="alert" className="border-l-2 border-maroon bg-white p-5 text-sm text-maroon">{error}</p> : !member ? <p className="text-sm text-charcoal/60">{tr('Loading your profile…')}</p> : (
        <div>
          <div className="flex flex-col gap-5 border-b border-emerald/15 pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[0.18em] text-gold">{tr('Member account')}</p><h2 className="mt-2 font-display text-4xl text-emerald">{tr('Welcome,')} {member.fullName.split(' ')[0]}.</h2><p className="mt-2 text-sm text-charcoal/65">{tr('Your council membership at a glance.')}</p></div><button type="button" onClick={() => void signOut()} className="text-sm font-semibold text-maroon underline">{tr('Sign out')}</button></div>
          <div className="mt-7 grid gap-4 sm:grid-cols-3"><div className="border border-emerald/10 bg-white p-5"><p className="text-xs uppercase tracking-[0.14em] text-charcoal/50">{tr('Member number')}</p><p className="mt-2 font-display text-2xl text-emerald">{member.memberNumber || tr('Active')}</p></div><div className="border border-emerald/10 bg-white p-5"><p className="text-xs uppercase tracking-[0.14em] text-charcoal/50">{tr('Student ID')}</p><p className="mt-2 text-lg font-semibold text-emerald">{member.studentId}</p></div><div className="border border-emerald/10 bg-white p-5"><p className="text-xs uppercase tracking-[0.14em] text-charcoal/50">{tr('Department · semester')}</p><p className="mt-2 text-sm font-semibold text-emerald">{member.department} · {member.semester}</p></div></div>
          <section className="mt-10"><div className="border-b border-emerald/15 pb-4"><p className="text-xs uppercase tracking-[0.18em] text-gold">{tr('Your participation')}</p><h3 className="mt-2 font-display text-3xl text-emerald">{tr('Event registrations')}</h3></div>{registrations.length === 0 ? <p className="py-8 text-sm text-charcoal/60">{tr('Your event registrations will appear here.')}</p> : <div className="divide-y divide-emerald/10">{registrations.map((registration) => <article key={registration.id} className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h4 className="font-display text-xl text-emerald">{tr(registration.event.title)}</h4><p className="mt-1 text-sm text-charcoal/65">{new Date(registration.event.startsAt).toLocaleString()} · {tr(registration.event.venue)}</p></div><Link to={`/events/${registration.event.slug}`} className="text-sm font-semibold text-maroon underline">{tr('Event details')}</Link></article>)}</div>}</section>
          <section className="mt-10"><div className="border-b border-emerald/15 pb-4"><p className="text-xs uppercase tracking-[0.18em] text-gold">{tr('Give your time')}</p><h3 className="mt-2 font-display text-3xl text-emerald">{tr('Volunteer opportunities')}</h3></div>{opportunities.length === 0 ? <p className="py-8 text-sm text-charcoal/60">{tr('New opportunities will appear here when the council opens them.')}</p> : <div className="grid gap-4 pt-5 lg:grid-cols-2">{opportunities.map((opportunity) => <article key={opportunity.id} className="border border-emerald/10 bg-white p-5"><p className="text-xs uppercase tracking-[0.15em] text-gold">{opportunity.startsAt ? new Date(opportunity.startsAt).toLocaleDateString(dateLocale(), { dateStyle: 'medium' }) : tr('Ongoing')}{opportunity.venue ? ` · ${tr(opportunity.venue)}` : ''}</p><h4 className="mt-2 font-display text-xl text-emerald">{tr(opportunity.title)}</h4><p className="mt-2 text-sm leading-6 text-charcoal/70">{tr(opportunity.summary)}</p>{opportunity.areas.length > 0 && <p className="mt-3 text-xs text-charcoal/55">{opportunity.areas.map((area) => tr(area)).join(' · ')}</p>}<div className="mt-4">{opportunity.signupStatus === 'applied' ? <button type="button" onClick={() => void updateVolunteerSignup(opportunity.id, 'withdraw')} className="text-sm font-semibold text-maroon underline">{tr('Application pending · withdraw')}</button> : opportunity.signupStatus ? <span className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald">{tr(opportunity.signupStatus)}</span> : <button type="button" onClick={() => void updateVolunteerSignup(opportunity.id, 'apply')} className="bg-emerald px-4 py-2 text-sm font-semibold text-ivory">{tr('Apply to volunteer')}</button>}</div></article>)}</div>}</section>
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
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : tr('Could not load applications.')); })
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
      setError(requestError instanceof Error ? requestError.message : tr('Sign-in failed.'));
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
      setMessage(decision === 'approved' ? tr('Application approved.') : tr('Application declined and reason recorded.'));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : tr('The decision could not be saved.'));
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
      setMessage(result.emailNotificationStatus === 'sent' ? tr('Decision email sent.') : tr('The email could not be delivered. Check SMTP settings and retry.'));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : tr('The email could not be sent.'));
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
    <PageShell title={tr('Application Review')}>
      {!authChecked ? (
        <p className="text-sm text-charcoal/65">{tr('Checking staff session…')}</p>
      ) : !staff ? (
        <div className="mx-auto max-w-xl border border-emerald/15 bg-white p-6 shadow-soft sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">{tr('Council staff')}</p>
          <h2 className="mt-3 font-display text-3xl text-emerald">{tr('Sign in to review applications')}</h2>
          <form onSubmit={signIn} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-emerald">{tr('Email')}
              <input required type="email" autoComplete="username" className="mt-2 w-full border border-emerald/20 px-3 py-3 text-sm outline-none focus:border-gold" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="block text-sm font-medium text-emerald">{tr('Password')}
              <input required type="password" autoComplete="current-password" className="mt-2 w-full border border-emerald/20 px-3 py-3 text-sm outline-none focus:border-gold" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {error && <p role="alert" className="text-sm text-maroon">{error}</p>}
            <button className="w-full bg-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ivory">{tr('Sign in')}</button>
          </form>
        </div>
      ) : !['admin', 'editor'].includes(staff.role) ? (
        <div className="border-l-2 border-maroon bg-white p-6">
          <h2 className="font-display text-2xl text-emerald">{tr('Review access is not enabled for this account.')}</h2>
          <button type="button" onClick={() => void signOut()} className="mt-4 text-sm font-semibold text-maroon underline">{tr('Sign out')}</button>
        </div>
      ) : (
        <div>
          <div className="flex flex-col gap-4 border-b border-emerald/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-charcoal/55">{tr('Signed in as')} {staff.email}</p>
              <p className="mt-1 text-sm text-charcoal/70">{tr('Review each application once. Decisions are recorded with your staff account.')}</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="sr-only" htmlFor="application-status">{tr('Filter applications')}</label>
              <select id="application-status" value={status} onChange={(event) => setStatus(event.target.value)} className="border border-emerald/20 bg-white px-3 py-2 text-sm text-emerald">
                <option value="pending">{tr('Pending')}</option><option value="approved">{tr('Approved')}</option><option value="rejected">{tr('Rejected')}</option><option value="all">{tr('All statuses')}</option>
              </select>
              <button type="button" onClick={() => void signOut()} className="text-sm font-semibold text-maroon underline">{tr('Sign out')}</button>
            </div>
          </div>

          {message && <p role="status" className="mt-5 border-l-2 border-emerald bg-emerald/5 px-4 py-3 text-sm text-emerald">{message}</p>}
          {error && <p role="alert" className="mt-5 border-l-2 border-maroon bg-maroon/5 px-4 py-3 text-sm text-maroon">{error}</p>}
          {loading ? <p className="py-10 text-sm text-charcoal/65">{tr('Loading applications…')}</p> : applications.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-gold">{status} {tr('applications')}</p>
              <h2 className="mt-2 font-display text-3xl text-emerald">{tr('Nothing to review here.')}</h2>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {applications.map((application) => (
                <article key={application.id} className="border border-emerald/10 bg-white p-5 shadow-soft sm:p-7">
                  <div className="flex flex-col gap-4 border-b border-emerald/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-gold">{tr(application.status)} · {new Date(application.createdAt).toLocaleDateString()}</p>
                      <h2 className="mt-2 font-display text-2xl text-emerald">{application.fullName}</h2>
                      <p className="mt-1 text-sm text-charcoal/65">{application.studentId} · {application.department} {tr('· Semester')} {application.semester}</p>
                    </div>
                    <span className="w-fit border border-emerald/10 px-3 py-1 text-xs uppercase tracking-[0.12em] text-charcoal/65">{localeLabels[application.preferredLanguage]}</span>
                  </div>
                  <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                    <div><p className="text-xs uppercase tracking-[0.14em] text-charcoal/50">{tr('Contact')}</p><p className="mt-1 text-charcoal/80">{application.universityEmail || tr('No email provided')}{application.phoneNumber ? ` · ${application.phoneNumber}` : ''}</p></div>
                    <div><p className="text-xs uppercase tracking-[0.14em] text-charcoal/50">{tr('Interests')}</p><p className="mt-1 text-charcoal/80">{application.areasOfInterest.map((area) => tr(area)).join(tr(', ')) || tr('Not specified')}</p></div>
                  </div>
                  {application.motivationStatement && <p className="mt-4 border-l border-gold pl-4 text-sm leading-6 text-charcoal/75">{application.motivationStatement}</p>}
                  {application.rejectionReason && <p className="mt-4 text-sm text-maroon">{tr('Decision note:')} {application.rejectionReason}</p>}
                  {application.status !== 'pending' && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-charcoal/60">
                      <span>{tr('Email:')} <strong className={application.emailNotificationStatus === 'sent' ? 'text-emerald' : 'text-maroon'}>{tr(application.emailNotificationStatus.replace('_', ' '))}</strong></span>
                      {application.status === 'approved' && application.accountSetupStatus && <span>{tr('Account:')} <strong className={application.accountSetupStatus === 'ready' ? 'text-emerald' : 'text-charcoal/70'}>{tr(application.accountSetupStatus.split('_').join(' '))}</strong></span>}
                      {application.emailNotificationStatus !== 'sent' && application.universityEmail && (
                        <button type="button" disabled={Boolean(busyId)} onClick={() => void retryNotification(application.id)} className="font-semibold text-maroon underline disabled:opacity-50">
                          {tr('Retry decision email')}
                        </button>
                      )}
                    </div>
                  )}
                  {application.status === 'pending' && (
                    <div className="mt-5 flex flex-wrap items-start gap-3 border-t border-emerald/10 pt-4">
                      <button type="button" disabled={Boolean(busyId)} onClick={() => void reviewApplication(application.id, 'approved')} className="bg-emerald px-4 py-2 text-sm font-semibold text-ivory disabled:opacity-50">{tr('Approve')}</button>
                      {rejectingId === application.id ? (
                        <form className="flex min-w-[min(100%,24rem)] flex-1 flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); void reviewApplication(application.id, 'rejected'); }}>
                          <input required maxLength={500} aria-label={tr('Reason for declining')} placeholder={tr('Reason for declining')} className="min-w-0 flex-1 border border-emerald/20 px-3 py-2 text-sm outline-none focus:border-gold" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} />
                          <button type="submit" disabled={Boolean(busyId)} className="bg-maroon px-4 py-2 text-sm font-semibold text-ivory disabled:opacity-50">{tr('Confirm decline')}</button>
                        </form>
                      ) : (
                        <button type="button" onClick={() => { setRejectingId(application.id); setRejectionReason(''); }} className="border border-maroon/30 px-4 py-2 text-sm font-semibold text-maroon">{tr('Decline')}</button>
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
      setError(requestError instanceof Error ? requestError.message : tr('Your message could not be sent.'));
    } finally {
      setSending(false);
    }
  }

  const inputClass = 'mt-2 w-full border border-emerald/20 bg-white px-3 py-3 text-sm text-charcoal outline-none focus:border-gold focus:ring-2 focus:ring-gold/20';

  return (
    <PageShell title={tr('Contact')}>
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <aside className="border-l-2 border-gold pl-5"><p className="text-xs uppercase tracking-[0.2em] text-gold">{tr('Start a conversation')}</p><h2 className="mt-3 font-display text-3xl leading-tight text-emerald">{tr('We welcome thoughtful questions and collaborations.')}</h2><p className="mt-4 text-sm leading-6 text-charcoal/70">{tr('Send a message to the council. Your enquiry is stored securely for follow-up, and we will reply to the email address you provide.')}</p><div className="mt-7 border-t border-emerald/15 pt-6"><p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold">{tr('Reach us directly')}</p><ContactChannels /></div></aside>
        <section className="border-t border-emerald/15 pt-6">
          {sent ? <div role="status" className="border border-emerald/15 bg-white p-7 shadow-soft"><p className="text-xs uppercase tracking-[0.18em] text-gold">{tr('Message recorded')}</p><h2 className="mt-3 font-display text-3xl text-emerald">{tr('Thank you for getting in touch.')}</h2><p className="mt-3 text-sm leading-6 text-charcoal/70">{tr('Your enquiry has been added to the council inbox.')} {emailStatus === 'sent' ? tr('The council inbox was notified by email.') : tr('Email delivery is temporarily unavailable, but staff can still retrieve your message from the inbox.')}</p></div> : <form onSubmit={sendMessage} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-medium text-emerald">{tr('Full name')}<input required minLength={2} maxLength={120} autoComplete="name" className={inputClass} value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} /></label><label className="block text-sm font-medium text-emerald">{tr('Email')}<input required type="email" maxLength={254} autoComplete="email" className={inputClass} value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label></div>
            <label className="block text-sm font-medium text-emerald">{tr('Subject')}<input required minLength={3} maxLength={160} className={inputClass} value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} /></label>
            <label className="block text-sm font-medium text-emerald">{tr('Message')}<textarea required minLength={10} maxLength={5000} rows={6} className={`${inputClass} resize-y`} value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} /></label>
            <label aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">{tr('Website')}<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} /></label>
            <label className="flex items-start gap-3 border-t border-emerald/15 pt-5 text-sm leading-6 text-charcoal/70"><input required type="checkbox" checked={form.privacyAcknowledged} onChange={(event) => setForm((current) => ({ ...current, privacyAcknowledged: event.target.checked }))} className="mt-1 accent-emerald" /><span>{tr('I agree that the council may use my details to respond to this enquiry.')}</span></label>
            {error && <p role="alert" className="text-sm text-maroon">{error}</p>}
            <button disabled={sending} className="bg-emerald px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ivory disabled:opacity-50">{sending ? tr('Sending…') : tr('Send message')}</button>
          </form>}
        </section>
      </div>
    </PageShell>
  );
}

function PrivacyPage() {
  return (
    <PageShell title={tr('Privacy Policy')}>
      <div className="rounded-[2rem] bg-white p-8 shadow-soft">
        <p className="text-charcoal/75">{tr('The council will document its privacy notice, consent standards, retention periods, and allowable disclosures in the compliance and governance stages.')}</p>
      </div>
    </PageShell>
  );
}

function TermsPage() {
  return (
    <PageShell title={tr('Terms of Use')}>
      <div className="rounded-[2rem] bg-white p-8 shadow-soft">
        <p className="text-charcoal/75">{tr('The use of this platform is governed by the final terms and policies reviewed by the council and university stakeholders.')}</p>
      </div>
    </PageShell>
  );
}

function NotFoundPage() {
  return (
    <PageShell title={tr('Page not found')}>
      <div className="rounded-[2rem] bg-white p-8 shadow-soft">
        <p className="text-charcoal/75">{tr('The requested page could not be found.')}</p>
      </div>
    </PageShell>
  );
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => {
    try {
      const requested = new URLSearchParams(window.location.search).get('lang') as Locale | null;
      if (requested && supportedLocales.includes(requested)) return requested;
      const saved = window.localStorage.getItem('ssc-locale') as Locale | null;
      return saved && supportedLocales.includes(saved) ? saved : 'en';
    } catch {
      return 'en';
    }
  });
  // Set before any child renders so every tr() call in this pass uses the chosen language.
  setActiveLocale(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = getDirection(locale);
    document.title = translations[locale].siteName;
    try { window.localStorage.setItem('ssc-locale', locale); } catch { /* storage unavailable */ }
  }, [locale]);

  return (
    <div dir={getDirection(locale)} className="app-root min-h-screen bg-ivory pb-[calc(4rem+env(safe-area-inset-bottom))] text-charcoal lg:pb-0">
      <ScrollChrome />
      <LogoPreview />
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
        <Route path="/poetry" element={<PoetryPage />} />
        <Route path="/culture" element={<CulturePage locale={locale} />} />
        <Route path="/culture/:slug" element={<ArticleDetailPage />} />
        <Route path="/announcements" element={<AnnouncementsPage locale={locale} />} />
        <Route path="/announcements/:slug" element={<AnnouncementDetailPage />} />
        <Route path="/join" element={<JoinPage locale={locale} />} />
        <Route path="/council/review" element={<MembershipReviewPage />} />
        <Route path="/council/members" element={<MembersDirectoryPage />} />
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
