import { connectDatabase, disconnectDatabase } from '../lib/db';
import { hashPassword } from '../lib/auth';
import { User } from '../models/User';
import { ContentItem } from '../models/ContentItem';
import { Event } from '../models/Event';

async function seed() {
  await connectDatabase();

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@saraikistudentcouncil.org';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'AdminPassword123!';

  const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
  if (!existingAdmin) {
    await User.create({
      email: adminEmail.toLowerCase(),
      passwordHash: await hashPassword(adminPassword),
      role: 'admin',
      isActive: true,
    });
    console.log(`Created admin user: ${adminEmail}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  const adminUser = await User.findOne({ email: adminEmail.toLowerCase() });
  if (!adminUser) {
    throw new Error('Admin user could not be created or found.');
  }

  const publishedAnnouncements = [
    {
      contentType: 'announcement',
      slug: 'cabinet-2026-2027-appointment',
      title: 'Cabinet 2026–2027 announced',
      summary: 'The new council leadership team is now active for the academic year.',
      body: 'The Saraiki Student Council is pleased to announce the leadership and executive cabinet for the 2026–2027 session. The team will now begin planning cultural initiatives, student voice programs, and campus representation work.',
      locale: 'en',
      status: 'published',
      publishedAt: new Date(),
    },
    {
      contentType: 'announcement',
      slug: 'khoj-e-heritage-week',
      title: 'Khoj-e-Heritage Week',
      summary: 'A campus-wide cultural and language celebration is being planned.',
      body: 'The council is preparing a heritage week with community performances, language sessions, and cultural learning activities for students across departments.',
      locale: 'ur',
      status: 'published',
      publishedAt: new Date(),
    },
  ];

  for (const announcement of publishedAnnouncements) {
    const exists = await ContentItem.findOne({ contentType: announcement.contentType, slug: announcement.slug });
    if (!exists) {
      await ContentItem.create({
        ...announcement,
        createdBy: adminUser._id,
      });
    }
  }

  const leaderProfiles = [
    {
      contentType: 'leader',
      slug: 'amjad-amin-chairman',
      title: 'Amjad Amin',
      summary: 'Chairman of the Saraiki Student Council and student voice representative for the 2026–2027 session.',
      body: 'Amjad Amin leads the cabinet with a focus on mentorship, student representation, and campus leadership rooted in cultural awareness and inclusion.',
      locale: 'en',
      status: 'published',
      roleTitle: 'Chairman',
      imageUrl: '/src/assets/Amjad.jpeg',
    },
    {
      contentType: 'leader',
      slug: 'malik-zahid-vice-chairman',
      title: 'Malik Zahid',
      summary: 'Vice Chairman supporting council direction, student advocacy, and leadership coordination.',
      body: 'Malik Zahid contributes strategic leadership, mentoring, and coordination across council initiatives and university engagement.',
      locale: 'en',
      status: 'published',
      roleTitle: 'Vice Chairman',
      imageUrl: '/src/assets/malik.jpeg',
    },
    {
      contentType: 'leader',
      slug: 'sohail-majeed-president',
      title: 'Sohail Majeed',
      summary: 'President of the council, guiding student engagement and inter-campus collaboration.',
      body: 'Sohail Majeed leads the student leadership agenda with a focus on culture, representation, and a stronger campus community.',
      locale: 'en',
      status: 'published',
      roleTitle: 'President',
      imageUrl: '/src/assets/sohail.jpeg',
    },
  ];

  for (const leader of leaderProfiles) {
    const exists = await ContentItem.findOne({ contentType: leader.contentType, slug: leader.slug });
    if (!exists) {
      await ContentItem.create({
        ...leader,
        createdBy: adminUser._id,
      });
    }
  }

  const eventExists = await Event.findOne({ slug: 'saraiki-heritage-evening' });
  if (!eventExists) {
    await Event.create({
      title: 'Saraiki Heritage Evening',
      slug: 'saraiki-heritage-evening',
      summary: 'A heritage evening of music, poetry, and campus storytelling.',
      description: 'Join the council for an evening of Saraiki language, culture, student poetry, and community storytelling.',
      startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14 + 1000 * 60 * 60 * 3),
      venue: 'Leads University Auditorium',
      capacity: 180,
      registrationCount: 0,
      registrationOpen: true,
      status: 'published',
      createdBy: adminUser._id,
    });
    console.log('Created starter public event: Saraiki Heritage Evening');
  } else {
    console.log('Starter public event already exists.');
  }

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
