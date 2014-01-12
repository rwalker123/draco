using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using ModelObjects;
using SportsManager;

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
						where r.id == playerId
						select new ContactName()
						{
							Id = r.Contact.Id,
							FirstName = r.Contact.FirstName,
							LastName = r.Contact.LastName,
							MiddleName = r.Contact.MiddleName,
							PhotoURL = Contact.GetPhotoURL(r.id)
						}).FirstOrDefault();
			}
			else
			{
				return (from rs in db.RosterSeasons
						where rs.id == playerId
						select new ContactName()
						{
							Id = rs.Roster.Contact.Id,
							FirstName = rs.Roster.Contact.FirstName,
							LastName = rs.Roster.Contact.LastName,
							MiddleName = rs.Roster.Contact.MiddleName,
							PhotoURL = Contact.GetPhotoURL(rs.Roster.Contact.Id)
						}).FirstOrDefault();
			}
		}

		static public Player GetPlayerFromId(long playerId)
		{
			Player p = null;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetPlayerFromId", myConnection);
					myCommand.Parameters.Add("@playerId", SqlDbType.BigInt).Value = playerId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					if (dr.Read())
					{
						Contact contactInfo = Contacts.GetContact(dr.GetInt64(2));
						p = new Player(dr.GetInt64(0), 0, -1, contactInfo, false, dr.GetBoolean(3), dr.GetInt64(1), DateTime.Now, String.Empty);
					}
				}

			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return p;
		}

		static public long GetPlayerIdFromSeasonId(long playerSeasonId)
		{
			long playerId = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetPlayerIdFromSeasonId", myConnection);
					myCommand.Parameters.Add("@playerSeasonId", SqlDbType.BigInt).Value = playerSeasonId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myCommand.Prepare();
					myConnection.Open();

					SqlDataReader dr = myCommand.ExecuteReader();

					if (dr.Read())
					{
						playerId = dr.GetInt64(0);
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return playerId;
		}

		static public Player GetPlayer(long playerSeasonId)
		{
            DB db = DBConnection.GetContext();

			long seasonId = (from rs in db.RosterSeasons
							 join ts in db.TeamsSeasons on rs.TeamSeasonId equals ts.id
							 join ls in db.LeagueSeasons on ts.LeagueSeasonId equals ls.id
							 select ls.SeasonId).SingleOrDefault();


			long rosterId = (from rs in db.RosterSeasons
							 where rs.id == playerSeasonId
							 select rs.PlayerId).SingleOrDefault();

			return (from rs in db.RosterSeasons
					join r in db.Rosters on rs.PlayerId equals r.id
					where rs.id == playerSeasonId
					select new Player()
					{
						Id = rs.id,
						TeamId = rs.TeamSeasonId,
						PlayerNumber = rs.PlayerNumber,
						SubmittedWaiver = rs.SubmittedWaiver,
						AccountId = r.AccountId,
						Contact = new Contact(r.Contact.Id, r.Contact.LastName, r.Contact.FirstName, r.Contact.MiddleName, r.Contact.Phone1, r.Contact.Phone2, r.Contact.Phone3, null, r.Contact.CreatorAccountId, r.Contact.StreetAddress, r.Contact.City, r.Contact.State, r.Contact.Zip, r.Contact.FirstYear.GetValueOrDefault(), r.Contact.DateOfBirth.GetValueOrDefault(), r.Contact.UserId),
						SubmittedDriversLicense = r.SubmittedDriversLicense,
						DateAdded = rs.DateAdded.Value,
						AffiliationDuesPaid = GetAffiliationsDues(rs.PlayerId, seasonId)
					}).SingleOrDefault();
		}

		static public IEnumerable<Player> GetPlayers(long teamSeasonId)
		{
            DB db = DBConnection.GetContext();

			long seasonId = (from ts in db.TeamsSeasons
							 join ls in db.LeagueSeasons on ts.LeagueSeasonId equals ls.id
							 where ts.id == teamSeasonId
							 select ls.SeasonId).SingleOrDefault();

			return (from rs in db.RosterSeasons
					join r in db.Rosters on rs.PlayerId equals r.id
					join c in db.Contacts on r.ContactId equals c.Id
					where rs.TeamSeasonId == teamSeasonId && rs.Inactive == false
					orderby c.LastName, c.FirstName, c.MiddleName
					select new Player()
					{
						Id = rs.id,
						TeamId = rs.TeamSeasonId,
						PlayerNumber = rs.PlayerNumber,
						SubmittedWaiver = rs.SubmittedWaiver,
						Contact = new Contact(r.Contact.Id, r.Contact.LastName, r.Contact.FirstName, r.Contact.MiddleName, r.Contact.Phone1, r.Contact.Phone2, r.Contact.Phone3, null, r.Contact.CreatorAccountId, r.Contact.StreetAddress, r.Contact.City, r.Contact.State, r.Contact.Zip, r.Contact.FirstYear.GetValueOrDefault(), r.Contact.DateOfBirth.GetValueOrDefault(), r.Contact.UserId),
						SubmittedDriversLicense = r.SubmittedDriversLicense,
						AccountId = r.AccountId,
						DateAdded = rs.DateAdded.Value,
						AffiliationDuesPaid = GetAffiliationsDues(rs.PlayerId, seasonId)
					});
		}

		static public IEnumerable<Player> GetAllPlayers(long teamSeasonId)
		{
            DB db = DBConnection.GetContext();

			long seasonId = (from ts in db.TeamsSeasons
							 join ls in db.LeagueSeasons on ts.LeagueSeasonId equals ls.id
							 where ts.id == teamSeasonId
							 select ls.SeasonId).SingleOrDefault();

			return (from rs in db.RosterSeasons
					join r in db.Rosters on rs.PlayerId equals r.id
					where rs.TeamSeasonId == teamSeasonId
					select new Player()
					{
						Id = rs.id,
						TeamId = rs.TeamSeasonId,
						PlayerNumber = rs.PlayerNumber,
						Contact = new Contact(r.Contact.Id, r.Contact.LastName, r.Contact.FirstName, r.Contact.MiddleName, r.Contact.Phone1, r.Contact.Phone2, r.Contact.Phone3, null, r.Contact.CreatorAccountId, r.Contact.StreetAddress, r.Contact.City, r.Contact.State, r.Contact.Zip, r.Contact.FirstYear.GetValueOrDefault(), r.Contact.DateOfBirth.GetValueOrDefault(), r.Contact.UserId),
						SubmittedWaiver = rs.SubmittedWaiver,
						SubmittedDriversLicense = r.SubmittedDriversLicense,
						AccountId = r.AccountId,
						DateAdded = rs.DateAdded.Value,
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
						PhotoURL = Contact.GetPhotoURL(c.Id)
					});
		}

		// get all players not on a team in the given league.		
		static public List<Contact> GetAvailablePlayers(long accountId, long leagueSeasonId)
		{
            DB db = DBConnection.GetContext();

            long affiliationId = (from a in db.Accounts
                                  where a.Id == accountId
                                  select a.AffiliationId).SingleOrDefault();

            var aIds = (from a in db.Accounts
                        where a.Id == accountId || (affiliationId != 1 && a.AffiliationId == affiliationId)
                        select a.Id);

            var cIds = (from ts in db.TeamsSeasons
                        join rs in db.RosterSeasons on ts.id equals rs.TeamSeasonId
                        join r in db.Rosters on rs.PlayerId equals r.id
                        where ts.LeagueSeasonId == leagueSeasonId && !rs.Inactive
                        select r.ContactId);

            return (from c in db.Contacts
                    where aIds.Contains(c.CreatorAccountId) &&
                    !cIds.Contains(c.Id)
                    orderby c.LastName, c.FirstName, c.MiddleName
                    select new Contact(c.Id, c.Email, c.LastName, c.FirstName, c.MiddleName, c.Phone1, c.Phone2,
                        c.Phone3, c.CreatorAccountId, c.StreetAddress, c.City, c.State, c.Zip,
                        c.FirstYear.GetValueOrDefault(), c.DateOfBirth, c.UserId)).ToList();
		}

		static public List<Contact> GetAvailableManagers(long accountId, long leagueSeasonId, long teamSeasonId)
		{
            DB db = DBConnection.GetContext();
            long affiliationId = (from a in db.Accounts
                                  where a.Id == accountId
                                  select a.AffiliationId).SingleOrDefault();

            if (teamSeasonId == 0)
            {
                var cIds = (from tsm in db.TeamSeasonManagers
                            join ts in db.TeamsSeasons on tsm.TeamSeasonId equals ts.id
                            where ts.LeagueSeasonId == leagueSeasonId
                            select tsm.ContactId);

                var aIds = (from a in db.Accounts
                            where a.Id == accountId || (affiliationId != 1 && affiliationId == a.AffiliationId)
                            select a.Id);

                return (from c in db.Contacts
                        where aIds.Contains(c.CreatorAccountId) &&
                        !cIds.Contains(c.Id)
                        orderby c.LastName, c.FirstName, c.MiddleName
                        select new Contact(c.Id, c.Email, c.LastName, c.FirstName, c.MiddleName, c.Phone1, c.Phone2,
                            c.Phone3, c.CreatorAccountId, c.StreetAddress, c.City, c.State, c.Zip, 
                            c.FirstYear.GetValueOrDefault(), c.DateOfBirth, c.UserId)).ToList();
            }
            else
            {
                var cIds = (from tsm in db.TeamSeasonManagers
                            where tsm.TeamSeasonId == teamSeasonId
                            select tsm.ContactId);

                return (from rs in db.RosterSeasons
                        join r in db.Rosters on rs.PlayerId equals r.id
                        join c in db.Contacts on r.ContactId equals c.Id
                        where rs.TeamSeasonId == teamSeasonId && !rs.Inactive &&
                        !cIds.Contains(c.Id)
                        orderby c.LastName, c.FirstName, c.MiddleName
                        select new Contact(c.Id, c.Email, c.LastName, c.FirstName, c.MiddleName, c.Phone1, c.Phone2,
                            c.Phone3, c.CreatorAccountId, c.StreetAddress, c.City, c.State, c.Zip,
                            c.FirstYear.GetValueOrDefault(), c.DateOfBirth, c.UserId)).ToList();
            }
		}

		static public bool ModifyPlayer(Player player)
		{
			int rowCount = 0;

			player.Contact.Phone1 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(player.Contact.Phone1));
			player.Contact.Phone2 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(player.Contact.Phone2));
			player.Contact.Phone3 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(player.Contact.Phone3));

			try
			{
				System.Web.Security.MembershipUser user = System.Web.Security.Membership.GetUser(player.Contact.UserName);
				if (user != null)
				{
					user.Email = player.Contact.Email;
					System.Web.Security.Membership.UpdateUser(user);
				}
			}
			catch (Exception ex)
			{
				Globals.LogException(ex);
			}

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.UpdatePlayer", myConnection);
					myCommand.Parameters.Add("@playerSeasonId", SqlDbType.BigInt).Value = player.Id;
					myCommand.Parameters.Add("@playerNumber", SqlDbType.Int).Value = player.PlayerNumber;
					myCommand.Parameters.Add("@submittedWaiver", SqlDbType.Bit).Value = player.SubmittedWaiver;
					myCommand.Parameters.Add("@submittedDriversLicense", SqlDbType.Bit).Value = player.SubmittedDriversLicense;
					myCommand.Parameters.Add("@lastName", SqlDbType.VarChar, 25).Value = player.Contact.LastName;
					myCommand.Parameters.Add("@firstName", SqlDbType.VarChar, 25).Value = player.Contact.FirstName;
					myCommand.Parameters.Add("@middleName", SqlDbType.VarChar, 25).Value = player.Contact.MiddleName;
					myCommand.Parameters.Add("@firstYear", SqlDbType.Int).Value = player.Contact.FirstYear;
					myCommand.Parameters.Add("@dateOfBirth", SqlDbType.SmallDateTime).Value = player.Contact.DateOfBirth;
					myCommand.Parameters.Add("@streetAddress", SqlDbType.VarChar, 75).Value = player.Contact.StreetAddress;
					myCommand.Parameters.Add("@city", SqlDbType.VarChar, 25).Value = player.Contact.City;
					myCommand.Parameters.Add("@state", SqlDbType.VarChar, 25).Value = player.Contact.State;
					myCommand.Parameters.Add("@zip", SqlDbType.VarChar, 15).Value = player.Contact.Zip;
					myCommand.Parameters.Add("@affiliationDuesPaid", SqlDbType.VarChar, 50).Value = player.AffiliationDuesPaid;
					myCommand.Parameters.Add("@phone1", SqlDbType.VarChar, 14).Value = player.Contact.Phone1;
					myCommand.Parameters.Add("@phone2", SqlDbType.VarChar, 14).Value = player.Contact.Phone2;
					myCommand.Parameters.Add("@phone3", SqlDbType.VarChar, 14).Value = player.Contact.Phone3;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					rowCount = myCommand.ExecuteNonQuery();
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return (rowCount <= 0) ? false : true;
		}

		static public long AddPlayer(Player player)
		{
			long playerId = 0;

			if (player.AccountId <= 0 || player.TeamId <= 0)
				return 0;


			try
			{
				if (player.Contact == null)
				{
					string homePhone = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(player.Contact.Phone1));
					string workPhone = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(player.Contact.Phone3));
					string cellPhone = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(player.Contact.Phone2));
					string streetAddress = player.Contact.StreetAddress;
					string city = player.Contact.City;
					string state = player.Contact.State;
					string zip = player.Contact.Zip;

					System.Diagnostics.Debug.Assert(false, "Fix this");
					//player.SetContactInfo(Contacts.AddContact(new Contact(0, player.LastName, player.FirstName, player.MiddleName,
					//                                        homePhone, workPhone, cellPhone, null, player.AccountId,
					//                                        streetAddress, city, state, zip,
					//                                        player.FirstYear, player.DateOfBirth)));
				}

				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.CreatePlayer", myConnection);
					myCommand.Parameters.Add("@teamSeasonId", SqlDbType.BigInt).Value = player.TeamId;
					myCommand.Parameters.Add("@playerNumber", SqlDbType.Int).Value = player.PlayerNumber;
					myCommand.Parameters.Add("@submittedWaiver", SqlDbType.Bit).Value = player.SubmittedWaiver;
					myCommand.Parameters.Add("@submittedDriversLicense", SqlDbType.Bit).Value = player.SubmittedDriversLicense;
					myCommand.Parameters.Add("@contactId", SqlDbType.BigInt).Value = player.Contact.Id;
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = player.AccountId;
					myCommand.Parameters.Add("@affiliationDuesPaid", SqlDbType.VarChar, 50).Value = player.AffiliationDuesPaid;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					if (dr.Read())
						playerId = dr.GetInt64(0);
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return playerId;
		}

		static public void RemoveTeamPlayers(long teamSeasonId)
		{
			IEnumerable<Player> players = TeamRoster.GetAllPlayers(teamSeasonId);
			foreach (Player p in players)
			{
				TeamRoster.RemovePlayer(p);
			}
		}

		static public bool RemovePlayer(Player p)
		{
			int rowCount = 0;

			// remove player stats for season.
			GameStats.RemovePlayerStats(p.Id);

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.DeletePlayer", myConnection);
					myCommand.Parameters.Add("@playerSeasonId", SqlDbType.BigInt).Value = p.Id;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					rowCount = myCommand.ExecuteNonQuery();
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return (rowCount <= 0) ? false : true;
		}

		static public bool ReleasePlayer(Player p)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.ReleasePlayer", myConnection);
					myCommand.Parameters.Add("@playerSeasonId", SqlDbType.BigInt).Value = p.Id;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					rowCount = myCommand.ExecuteNonQuery();
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return (rowCount <= 0) ? false : true;
		}

		static public bool SignContact(long accountId, long teamSeasonId, long contactId)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.SignContact", myConnection);
					myCommand.Parameters.Add("@contactId", SqlDbType.BigInt).Value = contactId;
					myCommand.Parameters.Add("@teamSeasonId", SqlDbType.BigInt).Value = teamSeasonId;
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					rowCount = myCommand.ExecuteNonQuery();
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return (rowCount <= 0) ? false : true;
		}

		static public bool SignPlayer(long teamSeasonId, long playerId)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.SignPlayer", myConnection);
					myCommand.Parameters.Add("@playerId", SqlDbType.BigInt).Value = playerId;
					myCommand.Parameters.Add("@teamSeasonId", SqlDbType.BigInt).Value = teamSeasonId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					rowCount = myCommand.ExecuteNonQuery();
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return (rowCount <= 0) ? false : true;
		}

		static public bool CopySeasonRoster(int teamSeasonId, int copyTeamSeasonId)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.CopySeasonRoster", myConnection);
					myCommand.Parameters.Add("@copyTeamSeasonId", SqlDbType.BigInt).Value = copyTeamSeasonId;
					myCommand.Parameters.Add("@teamSeasonId", SqlDbType.BigInt).Value = teamSeasonId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					rowCount = myCommand.ExecuteNonQuery();

				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return (rowCount <= 0) ? false : true;
		}

		static public bool PlayerNameExists(long accountId, long contactId, String firstName, String lastName, String middleName)
		{
			return Contacts.DoesContactExist(accountId, contactId, firstName, middleName, lastName);
		}

		static public Player GetPlayerFromName(long accountId, string firstName, string lastName, string middleName)
		{
			Player p = null;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetPlayerFromName", myConnection);
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;
					myCommand.Parameters.Add("@firstName", SqlDbType.VarChar, 25).Value = firstName;
					myCommand.Parameters.Add("@lastName", SqlDbType.VarChar, 25).Value = lastName;
					myCommand.Parameters.Add("@middleName", SqlDbType.VarChar, 25).Value = middleName;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					if (dr.Read())
					{
						Contact contactInfo = Contacts.GetContact(dr.GetInt64(2));
						p = new Player(dr.GetInt64(0), 0, -1, contactInfo, false, dr.GetBoolean(3), dr.GetInt64(1), DateTime.Now, string.Empty);
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return p;
		}

		static public bool PlayerNameExists(String firstName, String lastName, String middleName, long playerSeasonId)
		{
			bool rc = false;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.PlayerNameExistsInCurrentSeason", myConnection);
					myCommand.Parameters.Add("@firstName", SqlDbType.VarChar, 25).Value = firstName;
					myCommand.Parameters.Add("@lastName", SqlDbType.VarChar, 25).Value = lastName;
					myCommand.Parameters.Add("@middleName", SqlDbType.VarChar, 25).Value = middleName;
					myCommand.Parameters.Add("@playerSeasonId", SqlDbType.BigInt).Value = playerSeasonId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					if (dr.Read() && dr.GetInt64(0) > 0)
					{
						rc = true;
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return rc;
		}

		static public List<Player> GetAllBirthdayBoys(long accountId)
		{
			List<Player> players = new List<Player>();
			DateTime c = DateTime.Today;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetAllBirthdays", myConnection);
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;
					myCommand.Parameters.Add("@d", SqlDbType.SmallDateTime).Value = c;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					while (dr.Read())
					{
						Contact contactInfo = Contacts.GetContact(dr.GetInt64(2));
						if (contactInfo != null && contactInfo.DateOfBirth != DateTime.MinValue)
							players.Add(new Player(dr.GetInt64(0), 0, 0, contactInfo, false, dr.GetBoolean(3), dr.GetInt64(1), DateTime.Now, string.Empty));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return players;
		}

        // get all the active players in the current season.
		static public IEnumerable<Contact> GetAllActivePlayers(long accountId)
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

		public static bool IsTeamMember(long contactId, long teamSeasonId)
		{
			bool isMember = false;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.IsTeamMember", myConnection);
					myCommand.Parameters.Add("@contactId", SqlDbType.BigInt).Value = contactId;
					myCommand.Parameters.Add("@teamSeasonId", SqlDbType.BigInt).Value = teamSeasonId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myCommand.Prepare();
					myConnection.Open();

					SqlDataReader dr = myCommand.ExecuteReader();

					if (dr.Read())
					{
						isMember = (dr.GetInt64(0) > 0);
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return isMember;
		}

		public static long GetTeamPlayerIdFromName(long teamId, string name)
		{
			long playerId = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					string[] tokens = name.Split(new char[] { ' ' });
					if (tokens.Length < 2)
						return playerId;

					string firstName = string.Empty;
					string middleName = string.Empty;
					string lastName = string.Empty;

					if (tokens.Length > 2)
					{
						firstName = tokens[0];
						middleName = tokens[1];
						lastName = tokens[2];
					}
					else
					{
						firstName = tokens[0];
						lastName = tokens[1];
					}

					SqlCommand myCommand = new SqlCommand("dbo.GetTeamPlayerFromName", myConnection);
					myCommand.Parameters.Add("@teamSeasonId", SqlDbType.BigInt).Value = teamId;
					myCommand.Parameters.Add("@firstName", SqlDbType.VarChar, 25).Value = firstName;
					myCommand.Parameters.Add("@lastName", SqlDbType.VarChar, 25).Value = lastName;
					myCommand.Parameters.Add("@middleName", SqlDbType.VarChar, 25).Value = middleName;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					if (dr.Read())
					{
						playerId = dr.GetInt64(0);
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return playerId;
		}
	}
}