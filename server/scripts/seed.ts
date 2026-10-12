import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from '../lib/db.js';
import { hashPassword } from '../lib/auth.js';
import { User } from '../models/User.js';
import { ContentItem } from '../models/ContentItem.js';
import { Event } from '../models/Event.js';
import { VolunteerOpportunity } from '../models/VolunteerOpportunity.js';

// The seed only inserts records that are missing. Anything staff have edited since is left untouched,
// so it is safe to run more than once.

type Locale = 'en' | 'ur' | 'skr';

type SeedContent = {
  contentType: 'announcement' | 'article' | 'leader';
  slug: string;
  title: string;
  summary: string;
  body: string;
  locale: Locale;
  roleTitle?: string;
  publishedAt: Date;
};

// Pakistan Standard Time is UTC+5 and has no daylight saving.
function pkt(date: string, time: string) {
  return new Date(`${date}T${time}:00+05:00`);
}

const announcements: SeedContent[] = [
  {
    contentType: 'announcement',
    slug: 'membership-open-2026-27',
    title: 'Membership applications are open for 2026–2027',
    summary: 'Students from every department at Leads University can now apply to join the Saraiki Student Council.',
    body: [
      'The Saraiki Student Council is accepting membership applications for the 2026–2027 session. Membership is open to every enrolled student of Leads University, whatever your department, semester, or mother tongue.',
      'To apply, complete the short form on the Join page with your student ID and university email. Tell us which areas interest you most: cultural events, the Saraiki language, community outreach, student leadership, media and design, or research and archive work.',
      'Each application is reviewed by the council. You will receive the decision by email, and approved members get a secure link to activate their member account and sign in to the member portal.',
    ].join('\n\n'),
    locale: 'en',
    publishedAt: pkt('2026-10-12', '10:00'),
  },
  {
    contentType: 'announcement',
    slug: 'heritage-evening-registration-open',
    title: 'Registration is open for the Saraiki Heritage Evening',
    summary: 'An evening of kafi, poetry, and storytelling in the university auditorium. Places are limited, so register early.',
    body: [
      'The council invites students, faculty, and families to the Saraiki Heritage Evening, a programme of kafi singing, student poetry, and stories from the Saraiki region.',
      'Seats in the auditorium are limited and are confirmed in the order registrations arrive. Register from the Events page with your university email and student ID.',
      'Members who would like to help on the day can apply for the stage, hospitality, and media teams through the volunteer section of the member portal.',
    ].join('\n\n'),
    locale: 'en',
    publishedAt: pkt('2026-10-11', '10:00'),
  },
  {
    contentType: 'announcement',
    slug: 'mushaira-call-for-student-poets',
    title: 'Call for student poets: Saraiki Mushaira',
    summary: 'Students who write in Saraiki, Urdu, Punjabi, or English are invited to read at the council mushaira.',
    body: [
      'The council is preparing its student mushaira and is looking for poets to read their own work. Poems in Saraiki are especially welcome, and work in Urdu, Punjabi, and English will also be considered.',
      'Send one or two poems, with your name, department, and semester, through the Contact page with the subject "Mushaira submission". A small panel of council members will confirm the reading list.',
      'First-time readers are encouraged to take part. The aim of the evening is to give student voices a stage.',
    ].join('\n\n'),
    locale: 'en',
    publishedAt: pkt('2026-10-10', '10:00'),
  },
  {
    contentType: 'announcement',
    slug: 'cabinet-2026-2027-announced',
    title: 'Cabinet 2026–2027 announced',
    summary: 'The council leadership and executive cabinet for the 2026–2027 session have taken up their roles.',
    body: [
      'The Saraiki Student Council is pleased to announce its leadership and executive cabinet for the 2026–2027 session. The full roster is published on the Cabinet page.',
      'The cabinet will plan cultural programmes, represent students, and build the volunteer teams that make council events possible.',
      'Students with ideas for the year ahead are welcome to write to the council through the Contact page.',
    ].join('\n\n'),
    locale: 'en',
    publishedAt: pkt('2026-10-09', '10:00'),
  },
  {
    contentType: 'announcement',
    slug: 'volunteer-teams-forming',
    title: 'Volunteer teams are forming for the autumn programme',
    summary: 'Members can now apply for the event, media, language circle, and oral history teams from the member portal.',
    body: [
      'Council events are run by student volunteers. Four teams are open to members this term: event day support, media and photography, Saraiki language circle facilitators, and the oral history project.',
      'Sign in to the member portal to read each role and apply. You can add a short note about your experience or availability, and the event team will confirm your place.',
    ].join('\n\n'),
    locale: 'en',
    publishedAt: pkt('2026-10-08', '10:00'),
  },
  {
    contentType: 'announcement',
    slug: 'membership-open-2026-27-ur',
    title: 'سیشن 2026–2027 کے لیے رکنیت کی درخواستیں شروع',
    summary: 'لیڈز یونیورسٹی کے تمام شعبوں کے طلبہ اب سرائیکی طلبہ کونسل کی رکنیت کے لیے درخواست دے سکتے ہیں۔',
    body: [
      'سرائیکی طلبہ کونسل سیشن 2026–2027 کے لیے رکنیت کی درخواستیں قبول کر رہی ہے۔ رکنیت لیڈز یونیورسٹی کے ہر طالب علم کے لیے کھلی ہے، خواہ آپ کا شعبہ، سمسٹر یا مادری زبان کوئی بھی ہو۔',
      'درخواست دینے کے لیے "شمولیت" کے صفحے پر موجود فارم میں اپنا اسٹوڈنٹ آئی ڈی اور یونیورسٹی ای میل درج کریں اور بتائیں کہ آپ کس شعبے میں کام کرنا چاہتے ہیں۔',
      'کونسل ہر درخواست کا جائزہ لیتی ہے۔ فیصلے کی اطلاع ای میل کے ذریعے دی جائے گی اور منظور شدہ ارکان کو اپنا اکاؤنٹ فعال کرنے کے لیے ایک محفوظ لنک بھیجا جائے گا۔',
    ].join('\n\n'),
    locale: 'ur',
    publishedAt: pkt('2026-10-12', '10:00'),
  },
  {
    contentType: 'announcement',
    slug: 'heritage-evening-registration-open-ur',
    title: 'سرائیکی ثقافتی شام کے لیے رجسٹریشن جاری',
    summary: 'یونیورسٹی آڈیٹوریم میں کافی، شاعری اور داستان گوئی کی ایک شام۔ نشستیں محدود ہیں، جلد رجسٹر ہوں۔',
    body: [
      'کونسل طلبہ، اساتذہ اور اہلِ خانہ کو سرائیکی ثقافتی شام میں شرکت کی دعوت دیتی ہے، جس میں کافی گائیکی، طلبہ کی شاعری اور سرائیکی وسیب کی کہانیاں شامل ہوں گی۔',
      'آڈیٹوریم میں نشستیں محدود ہیں اور پہلے آئیے پہلے پائیے کی بنیاد پر دی جائیں گی۔ "تقریبات" کے صفحے سے اپنے یونیورسٹی ای میل اور اسٹوڈنٹ آئی ڈی کے ساتھ رجسٹر ہوں۔',
    ].join('\n\n'),
    locale: 'ur',
    publishedAt: pkt('2026-10-11', '10:00'),
  },
  {
    contentType: 'announcement',
    slug: 'mushaira-call-for-student-poets-ur',
    title: 'طلبہ شعرا کے لیے دعوت: سرائیکی مشاعرہ',
    summary: 'سرائیکی، اردو، پنجابی یا انگریزی میں لکھنے والے طلبہ کو کونسل کے مشاعرے میں اپنا کلام پڑھنے کی دعوت ہے۔',
    body: [
      'کونسل طلبہ کا مشاعرہ منعقد کر رہی ہے اور ایسے شعرا کی تلاش میں ہے جو اپنا کلام خود پڑھنا چاہیں۔ سرائیکی کلام کو خاص طور پر خوش آمدید کہا جائے گا۔',
      'اپنی ایک یا دو نظمیں نام، شعبے اور سمسٹر کے ساتھ "رابطہ" کے صفحے سے "مشاعرہ" کے عنوان کے تحت بھیجیں۔ پہلی بار پڑھنے والوں کی حوصلہ افزائی کی جائے گی۔',
    ].join('\n\n'),
    locale: 'ur',
    publishedAt: pkt('2026-10-10', '10:00'),
  },
  {
    contentType: 'announcement',
    slug: 'membership-open-2026-27-skr',
    title: 'سیشن 2026–2027 کیتے رکنیت دیاں درخواستاں شروع',
    summary: 'لیڈز یونیورسٹی دے سارے شعبیاں دے طالب علم ہݨ سرائیکی طلبہ کونسل دی رکنیت کیتے درخواست ݙے سڳدن۔',
    body: [
      'سرائیکی طلبہ کونسل سیشن 2026–2027 کیتے رکنیت دیاں درخواستاں گھندی پئی اے۔ رکنیت لیڈز یونیورسٹی دے ہر طالب علم کیتے کھلی اے۔',
      'درخواست ݙیوݨ کیتے "شمولیت" دے صفحے تے فارم بھرو تے اپݨا اسٹوڈنٹ آئی ڈی تے یونیورسٹی ای میل لکھو۔ فیصلے دی اطلاع ای میل نال ݙتی ویسی۔',
    ].join('\n\n'),
    locale: 'skr',
    publishedAt: pkt('2026-10-12', '10:00'),
  },
  {
    contentType: 'announcement',
    slug: 'heritage-evening-registration-open-skr',
    title: 'سرائیکی ثقافتی شام کیتے رجسٹریشن شروع',
    summary: 'یونیورسٹی آڈیٹوریم وچ کافی، شاعری تے قصے کہاݨیاں دی ہک شام۔ نشستاں تھوڑیاں ہن، جلدی رجسٹر تھیوو۔',
    body: [
      'کونسل طالب علماں، استاداں تے گھر والیاں کوں سرائیکی ثقافتی شام وچ آوݨ دی دعوت ݙیندی اے۔ ایں شام وچ کافی، طالب علماں دی شاعری تے سرائیکی وسیب دیاں کہاݨیاں ہوسن۔',
      '"تقریبات" دے صفحے توں اپݨے یونیورسٹی ای میل تے اسٹوڈنٹ آئی ڈی نال رجسٹر تھیوو۔',
    ].join('\n\n'),
    locale: 'skr',
    publishedAt: pkt('2026-10-11', '10:00'),
  },
];

