using ModelObjects;
using System.Linq;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public abstract class DBApiController : ApiController, IDb
    {
        private DB m_db;

        protected DBApiController(DB db)
        {
            m_db = db;
        }

        public DB Db
        {
            get
            {
                return m_db;
            }
        }

        protected void RemoveUnusedLeagues(long accountId)
        {
            // get all leagueSeasons with unique leagueId
            var accountLeagues = (from ls in m_db.LeagueSeasons
                                  select ls.LeagueId).Distinct();

            // if no league season is using a leagueId, we can remove it.
            var unusedLeagues = (from l in m_db.Leagues
                                 where l.AccountId == accountId && !accountLeagues.Contains(l.Id)
                                 select l);

            m_db.Leagues.RemoveRange(unusedLeagues);
            m_db.SaveChanges();
        }

        protected void RemoveUnusedContacts(long accountId)
        {
            // all places a contactId is used in for the account.
            var contactInRoster = (from r in m_db.Rosters
                                   select r.ContactId).Distinct();
            var contactInHof = (from h in m_db.Hofs
                                select h.ContactId).Distinct();
            var contactInManager = (from m in m_db.TeamSeasonManagers
                                    select m.ContactId).Distinct();
            var contactInMemberBusiness = (from mb in m_db.MemberBusinesses
                                           select mb.ContactId).Distinct();
            var unusedContacts = (from c in m_db.Contacts
                                  where c.CreatorAccountId == accountId &&
                                  !contactInRoster.Contains(c.Id) &&
                                  !contactInHof.Contains(c.Id) &&
                                  !contactInManager.Contains(c.Id) &&
                                  !contactInMemberBusiness.Contains(c.Id)
                                  select c);
            // member business blocking
            m_db.Contacts.RemoveRange(unusedContacts);
            m_db.SaveChanges();
        }

        protected void RemoveLeagueSeason(LeagueSeason ls)
        {
            m_db.DivisionSeasons.RemoveRange(ls.DivisionSeasons);

            var teamList = ls.TeamsSeasons.ToList();
            while (teamList.Any())
            {
                var t = teamList.First();
                RemoveSeasonTeam(t);
                teamList.Remove(t);
            }

            m_db.LeagueSeasons.Remove(ls);
            m_db.SaveChanges();
        }

        private void RemoveSeasonTeam(TeamSeason t)
        {
            m_db.RosterSeasons.RemoveRange(t.Roster);
            m_db.TeamSeasonManagers.RemoveRange(t.TeamSeasonManagers);
            m_db.GameRecaps.RemoveRange(t.GameRecaps);

            var allGamesForTeam = (from ls in m_db.LeagueSchedules
                                   where ls.HTeamId == t.Id || ls.VTeamId == t.Id
                                   select ls);
            m_db.LeagueSchedules.RemoveRange(allGamesForTeam);
        }

        protected void RemoveUnusedDivisions(long accountId)
        {
            var accountDivisions = (from ds in m_db.DivisionSeasons
                                    select ds.DivisionId).Distinct();

            var unusedDivisions = (from dd in m_db.DivisionDefs
                                   where dd.AccountId == accountId && !accountDivisions.Contains(dd.Id)
                                   select dd);

            m_db.DivisionDefs.RemoveRange(unusedDivisions);
            m_db.SaveChanges();
        }

    }
}
