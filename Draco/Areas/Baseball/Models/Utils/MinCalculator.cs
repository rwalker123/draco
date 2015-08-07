using ModelObjects;
using System.Linq;

namespace SportsManager.Utils
{
    public class MinCalculator
    {
        DB m_db;

        public MinCalculator(DB db)
        {
            m_db = db;
        }

        public int CalculateMinAB(long leagueId)
        {
            // 1.5 min ab's per game
            return CalculateMin(leagueId, 1.5f);
        }

        public int CalculateMinIP(long leagueId)
        {
            // 1.0 innings pitched per game.
            return CalculateMin(leagueId, 1.0f);
        }

        private int CalculateMin(long leagueId, float minNum)
        {
            double curMin = 0.0f;

            var totalGames = (from ls in m_db.LeagueSchedules
                              where ls.LeagueId == leagueId && ls.GameType == 0 && (ls.GameStatus == 1 || ls.GameStatus == 4 || ls.GameStatus == 5)
                              select ls).Count();

            var numGames = totalGames * 2;

            var numTeams = (from ts in m_db.TeamsSeasons
                            where ts.LeagueSeasonId == leagueId
                            select ts).Count();

            if (numTeams > 0)
                curMin = (double)numGames / (double)numTeams * (double)minNum;

            if (curMin < 0.0)
                curMin = 0.0;

            return (int)curMin;
        }

        public int CalculateTeamMinAB(long teamSeasonId)
        {
            // 1.5 min ab's per game
            return CalculateTeamMin(teamSeasonId, 1.5f);
        }

        public int CalculateTeamMinIP(long teamSeasonId)
        {
            // 1.0 innings pitched per game.
            return CalculateTeamMin(teamSeasonId, 1.0f);
        }

        private int CalculateTeamMin(long teamSeasonId, float minNum)
        {
            double curMin = 0.0f;

            var numGames = (from ls in m_db.LeagueSchedules
                            where (ls.HTeamId == teamSeasonId || ls.VTeamId == teamSeasonId) && ls.GameType == 0 && (ls.GameStatus == 1 || ls.GameStatus == 4 || ls.GameStatus == 5)
                            select ls).Count();

            curMin = (double)numGames * (double)minNum;

            if (curMin < 0.0)
                curMin = 0.0;

            return (int)curMin;
        }
    }
}