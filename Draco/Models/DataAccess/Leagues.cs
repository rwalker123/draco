using ModelObjects;
using SportsManager;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Transactions;

namespace DataAccess
{
    /// <summary>
    /// Summary description for Leagues
    /// </summary>
    static public class Leagues
    {
        static public long GetCurrentLeague()
        {
            throw new NotImplementedException();
            //long aId = 0;

            //System.Web.HttpContext context = System.Web.HttpContext.Current;
            //if (context != null)
            //{
            //    aId = DataAccess.Leagues.GetCurrentLeague(context.Session);
            //}

            //return aId;
        }

        static public string GetLeagueNameFromLeagueId(long leagueId)
        {
            DB db = DBConnection.GetContext();

            return (from x in db.Leagues
                    where x.Id == leagueId
                    select x.Name).SingleOrDefault();
        }

        static public string GetLeagueName(long leagueId)
        {
            	//SELECT League.Name FROM LeagueSeason LEFT JOIN League ON (LeagueSeason.LeagueID=League.ID) WHERE LeagueSeason.ID = @leagueId
            DB db = DBConnection.GetContext();

            return (from ls in db.LeagueSeasons
                    join l in db.Leagues on ls.LeagueId equals l.Id
                    where ls.Id == leagueId
                    select l.Name).SingleOrDefault();
        }

        static public League GetLeague(long leagueId)
        {
            DB db = DBConnection.GetContext();
            return (from ls in db.LeagueSeasons
                    join l in db.Leagues on ls.LeagueId equals l.Id
                    where ls.Id == leagueId
                    select new League()
                    {
                        Id = ls.Id,
                        Name = l.Name,
                        AccountId = l.AccountId
                    }).SingleOrDefault();
        }

        static public IQueryable<League> GetLeagues(long seasonId)
        {
            DB db = DBConnection.GetContext();

            return (from ls in db.LeagueSeasons
                    join l in db.Leagues on ls.LeagueId equals l.Id
                    where ls.SeasonId == seasonId
                    select new League()
                    {
                        Id = ls.Id,
                        AccountId = l.AccountId,
                        Name = l.Name
                    });
        }

        static public IQueryable<Team> GetLeagueTeamsFromSeason(long accountId, long? seasonId = null)
        {
            DB db = DBConnection.GetContext();

            long currentSeason = (!seasonId.HasValue || seasonId.Value <= 0) ? DataAccess.Seasons.GetCurrentSeason(accountId) : seasonId.Value;

            return (from ls in db.LeagueSeasons
                    join ts in db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                    where ls.SeasonId == currentSeason
                    orderby ls.League.Name, ts.Name
                    select new Team()
                    {
                        Id = ts.Id,
                        AccountId = accountId,
                        TeamId = ts.TeamId,
                        DivisionId = ts.DivisionSeasonId,
                        LeagueId = ls.LeagueId,
                        Name = ls.League.Name + " " + ts.Name
                    });
        }

        static public IQueryable<League> GetLeaguesFromSeason(long id, bool useAccount)
        {
            DB db = DBConnection.GetContext();

            if (useAccount)
            {
                return (from l in db.Leagues
                        where l.AccountId == id
                        select new League(l.Id, l.Name, l.AccountId));
            }
            else
            {
                return (from ls in db.LeagueSeasons
                        join l in db.Leagues on ls.LeagueId equals l.Id
                        where ls.SeasonId == id
                        select new League(ls.Id, l.Name, l.AccountId));
            }
        }

        static public bool ModifyLeague(League league)
        {
            DB db = DBConnection.GetContext();

            SportsManager.Model.League dbLeague = (from ls in db.LeagueSeasons
                                                   join l in db.Leagues on ls.LeagueId equals l.Id
                                                   where ls.Id == league.Id
                                                   select l).SingleOrDefault();
            if (dbLeague == null)
                return false;

            dbLeague.Name = league.Name;
            db.SubmitChanges();

            return true;
        }

