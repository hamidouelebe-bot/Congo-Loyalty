import { User, Receipt, Campaign, Supermarket, Notification, Partner, Admin } from '../types';

const API_PREFIX = '/api';

export const api = {
  upload: {
    image: async (file: File): Promise<{ url: string }> => {
      // Convert file to base64 safely using FileReader
      const toBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data:image/xxx;base64, prefix
            resolve(result.split(',')[1]);
          };
          reader.onerror = error => reject(error);
        });
      };

      const base64 = await toBase64(file);
      
      const res = await fetch(`${API_PREFIX}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          data: base64
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || 'Failed to upload image');
      }
      
      return res.json();
    }
  },
  auth: {
    shopperLogin: async (phone: string, pin: string): Promise<{ success: boolean; user?: User; error?: string }> => {
      const res = await fetch(`${API_PREFIX}/auth/shopper/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin })
      });
      return res.json();
    },
    shopperSignup: async (data: any): Promise<{ success: boolean; user?: User; error?: string }> => {
      const res = await fetch(`${API_PREFIX}/auth/shopper/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    shopperChangePin: async (userId: string, currentPin: string, newPin: string): Promise<{ success: boolean; message?: string; error?: string }> => {
      const res = await fetch(`${API_PREFIX}/auth/shopper/change-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentPin, newPin })
      });
      return res.json();
    },
    shopperForgotPin: async (phone: string): Promise<{ success: boolean; message?: string; email?: string; error?: string }> => {
      const res = await fetch(`${API_PREFIX}/auth/shopper/forgot-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      return res.json();
    },
    shopperResetPin: async (phone: string, code: string, newPin: string): Promise<{ success: boolean; message?: string; error?: string }> => {
      const res = await fetch(`${API_PREFIX}/auth/shopper/reset-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, newPin })
      });
      return res.json();
    },
    adminLogin: async (email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> => {
      const res = await fetch(`${API_PREFIX}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return res.json();
    },
    sendOtp: async (email: string): Promise<{ success: boolean; message?: string; error?: string }> => {
      const res = await fetch(`${API_PREFIX}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return res.json();
    },
    partnerLogin: async (email: string, password: string): Promise<{ success: boolean; user?: Partner; error?: string }> => {
      const res = await fetch(`${API_PREFIX}/auth/partner/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return res.json();
    },
    partnerSignup: async (data: { name: string; email: string; password: string; companyName: string; phone?: string; otp?: string }): Promise<{ success: boolean; user?: Partner; message?: string; error?: string }> => {
      const res = await fetch(`${API_PREFIX}/auth/partner/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    adminSignup: async (data: { name: string; email: string; password: string; otp?: string }): Promise<{ success: boolean; user?: Admin; error?: string }> => {
      const res = await fetch(`${API_PREFIX}/auth/admin/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    }
  },
  dashboard: {
    getStats: async () => {
      const res = await fetch(`${API_PREFIX}/dashboard/stats`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    getCharts: async () => {
      const res = await fetch(`${API_PREFIX}/dashboard/charts`);
      if (!res.ok) throw new Error('Failed to fetch charts');
      return res.json();
    }
  },
  rewards: {
    getAll: async (): Promise<any[]> => {
      const res = await fetch(`${API_PREFIX}/rewards`);
      if (!res.ok) throw new Error('Failed to fetch rewards');
      return res.json();
    },
    create: async (data: { title: string; cost: number; type: string; brand: string; imageUrl: string; partnerId?: number }): Promise<any> => {
      const res = await fetch(`${API_PREFIX}/rewards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create reward');
      return res.json();
    },
    update: async (id: string, data: { title?: string; cost?: number; type?: string; brand?: string; imageUrl?: string; partnerId?: number }): Promise<any> => {
      const res = await fetch(`${API_PREFIX}/rewards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update reward');
      return res.json();
    },
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_PREFIX}/rewards/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete reward');
    },
    redeem: async (userId: string, rewardId: string): Promise<{ success: boolean; newBalance: number }> => {
      const res = await fetch(`${API_PREFIX}/rewards/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, rewardId })
      });
      if (!res.ok) {
         const error = await res.json();
         throw new Error(error.error || 'Failed to redeem reward');
      }
      return res.json();
    }
  },
  activities: {
    getAll: async (userId: string): Promise<{ id: number; type: string; description: string; points: number; date: string }[]> => {
        const res = await fetch(`${API_PREFIX}/activities/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch activities');
        return res.json();
    }
  },
  users: {
    getAll: async (): Promise<User[]> => {
      const res = await fetch(`${API_PREFIX}/users`);
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    getById: async (id: string): Promise<User> => {
      const res = await fetch(`${API_PREFIX}/users/${id}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
    create: async (data: { firstName: string; lastName: string; email?: string; phoneNumber: string; pin: string; gender?: string; birthdate?: string }): Promise<User> => {
      const res = await fetch(`${API_PREFIX}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create user');
      }
      return res.json();
    },
    update: async (id: string, data: { firstName?: string; lastName?: string; email?: string; phoneNumber?: string; gender?: string; birthdate?: string; pointsBalance?: number }): Promise<User> => {
      const res = await fetch(`${API_PREFIX}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update user');
      return res.json();
    },
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_PREFIX}/users/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete user');
    },
    updateStatus: async (id: string, status: string): Promise<void> => {
      const res = await fetch(`${API_PREFIX}/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update user status');
    },
    adjustPoints: async (id: string, adjustment: number, reason?: string): Promise<{ success: boolean; newBalance: number }> => {
      const res = await fetch(`${API_PREFIX}/users/${id}/points`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustment, reason })
      });
      if (!res.ok) throw new Error('Failed to adjust points');
      return res.json();
    }
  },
  receipts: {
    getAll: async (): Promise<Receipt[]> => {
      const res = await fetch(`${API_PREFIX}/receipts`);
      if (!res.ok) throw new Error('Failed to fetch receipts');
      return res.json();
    },
    getByUserId: async (userId: string): Promise<Receipt[]> => {
      const res = await fetch(`${API_PREFIX}/receipts/user/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch user receipts');
      return res.json();
    },
    updateStatus: async (id: string, status: string, points?: number): Promise<void> => {
      const res = await fetch(`${API_PREFIX}/receipts/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, points })
      });
      if (!res.ok) throw new Error('Failed to update receipt status');
    },
    process: async (userId: string, scannedData: any, imageUrl?: string): Promise<{ success: boolean; points: number; status: string; receiptId: string; campaign?: string }> => {
      const res = await fetch(`${API_PREFIX}/receipts/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, scannedData, imageUrl })
      });
      if (!res.ok) {
        const error = await res.json();
        // Propagate error code if available
        const errObj = new Error(error.error || 'Failed to process receipt');
        (errObj as any).code = error.code;
        throw errObj;
      }
      return res.json();
    },
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_PREFIX}/receipts/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete receipt');
    }
  },
  supermarkets: {
    getAll: async (): Promise<Supermarket[]> => {
      const res = await fetch(`${API_PREFIX}/supermarkets`);
      if (!res.ok) throw new Error('Failed to fetch supermarkets');
      return res.json();
    },
    create: async (data: Partial<Supermarket>): Promise<Supermarket> => {
      const res = await fetch(`${API_PREFIX}/supermarkets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create supermarket');
      return res.json();
    },
    update: async (id: string, data: Partial<Supermarket>): Promise<Supermarket> => {
      const res = await fetch(`${API_PREFIX}/supermarkets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update supermarket');
      return res.json();
    },
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_PREFIX}/supermarkets/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete supermarket');
    }
  },
  // Active promotions for shoppers (public)
  promotions: {
    getActive: async (): Promise<{
      id: string;
      name: string;
      brand: string;
      mechanic: string;
      minSpend: number | null;
      rewardType: string;
      rewardValue: string;
      startDate: string;
      endDate: string;
      supermarkets: { id: string; name: string; logoUrl: string }[];
    }[]> => {
      const res = await fetch(`${API_PREFIX}/promotions/active`);
      if (!res.ok) throw new Error('Failed to fetch active promotions');
      return res.json();
    }
  },
  campaigns: {
    getAll: async (): Promise<Campaign[]> => {
      const res = await fetch(`${API_PREFIX}/campaigns`);
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      return res.json();
    },
    create: async (data: Partial<Campaign>): Promise<Campaign> => {
      const res = await fetch(`${API_PREFIX}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create campaign');
      return res.json();
    },
    update: async (id: string, data: Partial<Campaign>): Promise<Campaign> => {
      const res = await fetch(`${API_PREFIX}/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update campaign');
      return res.json();
    },
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_PREFIX}/campaigns/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete campaign');
    },
    updateStatus: async (id: string, status: string): Promise<void> => {
      const res = await fetch(`${API_PREFIX}/campaigns/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update campaign status');
    }
  },
  notifications: {
    create: async (data: { userId?: string; title: string; message: string; type?: string }): Promise<Notification> => {
      const res = await fetch(`${API_PREFIX}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create notification');
      return res.json();
    },
    getByUserId: async (userId: string): Promise<Notification[]> => {
      const res = await fetch(`${API_PREFIX}/notifications/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    }
  },
  partners: {
    getAll: async (): Promise<Partner[]> => {
      const res = await fetch(`${API_PREFIX}/partners`);
      if (!res.ok) throw new Error('Failed to fetch partners');
      return res.json();
    },
    updateStatus: async (id: string, status: string): Promise<void> => {
      const res = await fetch(`${API_PREFIX}/partners/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update partner status');
    },
    assignSupermarkets: async (id: string, supermarketIds: string[]): Promise<void> => {
      const res = await fetch(`${API_PREFIX}/partners/${id}/supermarkets`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supermarketIds })
      });
      if (!res.ok) throw new Error('Failed to assign supermarkets');
    }
  },
  admins: {
    getAll: async (): Promise<Admin[]> => {
      const res = await fetch(`${API_PREFIX}/admins`);
      if (!res.ok) throw new Error('Failed to fetch admins');
      return res.json();
    }
  },
  ai: {
    analyze: async (prompt: string): Promise<{ result: string }> => {
      const res = await fetch(`${API_PREFIX}/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (!res.ok) throw new Error('Failed to generate AI analysis');
      return res.json();
    }
  },
  reports: {
    getData: async (type: string, filters?: { startDate?: string; endDate?: string; status?: string; storeId?: string; limit?: number }): Promise<{ success: boolean; data: any[]; count: number; type: string }> => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.storeId) params.append('storeId', filters.storeId);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const res = await fetch(`${API_PREFIX}/reports/${type}?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch report data');
      return res.json();
    },
    getStats: async (): Promise<{ totalUsers: number; totalReceipts: number; totalRevenue: number; activeCampaigns: number; activeStores: number }> => {
      const res = await fetch(`${API_PREFIX}/reports/stats/summary`);
      if (!res.ok) throw new Error('Failed to fetch report stats');
      return res.json();
    },
    aiQuery: async (prompt: string): Promise<{ success: boolean; data: any[]; sql: string; count: number }> => {
      const res = await fetch(`${API_PREFIX}/reports/ai-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to process AI query');
      }
      return res.json();
    }
  }
};
