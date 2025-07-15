import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import TeamAvatar from './TeamAvatar';

interface TeamInfoCardProps {
  accountId?: string;
  seasonId?: string;
  teamSeasonId?: string;
}

interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  webAddress?: string;
  youtubeUserId?: string;
  defaultVideo?: string;
  autoPlayVideo?: boolean;
  seasonName?: string; // Add this if available from API
  leagueName?: string; // Add this if available from API
  // Add other fields as needed
}

export default function TeamInfoCard({ accountId, seasonId, teamSeasonId }: TeamInfoCardProps) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<{ wins: number; losses: number; ties: number } | null>(null);
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string>('');
  const [seasonName, setSeasonName] = useState<string>('');
  const [leagueName, setLeagueName] = useState<string>('');

  useEffect(() => {
    async function fetchTeam() {
      setLoading(true);
      setError(null);
      try {
        const url = `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch team info');
        const data = await res.json();
        setTeam({
          ...data.data.teamSeason,
          seasonName: data.data.season?.name || data.data.teamSeason?.seasonName || '',
        });
        setSeasonName(data.data.season?.name || data.data.teamSeason?.seasonName || '');
        setLeagueName(data.data.teamSeason?.leagueName || '');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    if (accountId && seasonId && teamSeasonId) fetchTeam();
  }, [accountId, seasonId, teamSeasonId]);

  useEffect(() => {
    async function fetchRecord() {
      if (!accountId || !seasonId || !teamSeasonId) return;
      setRecordLoading(true);
      setRecordError(null);
      try {
        const url = `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/record`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch team record');
        const data = await res.json();
        setRecord(data.data.record);
      } catch (err: unknown) {
        setRecordError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setRecordLoading(false);
      }
    }
    fetchRecord();
  }, [accountId, seasonId, teamSeasonId]);

  useEffect(() => {
    async function fetchAccountNameAndSeason() {
      if (!accountId) return;
      // Add query param to avoid fetching all seasons
      const url = seasonId
        ? `/api/accounts/${accountId}/public?seasonId=${seasonId}`
        : `/api/accounts/${accountId}/public?currentSeasonOnly=true`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch account info');
        const data = await res.json();
        setAccountName(data.data.account.name);
        // If seasonId is provided, find the season name
        if (seasonId && data.data.seasons) {
          type Season = { id: string | number; name?: string };
          const foundSeason = (data.data.seasons as Season[]).find(
            (s) => String(s.id) === String(seasonId),
          );
          setSeasonName(foundSeason?.name || '');
        } else if (data.data.currentSeason) {
          setSeasonName(data.data.currentSeason.name || '');
        } else {
          setSeasonName('');
        }
      } catch {
        setAccountName('');
        setSeasonName('');
      }
    }
    fetchAccountNameAndSeason();
  }, [accountId, seasonId]);

  return (
    <section className="flex flex-col items-center mb-10">
      {loading ? (
        <div className="text-gray-500">Loading team info...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : team ? (
        <>
          <div className="flex items-center gap-4 mb-4">
            <TeamAvatar
              name={team.name}
              logoUrl={team.logoUrl}
              size={80}
              alt={team.name + ' logo'}
            />
            <h1 className="text-4xl font-bold text-blue-900">
              {leagueName && <span className="mr-2">{leagueName}</span>}
              {team.name}
            </h1>
          </div>
          <div className="flex flex-col items-center gap-1 mb-2">
            <div className="flex gap-4">
              {recordLoading ? (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" /> Loading...
                </Badge>
              ) : recordError ? null : record ? (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  <span className="text-2xl">
                    {record.wins}&nbsp;-&nbsp;{record.losses}&nbsp;-&nbsp;{record.ties}
                  </span>
                </Badge>
              ) : null}
            </div>
            {/* Account and Season Name */}
            {(accountName || seasonName) && (
              <div className="text-gray-700 text-base font-medium mt-1">
                {accountName}
                {accountName && seasonName && ' - '}
                {seasonName}
              </div>
            )}
          </div>
          {team.webAddress && (
            <a
              href={team.webAddress}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline mb-2"
            >
              {team.webAddress}
            </a>
          )}
          {/* Add more metadata fields as needed */}
          <p className="text-lg text-gray-600 text-center max-w-xl">
            A passionate community of baseball players dedicated to excellence, teamwork, and
            sportsmanship. Join us on our journey to the championship!
          </p>
        </>
      ) : (
        <div className="text-gray-500">No team data found.</div>
      )}
    </section>
  );
}
