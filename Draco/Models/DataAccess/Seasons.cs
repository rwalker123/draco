using System.Collections.Generic;
using System.Linq;
using ModelObjects;
using SportsManager;
using System.Threading.Tasks;

namespace DataAccess
{
    /// <summary>
    /// Summary description for Seasons
    /// </summary>
    static public class Seasons
    {
        static public Season GetSeason(long seasonId)
        {
            DB db = DBConnection.GetContext();
            return (from s in db.Seasons
                    where s.Id == seasonId
                    select new ModelObjects.Season(s.Id, s.Name, s.AccountId)).SingleOrDefault();
        }

        static public string GetSeasonName(long seasonId)
        {
            DB db = DBConnection.GetContext();
            return (from s in db.Seasons
                    where s.Id == seasonId
                    select s.Name).SingleOrDefault();
        }

        static public long GetCurrentSeason(long accountId)
        {
            DB db = DBConnection.GetContext();
            long seasonId = (from cs in db.CurrentSeasons
                             where cs.AccountId == accountId
                             select cs.SeasonId).SingleOrDefault();

            return seasonId;
        }

        static public string GetCurrentSeasonName(long accountId)
        {
            DB db = DBConnection.GetContext();
            return (from cs in db.CurrentSeasons
                    join s in db.Seasons on cs.AccountId equals s.AccountId
                    where cs.SeasonId == s.Id && cs.AccountId == accountId
                    select s.Name).SingleOrDefault();
        }

        static public void SetCurrentSeason(long curSeasonId, long accountId)
        {
            DB db = DBConnection.GetContext();

            var curSeason = (from cs in db.CurrentSeasons
                             where cs.AccountId == accountId
                             select cs).SingleOrDefault();

            if (curSeasonId == 0)
            {
                if (curSeason != null)
                    db.CurrentSeasons.DeleteOnSubmit(curSeason);
            }
            else if (curSeason == null)
            {
                curSeason = new SportsManager.Model.CurrentSeason()
                {
                    AccountId = accountId,
                    SeasonId = curSeasonId
                };

                db.CurrentSeasons.InsertOnSubmit(curSeason);
            }
            else
            {
                curSeason.SeasonId = curSeasonId;
            }

            db.SubmitChanges();
        }

        static public ICollection<Season> GetSeasons(long accountId)
        {
            DB db = DBConnection.GetContext();

            return (from s in db.Seasons
                    where s.AccountId == accountId
                    select new Season()
                    {
                        Id = s.Id,
                        AccountId = s.AccountId,
                        Name = s.Name
                    }).ToList();
        }

        static public bool ModifySeason(Season s, bool setCurrent = false)
        {
            DB db = DBConnection.GetContext();

            SportsManager.Model.Season dbSeason = (from seas in db.Seasons
                                                   where seas.Id == s.Id
                                                   select seas).SingleOrDefault();
            if (dbSeason == null)
                return false;

            dbSeason.Name = s.Name;
            db.SubmitChanges();

            if (setCurrent)
            {
                DataAccess.Seasons.SetCurrentSeason(s.Id, s.AccountId);
            }

            return true;
        }

        static public long AddSeason(Season s)
        {
            if (s.AccountId <= 0)
                return 0;

            DB db = DBConnection.GetContext();
            SportsManager.Model.Season newSeason = new SportsManager.Model.Season()
            {
                AccountId = s.AccountId,
                Name = s.Name
            };

            db.Seasons.InsertOnSubmit(newSeason);
            db.SubmitChanges();

            return newSeason.Id;
        }

        static public async Task<bool> RemoveAccountSeasons(long accountId)
        {
            var seasons = Seasons.GetSeasons(accountId);
            foreach (Season s in seasons)
            {
                await Seasons.RemoveSeason(s.Id);
            }

            Seasons.RemoveCurrentSeason(accountId);
            return true;
        }

        static public void RemoveCurrentSeason(long accountId)
        {
            DB db = DBConnection.GetContext();
            var season = (from s in db.CurrentSeasons
                          where s.AccountId == accountId
                          select s).SingleOrDefault();
            if (season != null)
            {
                db.CurrentSeasons.DeleteOnSubmit(season);
                db.SubmitChanges();
            }
        }

        static public async Task<bool> RemoveSeason(long id)
        {
            DB db = DBConnection.GetContext();

            SportsManager.Model.Season dbSeason = (from s in db.Seasons
                                                   where id == s.Id
                                                   select s).SingleOrDefault();
            if (dbSeason == null)
                return false;

            long accountId = dbSeason.AccountId;

            await Leagues.RemoveLeagueSeason(dbSeason.Id);

            db.Seasons.DeleteOnSubmit(dbSeason);
            db.SubmitChanges();

            long currentSeason = GetCurrentSeason(accountId);
            if (currentSeason == dbSeason.Id)
                SetCurrentSeason(0, dbSeason.AccountId);

            // do some cleanup.
            Leagues.RemoveUnusedLeagues(accountId);
            Divisions.RemoveUnusedDivisions(accountId);
            Contacts.RemoveUnusedContacts(accountId);

            return true;
        }
    }
}