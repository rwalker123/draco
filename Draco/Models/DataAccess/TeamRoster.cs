using ModelObjects;
using SportsManager;
using System;
using System.Collections.Generic;
using System.Linq;

namespace DataAccess
{
	/// <summary>
	/// Summary description for TeamRoster
	/// </summary>
	static public class TeamRoster
	{
		// stupid methods because the details view grid doesn't like it when
		// list boxes are not bound to a data source of some sort.
		static public YearListData[] GetAvailablePlayerNumbers()
		{
			YearListData[] n = new YearListData[100];

			for (int i = 0; i < 100; ++i)
			{
				n[i] = new YearListData(i);
			}

			return n;
		}

		static public List<YearListData> GetAvailableFirstYear(long accountId)
		{
			ModelObjects.Account a = DataAccess.Accounts.GetAccount(accountId);
			if (a == null)
				return new List<YearListData>();

			DateTime dt = DateTime.Today;
			int firstYear = a.FirstYear;

			int numYears = 100;

			List<YearListData> yearList = new List<YearListData>(numYears);

			for (int i = 0; i < numYears; ++i)
			{
				yearList.Add(new YearListData(dt.Year));
				dt = dt.AddYears(-1);
			}

			return yearList;
		}

		/// <summary>
		/// Get the name of a player given either the RosterSeasonId (fromRoster = false) or
		/// RosterId (fromRoster = true).
		/// </summary>
		/// <param name="playerId"></param>
		/// <param name="fromRoster"></param>
		/// <returns></returns>
		static public ContactName GetPlayerName(long playerId, bool fromRoster = false)
		{
            DB db = DBConnection.GetContext();

			if (fromRoster)
			{
				return (from r in db.Rosters
						where r.Id == playerId
						select new ContactName()
						{
							Id = r.Contact.Id,
							FirstName = r.Contact.FirstName,
							LastName = r.Contact.LastName,
							MiddleName = r.Contact.MiddleName,
							PhotoURL = Contact.GetPhotoURL(r.Contact.Id),
                            FirstYear = r.Contact.FirstYear.GetValueOrDefault(0),
                            Zip = r.Contact.Zip,
                            BirthDate = r.Contact.DateOfBirth
						}).FirstOrDefault();
			}
			else
			{
				return (from rs in db.RosterSeasons
						where rs.Id == playerId
						select new ContactName()
						{
							Id = rs.Roster.Contact.Id,
							FirstName = rs.Roster.Contact.FirstName,
							LastName = rs.Roster.Contact.LastName,
							MiddleName = rs.Roster.Contact.MiddleName,
                            PhotoURL = Contact.GetPhotoURL(rs.Roster.Contact.Id),
                            FirstYear = rs.Roster.Contact.FirstYear.GetValueOrDefault(0),
                            Zip = rs.Roster.Contact.Zip,
                            BirthDate = rs.Roster.Contact.DateOfBirth
						}).FirstOrDefault();
			}
		}

        static public Player GetPlayerFromId(long playerId)
        {
            	//SELECT id, AccountId, ContactId, SubmittedDriversLicense FROM Roster WHERE Id = @playerId
            DB db = DBConnection.GetContext();

            return (from r in db.Rosters
                    where r.Id == playerId
                    select new Player()
                    {
                        Id = r.Id,
                        AccountId = r.AccountId,
                        Contact = new Contact(r.Contact.Id, r.Contact.Email, r.Contact.LastName, r.Contact.FirstName, r.Contact.MiddleName,
                            r.Contact.Phone1, r.Contact.Phone2, r.Contact.Phone3, r.Contact.CreatorAccountId, r.Contact.StreetAddress,
                            r.Contact.City, r.Contact.State, r.Contact.Zip, r.Contact.FirstYear.GetValueOrDefault(), r.Contact.DateOfBirth, r.Contact.UserId),
                        SubmittedDriversLicense = r.SubmittedDriversLicense
                    }).SingleOrDefault();
        }

