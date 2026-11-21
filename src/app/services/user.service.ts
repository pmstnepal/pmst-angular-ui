import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface UserDto {
  id: string;
  cognitoId: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  coverPhotoUrl: string;
  title: string;
  organization: string;
  phones: string;
  websites: string;
  socials: string;
  addressCountry: string;
  addressState: string;
  addressCity: string;
  addressStreet: string;
  addressPostal: string;
  role: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUserByUsername(username: string): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiUrl}/username/${username}`);
  }

  getUserProfile(id: string): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiUrl}/${id}/profile`);
  }

  updateProfile(id: string, profile: Partial<UserDto>): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.apiUrl}/${id}/profile`, profile);
  }

  /**
   * Admin-only user list for the user-management screen.
   *
   * Matches `UserController.listUsers` (GET /users, admin-only), which
   * returns a Spring `Page<UserDto>` envelope (`content`, `totalElements`,
   * `totalPages`, `number`, `size`) sorted by email, not a flat array.
   * `page`/`size` map directly to the backend's `@RequestParam`s
   * (defaults: page=0, size=50).
   */
  listUsers(page = 0, size = 50): Observable<PageResponse<UserDto>> {
    return this.http.get<PageResponse<UserDto>>(this.apiUrl, { params: { page, size } });
  }

  /**
   * Matches `UserController.updateRole` (PATCH /users/{id}/role, admin-only).
   * The backend independently enforces admin-only and rejects self-role-change
   * with 400/403 — this call surfaces whatever it returns, it does not
   * duplicate that validation client-side.
   */
  updateRole(id: string, role: 'admin' | 'moderator' | 'user'): Observable<{ message: string; role: string }> {
    return this.http.patch<{ message: string; role: string }>(`${this.apiUrl}/${id}/role`, { role });
  }

  /**
   * Matches `UserController.updateStatus` (PATCH /users/{id}/status, admin-only).
   *
   * Reversible, and the preferred way to remove someone's access: the row
   * survives so their articles keep showing an author name. Enforcement is at
   * login — `UserSyncService.activeOnly()` refuses a non-active account, which
   * matters because the Cognito identity still exists and would otherwise
   * authenticate fine.
   */
  updateStatus(id: string, status: 'active' | 'deactivated'): Observable<{ message: string; status: string }> {
    return this.http.patch<{ message: string; status: string }>(`${this.apiUrl}/${id}/status`, { status });
  }

  /**
   * Matches `UserController.deleteUser` (DELETE /users/{id}, admin-only).
   *
   * Permanent. Content is NOT destroyed — articles, galleries and comments are
   * ON DELETE SET NULL, so they survive but lose their author reference;
   * profile and follows cascade away with the user. The backend refuses to
   * delete the caller or the last remaining admin.
   */
  deleteUser(id: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(`${this.apiUrl}/${id}`);
  }
}