        static public long AddLeague(League newLeague, long seasonId)
        {
            DB db = DBConnection.GetContext();

            // re-use existing league if same name.
            SportsManager.Model.League dbLeague = (from l in db.Leagues
                                                   where l.AccountId == newLeague.AccountId &&
                                                   l.Name == newLeague.Name
                                                   select l).FirstOrDefault();
            if (dbLeague == null)
            {
                dbLeague = new SportsManager.Model.League()
                {
                    AccountId = newLeague.AccountId,
                    Name = newLeague.Name
                };

                db.Leagues.InsertOnSubmit(dbLeague);
                db.SubmitChanges();
            }

            SportsManager.Model.LeagueSeason dbLeagueSeason = new SportsManager.Model.LeagueSeason()
            {
                LeagueId = dbLeague.Id,
                SeasonId = seasonId
            };

            db.LeagueSeasons.InsertOnSubmit(dbLeagueSeason);

            db.SubmitChanges();

            newLeague.Id = dbLeagueSeason.Id;

            return newLeague.Id;
        }

        static public async Task<bool> RemoveLeagueSeason(long seasonId)
        {
            var leagues = GetLeaguesFromSeason(seasonId, false);

            foreach (League l in leagues)
            {
                await RemoveLeague(l.Id);
            }

            return true;
        }

        static public async Task<bool> RemoveLeague(long leagueSeasonId)
        {
            Divisions.RemoveLeagueDivisions(leagueSeasonId);
            await Teams.RemoveLeagueTeams(leagueSeasonId);

            DB db = DBConnection.GetContext();

            SportsManager.Model.LeagueSeason dbLeague = (from l in db.LeagueSeasons
                                                         where l.Id == leagueSeasonId
                                                         select l).SingleOrDefault();
            if (dbLeague == null)
                return false;

            // save league definition id so we can delete if no other uses.
            long leagueId = dbLeague.LeagueId;

            db.LeagueSeasons.DeleteOnSubmit(dbLeague);
            db.SubmitChanges();

            // anyone else using the leagueId?
            bool anyUses = (from ls in db.LeagueSeasons
                            where ls.LeagueId == leagueId
                            select ls).Any();

            if (!anyUses)
            {
                var leagueToDelete = (from l in db.Leagues
                                      where l.Id == leagueId
                                      select l);

                db.Leagues.DeleteAllOnSubmit(leagueToDelete);
                db.SubmitChanges();
            }

            return true;
        }

        static public bool RemoveUnusedLeagues(long accountId)
        {
            DB db = DBConnection.GetContext();

            // get all leagueSeasons with unique leagueId
            var accountLeagues = (from ls in db.LeagueSeasons
                                  select ls.LeagueId).Distinct();

            // if no league season is using a leagueId, we can remove it.
            var unusedLeagues = (from l in db.Leagues
                                 where l.AccountId == accountId && !accountLeagues.Contains(l.Id)
                                 select l);

            db.Leagues.DeleteAllOnSubmit(unusedLeagues);
            db.SubmitChanges();

            return true;
        }