		static public Player GetPlayer(long playerSeasonId)
		{
            DB db = DBConnection.GetContext();

			long seasonId = (from rs in db.RosterSeasons
							 join ts in db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
							 join ls in db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                             where rs.Id == playerSeasonId
							 select ls.SeasonId).SingleOrDefault();


			return (from rs in db.RosterSeasons
					join r in db.Rosters on rs.PlayerId equals r.Id
					where rs.Id == playerSeasonId
					select new Player()
					{
						Id = rs.Id,
						TeamId = rs.TeamSeasonId,
						PlayerNumber = rs.PlayerNumber,
						SubmittedWaiver = rs.SubmittedWaiver,
						AccountId = r.AccountId,
						Contact = new Contact(r.Contact.Id, r.Contact.Email, r.Contact.LastName, r.Contact.FirstName, r.Contact.MiddleName, r.Contact.Phone1, r.Contact.Phone2, r.Contact.Phone3, r.Contact.CreatorAccountId, r.Contact.StreetAddress, r.Contact.City, r.Contact.State, r.Contact.Zip, r.Contact.FirstYear.GetValueOrDefault(), r.Contact.DateOfBirth, r.Contact.UserId),
						SubmittedDriversLicense = r.SubmittedDriversLicense,
						DateAdded = rs.DateAdded.GetValueOrDefault(),
						AffiliationDuesPaid = GetAffiliationsDues(rs.PlayerId, seasonId),
                        GamesPlayed = 0
					}).SingleOrDefault();
		}

		static public IQueryable<Player> GetPlayers(long teamSeasonId)
		{
            DB db = DBConnection.GetContext();

			long seasonId = (from ts in db.TeamsSeasons
							 join ls in db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
							 where ts.Id == teamSeasonId
							 select ls.SeasonId).SingleOrDefault();

			return (from rs in db.RosterSeasons
					join r in db.Rosters on rs.PlayerId equals r.Id
					join c in db.Contacts on r.ContactId equals c.Id
					where rs.TeamSeasonId == teamSeasonId && rs.Inactive == false
					orderby c.LastName, c.FirstName, c.MiddleName
					select new Player()
					{
						Id = rs.Id,
						TeamId = rs.TeamSeasonId,
						PlayerNumber = rs.PlayerNumber,
						SubmittedWaiver = rs.SubmittedWaiver,
						Contact = new Contact(r.Contact.Id, r.Contact.Email, r.Contact.LastName, r.Contact.FirstName, r.Contact.MiddleName, r.Contact.Phone1, r.Contact.Phone2, r.Contact.Phone3, r.Contact.CreatorAccountId, r.Contact.StreetAddress, r.Contact.City, r.Contact.State, r.Contact.Zip, r.Contact.FirstYear.GetValueOrDefault(), r.Contact.DateOfBirth, r.Contact.UserId),
						SubmittedDriversLicense = r.SubmittedDriversLicense,
						AccountId = r.AccountId,
						DateAdded = rs.DateAdded.GetValueOrDefault(),
						AffiliationDuesPaid = GetAffiliationsDues(rs.PlayerId, seasonId),
                        GamesPlayed = rs.PlayerRecaps.Count()
					});
		}

