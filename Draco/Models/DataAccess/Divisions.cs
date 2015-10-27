using ModelObjects;
using System.Collections.Generic;
using System.Linq;

namespace DataAccess
{
	/// <summary>
	/// Summary description for Divisions
	/// </summary>
	static public class Divisions
	{
        static public IQueryable<DivisionSeason> GetDivisions(long leagueId)
        {
            using (var db = DBConnection.GetContext())
            {
                return (from ds in db.DivisionSeasons
                        join dd in db.DivisionDefs on ds.DivisionId equals dd.Id
                        where ds.LeagueSeasonId == leagueId
                        orderby ds.Priority ascending, dd.Name ascending
                        select ds);
            }
        }

        static public bool ModifyDivision(DivisionDefinition division)
        {
            // TODO: dependency injection for DB
            // How to attach if not attached
            // Should DataAccess "Save" changes or caller.
        }

		static public bool ModifyDivision(DivisionSeason division)
		{
            //DECLARE @divisionId bigint
            //SET @divisionId = (SELECT DivisionID From DivisionSeason WHERE DivisionSeason.ID = @divisionSeasonId)

            //Update DivisionSeason SET Priority = @priority WHERE ID = @divisionSeasonId
            //Update DivisionDefs SET Name = @divisionName WHERE ID = @divisionId
            using (DB db = DBConnection.GetContext())
            {
                db.DivisionSeasons.Attach(division);
                db.Entry(division).State = System.Data.Entity.EntityState.Modified;

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

                db.SaveChanges();
                return true;
            }
		}

		static public long AddDivision(DivisionSeason d)
		{
            if (d.DivisionDef == null || d.DivisionDef.AccountId <= 0 || d.LeagueSeasonId <= 0)
                return 0;

            DB db = DBConnection.GetContext();

            var divisionDef = new DivisionDefinition()
            {
                AccountId = d.DivisionDef.AccountId,
                Name = d.DivisionDef.Name
            };

            db.DivisionDefs.Add(divisionDef);
            db.SaveChanges();

            var divisionSeason = new DivisionSeason()
            {
                DivisionId = divisionDef.Id,
                LeagueSeasonId = d.LeagueSeasonId,
                Priority = d.Priority
            };

            db.DivisionSeasons.InsertOnSubmit(divisionSeason);
            db.SaveChanges();

            d.Id = divisionSeason.Id;

            return d.Id;
		}

		static public void RemoveLeagueDivisions(long leagueId)
		{
			var divisions = Divisions.GetDivisions(leagueId);
			foreach (DivisionSeason d in divisions)
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

            db.SaveChanges();

            var teamSeasons = (from ts in db.TeamsSeasons
                               where ts.DivisionSeasonId == divisionSeasonId
                               select ts);
            foreach (var teamSeason in teamSeasons)
            {
                teamSeason.DivisionSeasonId = 0;
            }

            db.SaveChanges();

            bool divisionInUse = (from ds in db.DivisionSeasons
                                  where ds.DivisionId == divisionSeasonId
                                  select ds).Any();
            if (!divisionInUse)
            {
                db.DivisionDefs.DeleteOnSubmit(db.DivisionDefs.Where(dd => dd.Id == divSeason.DivisionId).SingleOrDefault());
            }

            db.SaveChanges();
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
            List<DivisionSeason> newDivSeasons = new List<DivisionSeason>();
            foreach (var div in divisions)
            {
                newDivSeasons.Add(new DivisionSeason()
                    {
                        DivisionId = div.DivisionId,
                        LeagueSeasonId = leagueSeasonId,
                        Priority = div.Priority
                    });
            }

            db.DivisionSeasons.InsertAllOnSubmit(newDivSeasons);
            db.SaveChanges();

			return true;
		}
	}
}
