export interface DashboardKPIs {
    total_assets: number;
    assets_in_repair: number;
    active_members: number;
    pending_it_members: number;
}

export interface ChartDataItem {
    name?: string | null;
    status?: string | null;
    count: number;
}

export interface DashboardResponse {
    kpis: DashboardKPIs;
    charts: {
        by_status: ChartDataItem[];
        by_property: ChartDataItem[];
        trends: {
            labels: string[];
            assets_total: number[];
            assets_assigned: number[];
        };
        maintenance: {
            labels: string[];
            scheduled: number[];
            completed: number[];
            urgent: number[];
        };
        incidents: {
            labels: string[];
            critical: number[];
            moderate: number[];
            minor: number[];
        };
    };
    alerts: {
        expiring_warranties: any[];
        pending_offboardings: any[];
    };
}