using AutoMapper;
using SportsManager.Controllers;
using SportsManager.Golf.Models;
using SportsManager.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;

namespace SportsManager.Golf.ViewModels.Controllers
{
    public class MatchResultsViewModel : AccountViewModel
    {
        public MatchResultsViewModel(DBController c, long accountId, long matchId)
            : base(c, accountId)
        {
            InitializeMatch(c.Db.GolfMatches.Find(matchId));
        }

        public MatchResultsViewModel(GolfMatch match)
        {
            InitializeMatch(match);
        }

        private void InitializeMatch(GolfMatch match)
        {
            MatchId = match.Id;

            GolfMatch = match;

            Team1Scores = new List<GolfScoreViewModel>();
            Team2Scores = new List<GolfScoreViewModel>();

            if (GolfMatch != null)
            {
                GolfCourse course = Controller.Db.GolfCourses.Find(GolfMatch.CourseId.GetValueOrDefault(0));
                if (course != null)
                {
                    Course = Mapper.Map<GolfCourse, GolfCourseViewModel>(course);
                    Controller.AddTees(Course);
                }

                CoursePlayed = course?.Name;
                CourseId = GolfMatch.CourseId.GetValueOrDefault(0);

                Team1Name = GolfMatch.TeamsSeason_Team1.Name;
                Team2Name = GolfMatch.TeamsSeason_Team2.Name;

                Team1Id = GolfMatch.Team1;
                Team2Id = GolfMatch.Team2;

                MatchDate = GolfMatch.MatchDate;
                MatchTime = GolfMatch.MatchTime;
                MatchType = GolfMatch.MatchType;
                Comment = GolfMatch.Comment;
                MatchStatus = GolfMatch.MatchStatus;
            }
        }

        /// <summary>
        /// Get results of the match, this method does not setup the view model for edit.
        /// If using MatchResult for edit, use InitializeFromDB.
        /// </summary>
        public void InitializeMatchResults(long accountId)
        {
            Dictionary<long, GolfRoster> team1Players = GolfMatch.TeamsSeason_Team1.GolfRosters.ToDictionary(gr => gr.Id);
            Dictionary<long, GolfRoster> team2Players = GolfMatch.TeamsSeason_Team2.GolfRosters.ToDictionary(gr => gr.Id);

            IEnumerable<GolfMatchScore> golfScores = GolfMatch.GolfMatchScores;

            foreach (GolfMatchScore score in golfScores)
            {
                GolfScore gs = score.GolfScore;

                if (score.TeamId == Team1Id)
                {
                    // check for sub.
                    if (team1Players.ContainsKey(score.PlayerId))
                    {
                        Team1Scores.Add(new GolfScoreViewModel(Controller, gs, team1Players[score.PlayerId]));
                        team1Players.Remove(score.PlayerId);
                    }
                    else
                    {
                        Team1Scores.Add(new GolfScoreViewModel(Controller, gs, Controller.Db.GolfRosters.Find(score.PlayerId)));
                    }
                }
                else if (score.TeamId == Team2Id)
                {
                    // check for sub.
                    if (team2Players.ContainsKey(score.PlayerId))
                    {
                        Team2Scores.Add(new GolfScoreViewModel(Controller, gs, team2Players[score.PlayerId]));
                        team2Players.Remove(score.PlayerId);
                    }
                    else
                    {
                        Team2Scores.Add(new GolfScoreViewModel(Controller, gs, Controller.Db.GolfRosters.Find(score.PlayerId)));
                    }
                }
            }

            while (Team1Scores.Count < 2)
            {
                var keyValuePair = team1Players.First();

                //GolfRoster player, GolfMatch forMatch, GolfTeeInformation teeInfo, int numHoles)
                GolfScoreViewModel gsvm = new GolfScoreViewModel(Controller, keyValuePair.Value, GolfMatch, GetDefaultTeeInfo(accountId, CourseId, keyValuePair.Value.Contact.IsFemale.GetValueOrDefault()), NumberHolesPlayed);
                gsvm.PlayerName = gsvm.PlayerName;

                Team1Scores.Add(gsvm);
                team1Players.Remove(keyValuePair.Key);
            }

            while (Team2Scores.Count < 2)
            {
                var keyValuePair = team2Players.First();

                GolfScoreViewModel gsvm = new GolfScoreViewModel(Controller, keyValuePair.Value, GolfMatch, GetDefaultTeeInfo(accountId, CourseId, keyValuePair.Value.Contact.IsFemale.GetValueOrDefault()), NumberHolesPlayed);
                gsvm.PlayerName = gsvm.PlayerName;

                Team2Scores.Add(gsvm);
                team2Players.Remove(keyValuePair.Key);
            }

            CalculateResults();
        }

