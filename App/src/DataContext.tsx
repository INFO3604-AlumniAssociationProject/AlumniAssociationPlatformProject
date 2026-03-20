import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuthToken, useAuth } from './AuthContext';
import UWILogo from './assets/UWILogo.jpg';
// default cover used when nothing else is available
const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';


export interface Application {
  id: string;
  jobId: string;
  applicantId: string;
  applicantName: string;
  resumeUrl: string;
  coverLetter: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  posted: string;
  description: string;
  applied: boolean;
  communityId?: string;
  status: 'pending' | 'approved' | 'rejected';
  applicants?: Application[];
  postedBy?: string;
  applicationStatus?: 'pending' | 'approved' | 'rejected';
}

export interface Community {
  id: string;
  name: string;
  description: string;
  adminId: string;
  adminName: string;
  members: number;
  isMember?: boolean;
  image?: string;
}

export interface CommunityMember {
  userID: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  isAdmin: boolean;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  image: string;
  registered: boolean;
  communityId?: string;
  creatorId?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  sender: string;
  content: string;
  time: string;
  status: 'requested' | 'accepted' | 'read' | 'unread';
  avatar: string;
  online?: boolean;
  preview?: string;
  unread?: boolean;
}

export interface MessageRequest {
  id: string;
  name: string;
  role: string;
  avatar: string;
  message: string;
}

export interface UserProfile {
  name: string;
  email: string;
  bio: string;
  role: string;
  avatar: string;
  coverImage: string;
  isPrivate: boolean;
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
}

export interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
  likes: number;
  commentsCount: number;
  comments: Comment[];
  liked?: boolean;
  communityId?: string;
}

export interface Alumni {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  degree: string;
  year: string;
  location: string;
}

