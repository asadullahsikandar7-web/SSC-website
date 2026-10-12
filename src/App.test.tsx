import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import App from './App';

describe('App shell', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage?.clear();
  });

  it('renders the homepage hero content', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText('Preserving culture, amplifying student leadership.')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Join us' })).not.toBeNull();
  });

  it('allows switching languages', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    const select = screen.getByLabelText('Language');
    fireEvent.change(select, { target: { value: 'ur' } });

    expect(document.documentElement.lang).toBe('ur');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('submits a membership application and displays its reference', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ success: true, data: { application: { id: 'application-123' } } }),
    }));

    render(
      <MemoryRouter initialEntries={['/join']}>
        <App />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Ayesha Hussain' } });
    fireEvent.change(screen.getByLabelText('Student ID'), { target: { value: 'LU-1042' } });
    fireEvent.change(screen.getByLabelText('Department'), { target: { value: 'Computer Science' } });
    fireEvent.change(screen.getByLabelText('Current semester'), { target: { value: '4' } });
    fireEvent.click(screen.getByLabelText('I agree that the council may use these details to review and respond to my membership application.'));
    fireEvent.submit(screen.getByRole('button', { name: 'Submit application' }).closest('form')!);

    expect((await screen.findByRole('status')).textContent).toContain('application-123');
    expect(fetch).toHaveBeenCalledWith('/api/v1/membership/applications', expect.objectContaining({ method: 'POST' }));
  });

  it('shows a useful message when the API service is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      text: async () => 'proxy error: connection refused',
    }));

    render(
      <MemoryRouter initialEntries={['/join']}>
        <App />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Ayesha Hussain' } });
    fireEvent.change(screen.getByLabelText('Student ID'), { target: { value: 'LU-1042' } });
    fireEvent.change(screen.getByLabelText('Department'), { target: { value: 'Computer Science' } });
    fireEvent.change(screen.getByLabelText('Current semester'), { target: { value: '4' } });
    fireEvent.click(screen.getByLabelText('I agree that the council may use these details to review and respond to my membership application.'));
    fireEvent.submit(screen.getByRole('button', { name: 'Submit application' }).closest('form')!);

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('service is currently unavailable'));
  });

  it('renders the leadership and cabinet routes with the 2026–2027 council members', async () => {
    render(
      <MemoryRouter initialEntries={['/cabinet']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: /cabinet 2026–2027/i })).not.toBeNull();
    expect(screen.getByText('Amjad Amin')).not.toBeNull();
    expect(screen.getByText('Sohail Majeed')).not.toBeNull();
    expect(screen.getByText('Meer Asmat Baloch')).not.toBeNull();
  });

  it('registers a student for a published event', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, options?: RequestInit) => ({
      ok: true,
      text: async () => JSON.stringify({
        success: true,
        data: options?.method === 'POST'
          ? { registration: { eventTitle: 'Saraiki Heritage Evening' } }
          : { event: {
            id: 'event-1',
            title: 'Saraiki Heritage Evening',
            slug: 'saraiki-heritage-evening',
            summary: 'An evening of Saraiki language, storytelling, and student performances.',
            description: 'Join students for stories, language, and music.',
            startsAt: '2027-02-10T15:00:00.000Z',
            endsAt: '2027-02-10T18:00:00.000Z',
            venue: 'Leads University Auditorium',
            registrationCount: 0,
            registrationOpen: true,
            status: 'published',
          } },
      }),
    })));

    render(
      <MemoryRouter initialEntries={['/events/saraiki-heritage-evening']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: 'Saraiki Heritage Evening' });
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Ayesha Hussain' } });
    fireEvent.change(screen.getByLabelText('University email'), { target: { value: 'ayesha@leads.edu.pk' } });
    fireEvent.change(screen.getByLabelText('Student ID'), { target: { value: 'LU-SSC-1042' } });
    fireEvent.click(screen.getByLabelText('I agree that the council may use these details to manage my event registration.'));
    fireEvent.click(screen.getByRole('button', { name: 'Register for event' }));

    expect((await screen.findByRole('status')).textContent).toContain('Your place for Saraiki Heritage Evening is confirmed.');
  });

  it('submits a public enquiry and confirms durable receipt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ success: true, data: { id: 'contact-123', emailStatus: 'failed' } }),
    }));

    render(<MemoryRouter initialEntries={['/contact']}><App /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Ayesha Hussain' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ayesha@leads.edu.pk' } });
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Cultural collaboration' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'I would like to discuss a student language event.' } });
    fireEvent.click(screen.getByLabelText('I agree that the council may use my details to respond to this enquiry.'));
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    expect((await screen.findByRole('status')).textContent).toContain('added to the council inbox');
  });

  it('activates a member account from a secure email token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ success: true, data: { activated: true }, message: 'Member account activated.' }),
    }));

    render(<MemoryRouter initialEntries={['/member/setup?token=secure-one-time-token-value-123456789']}><App /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'A-Long-Member-Password-123!' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'A-Long-Member-Password-123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Activate account' }));

    expect((await screen.findByRole('status')).textContent).toContain('Your member access is active');
    expect(fetch).toHaveBeenCalledWith('/api/v1/membership/setup-account', expect.objectContaining({ method: 'POST' }));
  });
});
