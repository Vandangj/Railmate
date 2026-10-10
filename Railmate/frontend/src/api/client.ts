import {
  AuthResponse, User, Station, RouteSearchResponse,
  ChatMessageResponse, BookingPreview, Booking, Notification, AdminOverview, AgentLog
} from '../types';

const API_BASE = '/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('railmate_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorDetail = 'Request failed';
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || errorJson.error || JSON.stringify(errorJson);
      } catch (e) {
        errorDetail = response.statusText || `HTTP Error ${response.status}`;
      }
      throw new Error(errorDetail);
    }

    return response.json();
  }

  // Auth
  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: { email: string; password: string; full_name: string; phone?: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async updateProfile(data: { full_name?: string; phone?: string; preferences?: any }): Promise<User> {
    return this.request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Stations
  async getStations(): Promise<Station[]> {
    return this.request<Station[]>('/stations');
  }

  // Route Planning
  async searchRoutes(params: {
    origin: string;
    destination: string;
    travel_date: string;
    preference?: string;
    max_transfers?: number;
  }): Promise<RouteSearchResponse> {
    return this.request<RouteSearchResponse>('/routes/search', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Chat / Multi-Agent Assistant
  async sendChatMessage(message: string, conversation_id?: number): Promise<ChatMessageResponse> {
    return this.request<ChatMessageResponse>('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message, conversation_id }),
    });
  }

  async getConversations(): Promise<any[]> {
    return this.request<any[]>('/chat/conversations');
  }

  // Bookings
  async getBookingPreview(data: any): Promise<BookingPreview> {
    return this.request<BookingPreview>('/bookings/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createBooking(data: any): Promise<Booking> {
    return this.request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBookings(): Promise<Booking[]> {
    return this.request<Booking[]>('/bookings');
  }

  async getBooking(id: number): Promise<Booking> {
    return this.request<Booking>(`/bookings/${id}`);
  }

  async cancelBooking(id: number, reason: string, confirmed: boolean): Promise<Booking> {
    return this.request<Booking>(`/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason, confirmed }),
    });
  }

  async getAlternatives(bookingId: number): Promise<any> {
    return this.request<any>(`/bookings/${bookingId}/alternatives`);
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    return this.request<Notification[]>('/notifications');
  }

  async markNotificationAsRead(id: number): Promise<any> {
    return this.request<any>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead(): Promise<any> {
    return this.request<any>('/notifications/read-all', {
      method: 'POST',
    });
  }

  // Admin
  async getAdminOverview(): Promise<AdminOverview> {
    return this.request<AdminOverview>('/admin/overview');
  }

  async getAdminAgentLogs(agent_name?: string): Promise<AgentLog[]> {
    const query = agent_name ? `?agent_name=${encodeURIComponent(agent_name)}` : '';
    return this.request<AgentLog[]>(`/admin/agent-logs${query}`);
  }

  async getAdminProviderHealth(): Promise<any> {
    return this.request<any>('/admin/provider-health');
  }

  async getAdminBookings(): Promise<any[]> {
    return this.request<any[]>('/admin/bookings');
  }

  async getAdminAuditLogs(): Promise<any[]> {
    return this.request<any[]>('/admin/audit-logs');
  }

  // Support
  async createSupportTicket(ticket: { booking_ref?: string; subject: string; description: string }): Promise<any> {
    return this.request<any>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(ticket),
    });
  }

  async getSupportTickets(): Promise<any[]> {
    return this.request<any[]>('/support/tickets');
  }
}

export const api = new ApiClient();