        private GolfTeeInformation GetDefaultTeeInfo(long accountId, long courseId, bool isFemale)
        {
            return Controller.GetDefaultCourseTee(accountId, courseId, isFemale);
        }


        /// <summary>
        /// Initialize Match data from database. This is used when editing a Match Result.
        /// </summary>
        /// <param name="forResults">Create for displaying results, not for editing.</param>
        public void InitializeFromDB()
        {
            Dictionary<long, GolfRoster> team1Players = Controller.GetRoster(Team1Id).ToDictionary(gr => gr.Id);
            Dictionary<long, GolfRoster> team2Players = Controller.GetRoster(Team2Id).ToDictionary(gr => gr.Id);

            int team1PlayerCount = team1Players.Count;
            int team2PlayerCount = team2Players.Count;

            Dictionary<GolfRoster, GolfScore> team1SubPlayers = new Dictionary<GolfRoster, GolfScore>();
            Dictionary<GolfRoster, GolfScore> team2SubPlayers = new Dictionary<GolfRoster, GolfScore>();

            IEnumerable<GolfMatchScore> golfScores = GetMatchResults(MatchId);

            foreach (GolfMatchScore score in golfScores)
            {
                GolfScore gs = Controller.Db.GolfScores.Find(score.ScoreId);

                if (score.TeamId == Team1Id)
                {
                    // check for sub.
                    if (team1Players.ContainsKey(score.PlayerId))
                    {
                        Team1Scores.Add(new GolfScoreViewModel(Controller, gs, team1Players[score.PlayerId]));
                        team1Players.Remove(score.PlayerId);
                    }
                    else
                    {
                        team1SubPlayers[Controller.Db.GolfRosters.Find(score.PlayerId)] = gs;
                    }
                }
                else if (score.TeamId == Team2Id)
                {
                    // check for sub.
                    if (team2Players.ContainsKey(score.PlayerId))
                    {
                        Team2Scores.Add(new GolfScoreViewModel(Controller, gs, team2Players[score.PlayerId]));
                        team2Players.Remove(score.PlayerId);
                    }
                    else
                    {
                        team2SubPlayers[Controller.Db.GolfRosters.Find(score.PlayerId)] = gs;
                    }
                }
            }

            // if any scores have been created, create as absent.
            bool addAsAbsent = golfScores.Any();

            while (Team1Scores.Count < team1PlayerCount)
            {
                var keyValuePair = team1Players.First();
                bool addThisPlayerAbsent = addAsAbsent && !team1SubPlayers.Any();

                GolfScoreViewModel gsvm = new GolfScoreViewModel(Controller, keyValuePair.Value, addThisPlayerAbsent);
                if (team1SubPlayers.Any())
                {
                    gsvm.IsSub = true;
                    gsvm.SubPlayerName = team1SubPlayers.First().Key.Contact.FirstName + " " + team1SubPlayers.First().Key.Contact.LastName;
                    gsvm.SubPlayerId = team1SubPlayers.First().Key.Id;
                    gsvm.InitializeScores(team1SubPlayers.First().Key.Id, team1SubPlayers.First().Value);
                    team1SubPlayers.Remove(team1SubPlayers.First().Key);
                }

                Team1Scores.Add(gsvm);
                team1Players.Remove(keyValuePair.Key);
            }

            while (Team2Scores.Count < team2PlayerCount)
            {
                var keyValuePair = team2Players.First();
                bool addThisPlayerAbsent = addAsAbsent && !team2SubPlayers.Any();

                GolfScoreViewModel gsvm = new GolfScoreViewModel(Controller, keyValuePair.Value, addThisPlayerAbsent);
                if (team2SubPlayers.Any())
                {
                    gsvm.IsSub = true;
                    gsvm.SubPlayerName = team2SubPlayers.First().Key.Contact.FirstName + " " + team2SubPlayers.First().Key.Contact.LastName;
                    gsvm.SubPlayerId = team2SubPlayers.First().Key.Id;
                    gsvm.InitializeScores(team2SubPlayers.First().Key.Id, team2SubPlayers.First().Value);
                    team2SubPlayers.Remove(team2SubPlayers.First().Key);
                }

                Team2Scores.Add(gsvm);
                team2Players.Remove(keyValuePair.Key);
            }
        }

