// services/productionApi.ts
import axios from 'axios';
import { ApiResponse, CreateMachineData, CreateProductionLineData, Machine, ProductionLine } from '../types/production';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token if exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const productionApi = {
    // Production Lines
    getProductionLines: async (params?: any) => {
        const response = await api.get<ApiResponse<ProductionLine[]>>('/production-lines', { params });
        return response.data;
    },

    getProductionLine: async (id: number) => {
        const response = await api.get<ApiResponse<ProductionLine>>(`/production-lines/${id}`);
        return response.data;
    },

    createProductionLine: async (data: CreateProductionLineData) => {
        const response = await api.post<ApiResponse<ProductionLine>>('/production-lines', data);
        return response.data;
    },

    updateProductionLine: async (id: number, data: Partial<CreateProductionLineData>) => {
        const response = await api.put<ApiResponse<ProductionLine>>(`/production-lines/${id}`, data);
        return response.data;
    },

    deleteProductionLine: async (id: number) => {
        const response = await api.delete<ApiResponse<void>>(`/production-lines/${id}`);
        return response.data;
    },

    createProductionLineWithMachines: async (data: CreateProductionLineData) => {
        const response = await api.post<ApiResponse<ProductionLine>>('/setup/production-line-with-machines', data);
        return response.data;
    },

    // Machines
    getMachines: async (params?: any) => {
        const response = await api.get<ApiResponse<Machine[]>>('/machines', { params });
        return response.data;
    },

    getMachine: async (id: number) => {
        const response = await api.get<ApiResponse<Machine>>(`/machines/${id}`);
        return response.data;
    },

    createMachine: async (data: CreateMachineData) => {
        const response = await api.post<ApiResponse<Machine>>('/machines', data);
        return response.data;
    },

    createMachinesBatch: async (machines: CreateMachineData[]) => {
        const response = await api.post<ApiResponse<Machine[]>>('/machines/batch', { machines });
        return response.data;
    },

    updateMachine: async (id: number, data: Partial<CreateMachineData>) => {
        const response = await api.put<ApiResponse<Machine>>(`/machines/${id}`, data);
        return response.data;
    },

    deleteMachine: async (id: number) => {
        const response = await api.delete<ApiResponse<void>>(`/machines/${id}`);
        return response.data;
    },

    updateMachineStatus: async (id: number, data: any) => {
        const response = await api.put<ApiResponse<Machine>>(`/machines/${id}/status`, data);
        return response.data;
    },

    // Templates
    getTemplates: async () => {
        const response = await api.get<ApiResponse<any>>('/setup/templates');
        return response.data;
    },
};
