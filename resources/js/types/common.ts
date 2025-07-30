export interface BreadcrumbItem {
    title: string;
    href?: string; // Optional - last item usually doesn't have href
    icon?: React.ReactNode; // Optional icon
}

// You might also want to add other common types in this file
export interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    message?: string;
    errors?: Record<string, string[]>;
}

export interface SelectOption {
    label: string;
    value: string | number;
}

export interface TableColumn<T = any> {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
    className?: string;
}
