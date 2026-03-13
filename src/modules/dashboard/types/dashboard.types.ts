// 1. Overview
export interface DashboardOverview {
  total_assets: number;
  total_members: number;
  active_members: number;
  pending_it_members: number;
  offboarding_members: number;
  terminated_members: number;
  assets_assigned: number;
  assets_unassigned: number;
  categories_count: number;
  properties_count: number;
}

// Interfaces genéricas para conteos
export interface StatusCount { status: string; count: number; }
export interface CategoryCount { category: string; count: number; }
export interface PropertyCount { property: string; count: number; }
export interface DepartmentCount { department: string; count: number; }
export interface BrandCount { brand: string; count: number; }

// Alertas
export interface ExpiringWarrantyAlert {
    id: number;
    category_id: number;
    brand: string | null;
    model: string | null;
    serial_number: string | null;
    warranty_expiry: string;
}

export interface PendingOffboardingAlert {
    id: number;
    name: string;
    last_name: string;
    hire_end_date: string;
}

// 2. Assets Analytics
export interface DashboardAssets {
  by_status: StatusCount[];
  by_category: CategoryCount[];
  by_property: PropertyCount[];
  by_department: DepartmentCount[];
  unassigned: { count: number };
  top_categories: CategoryCount[];
  by_brand: BrandCount[];
  warranty_expiring: { next_30_days: number; next_90_days: number };
}

// 3. Members Analytics
export interface HiringTrend { month: string; count: number; }
export interface DashboardMembers {
  by_status: StatusCount[];
  by_department: DepartmentCount[];
  by_property: PropertyCount[];
  hiring_trend: HiringTrend[];
}

// 4. IT Lifecycle
export interface DashboardLifecycle {
  onboarding_pipeline: { pending_it: number; active: number; offboarding: number };
  onboarding_average_time: { avg_days: number };
}

// 5. Plataformas
export interface PlatformStat { platform: string; members: number; }
export interface DashboardPlatforms {
  most_used: PlatformStat[];
  overrides: { overrides_total: number };
}

// 6 & 7. Matrices y Auditoría
export interface MemberAssetCount { member: string; assets: number; }
export interface CategoryDepartmentMatrix {
  department: string;
  [category: string]: any; // Permite propiedades dinámicas como laptops: 50, monitors: 30
}

// OBJETO MAESTRO
export interface MasterDashboardResponse {
  overview: DashboardOverview;
  assets: DashboardAssets;
  members: DashboardMembers;
  lifecycle: DashboardLifecycle;
  platforms: DashboardPlatforms;
  audit_by_member: MemberAssetCount[];
  matrix: CategoryDepartmentMatrix[];

  alerts: {
      expiring_warranties: ExpiringWarrantyAlert[];
      pending_offboardings: PendingOffboardingAlert[];
  };
}