		static public IQueryable<Player> GetAllPlayers(long teamSeasonId)
		{
            DB db = DBConnection.GetContext();

			long seasonId = (from ts in db.TeamsSeasons
							 join ls in db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
							 where ts.Id == teamSeasonId
							 select ls.SeasonId).SingleOrDefault();

			return (from rs in db.RosterSeasons
					join r in db.Rosters on rs.PlayerId equals r.Id
					where rs.TeamSeasonId == teamSeasonId
					select new Player()
					{
						Id = rs.Id,
						TeamId = rs.TeamSeasonId,
						PlayerNumber = rs.PlayerNumber,
						Contact = new Contact(r.Contact.Id, r.Contact.LastName, r.Contact.FirstName, r.Contact.MiddleName, r.Contact.Phone1, r.Contact.Phone2, r.Contact.Phone3, null, r.Contact.CreatorAccountId, r.Contact.StreetAddress, r.Contact.City, r.Contact.State, r.Contact.Zip, r.Contact.FirstYear.GetValueOrDefault(), r.Contact.DateOfBirth, r.Contact.UserId),
						SubmittedWaiver = rs.SubmittedWaiver,
						SubmittedDriversLicense = r.SubmittedDriversLicense,
						AccountId = r.AccountId,
						DateAdded = rs.DateAdded.GetValueOrDefault(),
						AffiliationDuesPaid = GetAffiliationsDues(rs.PlayerId, seasonId)
					});
		}

		static private string GetAffiliationsDues(long playerId, long seasonId)
		{
            DB db = DBConnection.GetContext();
            return (from affDues in db.PlayerSeasonAffiliationDues
					where affDues.PlayerId == playerId && affDues.SeasonId == seasonId
					select affDues.AffiliationDuesPaid).SingleOrDefault();
		}

		static public IQueryable<ContactName> FindPlayers(long accountId, string lastName)
		{
            DB db = DBConnection.GetContext();

			return (from r in db.Rosters
					join c in db.Contacts on r.ContactId equals c.Id
					where r.AccountId == accountId && c.LastName.Contains(lastName)
					orderby c.LastName, c.FirstName, c.MiddleName
					select new ContactName()
					{
						Id = c.Id,
						FirstName = c.FirstName,
						LastName = c.LastName,
						MiddleName = c.MiddleName,
                        PhotoURL = Contact.GetPhotoURL(c.Id),
                        FirstYear = c.FirstYear.GetValueOrDefault(0),
                        Zip = c.Zip,
                        BirthDate = c.DateOfBirth
					});
		}

		// get all players not on a team in the given league.		
		static public IQueryable<Contact> GetAvailablePlayers(long accountId, long leagueSeasonId, String firstName, String lastName)
		{
            DB db = DBConnection.GetContext();

            long affiliationId = (from a in db.Accounts
                                  where a.Id == accountId
                                  select a.AffiliationId).SingleOrDefault();

            var aIds = (from a in db.Accounts
                        where a.Id == accountId || (affiliationId != 1 && a.AffiliationId == affiliationId)
                        select a.Id);

            var cIds = (from ts in db.TeamsSeasons
                        join rs in db.RosterSeasons on ts.Id equals rs.TeamSeasonId
                        join r in db.Rosters on rs.PlayerId equals r.Id
                        where ts.LeagueSeasonId == leagueSeasonId && !rs.Inactive
                        select r.ContactId);

            return (from c in db.Contacts
                    where aIds.Contains(c.CreatorAccountId) &&
                    !cIds.Contains(c.Id) &&
                    (String.IsNullOrWhiteSpace(firstName) || c.FirstName.Contains(firstName)) &&
                    (String.IsNullOrWhiteSpace(lastName) || c.LastName.Contains(lastName))
                    orderby c.LastName, c.FirstName, c.MiddleName
                    select new Contact(c.Id, c.Email, c.LastName, c.FirstName, c.MiddleName, c.Phone1, c.Phone2,
                        c.Phone3, c.CreatorAccountId, c.StreetAddress, c.City, c.State, c.Zip,
                        c.FirstYear.GetValueOrDefault(), c.DateOfBirth, c.UserId));
		}

