using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using SportsManager.Model;
using SportsManager.ViewModels;
using System.Web.Mvc;

namespace SportsManager.Golf.ViewModels
{
    public class LeagueHomeViewModel : AccountViewModel
    {
        public LeagueHomeViewModel(Controller c, long accountId, long seasonId)
            : base(c, accountId)
        {
            Season = DataAccess.Seasons.GetSeason(seasonId);
        }

        public ModelObjects.Season Season
        {
            get;
            private set;
        }

        public IEnumerable<FlightViewModel> RetrieveFlights()
        {
            IEnumerable<ModelObjects.League> flights = DataAccess.Leagues.GetLeagues(Season.Id);

            return (from f in flights
                    select new FlightViewModel(AccountId, Season.Id, f.Id)
                    {
                        Name = f.Name
                    });
        }

        /// <summary>
        /// Get the results from the most recently completed matches.
        /// </summary>
        /// <param name="flightId"></param>
        /// <returns></returns>
        public LeagueMatchResultsViewModel GetMostRecentlyCompletedMatch(long flightId)
        {
            // get a single recently completed match.
            GolfMatch recentMatch = DataAccess.Golf.GolfMatches.GetMostRecentCompleted(flightId);

            // get all other completed matches on same day as recentMatch above.
            IEnumerable<GolfMatch> matches = DataAccess.Golf.GolfMatches.GetCompletedMatches(flightId, recentMatch.MatchDate);
            CompletedMatches = (from m in matches
                                select new GolfMatchViewModel(m));

            // get the results for the most recent completed match date.
            if (recentMatch != null)
                return new LeagueMatchResultsViewModel(AccountId, flightId, recentMatch.MatchDate);

            return null;
        }

        /// <summary>
        /// Get next match that isn't completed.
        /// </summary>
        /// <param name="flightId"></param>
        /// <returns></returns>
        public IEnumerable<GolfMatchViewModel> GetNextMatch(long flightId)
        {
            IEnumerable<GolfMatch> upcomingMatches = DataAccess.Golf.GolfMatches.GetMostRecentUncompleted(flightId);

            return (from gm in upcomingMatches
                    select new GolfMatchViewModel(gm));
        }

        /// <summary>
        /// The matches that make up the most recently completed matches.
        /// </summary>
        public IEnumerable<GolfMatchViewModel> CompletedMatches { get; private set; }

        public LeagueStandingsViewModel LeagueStandings(long flightId)
        {
            return new LeagueStandingsViewModel(AccountId, Season.Id, flightId);
        }

        public IEnumerable<PlayerHandicapViewModel> GetPlayerHandicaps(long flightId)
        {
            IEnumerable<GolfRoster> allPlayers = DataAccess.Golf.GolfRosters.GetActivePlayers(Season.Id, flightId);

            var playerList = (from p in allPlayers
                              select new PlayerHandicapViewModel(p));

            return (from x in playerList
                    orderby x.HandicapIndex ascending
                    select x);
        }

        public IEnumerable<PlayerHandicapViewModel> GetSubPlayerHandicaps(long flightId)
        {
            IEnumerable<GolfRoster> allPlayers = DataAccess.Golf.GolfRosters.GetSubs(Season.Id);

            var playerList = (from p in allPlayers
                              select new PlayerHandicapViewModel(p));

            return (from x in playerList
                    orderby x.HandicapIndex ascending
                    select x);
        }

        public class PlayerSeasonTotal
        {
            public long PlayerId { get; set; }
            public String PlayerName { get; set; }
            public int Count { get; set; }
        }

        // total up the weekly results.
        IEnumerable<PlayerSeasonTotal> m_lowActualScores = null;
        IEnumerable<PlayerSeasonTotal> m_lowNetScores = null;
        IEnumerable<PlayerSeasonTotal> m_playerSkins = null;