const articles: SeedContent[] = [
  {
    contentType: 'article',
    slug: 'saraiki-language-a-living-voice',
    title: 'Saraiki: a living voice of the Indus valley',
    summary: 'Spoken by more than twenty-five million people, Saraiki carries the poetry, humour, and memory of southern Punjab and beyond.',
    body: [
      'Saraiki is one of the major languages of Pakistan. It is the mother tongue of more than twenty-five million people, most of them in southern Punjab, in and around Multan, Bahawalpur, Dera Ghazi Khan, Muzaffargarh, and Rahim Yar Khan. It is also spoken in Dera Ismail Khan and in neighbouring parts of Sindh and Balochistan.',
      'The language belongs to the Indo-Aryan family and is closely related to Punjabi and Sindhi, yet it has a sound of its own. Saraiki uses implosive consonants, made by drawing the breath inward, which give the language its soft, rounded music. In writing, these sounds have their own letters added to the Perso-Arabic script, such as ٻ, ڄ, ݙ, and ڳ.',
      'For centuries Saraiki was carried mostly by voice: in lullabies, wedding songs, proverbs, and the verses of Sufi poets sung at shrines. That oral inheritance is still its great strength. A grandparent telling a story in Saraiki passes on vocabulary, values, and a way of seeing the world all at once.',
      'For students who have moved to Lahore to study, the language is often the closest link to home. The council exists partly for that reason: to give Saraiki a place on campus, to welcome those who want to learn it, and to make sure it is spoken with pride.',
    ].join('\n\n'),
    locale: 'en',
    publishedAt: pkt('2026-10-12', '09:00'),
  },
  {
    contentType: 'article',
    slug: 'khwaja-ghulam-farid-and-the-kafi',
    title: 'Khwaja Ghulam Farid and the kafi tradition',
    summary: 'The nineteenth-century Sufi poet of Kot Mithan gave Saraiki its best-loved verses and turned the Rohi desert into a landscape of longing.',
    body: [
      'No poet is closer to the heart of Saraiki speakers than Khwaja Ghulam Farid. Born in 1845 in Chachran and laid to rest in 1901 at Kot Mithan, he was a Sufi of the Chishti order, a scholar of several languages, and the author of the collection known as Diwan-e-Farid.',
      'His chosen form was the kafi, a short lyric meant to be sung. A kafi usually returns again and again to a refrain, and its language is that of everyday life: the well, the herd, the monsoon cloud, the lover waiting for news. Behind those images lies a spiritual search, in which the beloved stands for the divine.',
      'Farid spent long periods in Rohi, the Cholistan desert, and his poetry made that landscape famous. In his verses the desert after rain, with its grasses, dunes, and wandering herders, becomes a place of beauty and of separation.',
      'His kafis are still sung at shrines, on the radio, and at family gatherings, and they are a natural starting point for anyone who wants to hear how Saraiki sounds at its most musical. The council opens its heritage evenings with one for exactly that reason.',
    ].join('\n\n'),
    locale: 'en',
    publishedAt: pkt('2026-10-10', '09:00'),
  },
  {
    contentType: 'article',
    slug: 'ajrak-and-multani-blue',
    title: 'Blue of the south: the Saraiki ajrak and Multani pottery',
    summary: 'From block-printed cloth to the glazed tiles of Multan, blue is the colour by which the Saraiki region is recognised.',
    body: [
      'Ask a Saraiki student what colour home is, and the answer is often blue. It is the blue of the Saraiki ajrak, the block-printed shawl worn at weddings, cultural days, and graduations, and the blue of the glazed tiles that cover the shrines of Multan.',
      'The ajrak is printed by hand with carved wooden blocks, layer after layer, in geometric patterns that take days to complete. The blue Saraiki ajrak has become a symbol of the region, and each year on 6 March it is worn widely to mark Saraiki Culture Day.',
      'Multan, often called the City of Saints, is equally known for kashi kari, the craft of blue pottery and tile work. Artisans paint floral and geometric designs in cobalt and turquoise on a white ground before glazing and firing. The same work decorates the great shrines of the city, including that of Shah Rukn-e-Alam.',
      'These crafts are more than decoration. They support families of artisans and carry skills that have passed from one generation to the next. Wearing an ajrak on campus is a small way of keeping that chain unbroken.',
    ].join('\n\n'),
    locale: 'en',
    publishedAt: pkt('2026-10-08', '09:00'),
  },
  {
    contentType: 'article',
    slug: 'jhumar-the-dance-of-celebration',
    title: 'Jhumar: the dance of celebration',
    summary: 'Slow, graceful, and danced in a circle to the beat of the dhol, jhumar is how the Saraiki region marks its happiest days.',
    body: [
      'Jhumar is the traditional dance of the Saraiki region. It is performed at weddings, harvests, and festivals, usually by a group moving in a circle around a drummer.',
      'What sets jhumar apart is its pace. The steps are unhurried and swaying, with the arms rising and falling together, and the rhythm builds gradually as the dhol player leads the dancers from one pattern to the next. The mood is joyful without being hurried.',
      'Because the basic steps are simple, jhumar welcomes everyone. A newcomer can join the circle within minutes, which is why the council teaches it in an open workshop each term. No experience is needed, only a willingness to follow the drum.',
    ].join('\n\n'),
    locale: 'en',
    publishedAt: pkt('2026-10-06', '09:00'),
  },
  {
    contentType: 'article',
    slug: 'saraiki-language-a-living-voice-ur',
    title: 'سرائیکی: وادیٔ سندھ کی زندہ آواز',
    summary: 'ڈھائی کروڑ سے زائد افراد کی مادری زبان سرائیکی جنوبی پنجاب کی شاعری، مزاح اور اجتماعی یادداشت کی امین ہے۔',
    body: [
      'سرائیکی پاکستان کی بڑی زبانوں میں سے ایک ہے۔ یہ ڈھائی کروڑ سے زائد افراد کی مادری زبان ہے جن کی اکثریت جنوبی پنجاب میں ملتان، بہاولپور، ڈیرہ غازی خان، مظفرگڑھ اور رحیم یار خان کے علاقوں میں آباد ہے۔ یہ ڈیرہ اسماعیل خان اور سندھ و بلوچستان کے ملحقہ علاقوں میں بھی بولی جاتی ہے۔',
      'یہ ہند آریائی خاندان کی زبان ہے اور پنجابی اور سندھی سے قریبی تعلق رکھتی ہے، مگر اس کا اپنا ایک الگ لہجہ ہے۔ سرائیکی کی مخصوص آوازوں کے لیے رسم الخط میں الگ حروف شامل ہیں، جیسے ٻ، ڄ، ݙ اور ڳ۔',
      'صدیوں تک سرائیکی زیادہ تر سینہ بہ سینہ منتقل ہوتی رہی: لوریوں، شادی کے گیتوں، کہاوتوں اور صوفی شعرا کے کلام کی صورت میں۔ یہی زبانی ورثہ آج بھی اس کی سب سے بڑی طاقت ہے۔',
      'جو طلبہ تعلیم کے لیے لاہور آئے ہیں ان کے لیے یہ زبان اکثر گھر سے سب سے قریبی رشتہ ہوتی ہے۔ کونسل کا ایک مقصد یہی ہے کہ جامعہ میں سرائیکی کو جگہ ملے اور اسے فخر کے ساتھ بولا جائے۔',
    ].join('\n\n'),
    locale: 'ur',
    publishedAt: pkt('2026-10-12', '09:00'),
  },
  {
    contentType: 'article',
    slug: 'khwaja-ghulam-farid-and-the-kafi-ur',
    title: 'خواجہ غلام فرید اور کافی کی روایت',
    summary: 'کوٹ مٹھن کے انیسویں صدی کے صوفی شاعر نے سرائیکی کو اس کا مقبول ترین کلام دیا اور روہی کو ہجر و وصال کا استعارہ بنا دیا۔',
    body: [
      'سرائیکی بولنے والوں کے دل کے سب سے قریب شاعر خواجہ غلام فرید ہیں۔ وہ 1845 میں چاچڑاں میں پیدا ہوئے اور 1901 میں کوٹ مٹھن میں آسودۂ خاک ہوئے۔ وہ سلسلۂ چشتیہ کے صوفی، کئی زبانوں کے عالم اور دیوانِ فرید کے خالق تھے۔',
      'ان کی پسندیدہ صنف کافی تھی، جو گانے کے لیے لکھی جانے والی مختصر نظم ہے۔ کافی کی زبان روزمرہ زندگی کی زبان ہے: کنواں، ریوڑ، ساون کا بادل اور محبوب کی خبر کا انتظار۔ ان تصویروں کے پیچھے ایک روحانی تلاش ہے۔',
      'خواجہ فرید نے روہی یعنی چولستان میں طویل عرصہ گزارا اور ان کی شاعری نے اس صحرا کو لازوال بنا دیا۔ ان کی کافیاں آج بھی مزاروں، ریڈیو اور گھریلو محفلوں میں گائی جاتی ہیں۔',
    ].join('\n\n'),
    locale: 'ur',
    publishedAt: pkt('2026-10-10', '09:00'),
  },
  {
    contentType: 'article',
    slug: 'saraiki-language-a-living-voice-skr',
    title: 'سرائیکی: ساݙی ماء ٻولی',
    summary: 'سرائیکی ݙھائی کروڑ توں ودھ لوکاں دی ماء ٻولی اے تے وسیب دی شاعری تے یاداں دی امین اے۔',
    body: [
      'سرائیکی پاکستان دیاں وݙیاں زباناں وچوں ہک اے۔ ایہ ملتان، بہاولپور، ݙیرہ غازی خان، مظفرگڑھ تے رحیم یار خان سمیت پورے وسیب وچ ٻولی ویندی اے۔',
      'خواجہ غلام فرید دیاں کافیاں ایں زبان دا سب توں وݙا سرمایہ ہن۔ جیہڑے طالب علم پڑھݨ کیتے لاہور آئے ہن، انہاں کیتے سرائیکی گھر نال سب توں نیڑے دا رشتہ اے۔',
      'کونسل دا مقصد ایہ اے جو جامعہ وچ سرائیکی کوں تھاں ملے تے ایہ فخر نال ٻولی ونڄے۔',
    ].join('\n\n'),
    locale: 'skr',
    publishedAt: pkt('2026-10-12', '09:00'),
  },
];

