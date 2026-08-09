export interface Tenant {
  id?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  propertyId?: string;
  status?: string;
  monthlyRent?: number;
  moveInDate?: string;
  notes?: string;
  archived?: boolean;
}

export interface Property {
  id?: string;
  title: string;
  type?: string;
  address: string;
  city?: string;
  monthlyRent?: number;
  rooms?: number;
  surface?: number;
  status?: string;
  ownerId?: string;
  notes?: string;
  archived?: boolean;
}

export interface Contract {
  id?: string;
  tenantId: string;
  propertyId: string;
  startDate: string;
  endDate?: string;
  monthlyRent: number;
  deposit?: number;
  status?: string;
  paymentDay?: number;
  notes?: string;
  terminatedAt?: string;
}

export interface NotificationItem {
  id?: string;
  type: string;
  severity: 'info' | 'warning' | 'critical' | string;
  title: string;
  message: string;
  read?: boolean;
  entityId?: string;
  createdAt?: string;
}

export interface ValidationResult<T> {
  valid: boolean;
  errors: string[];
  value: T;
}
