import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
}