interface DataContextType {
  jobs: Job[];
  events: Event[];
  messages: Message[];
  messageRequests: MessageRequest[];
  userProfile: UserProfile;
  posts: Post[];
  alumni: Alumni[];
  communities: Community[];
  stats: {
    alumniCount: number;
    unreadCount: number;
    appliedJobsCount: number;
    registeredEventsCount: number;
    pendingJobsCount: number;
  };
  addJob: (job: Omit<Job, 'id' | 'applied' | 'status' | 'applicants'>) => void;
  toggleApplyJob: (id: string) => void;
  submitJobApplication: (jobId: string, application: Omit<Application, 'id' | 'date'>) => void;
  approveJob: (id: string) => void;
  rejectJob: (id: string) => void;
  approveApplication: (jobId: string, applicantId: string) => void;
  rejectApplication: (jobId: string, applicantId: string) => void;
  addEvent: (event: Omit<Event, 'id' | 'registered'>) => void;
  toggleRegisterEvent: (id: string) => void;
  cancelEvent: (eventId: string) => void;
  sendMessage: (chatId: string, content: string) => void;
  acceptMessageRequest: (id: string) => void;
  rejectMessageRequest: (id: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  addPost: (content: string, communityId?: string) => Promise<boolean>;
  toggleLikePost: (id: string) => Promise<boolean>;
  addComment: (postId: string, content: string) => Promise<boolean>;
  createCommunity: (name: string, description: string) => void;
  joinCommunity: (communityId: string) => Promise<boolean>;
  leaveCommunity: (communityId: string) => Promise<boolean>;
  getCommunityMembers: (communityId: string) => Promise<CommunityMember[]>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const viteApiUrl = ((import.meta as any).env?.VITE_API_URL as string | undefined) || 'http://localhost:5000';
const API_ROOT = viteApiUrl.replace(/\/$/, '');
const API_BASE = API_ROOT.endsWith('/api') ? API_ROOT : `${API_ROOT}/api`;

const toId = (value: unknown): string => String(value ?? '');

const authHeaders = (extra: HeadersInit = {}): HeadersInit => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}`, ...extra } : extra;
};

const formatTo12Hour = (timeValue: string): string => {
  const parsed = new Date(`1970-01-01T${timeValue}`);
  if (Number.isNaN(parsed.getTime())) return timeValue;
  return parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const to24HourTime = (timeValue: string): string => {
  const value = (timeValue || '').trim();
  if (!value) return '09:00';
  if (/^\d{2}:\d{2}$/.test(value)) return value;

  const twelveHour = value.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (twelveHour) {
    let hour = Number.parseInt(twelveHour[1], 10) % 12;
    if (twelveHour[3].toUpperCase() === 'PM') hour += 12;
    return `${String(hour).padStart(2, '0')}:${twelveHour[2]}`;
  }

  const parsed = new Date(`1970-01-01 ${value}`);
  if (!Number.isNaN(parsed.getTime())) return parsed.toTimeString().slice(0, 5);
  return '09:00';
};

const normalizeMessageStatus = (status: string): Message['status'] => {
  if (status === 'requested') return 'requested';
  if (status === 'accepted') return 'accepted';
  if (status === 'read') return 'read';
  return 'unread';
};

const deriveJobType = (job: any): Job['type'] => {
  const location = String(job.location || '').toLowerCase();
  const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();
  if (location.includes('remote') || text.includes('remote')) return 'Remote';
  if (text.includes('part-time') || text.includes('part time')) return 'Part-time';
  if (text.includes('contract')) return 'Contract';
  return 'Full-time';
};

const deriveEventCategory = (event: any): Event['category'] => {
  const text = `${event.title || ''} ${event.description || ''}`.toLowerCase();
  if (text.includes('network') || text.includes('mixer') || text.includes('connect')) return 'Networking';
  if (text.includes('career') || text.includes('job') || text.includes('panel')) return 'Career';
  if (text.includes('tech') || text.includes('devops') || text.includes('cyber') || text.includes('ai')) return 'Technology';
  return 'Social';
};

const transformJob = (job: any): Job => ({
  id: toId(job.jobID),
  title: job.title,
  company: job.company,
  location: job.location || '',
  salary: job.salaryRange || '',
  type: deriveJobType(job),
  posted: new Date(job.postedDate).toLocaleDateString(),
  description: job.description,
  applied: false,
  communityId: job.boardID ? toId(job.boardID) : undefined,
  status: job.status === 'open' ? 'approved' : 'pending',
  applicants: [],
  postedBy: job.alumniID ? toId(job.alumniID) : 'admin',
});


// helper that produces a simple inline SVG as a data URI. this keeps the
// app completely self‑contained (no external network requests) and still
// gives every event a visually distinct cover based on its title and
// category. colors are chosen per category for variety.
const generateEventImage = (event: any): string => {
  const title = (event.title || event.category || 'Event').replace(/&/g, '&amp;');
  const category = event.category || 'Other';
  const colors: Record<string, string> = {
    Networking: '#1E90FF',
    Career: '#28a745',
    Social: '#ff7f50',
    Technology: '#6f42c1',
  };
  const bg = colors[category] || '#777777';
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400">
  <rect width="100%" height="100%" fill="${bg}" />
  <text x="50%" y="50%" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="36" text-anchor="middle" dominant-baseline="middle">
    ${title}
  </text>
</svg>`;
  // encode as percent‑escaped URI component to avoid base64 complexity
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml;charset=UTF-8,${encoded}`;
};

const transformEvent = (event: any): Event => ({
  id: toId(event.eventID),
  title: event.title,
  date: new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  time: event.time12 || formatTo12Hour(event.time),
  location: event.location,
  category: deriveEventCategory(event),
  // generate the cover image dynamically instead of hard‑coding one URL
  image: generateEventImage(event),
  registered: false,
  communityId: event.boardID ? toId(event.boardID) : undefined,
  creatorId: event.alumniID ? toId(event.alumniID) : undefined,
});

const emptyProfile: UserProfile = {
  name: '',
  email: '',
  bio: '',
  role: '',
  avatar: '',
  coverImage: '',
  isPrivate: false,
};

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageRequests, setMessageRequests] = useState<MessageRequest[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);

  const fetchJobs = async () => {
    const res = await fetch(`${API_BASE}/jobs/list/all`, { headers: authHeaders() });
    if (!res.ok) {
      setJobs([]);
      return;
    }
    const data = await res.json();
    setJobs((data.jobs || []).map(transformJob));
  };

  const fetchAppliedJobs = async () => {
    const res = await fetch(`${API_BASE}/jobs/applied/me`, { headers: authHeaders() });
    if (!res.ok) return;

    const data = await res.json();
    const appliedIds = new Set<string>((data.jobIDs || []).map((jobId: string) => toId(jobId)));
    const statusByJobId = new Map<string, string>(
      (data.applications || []).map((application: any) => [toId(application.jobID), String(application.status || 'pending')]),
    );

    setJobs((prev) =>
      prev.map((job) => {
        const applied = appliedIds.has(toId(job.id));
        const rawStatus = statusByJobId.get(toId(job.id));
        const applicationStatus =
          rawStatus === 'approved' || rawStatus === 'rejected' ? rawStatus : applied ? 'pending' : undefined;
        return { ...job, applied, applicationStatus };
      }),
    );
  };

  const fetchEvents = async () => {
    const res = await fetch(`${API_BASE}/events/list/all`, { headers: authHeaders() });
    if (!res.ok) {
      setEvents([]);
      return;
    }
    const data = await res.json();
    setEvents((data.events || []).map(transformEvent));
  };

  const fetchRegisteredEvents = async () => {
    const res = await fetch(`${API_BASE}/events/registrations/me`, { headers: authHeaders() });
    if (!res.ok) return;

    const data = await res.json();
    const registeredIds = new Set<string>((data.eventIDs || []).map((eventId: string) => toId(eventId)));
    setEvents((prev) => prev.map((event) => ({ ...event, registered: registeredIds.has(toId(event.id)) })));
  };

  const fetchMessages = async () => {
    const res = await fetch(`${API_BASE}/messages/inbox`, { headers: authHeaders() });
    if (!res.ok) {
      setMessages([]);
      return;
    }
    const data = await res.json();
    const transformed = (data.messages || []).map((message: any) => ({
      id: toId(message.messageID),
      senderId: toId(message.senderID),
      receiverId: toId(message.receiverID),
      sender: message.senderName || toId(message.senderID),
      content: message.content,
      time: new Date(message.timestamp).toLocaleTimeString(),
      status: normalizeMessageStatus(message.status),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(message.senderName || 'User')}&background=random`,
      online: false,
      preview: message.content,
      unread: message.status === 'requested' || message.status === 'sent' || message.status === 'unread',
    }));
    setMessages(transformed);
  };

  const fetchMessageRequests = async () => {
    const res = await fetch(`${API_BASE}/messages/inbox`, { headers: authHeaders() });
    if (!res.ok) {
      setMessageRequests([]);
      return;
    }
    const data = await res.json();
    const requests = (data.messages || [])
      .filter((message: any) => message.status === 'requested')
      .map((message: any) => ({
        id: toId(message.messageID),
        name: message.senderName || toId(message.senderID),
        role: message.senderRole || 'alumni',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(message.senderName || 'User')}&background=random`,
        message: message.content,
      }));
    setMessageRequests(requests);
  };

  // local fallback cover (UWI logo) - import at top of file
  const fetchUserProfile = async () => {
    const res = await fetch(`${API_BASE}/profiles/me/data`, { headers: authHeaders() });
    // keep whatever cover is already in state (perhaps user just changed it). also
    // check localStorage so the chosen cover survives a full reload.
    const storedCover = typeof localStorage !== 'undefined' ? localStorage.getItem('coverImage') : null;
    const existingCover = userProfile?.coverImage || storedCover || DEFAULT_COVER;

    if (!res.ok) {
      if (user) {
        setUserProfile({
          name: user.name,
          email: user.email,
          bio: '',
          role: user.role,
          avatar:
            user.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`,
          coverImage: existingCover,
        });
      }
      return;
    }
    const data = await res.json();
    setUserProfile({
      name: data.user.name,
      email: data.user.email,
      bio: data.profile.bio || '',
      role: data.user.role,
      avatar: data.profile.profilePicture || `https://ui-avatars.com/api/?name=${data.user.name}&background=0D8ABC&color=fff`,
      coverImage: data.profile.coverPhoto || existingCover,
    });
  };

  const fetchAlumni = async () => {
    const res = await fetch(`${API_BASE}/alumni/search`, { headers: authHeaders() });
    if (!res.ok) {
      setAlumni([]);
      return;
    }
    const data = await res.json();
    const transformed = (data.results || []).map((record: any) => ({
      id: toId(record.alumniID),
      name: record.name,
      role: record.currentJobTitle || '',
      company: record.company || '',
      avatar: `https://ui-avatars.com/api/?name=${record.name}&background=random`,
      degree: record.degree || '',
      year: record.graduationYear?.toString() || '',
      location: '',
    }));
    setAlumni(transformed);
  };

  const fetchCommunities = async () => {
    const res = await fetch(`${API_BASE}/boards`, { headers: authHeaders() });
    if (!res.ok) {
      setCommunities([]);
      return;
    }
    const data = await res.json();
    const transformed = (data.boards || []).map((board: any) => ({
      id: toId(board.boardID),
      name: board.name,
      description: board.description,
      adminId: toId(board.alumniID),
      adminName: board.adminName || 'Community Admin',
      members: Number(board.members || 0),
      isMember: Boolean(board.isMember),
    }));
    setCommunities(transformed);
  };

  const fetchPosts = async () => {
    const res = await fetch(`${API_BASE}/boards/posts/all`, { headers: authHeaders() });
    if (!res.ok) {
      setPosts([]);
      return;
    }

    const data = await res.json();
    const transformed = (data.posts || []).map((post: any) => ({
      id: toId(post.postID),
      author: post.authorName || 'Unknown User',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName || 'User')}&background=random`,
      content: post.content,
      time: new Date(post.postedDate).toLocaleString(),
      likes: Number(post.likesCount || 0),
      commentsCount: Number(post.commentsCount || 0),
      comments: (post.comments || []).map((comment: any) => ({
        id: toId(comment.commentID),
        author: comment.authorName || 'Unknown User',
        avatar:
          comment.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName || 'User')}&background=random`,
        content: comment.content || '',
        time: comment.time ? new Date(comment.time).toLocaleString() : '',
      })),
      liked: Boolean(post.likedBy?.includes?.(toId(user?.id))),
      communityId: toId(post.boardID),
    }));
    setPosts(transformed);
  };

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      try {
        await Promise.all([
          fetchJobs(),
          fetchEvents(),
          fetchMessages(),
          fetchMessageRequests(),
          fetchUserProfile(),
          fetchAlumni(),
          fetchCommunities(),
          fetchPosts(),
        ]);
        await Promise.all([fetchAppliedJobs(), fetchRegisteredEvents()]);
      } catch (error) {
        console.error('Failed to fetch data', error);
      }
    };

    fetchAll();

    const intervalId = window.setInterval(() => {
      fetchAll();
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [user?.id]);

  const addJob = async (job: Omit<Job, 'id' | 'applied' | 'status' | 'applicants'>) => {
    const boardID = job.communityId || communities[0]?.id;
    if (!boardID) return;

    const response = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        boardID: toId(boardID),
        title: job.title,
        company: job.company,
        description: `[${job.type}] ${job.description}`,
        salaryRange: job.salary,
        location: job.location,
        expiryDate: '2026-12-31',
      }),
    });
    if (response.ok) fetchJobs();
  };

  const submitJobApplication = async (jobId: string, application: Omit<Application, 'id' | 'date'>) => {
    const payload = { coverLetter: application.coverLetter };
    let response = await fetch(`${API_BASE}/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });

    if (response.status === 404) {
      response = await fetch(`${API_BASE}/alumni/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });
    }

    if (response.ok) {
      setJobs((prev) =>
        prev.map((job) => (toId(job.id) === toId(jobId) ? { ...job, applied: true, applicationStatus: 'pending' } : job)),
      );
      fetchAppliedJobs();
    }
  };

  const addEvent = async (event: Omit<Event, 'id' | 'registered'>) => {
    const boardID = event.communityId || communities[0]?.id;
    if (!boardID) return;

    const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(event.date)
      ? event.date
      : (() => {
          const parsed = new Date(event.date);
          return Number.isNaN(parsed.getTime()) ? new Date().toISOString().slice(0, 10) : parsed.toISOString().slice(0, 10);
        })();
    const normalizedTime = to24HourTime(event.time);

    const response = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        title: event.title,
        description: `${event.category || 'Community'} event`,
        date: normalizedDate,
        time: normalizedTime,
        location: event.location,
        maxAttendees: 100,
        boardID: toId(boardID),
      }),
    });
    if (response.ok) {
      await fetchEvents();
      await fetchRegisteredEvents();
    }
  };

  const toggleRegisterEvent = async (id: string) => {
    if (!user) return;
    const current = events.find((event) => toId(event.id) === toId(id));
    if (!current) return;

    const endpoint = current.registered ? 'unregister-attendee' : 'register-attendee';
    const response = await fetch(`${API_BASE}/events/${id}/${endpoint}`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ attendeeID: user.id }),
    });

    if (response.ok) {
      setEvents((prev) =>
        prev.map((event) =>
          toId(event.id) === toId(id) ? { ...event, registered: !current.registered } : event,
        ),
      );
    }
  };

  const cancelEvent = async (eventId: string) => {
    const response = await fetch(`${API_BASE}/events/${eventId}/cancel`, { method: 'POST', headers: authHeaders() });
    if (response.ok) {
      setEvents((prev) => prev.filter((event) => toId(event.id) !== toId(eventId)));
    }
  };

  const sendMessage = async (chatId: string, content: string) => {
    const response = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ receiverID: toId(chatId), content }),
    });
    if (response.ok) fetchMessages();
  };

  const acceptMessageRequest = async (id: string) => {
    const response = await fetch(`${API_BASE}/messages/${id}/accept`, { method: 'POST', headers: authHeaders() });
    if (response.ok) {
      setMessageRequests((prev) => prev.filter((request) => toId(request.id) !== toId(id)));
      setMessages((prev) =>
        prev.map((message) =>
          toId(message.id) === toId(id) ? { ...message, status: 'accepted', unread: false } : message,
        ),
      );
    }
  };

  const rejectMessageRequest = async (id: string) => {
    const response = await fetch(`${API_BASE}/messages/${id}/reject`, { method: 'POST', headers: authHeaders() });
    if (response.ok) {
      setMessageRequests((prev) => prev.filter((request) => toId(request.id) !== toId(id)));
      setMessages((prev) =>
        prev.map((message) =>
          toId(message.id) === toId(id) ? { ...message, status: 'read', unread: false } : message,
        ),
      );
    }
  };

  const updateProfile = async (profile: Partial<UserProfile>) => {
    // merge locally right away so the UI reflects changes even if network
    // calls take a moment or fail. coverImage is client-only and not
    // persisted to the API, but we save it in localStorage so it survives
    // reloads.
    setUserProfile((prev) => {
      const updated = prev ? { ...prev, ...profile } : prev;
      if (profile.coverImage !== undefined && updated) {
        try {
          localStorage.setItem('coverImage', profile.coverImage);
        } catch {}
      }
      return updated;
    });

    // name/email updates go to /users/profile
    const userPayload: any = {};
    if (profile.name !== undefined) userPayload.name = profile.name;
    if (profile.email !== undefined) userPayload.email = profile.email;

    if (Object.keys(userPayload).length) {
      await fetch(`${API_BASE}/users/profile`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(userPayload),
      });
      // don't await fetchUserProfile here; we will refresh below once for all
    }

    // bio updates go to profile endpoint
    if (profile.bio !== undefined) {
      await fetch(`${API_BASE}/profiles/me/bio`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ bio: profile.bio }),
      });
    }

    // avatar changes use the photo upload endpoint
    if (profile.avatar !== undefined) {
      await fetch(`${API_BASE}/profiles/me/photo`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ profilePicture: profile.avatar }),
      });
    }

    // coverImage isn't stored server-side, skip

    // finally refresh from server to ensure consistency
    await fetchUserProfile();
  };

  const createCommunity = async (name: string, description: string) => {
    const response = await fetch(`${API_BASE}/boards`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name, description }),
    });
    if (response.ok) {
      const data = await response.json();
      setCommunities((prev) => [
        {
          id: toId(data.boardID),
          name,
          description,
          adminId: toId(user?.id),
          adminName: userProfile?.name || user?.name || 'Community Admin',
          members: 1,
          isMember: true,
        },
        ...prev,
      ]);
    }
  };

  const toggleApplyJob = (id: string) => {
    setJobs((prev) => prev.map((job) => (toId(job.id) === toId(id) ? { ...job, applied: !job.applied } : job)));
  };

  const approveJob = (id: string) => {
    setJobs((prev) => prev.map((job) => (toId(job.id) === toId(id) ? { ...job, status: 'approved' } : job)));
  };

  const rejectJob = (id: string) => {
    setJobs((prev) => prev.map((job) => (toId(job.id) === toId(id) ? { ...job, status: 'rejected' } : job)));
  };

  const approveApplication = (jobId: string, applicantId: string) => {
    setJobs((prev) =>
      prev.map((job) => {
        if (toId(job.id) !== toId(jobId) || !job.applicants) return job;
        return {
          ...job,
          applicants: job.applicants.map((application) =>
            toId(application.applicantId) === toId(applicantId)
              ? { ...application, status: 'approved' }
              : application,
          ),
        };
      }),
    );
  };

  const rejectApplication = (jobId: string, applicantId: string) => {
    setJobs((prev) =>
      prev.map((job) => {
        if (toId(job.id) !== toId(jobId) || !job.applicants) return job;
        return {
          ...job,
          applicants: job.applicants.map((application) =>
            toId(application.applicantId) === toId(applicantId)
              ? { ...application, status: 'rejected' }
              : application,
          ),
        };
      }),
    );
  };

  const addPost = async (content: string, communityId?: string): Promise<boolean> => {
    if (!communityId) return false;
    const authorName = userProfile?.name || user?.name || 'User';
    const avatar =
      userProfile?.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=0D8ABC&color=fff`;

    try {
      const response = await fetch(`${API_BASE}/boards/${communityId}/posts`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ content }),
      });
      if (!response.ok) return false;

      const data = await response.json();
      const created = data.post;
      const post: Post = {
        id: toId(created.postID),
        author: created.authorName || authorName,
        avatar,
        content: created.content,
        time: new Date(created.postedDate).toLocaleString(),
        likes: Number(created.likesCount || 0),
        commentsCount: Number(created.commentsCount || 0),
        comments: (created.comments || []).map((comment: any) => ({
          id: toId(comment.commentID),
          author: comment.authorName || 'Unknown User',
          avatar:
            comment.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName || 'User')}&background=random`,
          content: comment.content || '',
          time: comment.time ? new Date(comment.time).toLocaleString() : '',
        })),
        liked: Boolean(created.liked),
        communityId: toId(created.boardID),
      };
      setPosts((prev) => [post, ...prev]);
      return true;
    } catch {
      return false;
    }
  };

  const toggleLikePost = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/boards/posts/${id}/like`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!response.ok) return false;

      const data = await response.json();
      setPosts((prev) =>
        prev.map((post) =>
          toId(post.id) === toId(id)
            ? {
                ...post,
                liked: Boolean(data.liked),
                likes: Number(data.likesCount || 0),
              }
            : post,
        ),
      );
      return true;
    } catch {
      return false;
    }
  };

  const addComment = async (postId: string, content: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/boards/posts/${postId}/comments`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ content }),
      });
      if (!response.ok) return false;

      const data = await response.json();
      const comments = (data.comments || []).map((comment: any) => ({
        id: toId(comment.commentID),
        author: comment.authorName || 'Unknown User',
        avatar:
          comment.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName || 'User')}&background=random`,
        content: comment.content || '',
        time: comment.time ? new Date(comment.time).toLocaleString() : '',
      }));
      setPosts((prev) =>
        prev.map((post) =>
          toId(post.id) === toId(postId)
            ? { ...post, comments, commentsCount: Number(data.commentsCount || comments.length) }
            : post,
        ),
      );
      return true;
    } catch {
      return false;
    }
  };

  const joinCommunity = async (communityId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/boards/${communityId}/join`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (response.ok) {
        await fetchCommunities();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const leaveCommunity = async (communityId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/boards/${communityId}/leave`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (response.ok) {
        await fetchCommunities();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const getCommunityMembers = async (communityId: string): Promise<CommunityMember[]> => {
    try {
      const response = await fetch(`${API_BASE}/boards/${communityId}/members`, {
        headers: authHeaders(),
      });
      if (!response.ok) return [];
      const data = await response.json();
      return (data.members || []).map((member: any) => ({
        userID: toId(member.userID),
        name: member.name || 'Unknown User',
        email: member.email || '',
        role: member.role || 'alumni',
        avatar:
          member.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=random`,
        isAdmin: Boolean(member.isAdmin),
      }));
    } catch {
      return [];
    }
  };

  const stats = {
    alumniCount: alumni.length,
    unreadCount: messages.filter((message) => message.unread).length,
    appliedJobsCount: jobs.filter((job) => job.applied).length,
    registeredEventsCount: events.filter((event) => event.registered).length,
    pendingJobsCount: jobs.filter((job) => job.status === 'pending').length,
  };

  const value: DataContextType = {
    jobs,
    events,
    messages,
    messageRequests,
    userProfile: userProfile || emptyProfile,
    posts,
    stats,
    alumni,
    communities,
    addJob,
    toggleApplyJob,
    submitJobApplication,
    approveJob,
    rejectJob,
    approveApplication,
    rejectApplication,
    addEvent,
    toggleRegisterEvent,
    cancelEvent,
    sendMessage,
    acceptMessageRequest,
    rejectMessageRequest,
    updateProfile,
    addPost,
    toggleLikePost,
    addComment,
    createCommunity,
    joinCommunity,
    leaveCommunity,
    getCommunityMembers,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}