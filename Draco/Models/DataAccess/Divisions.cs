using ModelObjects;
using SportsManager;
using System.Collections.Generic;
using System.Linq;

namespace DataAccess
{
	/// <summary>
	/// Summary description for Divisions
	/// </summary>
	static public class Divisions
	{
        static public IQueryable<Division> GetDivisions(long leagueId)
        {
            DB db = DBConnection.GetContext();
            return (from ds in db.DivisionSeasons
                    join dd in db.DivisionDefs on ds.DivisionId equals dd.Id
                    where ds.LeagueSeasonId == leagueId
                    orderby ds.Priority ascending, dd.Name ascending
                    select new Division(ds.Id, leagueId, dd.Name, ds.Priority, dd.AccountId));
        }

		static public bool ModifyDivision(Division division)
		{
            //DECLARE @divisionId bigint
            //SET @divisionId = (SELECT DivisionID From DivisionSeason WHERE DivisionSeason.ID = @divisionSeasonId)

            //Update DivisionSeason SET Priority = @priority WHERE ID = @divisionSeasonId
            //Update DivisionDefs SET Name = @divisionName WHERE ID = @divisionId
            DB db = DBConnection.GetContext();

            var divisionId = (from ds in db.DivisionSeasons
                              where ds.Id == division.Id
                              select ds.DivisionId).SingleOrDefault();

            var dbDivSeason = (from ds in db.DivisionSeasons
                               where ds.Id == division.Id
                               select ds).SingleOrDefault();
            if (dbDivSeason != null)
            {
                dbDivSeason.Priority = division.Priority;
            }

            var dbDivDef = (from dd in db.DivisionDefs
                            where dd.Id == division.Id
                            select dd).SingleOrDefault();
            if (dbDivDef != null)
            {
                dbDivDef.Name = division.Name;
            }

            db.SubmitChanges();
            return true;
		}

		static public long AddDivision(Division d)
		{
            if (d.AccountId <= 0 || d.LeagueId <= 0)
                return 0;

            DB db = DBConnection.GetContext();

            var divisionDef = new SportsManager.Model.DivisionDef()
            {
                AccountId = d.AccountId,
                Name = d.Name
            };

            db.DivisionDefs.InsertOnSubmit(divisionDef);
            db.SubmitChanges();

            var divisionSeason = new SportsManager.Model.DivisionSeason()
            {
                DivisionId = divisionDef.Id,
                LeagueSeasonId = d.LeagueId,
                Priority = d.Priority
            };

            db.DivisionSeasons.InsertOnSubmit(divisionSeason);
            db.SubmitChanges();

            d.Id = divisionSeason.Id;

            return d.Id;
		}

		static public void RemoveLeagueDivisions(long leagueId)
		{
			var divisions = Divisions.GetDivisions(leagueId);
			foreach (Division d in divisions)
			{
				Divisions.RemoveDivision(d.Id);
			}
		}

		static public bool RemoveDivision(long divisionSeasonId)
		{
            //DECLARE @divisionId bigint
            //SET @divisionId = (SELECT DivisionId FROM DivisionSeason WHERE Id = @divisionSeasonId)
	
            //DELETE FROM DivisionSeason WHERE Id = @divisionSeasonId
            //UPDATE TeamsSeason SET DivisionSeasonId=0 WHERE DivisionSeasonId = @divisionSeasonId
	
            //DECLARE @divCount int
            //SET @divCount = (SELECT Count(*) FROM DivisionSeason WHERE DivisionId = @divisionId)
	
            //IF @divCount = 0
            //    DELETE FROM DivisionDefs WHERE ID = @divisionId

            DB db = DBConnection.GetContext();

            var divSeason = (from ds in db.DivisionSeasons
                              where ds.Id == divisionSeasonId
                              select ds).SingleOrDefault();
            if (divSeason == null)
                return false;

            db.DivisionSeasons.DeleteOnSubmit(divSeason);

            db.SubmitChanges();

            var teamSeasons = (from ts in db.TeamsSeasons
                               where ts.DivisionSeasonId == divisionSeasonId
                               select ts);
            foreach (var teamSeason in teamSeasons)
            {
                teamSeason.DivisionSeasonId = 0;
            }

            db.SubmitChanges();

            bool divisionInUse = (from ds in db.DivisionSeasons
                                  where ds.DivisionId == divisionSeasonId
                                  select ds).Any();
            if (!divisionInUse)
            {
                db.DivisionDefs.DeleteOnSubmit(db.DivisionDefs.Where(dd => dd.Id == divSeason.DivisionId).SingleOrDefault());
            }

            db.SubmitChanges();
            return true;
		}

		static public bool RemoveUnusedDivisions(long accountId)
		{
            DB db = DBConnection.GetContext();

			var accountDivisions = (from ds in db.DivisionSeasons
									select ds.DivisionId).Distinct();

			var unusedDivisions = (from dd in db.DivisionDefs
								   where dd.AccountId == accountId && !accountDivisions.Contains(dd.Id)
								   select dd);

			db.DivisionDefs.DeleteAllOnSubmit(unusedDivisions);

			return true;
		}

		static public bool CopySeasonDivision(long leagueSeasonId, long copyLeagueSeasonId)
		{
            DB db = DBConnection.GetContext();

            var divisions = (from ds in db.DivisionSeasons
                             where ds.LeagueSeasonId == copyLeagueSeasonId
                             select ds);
            List<SportsManager.Model.DivisionSeason> newDivSeasons = new List<SportsManager.Model.DivisionSeason>();
            foreach (var div in divisions)
            {
                newDivSeasons.Add(new SportsManager.Model.DivisionSeason()
                    {
                        DivisionId = div.DivisionId,
                        LeagueSeasonId = leagueSeasonId,
                        Priority = div.Priority
                    });
            }

            db.DivisionSeasons.InsertAllOnSubmit(newDivSeasons);
            db.SubmitChanges();

			return true;
		}
	}
}
