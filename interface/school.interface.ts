export interface School {
  id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  logo?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateSchool {
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
}
