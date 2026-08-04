import { Network } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMembers } from '@/hooks/use-list';
import { POSITION_LABELS, formatDate, type Member, type MemberPosition } from '@/lib/types';
import { cn } from '@/lib/utils';

const HIERARCHY: { position: MemberPosition; children?: MemberPosition[] }[] = [
  {
    position: 'me_kuti',
    children: ['treasurer', 'preah_ther', 'bhikkhu', 'samanera', 'ramachang', 'old_student', 'new_student'],
  },
  {
    position: 'treasurer',
    children: ['utility_officer', 'food_officer'],
  },
];

function ProfileCard({ member }: { member: Member }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-shadow hover:shadow-md">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-khmer text-lg font-semibold text-primary">
        {member.khmer_name.slice(0, 1)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-khmer truncate text-sm font-bold">{member.khmer_name}</p>
        {member.english_name && <p className="truncate text-xs text-muted-foreground">{member.english_name}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="font-khmer text-[10px]">
            {POSITION_LABELS[member.position]?.kh}
          </Badge>
          <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
            {member.status}
          </Badge>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">Joined: {formatDate(member.join_date)}</p>
      </div>
    </div>
  );
}

function TreeNode({
  position,
  members,
  level,
  childPositions,
}: {
  position: MemberPosition;
  members: Member[];
  level: number;
  childPositions?: MemberPosition[];
}) {
  const positionMembers = members.filter((m) => m.position === position);
  const node = HIERARCHY.find((h) => h.position === position);
  const children = childPositions ?? node?.children ?? [];

  return (
    <div className={cn('relative', level > 0 && 'ml-8')}>
      {level > 0 && (
        <div className="absolute -left-8 top-0 h-full w-8">
          <div className="absolute left-0 top-0 h-full w-px bg-border" />
          <div className="absolute left-0 top-6 h-px w-8 bg-border" />
        </div>
      )}

      <div className="mb-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Network className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">{POSITION_LABELS[position]?.en}</p>
            <p className="font-khmer text-xs text-muted-foreground">{POSITION_LABELS[position]?.kh}</p>
          </div>
          <Badge variant="secondary" className="ml-auto text-[10px]">
            {positionMembers.length}
          </Badge>
        </div>

        {positionMembers.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {positionMembers.map((m) => (
              <ProfileCard key={m.id} member={m} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
            No members in this position
          </p>
        )}
      </div>

      {children.length > 0 && (
        <div className="space-y-4">
          {children.map((childPos) => (
            <TreeNode key={childPos} position={childPos} members={members} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function MemberOrganizationPage() {
  const { data: members } = useMembers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Structure"
        titleKh="រចនាសម្ព័ន្ធអង្គភាព"
        subtitle="Hierarchy of KOT 17 members"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            Organizational Hierarchy / ឋានានុក្រមតួនាទី
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TreeNode position="me_kuti" members={members} level={0} />
        </CardContent>
      </Card>
    </div>
  );
}
