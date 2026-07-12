import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Vehicle, Driver, Trip, MaintenanceLog, FuelLog, ExpenseLog } from './mockData';

// Assuming vite proxy maps /api to http://localhost:3000/api
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach token
apiClient.interceptors.request.use(
  (config) => {
    const state = useAuthStore.getState();
    if (state.accessToken) {
      config.headers['Authorization'] = `Bearer ${state.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle refresh token on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const state = useAuthStore.getState();
        if (state.refreshToken) {
          const res = await axios.post('/api/auth/refresh', { token: state.refreshToken });
          // The backend wraps responses in { success: true, data: { ... } }
          const { accessToken } = res.data.data || res.data;
          
          useAuthStore.getState().login(accessToken, state.refreshToken, state.user!);
          
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper to unwrap the standard API envelope { success, data, message }
const unwrap = (res: any) => res.data?.data || res.data;

export const api = {
  auth: {
    login: async (credentials: any) => {
      const res = await apiClient.post('/auth/login', credentials);
      return unwrap(res);
    },
    register: async (data: any) => {
      const res = await apiClient.post('/auth/register', data);
      return unwrap(res);
    },
    forgotPassword: async (email: string) => {
      const res = await apiClient.post('/auth/forgot-password', { email });
      return unwrap(res);
    },
    resetPassword: async (data: any) => {
      const res = await apiClient.post('/auth/reset-password', data);
      return unwrap(res);
    },
    logout: async () => {
      const res = await apiClient.post('/auth/logout');
      return unwrap(res);
    }
  },

  vehicles: {
    list: async (params?: any): Promise<Vehicle[]> => {
      const res = await apiClient.get('/vehicles', { params });
      return unwrap(res);
    },
    get: async (id: string): Promise<Vehicle> => {
      const res = await apiClient.get(`/vehicles/${id}`);
      return unwrap(res);
    },
    create: async (vehicle: any): Promise<Vehicle> => {
      const res = await apiClient.post('/vehicles', vehicle);
      return unwrap(res);
    },
    update: async (id: string, updates: any): Promise<Vehicle> => {
      const res = await apiClient.patch(`/vehicles/${id}`, updates);
      return unwrap(res);
    },
    delete: async (id: string): Promise<void> => {
      const res = await apiClient.delete(`/vehicles/${id}`);
      return unwrap(res);
    }
  },

  drivers: {
    list: async (params?: any): Promise<Driver[]> => {
      const res = await apiClient.get('/drivers', { params });
      return unwrap(res);
    },
    get: async (id: string): Promise<Driver> => {
      const res = await apiClient.get(`/drivers/${id}`);
      return unwrap(res);
    },
    create: async (driver: any): Promise<Driver> => {
      const res = await apiClient.post('/drivers', driver);
      return unwrap(res);
    },
    update: async (id: string, updates: any): Promise<Driver> => {
      const res = await apiClient.patch(`/drivers/${id}`, updates);
      return unwrap(res);
    },
    delete: async (id: string): Promise<void> => {
      const res = await apiClient.delete(`/drivers/${id}`);
      return unwrap(res);
    }
  },

  trips: {
    list: async (params?: any): Promise<Trip[]> => {
      const res = await apiClient.get('/trips', { params });
      return unwrap(res);
    },
    get: async (id: string): Promise<Trip> => {
      const res = await apiClient.get(`/trips/${id}`);
      return unwrap(res);
    },
    create: async (trip: any): Promise<Trip> => {
      const res = await apiClient.post('/trips', trip);
      return unwrap(res);
    },
    update: async (id: string, updates: any): Promise<Trip> => {
      const res = await apiClient.patch(`/trips/${id}`, updates);
      return unwrap(res);
    },
    dispatch: async (id: string): Promise<Trip> => {
      const res = await apiClient.post(`/trips/${id}/dispatch`);
      return unwrap(res);
    },
    complete: async (id: string, finalDetails: any): Promise<Trip> => {
      const res = await apiClient.post(`/trips/${id}/complete`, finalDetails);
      return unwrap(res);
    },
    cancel: async (id: string): Promise<Trip> => {
      const res = await apiClient.post(`/trips/${id}/cancel`);
      return unwrap(res);
    },
    delete: async (id: string): Promise<void> => {
      const res = await apiClient.delete(`/trips/${id}`);
      return unwrap(res);
    }
  },

  maintenance: {
    list: async (params?: any): Promise<MaintenanceLog[]> => {
      const res = await apiClient.get('/maintenance', { params });
      return unwrap(res);
    },
    get: async (id: string): Promise<MaintenanceLog> => {
      const res = await apiClient.get(`/maintenance/${id}`);
      return unwrap(res);
    },
    create: async (log: any): Promise<MaintenanceLog> => {
      const res = await apiClient.post('/maintenance', log);
      return unwrap(res);
    },
    update: async (id: string, updates: any): Promise<MaintenanceLog> => {
      const res = await apiClient.patch(`/maintenance/${id}`, updates);
      return unwrap(res);
    },
    delete: async (id: string): Promise<void> => {
      const res = await apiClient.delete(`/maintenance/${id}`);
      return unwrap(res);
    }
  },

  fuel: {
    list: async (params?: any): Promise<FuelLog[]> => {
      const res = await apiClient.get('/fuel', { params });
      return unwrap(res);
    },
    create: async (log: any): Promise<FuelLog> => {
      const res = await apiClient.post('/fuel', log);
      return unwrap(res);
    },
    getMetrics: async (vehicleId: string): Promise<any> => {
      const res = await apiClient.get(`/fuel/vehicle/${vehicleId}/metrics`);
      return unwrap(res);
    }
  },

  expenses: {
    list: async (params?: any): Promise<ExpenseLog[]> => {
      const res = await apiClient.get('/expenses', { params });
      return unwrap(res);
    },
    create: async (log: any): Promise<ExpenseLog> => {
      const res = await apiClient.post('/expenses', log);
      return unwrap(res);
    },
    getCost: async (vehicleId: string): Promise<any> => {
      const res = await apiClient.get(`/expenses/vehicle/${vehicleId}/cost`);
      return unwrap(res);
    }
  }
};
