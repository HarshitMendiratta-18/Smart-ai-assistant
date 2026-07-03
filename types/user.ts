export type UserRole = 'resident' | 'admin' | 'technician' | 'security';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'pending' | 'disabled';
  createdAt: string;
  updatedAt: string;
  
  // Role-specific fields
  unitNumber?: string;       // Resident (e.g., "Block A - 402")
  specialty?: string;        // Technician (e.g., "plumbing", "electrical")
  gateNumber?: string;       // Security Guard (e.g., "Gate 1")
  shift?: 'day' | 'night';   // Security Guard shift
}