		static public IQueryable<Contact> GetAvailableManagers(long accountId, long leagueSeasonId, long teamSeasonId, string firstName, string lastName)
		{
            DB db = DBConnection.GetContext();
            long affiliationId = (from a in db.Accounts
                                  where a.Id == accountId
                                  select a.AffiliationId).SingleOrDefault();

            if (teamSeasonId == 0)
            {
                var cIds = (from tsm in db.TeamSeasonManagers
                            join ts in db.TeamsSeasons on tsm.TeamSeasonId equals ts.Id
                            where ts.LeagueSeasonId == leagueSeasonId
                            select tsm.ContactId);

                var aIds = (from a in db.Accounts
                            where a.Id == accountId || (affiliationId != 1 && affiliationId == a.AffiliationId)
                            select a.Id);

                return (from c in db.Contacts
                        where aIds.Contains(c.CreatorAccountId) &&
                        !cIds.Contains(c.Id) &&
                        (String.IsNullOrWhiteSpace(firstName) || c.FirstName.Contains(firstName)) &&
                        (String.IsNullOrWhiteSpace(lastName) || c.LastName.Contains(lastName))
                        orderby c.LastName, c.FirstName, c.MiddleName
                        select new Contact(c.Id, c.Email, c.LastName, c.FirstName, c.MiddleName, c.Phone1, c.Phone2,
                            c.Phone3, c.CreatorAccountId, c.StreetAddress, c.City, c.State, c.Zip, 
                            c.FirstYear.GetValueOrDefault(), c.DateOfBirth, c.UserId));
            }
            else
            {
                var cIds = (from tsm in db.TeamSeasonManagers
                            where tsm.TeamSeasonId == teamSeasonId
                            select tsm.ContactId);

                return (from rs in db.RosterSeasons
                        join r in db.Rosters on rs.PlayerId equals r.Id
                        join c in db.Contacts on r.ContactId equals c.Id
                        where rs.TeamSeasonId == teamSeasonId && !rs.Inactive &&
                        !cIds.Contains(c.Id) &&
                        (String.IsNullOrWhiteSpace(firstName) || c.FirstName.Contains(firstName)) &&
                        (String.IsNullOrWhiteSpace(lastName) || c.LastName.Contains(lastName))
                        orderby c.LastName, c.FirstName, c.MiddleName
                        select new Contact(c.Id, c.Email, c.LastName, c.FirstName, c.MiddleName, c.Phone1, c.Phone2,
                            c.Phone3, c.CreatorAccountId, c.StreetAddress, c.City, c.State, c.Zip,
                            c.FirstYear.GetValueOrDefault(), c.DateOfBirth, c.UserId));
            }
		}

		static public bool ModifyPlayer(Player player)
		{
            DB db = DBConnection.GetContext();

            var dbPlayer = (from p in db.RosterSeasons
                            where p.Id == player.Id
                            select p).SingleOrDefault();

            if (dbPlayer != null)
            {
                dbPlayer.SubmittedWaiver = player.SubmittedWaiver;
                dbPlayer.PlayerNumber = player.PlayerNumber;

                var dbRoster = (from r in db.Rosters
                                where dbPlayer.PlayerId == r.Id
                                select r).SingleOrDefault();
                if (dbRoster != null)
                {
                    dbRoster.SubmittedDriversLicense = player.SubmittedDriversLicense;

                    var seasonId = DataAccess.Seasons.GetCurrentSeason(player.AccountId);

                    var dbAffDues = (from ad in db.PlayerSeasonAffiliationDues
                                     where ad.PlayerId == dbRoster.Id && ad.SeasonId == seasonId
                                     select ad).SingleOrDefault();

                    if (dbAffDues != null)
                    {
                        dbAffDues.AffiliationDuesPaid = player.AffiliationDuesPaid == null ? String.Empty : player.AffiliationDuesPaid;
                    }
                    else
                    {
                        dbAffDues = new SportsManager.Model.PlayerSeasonAffiliationDue()
                        {
                            PlayerId = dbRoster.Id,
                            AffiliationDuesPaid = player.AffiliationDuesPaid == null ? String.Empty : player.AffiliationDuesPaid,
                            SeasonId = seasonId
                        };

                        db.PlayerSeasonAffiliationDues.InsertOnSubmit(dbAffDues);
                    }
                }

                db.SubmitChanges();
                return true;
            }

            return false;
		}

