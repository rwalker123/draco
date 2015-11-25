using System;
using System.Collections.Generic;
using System.Linq;
using SportsManager;
using SportsManager.Model;

namespace DataAccess.Golf
{
    public class GolfMatches
    {
        static public IEnumerable<GolfMatch> GetMatches(long flightId)
        {
            DB db = DBConnection.GetContext();

            return (from a in db.GolfMatches
                    where a.LeagueId == flightId
                    select a);
        }

        static public GolfMatch GetMostRecentCompleted(long flightId)
        {
            DB db = DBConnection.GetContext();

            return (from gm in db.GolfMatches
                    where gm.LeagueId == flightId && gm.MatchStatus == 1
                    orderby gm.MatchDate descending
                    select gm).FirstOrDefault();
        }

        static public IEnumerable<GolfMatch> GetMostRecentUncompleted(long flightId)
        {
            DB db = DBConnection.GetContext();

            var recentMatch = (from gm in db.GolfMatches
                               where gm.LeagueId == flightId && gm.MatchStatus == 0
                               orderby gm.MatchDate ascending
                               select gm).FirstOrDefault();

            if (recentMatch != null)
                return (from gm in db.GolfMatches
                        where gm.LeagueId == flightId && recentMatch.MatchDate == gm.MatchDate
                        orderby gm.MatchDate ascending
                        select gm);

            return new List<GolfMatch>();
        }

        static public DateTime GetMostRecentUncompletedDate(long flightId)
        {
            DB db = DBConnection.GetContext();

            return (from gm in db.GolfMatches
                    where gm.LeagueId == flightId && gm.MatchStatus == 0
                    orderby gm.MatchDate ascending
                    select gm.MatchDate).FirstOrDefault();
        }

        static public IEnumerable<DateTime> GetCompletedMatchesDateRegularSeason(long flightId)
        {
            DB db = DBConnection.GetContext();

            return (from gm in db.GolfMatches
                    where gm.LeagueId == flightId && gm.MatchStatus == 1 && gm.MatchType == 0
                    select gm.MatchDate).Distinct();
        }

        static public IEnumerable<DateTime> GetCompletedMatchesDate(long flightId)
        {
            DB db = DBConnection.GetContext();

            return (from gm in db.GolfMatches
                    where gm.LeagueId == flightId && gm.MatchStatus == 1
                    select gm.MatchDate).Distinct();
        }

        static public IEnumerable<GolfMatchScore> GetCompletedMatchScores(long flightId)
        {
            DB db = DBConnection.GetContext();

            return (from gm in db.GolfMatches
                    join gms in db.GolfMatchScores on gm.Id equals gms.MatchId
                    join gs in db.GolfScores on gms.ScoreId equals gs.Id
                    where gm.LeagueId == flightId && gm.MatchStatus == 1
                    orderby gm.MatchDate
                    select gms);

        }

        static public IEnumerable<GolfMatch> GetCompletedMatches(long flightId)
        {
            DB db = DBConnection.GetContext();

            return (from gm in db.GolfMatches
                    where gm.LeagueId == flightId && gm.MatchStatus == 1
                    orderby gm.MatchDate
                    select gm);
        }

        static public IEnumerable<GolfMatch> GetCompletedMatchesForTeam(long teamSeasonId)
        {
            DB db = DBConnection.GetContext();

            return (from gm in db.GolfMatches
                    where (gm.Team1 == teamSeasonId || gm.Team2 == teamSeasonId) && gm.MatchStatus == 1
                    orderby gm.MatchDate
                    select gm);
        }

        static public IEnumerable<GolfMatch> GetNotCompletedMatches(long flightId)
        {
            DB db = DBConnection.GetContext();

            return (from gm in db.GolfMatches
                    where gm.LeagueId == flightId && gm.MatchStatus != 1
                    orderby gm.MatchDate
                    select gm);
        }

        static public IEnumerable<GolfMatch> GetNotCompletedMatchesForTeam(long teamSeasonId)
        {
            DB db = DBConnection.GetContext();

            return (from gm in db.GolfMatches
                    where (gm.Team1 == teamSeasonId || gm.Team2 == teamSeasonId) && gm.MatchStatus != 1
                    orderby gm.MatchDate
                    select gm);
        }

        static public IEnumerable<GolfMatch> GetCompletedMatchesRegularSeason(long flightId, DateTime onDate)
        {
            DB db = DBConnection.GetContext();

            return (from gm in db.GolfMatches
                    where gm.LeagueId == flightId && gm.MatchDate == onDate && gm.MatchStatus == 1 && gm.MatchType == 0
                    select gm);
        }

        static public IEnumerable<GolfMatch> GetCompletedMatches(long flightId, DateTime onDate)
        {
            DB db = DBConnection.GetContext();

            return (from gm in db.GolfMatches
                    where gm.LeagueId == flightId && gm.MatchDate == onDate && gm.MatchStatus == 1
                    select gm);
        }

        static public long AddMatch(GolfMatch gm)
        {
            DB db = DBConnection.GetContext();

            db.GolfMatches.InsertOnSubmit(gm);
            db.SubmitChanges();

            return gm.Id;
        }