// Names and designations match the cabinet roster shown on the site. Listed in order of seniority.
const cabinet: Array<{ name: string; roleTitle: string; focus: string }> = [
  { name: 'Amjad Amin', roleTitle: 'Chairman', focus: 'chairs the council and sets its direction for the session, with a focus on representation and mentorship' },
  { name: 'Malik Zahid', roleTitle: 'Vice Chairman', focus: 'supports the Chairman and coordinates the work of the cabinet across council initiatives' },
  { name: 'Sohail Majeed', roleTitle: 'President', focus: 'leads student engagement and represents the council to the university community' },
  { name: 'Meer Asmat Baloch', roleTitle: 'General Secretary', focus: 'manages council business, meetings, and communication between the cabinet and members' },
  { name: 'Ramish Khan', roleTitle: 'Advisor to Council', focus: 'advises the cabinet on planning, policy, and long-term priorities' },
  { name: 'Muhammad Haris', roleTitle: 'Joint Secretary', focus: 'assists the General Secretary with records, correspondence, and coordination' },
  { name: 'Zeeshan Chandia', roleTitle: 'Cultural Secretary', focus: 'plans the cultural calendar, from heritage evenings to Saraiki Culture Day' },
  { name: 'Adnan Zafar', roleTitle: 'Finance Secretary', focus: 'looks after council budgets and keeps event spending accountable' },
  { name: 'Muhammad Ahmad', roleTitle: 'Information Secretary', focus: 'handles announcements, media, and the council\'s public communication' },
  { name: 'Asadullah', roleTitle: 'Academic Secretary', focus: 'leads academic support, study circles, and guidance for new students' },
  { name: 'Zulfiqar Ahamd', roleTitle: 'Action Committee Head', focus: 'leads the action committee that turns cabinet decisions into work on the ground' },
  { name: 'Malik Sheroz', roleTitle: 'Senior Event Organizer', focus: 'runs event logistics and the volunteer teams on the day' },
  { name: 'Hasnain Shafi', roleTitle: 'Sports Secretary', focus: 'organises sports activities and council teams for campus tournaments' },
];

