using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using SportsManager.Model;

namespace SportsManager.Golf.ViewModels
{
    public class LeagueMatchResultsViewModel
    {
        public LeagueMatchResultsViewModel(long accountId, long flightId, DateTime matchDate)
        {
            Initialize(accountId, flightId, matchDate);
        }

        private void Initialize(long accountId, long flightId, DateTime matchDate)
        {
            MatchDate = matchDate;

            IEnumerable<GolfMatch> matches = DataAccess.Golf.GolfMatches.GetCompletedMatches(flightId, MatchDate);
            List<MatchResultsViewModel> matchResults = new List<MatchResultsViewModel>();

            foreach (GolfMatch match in matches)
            {
                MatchResultsViewModel vm = new MatchResultsViewModel(match);
                vm.InitializeMatchResults(accountId);
                matchResults.Add(vm);
            }

            ProcessMatches(matchResults);
        }

        public DateTime MatchDate { get; private set; }
        public IList<TeamScore> TeamScores { get; private set; }

        public IEnumerable<PlayerScoreViewModel> LowActualScores { get; private set; }
        public IEnumerable<PlayerScoreViewModel> LowNetScores { get; private set; }
        public IEnumerable<PlayerHoleSkinViewModel> PlayerSkins { get; private set; }

        public IEnumerable<PlayoffResult> PlayoffResults { get; private set; }

        private void ProcessMatches(IEnumerable<MatchResultsViewModel> matchResults)
        {
            List<TeamScore> teamScores = new List<TeamScore>();
            List<PlayoffResult> playoffResults = new List<PlayoffResult>();

            List<GolfScoreViewModel> lowIndividualActualScores = new List<GolfScoreViewModel>();
            List<GolfScoreViewModel> lowIndividualNetScores = new List<GolfScoreViewModel>();

            // map each hole to the current low value and player who got it. If more than one, PlayerScoreViewModel is null.
            Dictionary<int, Tuple<int, GolfScoreViewModel>> holeSkins = new Dictionary<int, Tuple<int, GolfScoreViewModel>>();

            int currentLowScore = int.MaxValue;
            int currentLowNetScore = int.MaxValue;

            foreach (var matchResult in matchResults)
            {
                List<GolfScoreViewModel> allScores = new List<GolfScoreViewModel>(matchResult.Team1Scores);
                allScores.AddRange(matchResult.Team2Scores);

                // find low score/top sandbagger/skins
                foreach (var teamScore in allScores)
                {
                    if (!teamScore.InitialAbsent)
                    {
                        // skins
                        for (int i = 1; i <= matchResult.NumberHolesPlayed; i++)
                        {
                            int holeScore = teamScore.HoleScore(i);

                            if (!holeSkins.ContainsKey(i) || holeScore < holeSkins[i].Item1)
                            {
                                holeSkins[i] = new Tuple<int, GolfScoreViewModel>(holeScore, teamScore);
                            }
                            else if (holeSkins[i].Item1 == holeScore)
                            {
                                // another player with same score, can't be skin.
                                holeSkins[i] = new Tuple<int, GolfScoreViewModel>(holeScore, null);
                            }
                        }

                        // actual score:
                        if (teamScore.TotalScore < currentLowScore)
                        {
                            lowIndividualActualScores.Clear();
                            lowIndividualActualScores.Add(teamScore);

                            currentLowScore = teamScore.TotalScore;
                        }
                        else if (teamScore.TotalScore == currentLowScore)
                        {
                            lowIndividualActualScores.Add(teamScore);
                        }

                        // net score:
                        if (teamScore.TotalNetScore < currentLowNetScore)
                        {
                            lowIndividualNetScores.Clear();
                            lowIndividualNetScores.Add(teamScore);

                            currentLowNetScore = teamScore.TotalNetScore;
                        }
                        else if (teamScore.TotalNetScore == currentLowNetScore)
                        {
                            lowIndividualNetScores.Add(teamScore);
                        }
                    }
                }

                // there really shouldn't be regular season matches the same
                // time as playoffs, but just in case, assume both could exist.
                if (matchResult.MatchType == 0) // regular season
                {
                    teamScores.Add(new TeamScore(matchResult.Team1Id, matchResult.Team1MatchPoints, matchResult.Team1NetScore));
                    teamScores.Add(new TeamScore(matchResult.Team2Id, matchResult.Team2MatchPoints, matchResult.Team2NetScore));
                }
                else if (matchResult.MatchType == 1) // playoffs
                {
                    playoffResults.Add(ProcessPlayoffResult(matchResult));
                }
            }

            PlayoffResults = playoffResults;

            List<PlayerScoreViewModel> lowScores = new List<PlayerScoreViewModel>();

            // create view model to show low score
            foreach (var playerScore in lowIndividualActualScores)
            {
                lowScores.Add(new PlayerScoreViewModel(playerScore.PlayerId, playerScore.PlayerName, playerScore.TotalScore));
            }

            LowActualScores = lowScores;

            List<PlayerScoreViewModel> lowNetScores = new List<PlayerScoreViewModel>();

            // create view model to show low net score
            foreach (var playerScore in lowIndividualNetScores)
            {
                lowNetScores.Add(new PlayerScoreViewModel(playerScore.PlayerId, playerScore.PlayerName, playerScore.TotalNetScore));
            }

            LowNetScores = lowNetScores;

            // create view model to show skins
            List<PlayerHoleSkinViewModel> playerSkins = new List<PlayerHoleSkinViewModel>();
            foreach (var holeSkin in holeSkins)
            {
                if (holeSkin.Value.Item2 != null)
                {
                    playerSkins.Add(new PlayerHoleSkinViewModel(holeSkin.Value.Item2.PlayerId, holeSkin.Value.Item2.PlayerName, holeSkin.Key, holeSkin.Value.Item1));
                }
            }

            PlayerSkins = playerSkins;

            // process regular season point standings.
            if (teamScores.Count > 0)
            {
                // determine net score points. 9 for lowest net score, 8 for next, etc.
                teamScores.Sort(new NetScoreComparer());

                double strokePoints = 9.0;

                int previousNetScore = teamScores[0].TotalNetScore;

                List<TeamScore> pendingScore = new List<TeamScore>();

                foreach (var ts in teamScores)
                {
                    if (previousNetScore != ts.TotalNetScore)
                    {
                        // handle ties.
                        ProcessPendingScores(pendingScore, ref strokePoints);
                        pendingScore.Clear();
                    }

                    pendingScore.Add(ts);
                    previousNetScore = ts.TotalNetScore;
                }

                // process remaining ties.
                ProcessPendingScores(pendingScore, ref strokePoints);

                teamScores.Sort(new TotalPointsComparer());
            }

            TeamScores = teamScores;
        }

