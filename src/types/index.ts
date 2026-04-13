export interface Service {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  features: string[];
  benefits: string[];
}

export interface Project {
  id: string;
  title: string;
  client: string;
  category: string;
  description: string;
  results: string[];
  year: number;
}

export interface TeamMember {
  id: string;
  name: string;
  position: string;
  bio: string;
  expertise: string[];
  image?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  author: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}