		static public void RemoveTeamPlayers(long teamSeasonId)
		{
			IQueryable<Player> players = TeamRoster.GetAllPlayers(teamSeasonId);
			foreach (Player p in players)
			{
				TeamRoster.RemovePlayer(p.Id);
			}
		}

		static public bool RemovePlayer(long playerSeasonId)
		{
			// remove player stats for season.
			GameStats.RemovePlayerStats(playerSeasonId);

            DB db = DBConnection.GetContext();

            var playerId = (from rs in db.RosterSeasons
                            where rs.Id == playerSeasonId
                            select rs.PlayerId).SingleOrDefault();

            var playerRecaps = (from pr in db.PlayerRecaps
                                where pr.PlayerId == playerSeasonId
                                select pr);
            db.PlayerRecaps.DeleteAllOnSubmit(playerRecaps);

            var rosterSeasons = (from rs in db.RosterSeasons
                                 where rs.Id == playerSeasonId
                                 select rs);
            db.RosterSeasons.DeleteAllOnSubmit(rosterSeasons);

            var playerProfiles = (from pp in db.PlayerProfiles
                                  where pp.PlayerId == playerId
                                  select pp);
            db.PlayerProfiles.DeleteAllOnSubmit(playerProfiles);

            db.SubmitChanges();

            // is this player on any other team in season?
            var cnt = (from rs in db.RosterSeasons
                       where rs.PlayerId == playerId
                       select rs).Any();

            var affs = (from ps in db.PlayerSeasonAffiliationDues
                        where ps.PlayerId == playerId
                        select ps);
            db.PlayerSeasonAffiliationDues.DeleteAllOnSubmit(affs);

            db.SubmitChanges();

            var rosters = (from r in db.Rosters
                           where r.Id == playerId
                           select r);
            db.Rosters.DeleteAllOnSubmit(rosters);

            db.SubmitChanges();
            return true;
		}

        static public bool ReleaseAllPlayers(long teamSeasonId)
        {
            DB db = DBConnection.GetContext();

            var dbPlayers = (from rs in db.RosterSeasons
                            where rs.TeamSeasonId == teamSeasonId
                            select rs);

            foreach(var p in dbPlayers)
                p.Inactive = true;

            db.SubmitChanges();
            return true;
        }

		static public bool ReleasePlayer(long playerSeasonId)
		{
            DB db = DBConnection.GetContext();

            var dbPlayer = (from rs in db.RosterSeasons
                            where rs.Id == playerSeasonId
                            select rs).SingleOrDefault();

            if (dbPlayer != null)
            {
                dbPlayer.Inactive = true;
                db.SubmitChanges();
                return true;
            }

            return false; 
		}

		static public Player SignContact(long accountId, long teamSeasonId, long contactId)
		{
            DB db = DBConnection.GetContext();
            var playerId = (from r in db.Rosters
                            where r.ContactId == contactId
                            select r.Id).SingleOrDefault();
            if (playerId == 0)
            {
                SportsManager.Model.Roster dbRoster = new SportsManager.Model.Roster()
                {
                     AccountId = accountId,
                     ContactId = contactId,
                     SubmittedDriversLicense = false
                };

                db.Rosters.InsertOnSubmit(dbRoster);
                db.SubmitChanges();

                playerId = dbRoster.Id;
            }
    
            return SignPlayer(teamSeasonId, playerId);
		}

