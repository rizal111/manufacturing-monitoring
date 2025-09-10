export interface ProductionLine {
    id: number;
    name: string;
    code: string;
    description?: string;
    status: 'running' | 'idle' | 'maintenance' | 'stopped';
    is_active: boolean;
    created_at: string;
    updated_at: string;
    machines?: Machine[];
    machines_count?: number;
    statistics?: {
        total_machines: number;
        active_machines: number;
        running_machines: number;
        current_downtimes: number;
        upcoming_schedules: number;
    };
}

export interface Machine {
    id: number;
    production_line_id: number;
    name: string;
    code: string;
    description?: string;
    status: 'running' | 'idle' | 'maintenance' | 'breakdown';
    ideal_cycle_time: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    production_line?: ProductionLine;
    current_status_duration?: number;
    statistics?: {
        total_production_today: number;
        total_rejects_today: number;
        downtime_hours_week: number;
        status_duration: number;
    };
}

export interface CreateProductionLineData {
    name: string;
    code: string;
    description?: string;
    machines?: CreateMachineData[];
}

export interface CreateMachineData {
    production_line_id?: number;
    name: string;
    code: string;
    status: 'running' | 'idle' | 'maintenance' | 'breakdown';
    description?: string;
    ideal_cycle_time: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}
