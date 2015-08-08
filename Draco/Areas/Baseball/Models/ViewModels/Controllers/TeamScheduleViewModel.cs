using ModelObjects;
using SportsManager.Controllers;
using SportsManager.ViewModels;
using System;
using System.Linq;

namespace SportsManager.Baseball.ViewModels
{
    public class TeamScheduleViewModel : AccountViewModel
    {
        public TeamScheduleViewModel(DBController c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            Team = c.Db.TeamsSeasons.Find(teamSeasonId);
            if (Team != null)
            {
                Games = (from sched in c.Db.LeagueSchedules
                         where (sched.HTeamId == teamSeasonId || sched.VTeamId == teamSeasonId)
                         orderby sched.GameDate
                         select sched);
            }
        }

        public TeamSeason Team { get; set; }
        public IQueryable<Game> Games { get; set; }

        public string GameSummary(long gameId)
        {
            return (from gr in Controller.Db.GameRecaps
                    where gr.TeamId == Team.Id && gr.GameId == gameId
                    select gr.Recap).SingleOrDefault();
        }

        public string WinLoseString(long gameWinner, int gameStatus)
        {
            if (gameStatus == 1)
            {
                if (gameWinner == -1)
                    return String.Empty;
                else if (gameWinner == 0)
                    return "T";
                else if (gameWinner == Team.Id)
                    return "W";
                else
                    return "L";
            }
            else if (gameStatus == 2)
            {
                return "R";
            }
            else if (gameStatus == 3)
            {
                return "P";
            }
            else if (gameStatus == 4)
            {
                return "F";
            }
            else if (gameStatus == 5)
            {
                return "DNR";
            }

            return String.Empty;
        }

        public String Score1(long gameWinner, int homeScore, int awayScore)
        {
            String score = String.Empty;

            if (gameWinner >= 0)
            {
                if (homeScore > awayScore)
                    return homeScore.ToString();
                else
                    return awayScore.ToString();
            }

            return score;
        }

        public String Score2(long gameWinner, int homeScore, int awayScore)
        {
            String score = String.Empty;

            if (gameWinner >= 0)
            {
                if (homeScore < awayScore)
                    return homeScore.ToString();
                else
                    return awayScore.ToString();
            }

            return score;
        }

        public string FieldName(Game g)
        {
            return g.AvailableField?.Name;
        }
    }
}