        private IQueryable<GolfMatchScore> GetMatchResults(long id)
        {
            return (from gms in Controller.Db.GolfMatchScores
                    where gms.MatchId == id
                    select gms);
        }

        private GolfMatch GolfMatch { get; set; }

        /// <summary>
        /// InitializeDB should be called first.
        /// </summary>
        private void CalculateResults()
        {
            // match status of 1 means complete. Don't calculate results unless done.
            if (MatchStatus != 1)
                return;

            Team1HolePoints = new List<double>();
            Team2HolePoints = new List<double>();

            double team1MatchPoints = 0.0;
            double team2MatchPoints = 0.0;

            foreach (var gs in Team1Scores)
                Team1NetScore += gs.TotalNetScore;

            foreach (var gs in Team2Scores)
                Team2NetScore += gs.TotalNetScore;

            for (int i = 1; i <= NumberHolesPlayed; ++i)
            {
                int netScore1 = 0;
                int netScore2 = 0;

                foreach (var gs in Team1Scores)
                    netScore1 += gs.NetHoleScoreToPar(i);

                foreach (var gs in Team2Scores)
                    netScore2 += gs.NetHoleScoreToPar(i);

                if (netScore1 > netScore2)
                {
                    Team1HolePoints.Add(0);
                    Team2HolePoints.Add(1);

                    team2MatchPoints++;
                }
                else if (netScore1 < netScore2)
                {
                    Team1HolePoints.Add(1);
                    Team2HolePoints.Add(0);

                    team1MatchPoints++;
                }
                else
                {
                    Team1HolePoints.Add(0.5);
                    Team2HolePoints.Add(0.5);

                    team1MatchPoints += 0.5;
                    team2MatchPoints += 0.5;
                }
            }

            Team1MatchPoints = team1MatchPoints;
            Team2MatchPoints = team2MatchPoints;
        }

        public IList<double> Team1HolePoints { get; private set; }
        public IList<double> Team2HolePoints { get; private set; }

        public int Team1NetScore { get; private set; }
        public int Team2NetScore { get; private set; }

        public double Team1MatchPoints { get; private set; }
        public double Team2MatchPoints { get; private set; }

        public long MatchId { get; private set; }

        public DateTime MatchDate { get; private set; }
        public DateTime MatchTime { get; private set; }

        public int MatchType { get; private set; }

        public string Comment { get; private set; }
        public int MatchStatus { get; set; }

        public string CoursePlayed { get; private set; }
        public long CourseId { get; private set; }

        public GolfCourseViewModel Course { get; private set; }

        public int NumberHolesPlayed { get { return 9; } }

        public long Team1Id { get; private set; }
        public string Team1Name { get; private set; }
        public IList<GolfScoreViewModel> Team1Scores { get; private set; }

        public void AddTeam1Score(GolfScoreViewModel vm)
        {
            Team1Scores.Add(vm);
        }

        public long Team2Id { get; private set; }
        public string Team2Name { get; private set; }
        public IList<GolfScoreViewModel> Team2Scores { get; private set; }

        public void AddTeam2Score(GolfScoreViewModel vm)
        {
            Team2Scores.Add(vm);
        }

        public IEnumerable<PlayerViewModel> GetAvailableSubs(long seasonId)
        {
            IEnumerable<GolfRoster> subs = Controller.GetSubs(seasonId);

            // convert to TeamViewModel
            return (from s in subs
                    select new PlayerViewModel(Controller.Db, s));
        }
    }
}