const leaders: SeedContent[] = cabinet.map((member, index) => ({
  contentType: 'leader',
  slug: `${member.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${member.roleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  title: member.name,
  summary: `${member.roleTitle} of the Saraiki Student Council for the 2026–2027 session.`,
  body: `As ${member.roleTitle}, ${member.name} ${member.focus}.`,
  locale: 'en',
  roleTitle: member.roleTitle,
  // Most senior first when sorted newest-first.
  publishedAt: new Date(pkt('2026-10-09', '10:00').getTime() - index * 60_000),
}));

const events = [
  {
    title: 'New Member Orientation',
    slug: 'new-member-orientation-2026',
    summary: 'Meet the cabinet, learn how the council works, and find the team that suits you.',
    description: [
      'A welcome session for new and prospective members of the Saraiki Student Council. The cabinet will introduce the plans for the 2026–2027 session and explain how membership, events, and volunteer teams work.',
      'You will hear from each team lead, have time for questions, and can sign up for volunteer roles on the spot. Students who have not applied for membership yet are welcome to attend.',
    ].join('\n\n'),
    startsAt: pkt('2026-10-22', '15:00'),
    endsAt: pkt('2026-10-22', '16:30'),
    venue: 'Seminar Hall, Leads University, Lahore',
    capacity: 80,
    registrationOpen: true,
    status: 'published',
  },
  {
    title: 'Saraiki Heritage Evening',
    slug: 'saraiki-heritage-evening',
    summary: 'An evening of kafi, student poetry, and storytelling from the Saraiki region.',
    description: [
      'Join the council for its flagship cultural evening. The programme opens with a kafi of Khwaja Ghulam Farid, followed by student poetry in Saraiki and Urdu, storytelling from the region, and a jhumar performance to close.',
      'Guests are encouraged to wear the Saraiki ajrak. Students, faculty, and families are all welcome. Seats are limited and confirmed in the order registrations arrive.',
    ].join('\n\n'),
    startsAt: pkt('2026-10-30', '17:00'),
    endsAt: pkt('2026-10-30', '20:00'),
    venue: 'Leads University Auditorium, Lahore',
    capacity: 180,
    registrationOpen: true,
    status: 'published',
  },
  {
    title: 'Jhumar Workshop',
    slug: 'jhumar-workshop-autumn-2026',
    summary: 'Learn the steps of the traditional Saraiki circle dance. No experience needed.',
    description: [
      'A hands-on workshop in jhumar, the traditional dance of the Saraiki region. Council members will teach the basic steps and two group patterns to the beat of the dhol.',
      'The session is open to complete beginners. Wear comfortable clothes and shoes. Participants who enjoy it can join the group performing at later council events.',
    ].join('\n\n'),
    startsAt: pkt('2026-11-05', '15:00'),
    endsAt: pkt('2026-11-05', '17:00'),
    venue: 'Student Activity Centre, Leads University, Lahore',
    capacity: 40,
    registrationOpen: true,
    status: 'published',
  },
  {
    title: 'Saraiki Mushaira',
    slug: 'saraiki-mushaira-2026',
    summary: 'Student poets read their own work in Saraiki, Urdu, Punjabi, and English.',
    description: [
      'An evening of poetry read by students. The mushaira gives first-time and experienced poets the same stage, with Saraiki verse at its centre and readings in Urdu, Punjabi, and English alongside.',
      'Students who would like to read should send their poems through the Contact page with the subject "Mushaira submission". Everyone else is welcome to register as audience.',
    ].join('\n\n'),
    startsAt: pkt('2026-11-20', '17:30'),
    endsAt: pkt('2026-11-20', '20:00'),
    venue: 'Leads University Auditorium, Lahore',
    capacity: 150,
    registrationOpen: true,
    status: 'published',
  },
  {
    title: 'Saraiki Culture Day',
    slug: 'saraiki-culture-day-2027',
    summary: 'A campus celebration of Saraiki Culture Day with ajrak, music, craft, and food.',
    description: [
      'Saraiki Culture Day is marked each year on 6 March. The council will celebrate on campus with an ajrak walk, live music and jhumar, a display of Multani blue pottery and other crafts, and stalls serving food from the region.',
      'The day is open to the whole university. Registration will open closer to the date.',
    ].join('\n\n'),
    startsAt: pkt('2027-03-06', '11:00'),
    endsAt: pkt('2027-03-06', '16:00'),
    venue: 'Central Lawn, Leads University, Lahore',
    registrationOpen: false,
    status: 'published',
  },
];

const volunteerOpportunities = [
  {
    title: 'Heritage Evening: stage and hospitality team',
    summary: 'Help run the Saraiki Heritage Evening, from welcoming guests to keeping the programme on time.',
    details: 'Volunteers will welcome and seat guests, check registrations at the door, look after performers backstage, and help the stage manager keep the programme running to schedule. You will need to attend one short briefing before the event and be available from 3:30 pm on the day.',
    areas: ['Cultural events', 'Student leadership'],
    startsAt: pkt('2026-10-30', '15:30'),
    venue: 'Leads University Auditorium, Lahore',
    status: 'open',
  },
  {
    title: 'Media and photography team',
    summary: 'Photograph council events and help produce posts, posters, and short videos.',
    details: 'The media team covers every council event and prepares material for announcements and social media. We are looking for photographers, videographers, graphic designers, and writers. Bring your own camera or phone; design work can be done on any software you are comfortable with. Please mention the kind of work you do in your note.',
    areas: ['Media and design'],
    status: 'open',
  },
  {
    title: 'Saraiki language circle facilitators',
    summary: 'Lead a weekly conversation circle for students who want to learn or practise Saraiki.',
    details: 'Facilitators host a relaxed one-hour circle each week where learners practise everyday Saraiki through conversation, proverbs, and song. Fluent speakers from any department are welcome, and no teaching experience is required. The council will provide a simple session outline.',
    areas: ['Saraiki language', 'Community outreach'],
    venue: 'Leads University, Lahore',
    status: 'open',
  },
  {
    title: 'Oral history and archive project',
    summary: 'Record stories, proverbs, and songs from elders and help build the council archive.',
    details: 'Volunteers will interview family members and elders, record and transcribe what they share, and help catalogue the material for the council archive. This suits students interested in research, writing, or audio work. Guidance on consent and recording will be given before you begin.',
    areas: ['Research and archive', 'Saraiki language'],
    status: 'open',
  },
];

async function findOrCreateAdmin() {
  const existingAdmin = await User.findOne({ role: 'admin', isActive: true }).sort({ createdAt: 1 });
  if (existingAdmin) {
    console.log(`Using existing admin account: ${existingAdmin.email}`);
    return existingAdmin;
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error('No admin account exists. Run `npm run admin:create` first, or set ADMIN_EMAIL and ADMIN_PASSWORD (minimum 12 characters) for this command.');
  }

  const admin = await User.create({ email, passwordHash: await hashPassword(password), role: 'admin', isActive: true });
  console.log(`Created admin account: ${email}`);
  return admin;
}

async function seed() {
  await connectDatabase();
  const admin = await findOrCreateAdmin();

  let created = 0;
  for (const item of [...announcements, ...articles, ...leaders]) {
    if (await ContentItem.exists({ contentType: item.contentType, slug: item.slug })) continue;
    await ContentItem.create({ ...item, status: 'published', createdBy: admin._id });
    created += 1;
  }
  console.log(`Content: ${created} added, ${announcements.length + articles.length + leaders.length - created} already present.`);

  created = 0;
  for (const event of events) {
    if (await Event.exists({ slug: event.slug })) continue;
    await Event.create({ ...event, registrationCount: 0, createdBy: admin._id });
    created += 1;
  }
  console.log(`Events: ${created} added, ${events.length - created} already present.`);

  created = 0;
  for (const opportunity of volunteerOpportunities) {
    if (await VolunteerOpportunity.exists({ title: opportunity.title })) continue;
    await VolunteerOpportunity.create({ ...opportunity, createdBy: admin._id });
    created += 1;
  }
  console.log(`Volunteer opportunities: ${created} added, ${volunteerOpportunities.length - created} already present.`);

  console.log('Database seed completed.');
}

seed()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Seed failed.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
