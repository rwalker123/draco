using ModelObjects;
using SportsManager.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class TeamScheduleViewModel : AccountViewModel
    {
        public TeamScheduleViewModel(Controller c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            Team = DataAccess.Teams.GetTeam(teamSeasonId);
            if (Team != null)
            {
                Games = DataAccess.Schedule.GetTeamSchedule(teamSeasonId);
            }
        }

        public Team Team { get; set; }
        public IQueryable<Game> Games { get; set; }

        public string GameSummary(long gameId)
        {
            ModelObjects.GameRecap recap = DataAccess.GameStats.GetGameRecap(gameId, Team.Id);

            return (recap != null) ? recap.Recap : String.Empty;
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

    }
}