using ModelObjects;
using SportsManager.Controllers;
using SportsManager.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace SportsManager.Golf
{
    public static class DBExtensions
    {
        /// <summary>
        /// Utililty to hold 2 9 hole score values for calculating a handicap.
        /// </summary>
        private class GolfScoreDouble
        {
            public GolfScore Score1 { get; set; }
            public GolfScore Score2 { get; set; }

            public GolfScoreDouble(GolfScore score1)
            {
                Score1 = score1;
                Score2 = null;
            }

            public GolfScoreDouble(GolfScore score1, GolfScore score2)
            {
                Score1 = score1;
                Score2 = score2;
            }

            public double? m_differential = null;
            public double Differential
            {
                get
                {
                    if (m_differential == null)
                    {
                        // ratings should return 9 hole rating since that is what was played,
                        // take the average of the slopes.
                        m_differential = GolfScore.CalculateDifferential(Score1.TotalESCScore(true) + Score2.TotalESCScore(true), Score1.GetRating() / 2.0 + Score2.GetRating() / 2.0, (Score1.GetSlope() + Score2.GetSlope()) / 2);
                    }

                    return m_differential.Value;
                }
            }
        }

        public static double? CalculateHandicapIndexOnDate(this IDb db, long contactId, DateTime beforeDate, bool for9Holes = false)
        {
            double? handIndex = null;

            if (for9Holes)
            {
                var last20Rounds = (from gs in db.Db.GolfScores
                                    where gs.ContactId == contactId && gs.DatePlayed <= beforeDate && gs.HolesPlayed == 9
                                    orderby gs.DatePlayed descending
                                    select gs).Take(20);

                handIndex = CalculateHandicapIndex9(last20Rounds);
            }
            else
            {
                var last40Rounds = (from gs in db.Db.GolfScores
                                    where gs.ContactId == contactId && gs.DatePlayed <= beforeDate
                                    orderby gs.DatePlayed descending
                                    select gs).Take(40);

                handIndex = CalculateHandicapIndex(last40Rounds);
            }

            return handIndex;
        }

        public static double? CalculateHandicapIndex(this IDb db, long contactId, bool for9Holes = false)
        {
            double? handIndex = null;

            if (for9Holes)
            {
                // 9 hole handicaps will only include 9 hole scores.
                var last20Rounds = (from gs in db.Db.GolfScores
                                    where gs.ContactId == contactId && gs.HolesPlayed == 9
                                    orderby gs.DatePlayed descending
                                    select gs).Take(20);

                handIndex = CalculateHandicapIndex9(last20Rounds);
            }
            else
            {
                var last40Rounds = (from gs in db.Db.GolfScores
                                    where gs.ContactId == contactId
                                    orderby gs.DatePlayed descending
                                    select gs).Take(40);

                handIndex = CalculateHandicapIndex(last40Rounds);
            }

            return handIndex;
        }

        public static GolfTeeInformation GetDefaultCourseTee(this IDb db, long accountId, long courseId, bool forWoman)
        {
            long? teeId = (from gls in db.Db.GolfLeagueCourses
                           where gls.AccountId == accountId && gls.CourseId == courseId
                           select forWoman ? gls.DefaultWomansTee : gls.DefaultMensTee).SingleOrDefault();

            if (teeId.HasValue)
                return (from ti in db.Db.GolfTeeInformations
                        where ti.Id == teeId.Value
                        select ti).SingleOrDefault();
            else
                return null;
        }

        public static IQueryable<GolfRoster> GetRoster(this IDb db, long teamSeasonId)
        {
            return (from gr in db.Db.GolfRosters
                    where gr.TeamSeasonId == teamSeasonId && gr.IsActive == true
                    select gr);
        }

        public static IQueryable<GolfRoster> GetSubs(this IDb db, long seasonId)
        {
            return (from gr in db.Db.GolfRosters
                    where gr.IsSub && gr.SubSeasonId == seasonId && gr.IsActive == true
                    select gr);
        }

        static public IQueryable<GolfMatch> GetCompletedMatches(this IDb db, long flightId)
        {
            return (from gm in db.Db.GolfMatches
                    where gm.LeagueId == flightId && gm.MatchStatus == 1
                    orderby gm.MatchDate
                    select gm);
        }

        static public IQueryable<GolfMatch> GetCompletedMatches(this IDb db, long flightId, DateTime onDate)
        {
            return (from gm in db.Db.GolfMatches
                    where gm.LeagueId == flightId && gm.MatchDate == onDate && gm.MatchStatus == 1
                    select gm);
        }

        static public IEnumerable<GolfMatch> GetMostRecentUncompleted(this IDb db, long flightId)
        {
            var recentMatch = (from gm in db.Db.GolfMatches
                               where gm.LeagueId == flightId && gm.MatchStatus == 0
                               orderby gm.MatchDate ascending
                               select gm).FirstOrDefault();

            if (recentMatch != null)
                return (from gm in db.Db.GolfMatches
                        where gm.LeagueId == flightId && recentMatch.MatchDate == gm.MatchDate
                        orderby gm.MatchDate ascending
                        select gm);

            return new List<GolfMatch>();
        }

        static public DateTime GetMostRecentUncompletedDate(this IDb db, long flightId)
        {
            return (from gm in db.Db.GolfMatches
                    where gm.LeagueId == flightId && gm.MatchStatus == 0
                    orderby gm.MatchDate ascending
                    select gm.MatchDate).FirstOrDefault();
        }


        private static double? CalculateHandicapIndex9(IEnumerable<GolfScore> last20Rounds)
        {
            int count = last20Rounds.Count();
            if (count == 0)
                return null;

            int lowestScoresUsed = GetLowestScoresToUse(last20Rounds.Count());

            var diffs = (from gs in last20Rounds
                         select GolfScore.CalculateDifferential(gs.TotalESCScore(true), gs.GetRating() / 2.0, gs.GetSlope()));

            return CalculateHandicapIndex(diffs.OrderBy(o => o).Take(lowestScoresUsed).ToList());
        }

        private static double? CalculateHandicapIndex(IEnumerable<GolfScore> last40Rounds)
        {
            List<GolfScoreDouble> last20Rounds = new List<GolfScoreDouble>();

            GolfScore pending9HoleScore = null;

            foreach (GolfScore gs in last40Rounds)
            {
                if (gs.HolesPlayed != (int)GolfScore.eHolesPlayed.Eighteen)
                {
                    if (pending9HoleScore == null)
                    {
                        pending9HoleScore = gs;
                    }
                    else
                    {
                        last20Rounds.Add(new GolfScoreDouble(pending9HoleScore, gs));
                        pending9HoleScore = null;
                    }
                }
                else
                {
                    last20Rounds.Add(new GolfScoreDouble(gs));
                }

                if (last20Rounds.Count == 20)
                    break;
            }

            if (last20Rounds.Count == 0)
                return null;

            int lowestScoresUsed = GetLowestScoresToUse(last20Rounds.Count);


            // sort scores and take lowest.
            var lowestScores = (from gd in last20Rounds
                                orderby gd.Differential ascending
                                select gd.Differential).Take(lowestScoresUsed).ToList();

            return CalculateHandicapIndex(lowestScores);
        }

        private static double CalculateHandicapIndex(ICollection<double> diffScores)
        {
            double totalDiffs = 0.0;

            foreach (double diffScore in diffScores)
                totalDiffs += diffScore;

            return GolfScore.CalculateIndex(totalDiffs, diffScores.Count);
        }

        public static GolfMatch GetMostRecentCompleted(this IDb db, long flightId)
        {
            return (from gm in db.Db.GolfMatches
                    where gm.LeagueId == flightId && gm.MatchStatus == 1
                    orderby gm.MatchDate descending
                    select gm).FirstOrDefault();
        }

        public static int GetLowestScoresToUse(int numScores)
        {
            int lowestScoresUsed = 0;

            if (numScores <= 6)
                lowestScoresUsed = 1;
            else if (numScores <= 8)
                lowestScoresUsed = 2;
            else if (numScores <= 10)
                lowestScoresUsed = 3;
            else if (numScores <= 12)
                lowestScoresUsed = 4;
            else if (numScores <= 14)
                lowestScoresUsed = 5;
            else if (numScores <= 16)
                lowestScoresUsed = 6;
            else if (numScores == 17)
                lowestScoresUsed = 7;
            else if (numScores == 18)
                lowestScoresUsed = 8;
            else if (numScores <= 19)
                lowestScoresUsed = 9;
            else if (numScores == 20)
                lowestScoresUsed = 10;

            return lowestScoresUsed;
        }
    }
}