		static public Player SignPlayer(long teamSeasonId, long playerId)
		{
            DB db = DBConnection.GetContext();

            // see if user is currently on a roster but inactive.
            var rosterPlayer = (from rs in db.RosterSeasons
                                where rs.PlayerId == playerId && rs.TeamSeasonId == teamSeasonId
                                select rs).SingleOrDefault();

            if (rosterPlayer == null)
            {
                rosterPlayer = new SportsManager.Model.RosterSeason()
                {
                     PlayerId = playerId,
                     TeamSeasonId = teamSeasonId,
                     DateAdded = DateTime.Now
                };

                db.RosterSeasons.InsertOnSubmit(rosterPlayer);
                db.SubmitChanges();
            }
            else
            {
                rosterPlayer.Inactive = false;
                rosterPlayer.DateAdded = DateTime.Now;
                db.SubmitChanges();
            }

            var dbRoster = (from r in db.Rosters
                             where r.Id == playerId
                             select r).SingleOrDefault();

            if (dbRoster != null)
            {
                Contact c = DataAccess.Contacts.GetContact(dbRoster.ContactId);

                return new Player()
                {
                    Id = rosterPlayer.Id,
                    TeamId = rosterPlayer.TeamSeasonId,
                    PlayerNumber = rosterPlayer.PlayerNumber,
                    Contact = c,
                    AccountId = dbRoster.AccountId,
                    AffiliationDuesPaid = dbRoster.PlayerSeasonAffiliationDues.Any() ? dbRoster.PlayerSeasonAffiliationDues.First().AffiliationDuesPaid : String.Empty,
                    DateAdded = rosterPlayer.DateAdded.GetValueOrDefault(),
                    SubmittedDriversLicense = dbRoster.SubmittedDriversLicense,
                    SubmittedWaiver = rosterPlayer.SubmittedWaiver
                };
            }

            return null;
		}

		static public bool CopySeasonRoster(long teamSeasonId, long copyTeamSeasonId)
		{
            //DECLARE @playerId bigint
            //DECLARE @playerNumber int
            //DECLARE @dateAdded DateTime
	
            //DECLARE rosterIter CURSOR LOCAL FOR SELECT PlayerId, PlayerNumber, DateAdded FROM RosterSeason WHERE TeamSeasonId = @copyTeamSeasonId AND Inactive = 0
            //OPEN rosterIter
            //FETCH NEXT FROM rosterIter INTO @playerId, @playerNumber, @dateAdded
            //WHILE (@@FETCH_STATUS = 0)
            //BEGIN
            //    INSERT INTO RosterSeason VALUES(@playerId, @teamSeasonId, @playerNumber, 0, 0, @dateAdded)

            //    FETCH NEXT FROM rosterIter INTO @playerId, @playerNumber, @dateAdded
            //END

            DB db = DBConnection.GetContext();

            var copyRoster = (from rs in db.RosterSeasons
                              where rs.TeamSeasonId == copyTeamSeasonId && rs.Inactive == false
                              select rs);

            List<SportsManager.Model.RosterSeason> newRosters = new List<SportsManager.Model.RosterSeason>();

            foreach(var r in copyRoster)
            {
                newRosters.Add(new SportsManager.Model.RosterSeason()
                {
                    PlayerId = r.PlayerId,
                    TeamSeasonId = teamSeasonId,
                    PlayerNumber = r.PlayerNumber,
                    Inactive = r.Inactive,
                    SubmittedWaiver = false,
                    DateAdded = r.DateAdded
                });

            }
            db.RosterSeasons.InsertAllOnSubmit(newRosters);

            db.SubmitChanges();

            return true;
		}

		static public bool PlayerNameExists(long accountId, long contactId, String firstName, String lastName, String middleName)
		{
			return Contacts.DoesContactExist(accountId, contactId, firstName, middleName, lastName);
		}

        static public IQueryable<ContactName> GetAllBirthdayBoys(long accountId)
        {
            DateTime c = DateTime.Today;

            DB db = DBConnection.GetContext();

            return (from cs in db.CurrentSeasons
                    join ls in db.LeagueSeasons on cs.SeasonId equals ls.SeasonId
                    join ts in db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                    join rs in db.RosterSeasons on ts.Id equals rs.TeamSeasonId
                    join r in db.Rosters on rs.PlayerId equals r.Id
                    join co in db.Contacts on r.ContactId equals co.Id
                    where cs.AccountId == accountId &&
                        !rs.Inactive &&
                        co.DateOfBirth.Day == c.Day &&
                        co.DateOfBirth.Month == c.Month
                    orderby co.LastName, co.FirstName, co.MiddleName
                    select new ContactName()
                    {
                        Id = co.Id,
                        FirstName = co.FirstName,
                        MiddleName = co.MiddleName,
                        LastName = co.LastName,
                        PhotoURL = Contact.GetPhotoURL(co.Id),
                        FirstYear = co.FirstYear.GetValueOrDefault(0),
                        Zip = co.Zip,
                        BirthDate = co.DateOfBirth
                    }).Distinct();
        }