        private void GetSeasonLeaders(long flightId)
        {
            Dictionary<long, PlayerSeasonTotal> lowActualScoresByPlayerId = new Dictionary<long, PlayerSeasonTotal>();
            Dictionary<long, PlayerSeasonTotal> lowNetScoresByPlayerId = new Dictionary<long, PlayerSeasonTotal>();
            Dictionary<long, PlayerSeasonTotal> playerSkinsByPlayerId = new Dictionary<long, PlayerSeasonTotal>();

            IEnumerable<DateTime> completedMatchesDate = DataAccess.Golf.GolfMatches.GetCompletedMatchesDate(flightId);

            // get all unique match dates with a completed match.
            List<LeagueMatchResultsViewModel> weeklyResults = new List<LeagueMatchResultsViewModel>();
            foreach (var matchDate in completedMatchesDate)
            {
                weeklyResults.Add(new LeagueMatchResultsViewModel(AccountId, flightId, matchDate));
            }

            foreach (var matchResults in weeklyResults)
            {
                // get low actual scores.
                foreach (var lowScores in matchResults.LowActualScores)
                {
                    PlayerSeasonTotal curPlayer;
                    if (lowActualScoresByPlayerId.ContainsKey(lowScores.PlayerId))
                    {
                        curPlayer = lowActualScoresByPlayerId[lowScores.PlayerId];
                    }
                    else
                    {
                        curPlayer = new PlayerSeasonTotal()
                        {
                            PlayerId = lowScores.PlayerId,
                            PlayerName = lowScores.PlayerName
                        };

                        lowActualScoresByPlayerId[lowScores.PlayerId] = curPlayer;
                    }

                    curPlayer.Count++;
                }

                // get low net scores.
                foreach (var lowScores in matchResults.LowNetScores)
                {
                    PlayerSeasonTotal curPlayer;
                    if (lowNetScoresByPlayerId.ContainsKey(lowScores.PlayerId))
                    {
                        curPlayer = lowNetScoresByPlayerId[lowScores.PlayerId];
                    }
                    else
                    {
                        curPlayer = new PlayerSeasonTotal()
                        {
                            PlayerId = lowScores.PlayerId,
                            PlayerName = lowScores.PlayerName
                        };

                        lowNetScoresByPlayerId[lowScores.PlayerId] = curPlayer;
                    }

                    curPlayer.Count++;
                }

                // get player skins
                foreach (var skinsWon in matchResults.PlayerSkins)
                {
                    PlayerSeasonTotal curPlayer;
                    if (playerSkinsByPlayerId.ContainsKey(skinsWon.PlayerId))
                    {
                        curPlayer = playerSkinsByPlayerId[skinsWon.PlayerId];
                    }
                    else
                    {
                        curPlayer = new PlayerSeasonTotal()
                        {
                            PlayerId = skinsWon.PlayerId,
                            PlayerName = skinsWon.PlayerName
                        };

                        playerSkinsByPlayerId[skinsWon.PlayerId] = curPlayer;
                    }

                    curPlayer.Count++;
                }
            }

            m_lowActualScores = (from x in lowActualScoresByPlayerId
                                 orderby x.Value.Count descending
                                 select x.Value);

            m_lowNetScores = (from x in lowNetScoresByPlayerId
                              orderby x.Value.Count descending
                              select x.Value);

            m_playerSkins = (from x in playerSkinsByPlayerId
                             orderby x.Value.Count descending
                             select x.Value);
        }

        public IEnumerable<PlayerSeasonTotal> LowActualScoresLeaders(long flightId)
        {
            if (m_lowActualScores == null)
                GetSeasonLeaders(flightId);

            return m_lowActualScores;
        }

        public IEnumerable<PlayerSeasonTotal> LowNetScoresLeaders(long flightId)
        {
            if (m_lowNetScores == null)
                GetSeasonLeaders(flightId);

            return m_lowNetScores;
        }

        public IEnumerable<PlayerSeasonTotal> PlayerSkinsTotals(long flightId)
        {
            if (m_playerSkins == null)
                GetSeasonLeaders(flightId);

            return m_playerSkins;
        }
    }
}