        /// <summary>
        /// playoffs are match play against other team. Team gets either a 
        /// win or loss, nothing else. Tie is lowest net score, Next is lowest
        /// net score for a player.
        /// </summary>
        /// <param name="matchResult"></param>
        private PlayoffResult ProcessPlayoffResult(MatchResultsViewModel matchResult)
        {
            bool isTeam1Winner;

            // match points tied, go to first tie-breaker.
            if (matchResult.Team1MatchPoints == matchResult.Team2MatchPoints)
            {
                // net score is tied, go to second tie-breaker
                if (matchResult.Team1NetScore == matchResult.Team2NetScore)
                {
                    isTeam1Winner = true;
                }
                else
                {
                    // lowest net score wins.
                    isTeam1Winner = matchResult.Team1NetScore < matchResult.Team2NetScore;
                }
            }
            else
            {
                // most match points wins.
                isTeam1Winner = matchResult.Team1MatchPoints > matchResult.Team2MatchPoints;
            }

            return new PlayoffResult(matchResult, isTeam1Winner);
        }

        private void ProcessPendingScores(IList<TeamScore> pendingScore, ref double strokePoints)
        {
            int numberTies = pendingScore.Count;
            double pointsPerTeam = 0.0;
            for (int i = 0; i < numberTies; ++i)
            {
                pointsPerTeam += strokePoints--;
            }

            pointsPerTeam /= numberTies;

            foreach (var ps in pendingScore)
            {
                ps.StrokePoints = pointsPerTeam;
            }
        }
    }

    public class NetScoreComparer : IComparer<TeamScore>
    {
        public int Compare(TeamScore x, TeamScore y)
        {
            if (x.TotalNetScore == y.TotalNetScore)
                return 0;

            return (x.TotalNetScore > y.TotalNetScore ? 1 : -1);
        }
    }

    public class TotalPointsComparer : IComparer<TeamScore>
    {
        public int Compare(TeamScore x, TeamScore y)
        {
            if (x.TotalPoints == y.TotalPoints)
                return 0;

            return (x.TotalPoints > y.TotalPoints ? -1 : 1);
        }
    }

    public class TeamScore
    {
        string m_teamName = null;

        public TeamScore(long teamId, double matchPoints, int netScore)
        {
            TeamId = teamId;

            MatchPoints = matchPoints;
            TotalNetScore = netScore;
        }

        [DisplayName("Match")]
        public double MatchPoints { get; private set; }

        [DisplayName("Net Score")]
        public int TotalNetScore { get; private set; }

        [ScaffoldColumn(false)]
        public long TeamId { get; private set; }

        [DisplayName("Team")]
        public string TeamName
        {
            get
            {
                if (m_teamName == null)
                    m_teamName = DataAccess.Teams.GetTeamName(TeamId);

                return m_teamName;
            }
        }

        [DisplayName("Stroke")]
        public double StrokePoints { get; set; }

        [DisplayName("Total")]
        public double TotalPoints
        {
            get
            {
                return MatchPoints + StrokePoints;
            }
        }
    }

    public class PlayoffResult
    {
        public PlayoffResult(MatchResultsViewModel matchResult, bool isTeam1Winner)
        {
            IsTeam1Winner = isTeam1Winner;
            MatchResults = matchResult;
            Team1 = DataAccess.Teams.GetTeamName(matchResult.Team1Id);
            Team2 = DataAccess.Teams.GetTeamName(matchResult.Team2Id);
        }

        public string Team1 { get; private set; }
        public string Team2 { get; private set; }
        public bool IsTeam1Winner { get; private set; }

        public MatchResultsViewModel MatchResults { get; private set; }
    }
}