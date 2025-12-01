export interface JwtResponse {
  access: string;
  refresh?: string;
}

export interface JwtPayload {
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  matricola: string;
  is_staff: boolean;
  is_superuser: boolean;
  exp: number;
  iat: number;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JwtPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}
