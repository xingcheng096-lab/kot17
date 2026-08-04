import { ShieldCheck, Check, X, Download } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ROLE_LABELS, type UserRole } from '@/lib/types';
import { exportToCSV } from '@/lib/export';
import { toast } from 'sonner';

interface Permission {
  module: string;
  moduleKh: string;
  permissions: {
    view: Record<UserRole, boolean>;
    create: Record<UserRole, boolean>;
    update: Record<UserRole, boolean>;
    delete: Record<UserRole, boolean>;
    approve: Record<UserRole, boolean>;
    export: Record<UserRole, boolean>;
  };
}

const MODULES: Permission[] = [
  {
    module: 'Dashboard', moduleKh: 'ផ្ទាំងគ្រប់គ្រង',
    permissions: {
      view: { admin: true, treasurer: true, utility: true, food: true, member: true },
      create: { admin: true, treasurer: false, utility: false, food: false, member: false },
      update: { admin: true, treasurer: false, utility: false, food: false, member: false },
      delete: { admin: true, treasurer: false, utility: false, food: false, member: false },
      approve: { admin: true, treasurer: false, utility: false, food: false, member: false },
      export: { admin: true, treasurer: true, utility: true, food: true, member: false },
    },
  },
  {
    module: 'Members', moduleKh: 'សមាជិក',
    permissions: {
      view: { admin: true, treasurer: true, utility: false, food: false, member: false },
      create: { admin: true, treasurer: false, utility: false, food: false, member: false },
      update: { admin: true, treasurer: false, utility: false, food: false, member: false },
      delete: { admin: true, treasurer: false, utility: false, food: false, member: false },
      approve: { admin: true, treasurer: false, utility: false, food: false, member: false },
      export: { admin: true, treasurer: false, utility: false, food: false, member: false },
    },
  },
  {
    module: 'Monks', moduleKh: 'ព្រះសង្ឃ',
    permissions: {
      view: { admin: true, treasurer: true, utility: false, food: false, member: false },
      create: { admin: true, treasurer: false, utility: false, food: false, member: false },
      update: { admin: true, treasurer: false, utility: false, food: false, member: false },
      delete: { admin: true, treasurer: false, utility: false, food: false, member: false },
      approve: { admin: true, treasurer: false, utility: false, food: false, member: false },
      export: { admin: true, treasurer: false, utility: false, food: false, member: false },
    },
  },
  {
    module: 'Students', moduleKh: 'សិស្ស',
    permissions: {
      view: { admin: true, treasurer: true, utility: false, food: false, member: false },
      create: { admin: true, treasurer: false, utility: false, food: false, member: false },
      update: { admin: true, treasurer: false, utility: false, food: false, member: false },
      delete: { admin: true, treasurer: false, utility: false, food: false, member: false },
      approve: { admin: true, treasurer: false, utility: false, food: false, member: false },
      export: { admin: true, treasurer: false, utility: false, food: false, member: false },
    },
  },
  {
    module: 'Donations', moduleKh: 'ការបរិច្ចាគ',
    permissions: {
      view: { admin: true, treasurer: true, utility: false, food: false, member: false },
      create: { admin: true, treasurer: true, utility: false, food: false, member: false },
      update: { admin: true, treasurer: true, utility: false, food: false, member: false },
      delete: { admin: true, treasurer: true, utility: false, food: false, member: false },
      approve: { admin: true, treasurer: true, utility: false, food: false, member: false },
      export: { admin: true, treasurer: true, utility: false, food: false, member: false },
    },
  },
  {
    module: 'Expenses', moduleKh: 'ការចំណាយ',
    permissions: {
      view: { admin: true, treasurer: true, utility: true, food: true, member: false },
      create: { admin: true, treasurer: true, utility: true, food: true, member: false },
      update: { admin: true, treasurer: true, utility: true, food: true, member: false },
      delete: { admin: true, treasurer: true, utility: false, food: false, member: false },
      approve: { admin: true, treasurer: true, utility: false, food: false, member: false },
      export: { admin: true, treasurer: true, utility: true, food: true, member: false },
    },
  },
  {
    module: 'Budget', moduleKh: 'ថវិកា',
    permissions: {
      view: { admin: true, treasurer: true, utility: false, food: false, member: false },
      create: { admin: true, treasurer: true, utility: false, food: false, member: false },
      update: { admin: true, treasurer: true, utility: false, food: false, member: false },
      delete: { admin: true, treasurer: true, utility: false, food: false, member: false },
      approve: { admin: true, treasurer: false, utility: false, food: false, member: false },
      export: { admin: true, treasurer: true, utility: false, food: false, member: false },
    },
  },
  {
    module: 'Reports', moduleKh: 'របាយការណ៍',
    permissions: {
      view: { admin: true, treasurer: true, utility: false, food: false, member: false },
      create: { admin: true, treasurer: true, utility: false, food: false, member: false },
      update: { admin: true, treasurer: false, utility: false, food: false, member: false },
      delete: { admin: true, treasurer: false, utility: false, food: false, member: false },
      approve: { admin: true, treasurer: false, utility: false, food: false, member: false },
      export: { admin: true, treasurer: true, utility: false, food: false, member: false },
    },
  },
  {
    module: 'Settings', moduleKh: 'ការកំណត់',
    permissions: {
      view: { admin: true, treasurer: false, utility: false, food: false, member: false },
      create: { admin: true, treasurer: false, utility: false, food: false, member: false },
      update: { admin: true, treasurer: false, utility: false, food: false, member: false },
      delete: { admin: true, treasurer: false, utility: false, food: false, member: false },
      approve: { admin: true, treasurer: false, utility: false, food: false, member: false },
      export: { admin: true, treasurer: false, utility: false, food: false, member: false },
    },
  },
  {
    module: 'Users', moduleKh: 'អ្នកប្រើ',
    permissions: {
      view: { admin: true, treasurer: false, utility: false, food: false, member: false },
      create: { admin: true, treasurer: false, utility: false, food: false, member: false },
      update: { admin: true, treasurer: false, utility: false, food: false, member: false },
      delete: { admin: true, treasurer: false, utility: false, food: false, member: false },
      approve: { admin: true, treasurer: false, utility: false, food: false, member: false },
      export: { admin: true, treasurer: false, utility: false, food: false, member: false },
    },
  },
];