        static public bool UpdateMatch(GolfMatch golfMatch, bool updateStatus = true)
        {
            DB db = DBConnection.GetContext();

            GolfMatch dbGolfMatch = (from gm in db.GolfMatches
                                     where gm.Id == golfMatch.Id
                                     select gm).SingleOrDefault();
            if (dbGolfMatch == null)
                return false;

            dbGolfMatch.MatchDate = golfMatch.MatchDate;
            dbGolfMatch.MatchTime = golfMatch.MatchTime;
            dbGolfMatch.MatchType = golfMatch.MatchType;
            if (updateStatus)
                dbGolfMatch.MatchStatus = golfMatch.MatchStatus;
            dbGolfMatch.Team1 = golfMatch.Team1;
            dbGolfMatch.Team2 = golfMatch.Team2;
            dbGolfMatch.CourseId = golfMatch.CourseId;
            dbGolfMatch.Comment = golfMatch.Comment;

            // if any of these change any results have to be removed.
            if (dbGolfMatch.Team1 != golfMatch.Team1 ||
                dbGolfMatch.Team2 != golfMatch.Team2 ||
                dbGolfMatch.CourseId != golfMatch.CourseId)
            {
                var matchScores = (from gms in db.GolfMatchScores
                                   where gms.MatchId == dbGolfMatch.Id
                                   select gms);

                var golfScores = (from gms in db.GolfMatchScores
                                  join gs in db.GolfScores on gms.ScoreId equals gs.Id
                                  where gms.MatchId == dbGolfMatch.Id
                                  select gs);

                db.GolfScores.DeleteAllOnSubmit(golfScores);
                db.GolfMatchScores.DeleteAllOnSubmit(matchScores);

                golfMatch.MatchStatus = 0;
            }
            // if date changes update the scores DatePlayed.
            else if (dbGolfMatch.MatchDate != golfMatch.MatchDate)
            {
                var golfScores = (from gms in db.GolfMatchScores
                                  join gs in db.GolfScores on gms.ScoreId equals gs.Id
                                  where gms.MatchId == dbGolfMatch.Id
                                  select gs);

                foreach (GolfScore score in golfScores)
                {
                    score.DatePlayed = golfMatch.MatchDate;
                }
            }

            db.SubmitChanges();

            return true;
        }

        static public bool UpdateMatchScores(GolfMatch match, IDictionary<long, Dictionary<long, GolfScore>> teamIdToRosterPlayerScores)
        {
            DB db = DBConnection.GetContext();

            // remove all existing match scores, assume the scores passed in are entire set for match.
            var oldMatchScores = (from gm in db.GolfMatchScores
                                  where gm.MatchId == match.Id
                                  select gm);

            var oldGolfScores = (from gm in db.GolfMatchScores
                                 join gs in db.GolfScores on gm.ScoreId equals gs.Id
                                 where gm.MatchId == match.Id
                                 select gs);

            db.GolfMatchScores.DeleteAllOnSubmit(oldMatchScores);
            db.GolfScores.DeleteAllOnSubmit(oldGolfScores);
            db.SubmitChanges();

            foreach (var t in teamIdToRosterPlayerScores)
            {
                foreach (var r in t.Value)
                {
                    GolfScore gs = r.Value;

                    // get the start index to use for this round.
                    gs.StartIndex = GolfScores.CalculateHandicapIndexOnDate(gs.ContactId, gs.DatePlayed);
                    gs.StartIndex9 = GolfScores.CalculateHandicapIndexOnDate(gs.ContactId, gs.DatePlayed, for9Holes: true);
                    db.GolfScores.InsertOnSubmit(gs);
                    db.SubmitChanges();

                    // update future scores.
                    GolfScores.UpdateIndexForSubsequentScores(gs);

                    GolfMatchScore gms = new GolfMatchScore()
                    {
                        MatchId = match.Id,
                        TeamId = t.Key,
                        PlayerId = r.Key,
                        ScoreId = gs.Id
                    };

                    db.GolfMatchScores.InsertOnSubmit(gms);
                }
            }

            db.SubmitChanges();

            return true;
        }

        static public bool RemoveMatch(long matchId)
        {
            DB db = DBConnection.GetContext();

            GolfMatch dbGolfMatch = (from gm in db.GolfMatches
                                     where gm.Id == matchId
                                     select gm).SingleOrDefault();
            if (dbGolfMatch == null)
                return false;

            // remove scores entered for this match.
            var golfMatchScores = (from gms in db.GolfMatchScores
                                   where gms.MatchId == dbGolfMatch.Id
                                   select gms);

            var golfScores = (from gms in db.GolfMatchScores
                              join gs in db.GolfScores on gms.ScoreId equals gs.Id
                              where gms.MatchId == dbGolfMatch.Id
                              select gs);

            db.GolfScores.DeleteAllOnSubmit(golfScores);
            db.GolfMatchScores.DeleteAllOnSubmit(golfMatchScores);
            db.GolfMatches.DeleteOnSubmit(dbGolfMatch);

            db.SubmitChanges();

            return true;
        }

        static public GolfMatch GetMatch(long id)
        {
            DB db = DBConnection.GetContext();

            return (from m in db.GolfMatches
                    where m.Id == id
                    select m).SingleOrDefault();
        }

        static public IEnumerable<GolfMatchScore> GetMatchResults(long id)
        {
            DB db = DBConnection.GetContext();

            return (from gms in db.GolfMatchScores
                    where gms.MatchId == id
                    select gms);
        }

    }
}