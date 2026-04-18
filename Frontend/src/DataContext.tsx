// File: src/DataContext.tsx

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { getAuthToken, useAuth } from './AuthContext';
import { API_BASE } from './apiConfig';
import UWILogo from './assets/UWILogo.jpg';

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

export interface JobTestimonial {
  id: string;
  name: string;
  avatar: string;
  stars: number;
  comment: string;
  timestamp: string;
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
  status: 'pending' | 'approved' | 'rejected' | 'closed';
  applicants?: Application[];
  postedBy?: string;
  applicationStatus?: 'pending' | 'approved' | 'rejected';
  saved?: boolean;
  testimonials?: JobTestimonial[];
  expiryDate?: string;
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
  status?: 'pending' | 'approved' | 'cancelled';
  description?: string;
  faculty?: string;
  department?: string;
  hostClub?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  sender: string;
  content: string;
  time: string;
  rawTimestamp?: string;
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
  skills?: string[];
  experience?: {
    id: string;
    title: string;
    company: string;
    duration: string;
    description?: string;
  }[];
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
  likedBy: string[];
  commentsCount: number;
  comments: Comment[];
  liked?: boolean;
  communityId?: string;
  isAnnouncement?: boolean;
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
  isPublicProfile: boolean;
}

export interface Announcement extends Post {
  isAnnouncement: true;
  sentAsMessage: boolean;
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
  announcements: Announcement[];
  stats: {
    alumniCount: number;
    unreadCount: number;
    appliedJobsCount: number;
    registeredEventsCount: number;
    pendingJobsCount: number;
  };
  addJob: (job: Omit<Job, 'id' | 'applied' | 'status' | 'applicants'>) => Promise<boolean>;
  toggleApplyJob: (id: string) => void;
  submitJobApplication: (jobId: string, application: Omit<Application, 'id' | 'date' | 'status'>) => Promise<void>;
  approveJob: (id: string) => Promise<boolean>;
  rejectJob: (id: string) => Promise<boolean>;
  saveJob: (id: string) => Promise<boolean>;
  addTestimonial: (jobId: string, testimonial: Omit<JobTestimonial, 'id' | 'timestamp'>) => void;
  deleteTestimonial: (jobId: string, testimonialId: string) => void;
  approveApplication: (jobId: string, applicantId: string) => Promise<boolean>;
  rejectApplication: (jobId: string, applicantId: string) => Promise<boolean>;
  updateApplicationStatus?: (applicationId: string, status: 'approved' | 'rejected') => Promise<boolean>;
  fetchJobApplications?: (jobId: string) => Promise<Application[]>;
  fetchAndSetJobApplications?: (jobId: string) => Promise<void>;
  withdrawApplication?: (applicationId: string) => Promise<boolean>;
  getApplicationId?: (jobId: string, applicantId: string) => string | null;
  addEvent: (event: Omit<Event, 'id' | 'registered'>) => Promise<boolean>;
  toggleRegisterEvent: (id: string) => void;
  cancelEvent: (eventId: string) => void;
  reopenEvent?: (eventId: string) => Promise<boolean>;
  sendMessage: (chatId: string, content: string) => Promise<void>;
  acceptMessageRequest: (id: string) => Promise<void>;
  rejectMessageRequest: (id: string) => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  addPost: (content: string, communityId?: string) => Promise<boolean>;
  toggleLikePost: (id: string) => Promise<boolean>;
  addComment: (postId: string, content: string) => Promise<boolean>;
  deletePost?: (postId: string) => Promise<boolean>;
  updatePost?: (postId: string, content: string) => Promise<boolean>;
  createCommunity: (name: string, description: string) => Promise<void>;
  joinCommunity: (communityId: string) => Promise<boolean>;
  leaveCommunity: (communityId: string) => Promise<boolean>;
  getCommunityMembers: (communityId: string) => Promise<CommunityMember[]>;
  addAnnouncement: (content: string, adminName: string, adminAvatar: string) => Promise<void>;
  reportUser: (reportedUserId: string, reportedUserName: string, reason: string, details?: string) => Promise<void>;
  suspendUser: (userId: string, reason: string, durationDays: number) => Promise<boolean>;
  banUser: (userId: string, reason: string) => Promise<boolean>;
  loading?: {
    savingJob?: boolean;
    sendingMessage?: boolean;
    approvingApplication?: boolean;
    rejectingApplication?: boolean;
    approvingJob?: boolean;
    rejectingJob?: boolean;
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

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

const normalizeJobStatus = (status: string): Job['status'] => {
  if (status === 'open' || status === 'approved') return 'approved';
  if (status === 'pending' || status === 'pending_vote') return 'pending';
  if (status === 'closed') return 'closed';
  return 'rejected';
};

const normalizeEventStatus = (status: string): Event['status'] => {
  if (status === 'active' || status === 'approved') return 'approved';
  if (status === 'pending' || status === 'pending_vote') return 'pending';
  return 'cancelled';
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
  status: normalizeJobStatus(String(job.status || 'open')),
  applicants: [],
  postedBy: job.alumniID ? toId(job.alumniID) : 'admin',
  saved: Boolean(job.saved),
  testimonials: job.testimonials || [],
  expiryDate: job.expiryDate || '2026-12-31',
});

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
  const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');
  return `data:image/svg+xml;charset=UTF-8,${encoded}`;
};