        static public bool CopySeasonLeague(long seasonId, long seasonCopyId)
        {
            DB db = DBConnection.GetContext();
            using (TransactionScope t = new TransactionScope())
            {
                var leagues = (from ls in db.LeagueSeasons
                               where ls.SeasonId == seasonCopyId
                               select ls);

                foreach (var league in leagues)
                {
                    SportsManager.Model.LeagueSeason ls = new SportsManager.Model.LeagueSeason()
                    {
                        LeagueId = league.LeagueId,
                        SeasonId = seasonId
                    };
                    db.LeagueSeasons.InsertOnSubmit(ls);
                    db.SubmitChanges();
                    
                    // Copy Divisions
                    var divisions = (from ds in db.DivisionSeasons
                                     where ds.LeagueSeasonId == league.Id
                                     select ds);

                    foreach (var division in divisions)
                    {
                        SportsManager.Model.DivisionSeason ds = new SportsManager.Model.DivisionSeason()
                        {
                            DivisionId = division.DivisionId,
                            LeagueSeasonId = ls.Id,
                            Priority = division.Priority
                        };

                        db.DivisionSeasons.InsertOnSubmit(ds);
                    }

                    db.SubmitChanges();

                    // copy teams
                    //Exec CopySeasonTeams @newLeagueSeasonId, @leagueSeasonId
                    var teams = (from ts in db.TeamsSeasons
                                 where ts.LeagueSeasonId == league.Id
                                 select ts);

                    foreach (var team in teams)
                    {
                        // get divisiondef id of old team.
                        var divId = (from ds in db.DivisionSeasons
                                     where ds.Id == team.DivisionSeasonId
                                     select ds.DivisionId).SingleOrDefault();

                        // find new division season given division def id, we should have added this division above.
                        var divisionSeasonId = (from ds in db.DivisionSeasons
                                                where ds.DivisionId == divId && ds.LeagueSeasonId == ls.Id
                                                select ds.Id).SingleOrDefault();

                        var newTeam = new SportsManager.Model.TeamsSeason()
                        {
                           LeagueSeasonId = ls.Id,
                           TeamId = team.TeamId,
                           Name = team.Name,
                           DivisionSeasonId = divisionSeasonId
                        };

                        db.TeamsSeasons.InsertOnSubmit(newTeam);
                        db.SubmitChanges();

                        //    -- copy roster.                
                        //    EXEC dbo.CopySeasonRoster @teamSeasonId, @oldTeamSeasonId
                        var rosters = (from rs in db.RosterSeasons
                                       where rs.TeamSeasonId == team.Id && !rs.Inactive
                                       select rs);

                        foreach (var roster in rosters)
                        {
                            var newPlayer = new SportsManager.Model.RosterSeason()
                            {
                                PlayerId = roster.PlayerId,
                                TeamSeasonId = newTeam.Id,
                                PlayerNumber = roster.PlayerNumber,
                                DateAdded = roster.DateAdded,
                                Inactive = false,
                                SubmittedWaiver = false
                            };

                            db.RosterSeasons.InsertOnSubmit(newPlayer);
                        }

                        db.SubmitChanges();

                        //    -- copy managers.                                        
                        //    EXEC dbo.CopySeasonManager @teamSeasonId, @oldTeamSeasonId
                        var managers = (from tsm in db.TeamSeasonManagers
                                        where tsm.TeamSeasonId == team.Id
                                        select tsm);

                        foreach (var manager in managers)
                        {
                            var newManager = new SportsManager.Model.TeamSeasonManager()
                            {
                                TeamSeasonId = newTeam.Id,
                                ContactId = manager.ContactId
                            };

                            db.TeamSeasonManagers.InsertOnSubmit(newManager);
                        }

                        db.SubmitChanges();
                    }
                }

                t.Complete();
            }

            return true;
        }

        static public IQueryable<Contact> GetLeagueContacts(long leagueSeasonId)
        {
            DB db = DBConnection.GetContext();

            return (from ls in db.LeagueSeasons
                    join ts in db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                    join rs in db.RosterSeasons on ts.Id equals rs.TeamSeasonId
                    join r in db.Rosters on rs.PlayerId equals r.Id
                    join c in db.Contacts on r.ContactId equals c.Id
                    orderby c.LastName, c.FirstName, c.MiddleName
                    where (c.Email != "" && c.Email != null) && ls.Id == leagueSeasonId && !rs.Inactive
                    select new Contact(c.Id, c.Email, c.LastName, c.FirstName, c.MiddleName, c.Phone1, c.Phone2, c.Phone3, c.CreatorAccountId,
                        c.StreetAddress, c.City, c.State, c.Zip, c.FirstYear.GetValueOrDefault(), c.DateOfBirth, c.UserId));
        }
    }
}