        // get all the active players in the current season.
		static public IEnumerable<Contact> GetAllActiveContacts(long accountId)
		{
            List<Contact> contacts = new List<Contact>();

            DB db = DBConnection.GetContext();

            long seasonId = DataAccess.Seasons.GetCurrentSeason(accountId);

            // get leagues in season
            var leagues = DataAccess.Leagues.GetLeagues(seasonId);
            foreach (var l in leagues)
            {
                contacts.AddRange(DataAccess.Leagues.GetLeagueContacts(l.Id)); //.ToList();
            }

            return contacts;
		}

        static public IQueryable<Player> GetAllActivePlayers(long accountId)
        {
            DB db = DBConnection.GetContext();

            long seasonId = DataAccess.Seasons.GetCurrentSeason(accountId);

            //var contactIdsInSeason = (from ls in db.LeagueSeasons
            //                          join ts in db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
            //                          join rs in db.RosterSeasons on ts.Id equals rs.TeamSeasonId
            //                          join r in db.Rosters on rs.PlayerId equals r.Id
            //                          join c in db.Contacts on r.ContactId equals c.Id
            //                          where ls.SeasonId == seasonId && !rs.Inactive
            //                          select c.Id).Distinct();

            return (from ls in db.LeagueSeasons
                    join ts in db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                    join rs in db.RosterSeasons on ts.Id equals rs.TeamSeasonId
                    join r in db.Rosters on rs.PlayerId equals r.Id
                    where ls.SeasonId == seasonId && !rs.Inactive
                    select new Player()
                    {
                        Id = rs.Id,
                        TeamId = rs.TeamSeasonId,
                        PlayerNumber = rs.PlayerNumber,
                        SubmittedWaiver = rs.SubmittedWaiver,
                        ContactId = r.Contact.Id,
                        Contact = new Contact(r.Contact.Id, r.Contact.Email, r.Contact.LastName, r.Contact.FirstName, r.Contact.MiddleName, r.Contact.Phone1, r.Contact.Phone2, r.Contact.Phone3, r.Contact.CreatorAccountId, r.Contact.StreetAddress, r.Contact.City, r.Contact.State, r.Contact.Zip, r.Contact.FirstYear.GetValueOrDefault(), r.Contact.DateOfBirth, r.Contact.UserId),
                        SubmittedDriversLicense = r.SubmittedDriversLicense,
                        AccountId = r.AccountId,
                        DateAdded = rs.DateAdded.GetValueOrDefault(),
                        AffiliationDuesPaid = GetAffiliationsDues(rs.PlayerId, seasonId)
                    }).GroupBy(x => x.ContactId).Select(y => y.First());

        }

		public static bool IsTeamMember(long contactId, long teamSeasonId)
		{
            DB db = DBConnection.GetContext();

            // is on roster?
            var isTeamMember = (from r in db.Rosters
                              join rs in db.RosterSeasons on r.Id equals rs.PlayerId
                              join ts in db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
                              where r.ContactId == contactId && ts.Id == teamSeasonId
                              select r.ContactId).Any();
            if (!isTeamMember)
            {
                // see if they are a manager.
                isTeamMember = (from tsm in db.TeamSeasonManagers
                                where tsm.TeamSeasonId == teamSeasonId && tsm.ContactId == contactId
                                select tsm.ContactId).Any();
            }

            return isTeamMember;
		}

	}
}