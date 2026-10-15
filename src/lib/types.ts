export type Link = { label: string; url: string };

export type Profile = {
  name: string;
  headline: string;
  tagline: string;
  roles: string[];
  location: string;
  email: string;
  photo: string;
  bio: string;
  availability: string;
  stats: { label: string; value: string }[];
  socials: Link[];
  cvUrl: string;
};

export type Experience = {
  id: string;
  role: string;
  org: string;
  location: string;
  start: string;
  end: string;
  summary: string;
  highlights: string[];
  tags: string[];
};

export type Education = {
  id: string;
  degree: string;
  school: string;
  location: string;
  start: string;
  end: string;
  details: string;
};

export type Project = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  category: string;
  year: string;
  status: string;
  cover: string;
  video: string;
  model3d: string;
  description: string;
  highlights: string[];
  tech: string[];
  links: Link[];
  featured: boolean;
  accent: string;
};

export type Publication = {
  id: string;
  title: string;
  venue: string;
  year: string;
  status: string;
  kind: string;
  authors: string;
  doi: string;
  url: string;
  summary: string;
  tags: string[];
};

export type Person = {
  id: string;
  name: string;
  role: string;
  org: string;
  photo: string;
  url: string;
  relation: string;
  group: string;
  since: string;
  note: string;
  consent: boolean;
};

export type Talk = {
  id: string;
  title: string;
  event: string;
  role: string;
  location: string;
  year: string;
  lat: number;
  lng: number;
  url: string;
};

export type SkillGroup = {
  id: string;
  name: string;
  items: string[];
};

export type HubTool = {
  id: string;
  name: string;
  kind: string;
  description: string;
  endpoint: string;
  status: string;
};

export type Leadership = {
  id: string;
  role: string;
  org: string;
  period: string;
};

export type SiteContent = {
  profile: Profile;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  publications: Publication[];
  people: Person[];
  talks: Talk[];
  skills: SkillGroup[];
  hub: HubTool[];
  leadership: Leadership[];
};

export type SectionKey = keyof SiteContent;
