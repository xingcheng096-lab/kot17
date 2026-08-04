import { Megaphone, Users, Network, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMembers, useAnnouncements } from '@/hooks/use-list';
import { useAuth } from '@/hooks/use-auth';
import { formatDate, ROLE_LABELS } from '@/lib/types';

export function MemberDashboardPage() {
  const { data: members } = useMembers();
  const { data: announcements } = useAnnouncements();
  const { profile } = useAuth();

  const pinned = announcements.filter((a) => a.pinned).slice(0, 3);
  const recent = announcements.slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${profile?.full_name ?? 'Member'}`}
        titleKh="សូមស្វាគមន៍"
        subtitle="Your member dashboard"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Members" titleKh="សមាជិកសរុប" value={members.length} icon={Users} accent="primary" />
        <StatCard title="Announcements" titleKh="ការប្រកាស" value={announcements.length} icon={Megaphone} accent="secondary" />
        <StatCard title="Your Role" titleKh="តួនាទី" value={profile ? ROLE_LABELS[profile.role].en : '-'} icon={Network} accent="info" />
        <StatCard title="Pinned" titleKh="បានបិទភ្ជាប់" value={pinned.length} icon={Calendar} accent="success" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Pinned Announcements / ការប្រកាសសំខាន់
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pinned.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pinned announcements</p>
            ) : (
              pinned.map((a) => (
                <div key={a.id} className="rounded-lg border border-secondary/30 bg-secondary/5 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{a.title}</h3>
                    <Badge variant="secondary" className="text-[10px]">Pinned</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{formatDate(a.created_at)} • {a.author_name}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Announcements / ការប្រកាសថ្មីៗ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements</p>
            ) : (
              recent.map((a) => (
                <div key={a.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(a.created_at)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            Quick Links / តំណភ្ជាប់
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Button asChild variant="outline" className="h-auto justify-start py-3">
            <Link to="/member/profile">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>My Profile / ប្រវត្តិផ្ទាល់ខ្លួន</span>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto justify-start py-3">
            <Link to="/member/organization">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4" />
                <span>Organization / អង្គភាព</span>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto justify-start py-3">
            <Link to="/member/announcements">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                <span>Announcements / ការប្រកាស</span>
              </div>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
