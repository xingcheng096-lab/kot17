import { Megaphone, Pin } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnnouncements } from '@/hooks/use-list';
import { formatDate, type Announcement } from '@/lib/types';

export function MemberAnnouncementsPage() {
  const { data: announcements } = useAnnouncements();
  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.created_at.localeCompare(a.created_at);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        titleKh="ការប្រកាស"
        subtitle="Latest announcements from KOT 17"
      />

      <div className="space-y-4">
        {sorted.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Megaphone className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No announcements yet</p>
            </CardContent>
          </Card>
        ) : (
          sorted.map((a) => <AnnouncementCard key={a.id} announcement={a} />)
        )}
      </div>
    </div>
  );
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  return (
    <Card className={announcement.pinned ? 'border-secondary/40 bg-secondary/5' : ''}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {announcement.pinned && <Pin className="h-4 w-4 text-secondary" />}
              <h3 className="font-semibold">{announcement.title}</h3>
              {announcement.pinned && (
                <Badge variant="secondary" className="text-[10px]">Pinned</Badge>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{announcement.body}</p>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{formatDate(announcement.created_at)}</span>
              {announcement.author_name && (
                <>
                  <span>•</span>
                  <span>by {announcement.author_name}</span>
                </>
              )}
              <span>•</span>
              <span>Audience: {announcement.audience}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