const transformEvent = (event: any): Event => ({
  id: toId(event.eventID),
  title: event.title,
  date: new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  time: event.time12 || formatTo12Hour(event.time),
  location: event.location,
  category: deriveEventCategory(event),
  image: generateEventImage(event),
  registered: false,
  communityId: event.boardID ? toId(event.boardID) : undefined,
  creatorId: event.alumniID ? toId(event.alumniID) : undefined,
  status: normalizeEventStatus(String(event.status || 'active')),
  description: event.description || '',
  faculty: event.faculty || 'General',
  department: event.department || 'All Departments',
  hostClub: event.hostClub || 'UWI Alumni Association',
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

type LoadingState = {
  savingJob?: boolean;
  sendingMessage?: boolean;
  approvingApplication?: boolean;
  rejectingApplication?: boolean;
  approvingJob?: boolean;
  rejectingJob?: boolean;
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<LoadingState>({});

  const fetchedJobsCache = useRef<Set<string>>(new Set());

  const getAdminId = () => {
    const admin = alumni.find(a => a.role === 'admin');
    return admin?.id || 'admin-system';
  };

  const sendSystemMessage = async (receiverId: string, content: string) => {
    try {
      await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ receiverID: toId(receiverId), content: `📢 ${content}` }),
      });
      setTimeout(() => fetchMessages(), 500);
    } catch {
      // Ignore errors
    }
  };

  const fetchJobs = async () => {
    const res = await fetch(`${API_BASE}/jobs/list?limit=500`, { headers: authHeaders() });
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
    const apps = data.applications || [];
    const appliedIds = new Set<string>(apps.map((a: any) => toId(a.jobID)));
    const statusByJobId = new Map<string, string>(apps.map((application: any) => [toId(application.jobID), String(application.status || 'pending')]));
    setJobs((prev) =>
      prev.map((job) => {
        const applied = appliedIds.has(toId(job.id));
        const rawStatus = statusByJobId.get(toId(job.id));
        const applicationStatus = rawStatus === 'approved' || rawStatus === 'rejected' ? rawStatus : applied ? 'pending' : undefined;
        return { ...job, applied, applicationStatus };
      }),
    );
  };

  const fetchEvents = async () => {
    const res = await fetch(`${API_BASE}/events/list?limit=500`, { headers: authHeaders() });
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
    const [inboxRes, sentRes] = await Promise.all([
      fetch(`${API_BASE}/messages/inbox`, { headers: authHeaders() }),
      fetch(`${API_BASE}/messages/sent`, { headers: authHeaders() }),
    ]);
    if (!inboxRes.ok && !sentRes.ok) {
      setMessages([]);
      return;
    }
    const inboxData = inboxRes.ok ? await inboxRes.json().catch(() => ({})) : {};
    const sentData = sentRes.ok ? await sentRes.json().catch(() => ({})) : {};
    const merged = [...(inboxData.messages || []), ...(sentData.messages || [])];
    const seen = new Set<string>();
    const transformed = merged
      .filter((message: any) => {
        const id = toId(message.messageID);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((message: any) => {
        const isMine = toId(message.senderID) === toId(user?.id);
        const counterpartName = isMine ? (message.receiverName || toId(message.receiverID)) : (message.senderName || toId(message.senderID));
        return {
          id: toId(message.messageID),
          senderId: toId(message.senderID),
          receiverId: toId(message.receiverID),
          sender: counterpartName,
          content: message.content,
          time: new Date(message.timestamp).toLocaleTimeString(),
          rawTimestamp: message.timestamp,
          status: normalizeMessageStatus(message.status),
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(counterpartName || 'User')}&background=random`,
          online: false,
          preview: message.content,
          unread: !isMine && (message.status === 'requested' || message.status === 'sent' || message.status === 'unread'),
        };
      })
      .sort((a, b) => new Date(b.rawTimestamp || b.time).getTime() - new Date(a.rawTimestamp || a.time).getTime());
    setMessages(transformed);
  };

  const fetchMessageRequests = async () => {
    const res = await fetch(`${API_BASE}/messages/requests`, { headers: authHeaders() });
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

  const fetchUserProfile = async () => {
    const res = await fetch(`${API_BASE}/profiles/me/data`, { headers: authHeaders() });
    const storedCover = typeof localStorage !== 'undefined' ? localStorage.getItem('coverImage') : null;
    const existingCover = userProfile?.coverImage || storedCover || DEFAULT_COVER;
    const existingPrivacy = userProfile?.isPrivate || false;
    const storedSkills = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('skills') || '[]') : [];
    const storedExperience = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('experience') || '[]') : [];

    if (!res.ok) {
      if (user) {
        setUserProfile({
          name: user.name,
          email: user.email,
          bio: '',
          role: user.role,
          avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`,
          coverImage: existingCover,
          isPrivate: existingPrivacy,
          skills: storedSkills,
          experience: storedExperience,
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
      isPrivate: String(data.profile.profileVisibility || 'public').toLowerCase() === 'private',
      skills: storedSkills,
      experience: storedExperience,
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
      location: record.location || '',
      isPublicProfile: record.isPublicProfile ?? true,
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
    const res = await fetch(`${API_BASE}/boardposts/all`, { headers: authHeaders() });
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
      likedBy: (post.likedBy || []).map((value: unknown) => toId(value)),
      commentsCount: Number(post.commentsCount || 0),
      comments: (post.comments || []).map((comment: any) => ({
        id: toId(comment.commentID),
        author: comment.authorName || 'Unknown User',
        avatar: comment.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName || 'User')}&background=random`,
        content: comment.content || '',
        time: comment.time ? new Date(comment.time).toLocaleString() : '',
      })),
      liked: Boolean((post.likedBy || []).map((value: unknown) => toId(value)).includes(toId(user?.id))),
      communityId: toId(post.boardID),
      isAnnouncement: false,
    }));
    setPosts(transformed);
  };

  const allPosts = [...announcements, ...posts].sort((a, b) => {
    const timeA = a.isAnnouncement ? new Date().getTime() : new Date(a.time).getTime();
    const timeB = b.isAnnouncement ? new Date().getTime() : new Date(b.time).getTime();
    return timeB - timeA;
  });

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
  }, [user?.id]);

  const addJob = async (job: Omit<Job, 'id' | 'applied' | 'status' | 'applicants'>): Promise<boolean> => {
    const boardID = job.communityId || communities[0]?.id;
    if (!boardID) return false;
    const useBoardPollEndpoint = Boolean(job.communityId);
    const endpoint = useBoardPollEndpoint ? `${API_BASE}/boards/${toId(boardID)}/jobs` : `${API_BASE}/jobs`;

    const expiryDate = job.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        title: job.title,
        company: job.company,
        description: `[${job.type}] ${job.description}`,
        salaryRange: job.salary,
        location: job.location,
        expiryDate,
        ...(useBoardPollEndpoint ? {} : { boardID: toId(boardID) }),
      }),
    });
    if (!response.ok) return false;
    await fetchJobs();
    if (user) {
      sendSystemMessage(user.id, `Your job posting "${job.title}" has been submitted and is pending admin approval.`);
    }
    return true;
  };

  const submitJobApplication = async (jobId: string, application: Omit<Application, 'id' | 'date' | 'status'>) => {
    try {
      const payload: any = {
        jobID: toId(jobId),
        coverLetter: application.coverLetter,
        resumeUrl: application.resumeUrl,
      };
      if (application.applicantName) payload.applicantName = application.applicantName;

      const response = await fetch(`${API_BASE}/applications`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const newApplication: Application = {
          id: toId(data.application?.applicationID || data.applicationID || `app-${Date.now()}`),
          jobId: toId(jobId),
          applicantId: user?.id || 'current-user',
          applicantName: application.applicantName,
          resumeUrl: application.resumeUrl,
          coverLetter: application.coverLetter,
          date: new Date().toLocaleDateString(),
          status: 'pending',
        };

        setJobs((prev) =>
          prev.map((job) => {
            if (toId(job.id) === toId(jobId)) {
              const existingApplicants = job.applicants || [];
              return {
                ...job,
                applied: true,
                applicationStatus: 'pending',
                applicants: [...existingApplicants, newApplication],
              };
            }
            return job;
          }),
        );
        await fetchAppliedJobs();
        await fetchAndSetJobApplications(jobId);
        const jobTitle = jobs.find(j => toId(j.id) === toId(jobId))?.title || 'the position';
        if (user) {
          sendSystemMessage(user.id, `Your application for "${jobTitle}" has been submitted successfully.`);
        }
      }
    } catch (err) {
      // silent failure; caller shows toast
    }
  };

  const addEvent = async (event: Omit<Event, 'id' | 'registered'>): Promise<boolean> => {
    const boardID = event.communityId || communities[0]?.id;
    if (!boardID) return false;
    const useBoardPollEndpoint = Boolean(event.communityId);
    const endpoint = useBoardPollEndpoint ? `${API_BASE}/boards/${toId(boardID)}/events` : `${API_BASE}/events`;

    const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(event.date)
      ? event.date
      : (() => {
          const parsed = new Date(event.date);
          return Number.isNaN(parsed.getTime()) ? new Date().toISOString().slice(0, 10) : parsed.toISOString().slice(0, 10);
        })();
    const normalizedTime = to24HourTime(event.time);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        title: event.title,
        description: `${event.category || 'Community'} event`,
        date: normalizedDate,
        time: normalizedTime,
        location: event.location,
        maxAttendees: 100,
        ...(useBoardPollEndpoint ? {} : { boardID: toId(boardID) }),
      }),
    });
    if (!response.ok) return false;
    await fetchEvents();
    await fetchRegisteredEvents();
    if (user) {
      sendSystemMessage(user.id, `Your event "${event.title}" has been created successfully.`);
    }
    return true;
  };

  const toggleRegisterEvent = async (id: string) => {
    if (!user) return;
    const current = events.find((event) => toId(event.id) === toId(id));
    if (!current) return;

    const endpoint = current.registered ? 'unregister' : 'register';
    const response = await fetch(`${API_BASE}/events/${id}/${endpoint}`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
    });

    if (response.ok) {
      setEvents((prev) =>
        prev.map((event) =>
          toId(event.id) === toId(id) ? { ...event, registered: !current.registered } : event,
        ),
      );
      if (!current.registered) {
        sendSystemMessage(user.id, `You have successfully registered for "${current.title}".`);
      }
    }
  };

  const fetchJobApplications = async (jobId: string): Promise<Application[]> => {
    try {
      const res = await fetch(`${API_BASE}/jobs/${jobId}/applications`, { headers: authHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      const apps = (data.applications || []).map((a: any) => ({
        id: toId(a.applicationID || a.id || a.applicationId),
        jobId: toId(a.jobID || a.jobId),
        applicantId: toId(a.applicantID || a.applicantId || a.userID),
        applicantName: a.applicantName || a.name || '',
        resumeUrl: a.resumeUrl || a.resume || '',
        coverLetter: a.coverLetter || a.cover_letter || '',
        date: a.date || a.createdAt || a.timestamp || '',
        status: (a.status || 'pending') as 'pending' | 'approved' | 'rejected',
      }));
      return apps;
    } catch {
      return [];
    }
  };

  const fetchAndSetJobApplications = async (jobId: string) => {
    if (fetchedJobsCache.current.has(jobId)) return;
    fetchedJobsCache.current.add(jobId);
    const apps = await fetchJobApplications(jobId);
    if (!apps.length) return;
    setJobs((prev) => prev.map((job) => (toId(job.id) === toId(jobId) ? { ...job, applicants: apps } : job)));
  };

  const cancelEvent = async (eventId: string) => {
    const response = await fetch(`${API_BASE}/events/${eventId}/cancel`, { method: 'POST', headers: authHeaders() });
    if (response.ok) {
      setEvents((prev) => prev.filter((event) => toId(event.id) !== toId(eventId)));
    }
  };

  const reopenEvent = async (eventId: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/admin/events/${eventId}/manage`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ action: 'reopen' }),
      });
      if (!res.ok) return false;
      await fetchEvents();
      return true;
    } catch {
      return false;
    }
  };

  const sendMessage = async (chatId: string, content: string) => {
    setLoading((prev) => ({ ...prev, sendingMessage: true }));
    try {
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ receiverID: toId(chatId), content }),
      });
      if (response.ok) await fetchMessages();
    } finally {
      setLoading((prev) => ({ ...prev, sendingMessage: false }));
    }
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
    setUserProfile((prev) => {
      const updated = prev ? { ...prev, ...profile } : prev;
      if (profile.coverImage !== undefined && updated) {
        try { localStorage.setItem('coverImage', profile.coverImage); } catch {}
      }
      if (profile.skills !== undefined && updated) {
        try { localStorage.setItem('skills', JSON.stringify(profile.skills)); } catch {}
      }
      if (profile.experience !== undefined && updated) {
        try { localStorage.setItem('experience', JSON.stringify(profile.experience)); } catch {}
      }
      return updated;
    });

    const userPayload: any = {};
    if (profile.name !== undefined) userPayload.name = profile.name;
    if (profile.email !== undefined) userPayload.email = profile.email;

    if (Object.keys(userPayload).length) {
      await fetch(`${API_BASE}/users/profile`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(userPayload),
      });
    }

    if (profile.bio !== undefined || profile.isPrivate !== undefined) {
      await fetch(`${API_BASE}/profiles/me/bio`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          ...(profile.bio !== undefined ? { bio: profile.bio } : {}),
          ...(profile.isPrivate !== undefined ? { profileVisibility: profile.isPrivate ? 'private' : 'public' } : {}),
        }),
      });
    }

    if (profile.avatar !== undefined) {
      await fetch(`${API_BASE}/profiles/me/photo`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ profilePicture: profile.avatar }),
      });
    }

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
      if (user) {
        sendSystemMessage(user.id, `You have successfully created the community "${name}".`);
      }
    }
  };

  const toggleApplyJob = (id: string) => {
    setJobs((prev) => prev.map((job) => (toId(job.id) === toId(id) ? { ...job, applied: !job.applied } : job)));
  };

  const approveJob = async (id: string) => {
    setLoading((prev) => ({ ...prev, approvingJob: true }));
    try {
      const res = await fetch(`${API_BASE}/admin/moderate`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ type: 'job', id: toId(id), action: 'approve' }),
      });
      if (res.ok) {
        setJobs((prev) => prev.map((job) => (toId(job.id) === toId(id) ? { ...job, status: 'approved' } : job)));
        const job = jobs.find(j => toId(j.id) === toId(id));
        if (job?.postedBy) {
          sendSystemMessage(job.postedBy, `Your job posting "${job.title}" has been approved.`);
        }
        return true;
      }
      return false;
    } finally {
      setLoading((prev) => ({ ...prev, approvingJob: false }));
    }
  };

  const rejectJob = async (id: string) => {
    setLoading((prev) => ({ ...prev, rejectingJob: true }));
    try {
      const res = await fetch(`${API_BASE}/admin/moderate`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ type: 'job', id: toId(id), action: 'reject' }),
      });
      if (res.ok) {
        setJobs((prev) => prev.map((job) => (toId(job.id) === toId(id) ? { ...job, status: 'rejected' } : job)));
        return true;
      }
      return false;
    } finally {
      setLoading((prev) => ({ ...prev, rejectingJob: false }));
    }
  };

  const saveJob = async (id: string) => {
    setLoading((prev) => ({ ...prev, savingJob: true }));
    try {
      const res = await fetch(`${API_BASE}/jobs/${id}/save`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
      });
      if (!res.ok) return false;
      let data: any = {};
      try { data = await res.json(); } catch {}
      const serverSaved = data.saved;
      setJobs((prev) =>
        prev.map((job) =>
          toId(job.id) === toId(id) ? { ...job, saved: serverSaved !== undefined ? Boolean(serverSaved) : !job.saved } : job,
        ),
      );
      return true;
    } catch {
      return false;
    } finally {
      setLoading((prev) => ({ ...prev, savingJob: false }));
    }
  };

  const addTestimonial = (jobId: string, testimonial: Omit<JobTestimonial, 'id' | 'timestamp'>) => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}/testimonials`, {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ name: testimonial.name, avatar: testimonial.avatar, stars: testimonial.stars, comment: testimonial.comment }),
        });
        if (!res.ok) {
          setJobs((prev) => prev.map((job) => {
            if (toId(job.id) !== toId(jobId)) return job;
            const newTestimonial: JobTestimonial = {
              ...testimonial,
              id: Math.random().toString(36).substring(2, 9),
              timestamp: new Date().toISOString(),
            };
            return { ...job, testimonials: [newTestimonial, ...(job.testimonials || [])] };
          }));
          return;
        }
        const data = await res.json();
        const created = data.testimonial || data.created || data;
        const newTestimonial: JobTestimonial = {
          id: toId(created.testimonialID || created.id || Math.random().toString(36).substring(2, 9)),
          name: created.name || testimonial.name,
          avatar: created.avatar || testimonial.avatar,
          stars: Number(created.stars || testimonial.stars),
          comment: created.comment || testimonial.comment,
          timestamp: created.timestamp || new Date().toISOString(),
        };
        setJobs((prev) => prev.map((job) => (toId(job.id) === toId(jobId) ? { ...job, testimonials: [newTestimonial, ...(job.testimonials || [])] } : job)));
      } catch {
        setJobs((prev) => prev.map((job) => {
          if (toId(job.id) !== toId(jobId)) return job;
          const newTestimonial: JobTestimonial = {
            ...testimonial,
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toISOString(),
          };
          return { ...job, testimonials: [newTestimonial, ...(job.testimonials || [])] };
        }));
      }
    })();
  };

  const deleteTestimonial = (jobId: string, testimonialId: string) => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}/testimonials/${testimonialId}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (res.ok) {
          setJobs((prev) => prev.map((job) => {
            if (toId(job.id) !== toId(jobId)) return job;
            return { ...job, testimonials: (job.testimonials || []).filter(t => t.id !== testimonialId) };
          }));
        }
      } catch {
        setJobs((prev) => prev.map((job) => {
          if (toId(job.id) !== toId(jobId)) return job;
          return { ...job, testimonials: (job.testimonials || []).filter(t => t.id !== testimonialId) };
        }));
      }
    })();
  };

  const findApplicationId = (jobId: string, applicantId: string): string | null => {
    const job = jobs.find((j) => toId(j.id) === toId(jobId));
    if (!job || !job.applicants) return null;
    const app = job.applicants.find((a) => toId(a.applicantId) === toId(applicantId));
    return app ? toId(app.id) : null;
  };

  const updateApplicationStatus = async (applicationId: string, status: 'approved' | 'rejected'): Promise<boolean> => {
    setLoading((prev) => ({ ...prev, approvingApplication: status === 'approved', rejectingApplication: status === 'rejected' }));
    try {
      const res = await fetch(`${API_BASE}/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return false;
      setJobs((prev) =>
        prev.map((job) => ({
          ...job,
          applicants: job.applicants ? job.applicants.map((app) => (toId(app.id) === toId(applicationId) ? { ...app, status } : app)) : job.applicants,
        })),
      );
      return true;
    } finally {
      setLoading((prev) => ({ ...prev, approvingApplication: false, rejectingApplication: false }));
    }
  };

  const approveApplication = async (jobId: string, applicantId: string): Promise<boolean> => {
    const applicationId = findApplicationId(jobId, applicantId);
    if (!applicationId) {
      setJobs((prev) =>
        prev.map((job) => {
          if (toId(job.id) !== toId(jobId) || !job.applicants) return job;
          return {
            ...job,
            applicants: job.applicants.map((application) =>
              toId(application.applicantId) === toId(applicantId) ? { ...application, status: 'approved' } : application,
            ),
          };
        }),
      );
      return true;
    }
    return await updateApplicationStatus(applicationId, 'approved');
  };

  const rejectApplication = async (jobId: string, applicantId: string): Promise<boolean> => {
    const applicationId = findApplicationId(jobId, applicantId);
    if (!applicationId) {
      setJobs((prev) =>
        prev.map((job) => {
          if (toId(job.id) !== toId(jobId) || !job.applicants) return job;
          return {
            ...job,
            applicants: job.applicants.map((application) =>
              toId(application.applicantId) === toId(applicantId) ? { ...application, status: 'rejected' } : application,
            ),
          };
        }),
      );
      return true;
    }
    return await updateApplicationStatus(applicationId, 'rejected');
  };

  const addPost = async (content: string, communityId?: string): Promise<boolean> => {
    const targetCommunityId = communityId || communities[0]?.id;
    if (!targetCommunityId) return false;
    const authorName = userProfile?.name || user?.name || 'User';
    const avatar = userProfile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=0D8ABC&color=fff`;

    try {
      const response = await fetch(`${API_BASE}/boardposts`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ boardID: toId(targetCommunityId), content }),
      });
      if (!response.ok) return false;

      const data = await response.json();
      const created = data.post || data.created || data;
      const post: Post = {
        id: toId(created.postID),
        author: created.authorName || authorName,
        avatar,
        content: created.content,
        time: new Date(created.postedDate).toLocaleString(),
        likes: Number(created.likesCount || 0),
        likedBy: (created.likedBy || []).map((value: unknown) => toId(value)),
        commentsCount: Number(created.commentsCount || 0),
        comments: (created.comments || []).map((comment: any) => ({
          id: toId(comment.commentID),
          author: comment.authorName || 'Unknown User',
          avatar: comment.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName || 'User')}&background=random`,
          content: comment.content || '',
          time: comment.time ? new Date(comment.time).toLocaleString() : '',
        })),
        liked: Boolean(created.liked),
        communityId: toId(created.boardID),
        isAnnouncement: false,
      };
      setPosts((prev) => [post, ...prev]);
      return true;
    } catch {
      return false;
    }
  };

  const deletePost = async (postId: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/boardposts/${postId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) return false;
      setPosts((prev) => prev.filter((p) => toId(p.id) !== toId(postId)));
      return true;
    } catch {
      return false;
    }
  };

  const updatePost = async (postId: string, content: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/boardposts/${postId}`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ content }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      const updated = data.post || data.updated || data;
      setPosts((prev) => prev.map((p) => (toId(p.id) === toId(postId) ? { ...p, content: updated.content || content } : p)));
      return true;
    } catch {
      return false;
    }
  };

  const toggleLikePost = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/boardposts/${id}/like`, {
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
                likedBy: Array.isArray(data.likedBy) ? data.likedBy.map((v: any) => toId(v)) : data.liked ? [...(post.likedBy || []), toId(user?.id)] : (post.likedBy || []).filter((v) => toId(v) !== toId(user?.id)),
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
      const response = await fetch(`${API_BASE}/boardposts/${postId}/comments`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ content }),
      });
      if (!response.ok) return false;

      const data = await response.json();
      const comments = (data.comments || []).map((comment: any) => ({
        id: toId(comment.commentID),
        author: comment.authorName || 'Unknown User',
        avatar: comment.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName || 'User')}&background=random`,
        content: comment.content || '',
        time: comment.time ? new Date(comment.time).toLocaleString() : '',
      }));
      setPosts((prev) =>
        prev.map((post) =>
          toId(post.id) === toId(postId) ? { ...post, comments, commentsCount: Number(data.commentsCount || comments.length) } : post,
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
        if (user) {
          const community = communities.find(c => c.id === communityId);
          sendSystemMessage(user.id, `You have joined the community "${community?.name || communityId}".`);
        }
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
      const response = await fetch(`${API_BASE}/boards/${communityId}/members`, { headers: authHeaders() });
      if (!response.ok) return [];
      const data = await response.json();
      return (data.members || []).map((member: any) => ({
        userID: toId(member.userID),
        name: member.name || 'Unknown User',
        email: member.email || '',
        role: member.role || 'alumni',
        avatar: member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=random`,
        isAdmin: Boolean(member.isAdmin),
      }));
    } catch {
      return [];
    }
  };

  const addAnnouncement = async (content: string, adminName: string, adminAvatar: string) => {
    const newAnnouncement: Announcement = {
      id: `announcement-${Date.now()}`,
      author: adminName || 'UWI Admin',
      avatar: adminAvatar || `https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff`,
      content: `📢 ${content}`,
      time: new Date().toLocaleString(),
      likes: 0,
      likedBy: [],
      commentsCount: 0,
      comments: [],
      liked: false,
      communityId: undefined,
      isAnnouncement: true,
      sentAsMessage: false,
    };

    setAnnouncements((prev) => [newAnnouncement, ...prev]);

    const alumniList = alumni;
    const messagePromises = alumniList.map(async (recipient) => {
      try {
        await fetch(`${API_BASE}/messages`, {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ receiverID: toId(recipient.id), content: `📢 Announcement: ${content}` }),
        });
      } catch {}
    });

    Promise.all(messagePromises).then(() => {
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === newAnnouncement.id ? { ...a, sentAsMessage: true } : a))
      );
    });

    setTimeout(() => fetchMessages(), 1000);
  };

  const reportUser = async (reportedUserId: string, reportedUserName: string, reason: string, details?: string) => {
    const adminId = getAdminId();
    const reportContent = `🚨 User Report\nReported: ${reportedUserName} (ID: ${reportedUserId})\nReason: ${reason}\n${details ? `Details: ${details}` : ''}\nReported by: ${user?.name}`;
    await sendSystemMessage(adminId, reportContent);
  };

  const suspendUser = async (userId: string, reason: string, durationDays: number): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ reason, durationDays }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const banUser = async (userId: string, reason: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ reason }),
      });
      return res.ok;
    } catch {
      return false;
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
    posts: allPosts,
    stats,
    alumni,
    communities,
    announcements,
    addJob,
    toggleApplyJob,
    submitJobApplication,
    approveJob,
    rejectJob,
    saveJob,
    addTestimonial,
    deleteTestimonial,
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
    updateApplicationStatus,
    fetchJobApplications,
    fetchAndSetJobApplications,
    withdrawApplication: async (applicationId: string) => {
      try {
        const jobContaining = jobs.find((j) => (j.applicants || []).some((a) => toId(a.id) === toId(applicationId)));
        const res = await fetch(`${API_BASE}/applications/${applicationId}/withdraw`, {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
        });
        if (!res.ok) return false;
        setJobs((prev) => prev.map((job) => {
          if (!job.applicants) return job;
          return toId(job.id) === toId(jobContaining?.id)
            ? { ...job, applicants: job.applicants.filter((a) => toId(a.id) !== toId(applicationId)), applied: false }
            : job;
        }));
        return true;
      } catch {
        return false;
      }
    },
    getApplicationId: findApplicationId,
    deletePost,
    updatePost,
    reopenEvent,
    addAnnouncement,
    reportUser,
    suspendUser,
    banUser,
    loading,
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