const PERMISSION_TYPES = ['view', 'create', 'update', 'delete', 'approve', 'export'] as const;
const PERMISSION_LABELS: Record<string, { en: string; kh: string }> = {
  view: { en: 'View', kh: 'មើល' },
  create: { en: 'Create', kh: 'បង្កើត' },
  update: { en: 'Update', kh: 'កែសម្រួល' },
  delete: { en: 'Delete', kh: 'លុប' },
  approve: { en: 'Approve', kh: 'អនុម័ត' },
  export: { en: 'Export', kh: 'នាំចេញ' },
};

const ROLES = Object.keys(ROLE_LABELS) as UserRole[];

export function AdminRolesPage() {
  const handleExport = () => {
    const rows: Record<string, unknown>[] = [];
    MODULES.forEach((m) => {
      PERMISSION_TYPES.forEach((perm) => {
        const row: Record<string, unknown> = { Module: m.module, Permission: perm };
        ROLES.forEach((r) => { row[ROLE_LABELS[r].en] = m.permissions[perm][r] ? 'Yes' : 'No'; });
        rows.push(row);
      });
    });
    exportToCSV('kot17_permissions', rows);
    toast.success('Permission matrix exported');
  };

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard">Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Roles & Permissions</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Roles & Permissions" titleKh="តួនាទី និងសិទ្ធិ"
        subtitle="Role-based access control matrix with View, Create, Update, Delete, Approve, and Export permissions"
        actions={<Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>}
      />

      {/* Role Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {ROLES.map((r) => (
          <Card key={r}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{ROLE_LABELS[r].en}</p>
                  <p className="font-khmer text-xs text-muted-foreground">{ROLE_LABELS[r].kh}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permission Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix / តារាងសិទ្ធិ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Module</th>
                  <th className="px-3 py-3 text-center font-medium text-muted-foreground">Permission</th>
                  {ROLES.map((r) => (
                    <th key={r} className="px-3 py-3 text-center">
                      <div>
                        <span className="text-xs font-semibold">{ROLE_LABELS[r].en}</span>
                        <span className="font-khmer block text-[10px] text-muted-foreground">{ROLE_LABELS[r].kh}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES.map((m) => (
                  PERMISSION_TYPES.map((perm, pi) => (
                    <tr key={`${m.module}-${perm}`} className={`border-b border-border/50 ${pi === 0 ? 'border-t-2 border-t-border/30' : ''}`}>
                      {pi === 0 && (
                        <td rowSpan={PERMISSION_TYPES.length} className="px-3 py-3 align-top">
                          <div>
                            <span className="text-sm font-medium">{m.module}</span>
                            <span className="font-khmer block text-[11px] text-muted-foreground">{m.moduleKh}</span>
                          </div>
                        </td>
                      )}
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-xs text-muted-foreground">{PERMISSION_LABELS[perm].en}</span>
                      </td>
                      {ROLES.map((r) => (
                        <td key={r} className="px-3 py-2.5 text-center">
                          {m.permissions[perm][r] ? (
                            <Check className="mx-auto h-4 w-4 text-success" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-muted-foreground/40" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <span className="text-sm text-muted-foreground">Legend:</span>
          <div className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /><span className="text-sm">Allowed</span></div>
          <div className="flex items-center gap-2"><X className="h-4 w-4 text-muted-foreground/40" /><span className="text-sm">Not Allowed</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
