using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web.SessionState;
using ModelObjects;
using SportsManager;
using SportsManager.Models.Utils;
using System.Threading.Tasks;

namespace DataAccess
{
	/// <summary>
	/// Summary description for Teams
	/// </summary>
	static public class Teams
	{
		static public long GetCurrentTeam()
		{
			long aId = 0;

			System.Web.HttpContext context = System.Web.HttpContext.Current;
			if (context != null)
			{
				aId = DataAccess.Teams.GetCurrentTeam(context.Session);
			}

			return aId;
		}

		static public long GetCurrentTeam(HttpSessionState s)
		{
			return s["AdminCurrentTeam"] != null ? Int32.Parse((string)s["AdminCurrentTeam"]) : 0;
		}

        static public Team GetTeamSeason(long teamId)
        {
            DB db = DBConnection.GetContext();
            var team = (from t in db.Teams
                     where t.id == teamId
                     select t).SingleOrDefault();

            if (team == null)
                return null;

            var currentSeason = DataAccess.Seasons.GetCurrentSeason(team.AccountId);
            var currentLeagues = (from ls in db.LeagueSeasons
                                  where ls.SeasonId == currentSeason
                                  select ls.id);

            var teamSeason = (from ts in db.TeamsSeasons
                              where ts.TeamId == team.id && currentLeagues.Contains(ts.LeagueSeasonId)
                              select ts).SingleOrDefault();

            if (teamSeason == null)
                return null;

            return new Team(teamSeason.id, teamSeason.LeagueSeasonId, teamSeason.Name, teamSeason.DivisionSeasonId, team.id, team.AccountId);
        }

		static public string GetTeamNameFromTeamId(long teamId, bool includeLeague)
		{
            Team t = GetTeamSeason(teamId);
            if (t == null)
                return null;

            if (includeLeague)
            {
                DB db = DBConnection.GetContext();
                return (from ls in db.LeagueSeasons
                        join l in db.Leagues on ls.LeagueId equals l.id
                        where ls.id == t.LeagueId
                        select l.Name + " " + t.Name).SingleOrDefault();
            }
            else
            {
                return t.Name;
            }
		}

		static public string GetTeamName(long teamId)
		{
            DB db = DBConnection.GetContext();
            return (from ts in db.TeamsSeasons
                    where ts.id == teamId
                    select ts.Name).SingleOrDefault();
		}

		static public string GetLeagueTeamName(long teamId)
		{
            DB db = DBConnection.GetContext();
            return (from ts in db.TeamsSeasons
                    join ls in db.LeagueSeasons on ts.LeagueSeasonId equals ls.id
                    join l in db.Leagues on ls.LeagueId equals l.id
                    where ts.id == teamId
                    select l.Name + " " + ts.Name).SingleOrDefault();
		}

		static public Team GetTeam(long teamId)
		{
			Team team = null;
			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetTeam", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					if (dr.Read())
					{
						team = new Team(dr.GetInt64(1), dr.GetInt64(2), dr.GetString(3), dr.GetInt64(4), dr.GetInt64(0), dr.GetInt64(6));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return team;
		}

		static public long GetTeamSeasonIdFromId(long teamId)
		{
			long teamSeasonId = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetTeamSeasonIdFromId", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					if (dr.Read())
					{
						teamSeasonId = dr.GetInt64(0);
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return teamSeasonId;
		}

		static public IEnumerable<Team> GetTeams(long leagueId)
		{
            DB db = DBConnection.GetContext();

			return (from ts in db.TeamsSeasons
					join t in db.Teams on ts.TeamId equals t.id
					where ts.LeagueSeasonId == leagueId
					orderby ts.DivisionSeasonId
					select new Team(ts.id, ts.LeagueSeasonId, ts.Name, ts.DivisionSeasonId, ts.TeamId, t.AccountId));
		}

		static public List<Team> GetAccountTeams(long accountId, bool includeNone)
		{
			List<Team> teams = new List<Team>();

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetAccountTeams", myConnection);
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					if (includeNone)
						teams.Add(new Team(0, 0, "No Team Selected", 0, 0, 0));

					while (dr.Read())
					{
						teams.Add(new Team(dr.GetInt64(1), dr.GetInt64(2), dr.GetString(3), dr.GetInt64(4), dr.GetInt64(0), dr.GetInt64(6)));
					}

				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return teams;
		}

        static public IQueryable<Team> GetDivisionTeams(long divisionSeasonId)
        {
            DB db = DBConnection.GetContext();

            return (from t in db.TeamsSeasons
                    where t.DivisionSeasonId == divisionSeasonId
                    orderby t.Name ascending
                    select new Team()
                    {
                        Id = t.id,
                        LeagueId = t.LeagueSeasonId,
                        Name = t.Name,
                        DivisionId = t.DivisionSeasonId,
                        TeamId = t.TeamId,
                        AccountId = t.Team.AccountId
                    });
        }


		static public bool ModifyTeam(Team team)
		{
            DB db = DBConnection.GetContext();

			SportsManager.Model.TeamsSeason dbTeamSeason = (from ts in db.TeamsSeasons
															where ts.id == team.Id
															select ts).Single();

			dbTeamSeason.DivisionSeasonId = team.DivisionId;
			dbTeamSeason.Name = team.Name;

			db.SubmitChanges();

			return true;
		}

		static public long AddTeam(Team t)
		{
            DB db = DBConnection.GetContext();

			SportsManager.Model.Team dbTeam = new SportsManager.Model.Team()
			{
				AccountId = t.AccountId,
				WebAddress = String.Empty
			};

			db.Teams.InsertOnSubmit(dbTeam);
			db.SubmitChanges();

			SportsManager.Model.TeamsSeason dbTeamSeason = new SportsManager.Model.TeamsSeason()
			{
				LeagueSeasonId = t.LeagueId,
				TeamId = dbTeam.id,
				DivisionSeasonId = t.DivisionId,
				Name = t.Name
			};

			db.TeamsSeasons.InsertOnSubmit(dbTeamSeason);
			db.SubmitChanges();

			t.Id = dbTeamSeason.id;

			return t.Id;
		}

		static public async Task<bool> RemoveLeagueTeams(long leagueId)
		{
			var teams = Teams.GetTeams(leagueId);

			foreach (Team t in teams)
			{
				await Teams.RemoveTeam(t);
			}

            return true;
		}

		static public async Task<bool> RemoveTeam(Team t)
		{
			TeamRoster.RemoveTeamPlayers(t.Id);
			IQueryable<TeamManager> managers = Teams.GetTeamManagers(t.Id);

			foreach (TeamManager tm in managers)
			{
				Teams.RemoveManager(tm);
			}

			List<ModelObjects.PhotoGalleryItem> items = DataAccess.PhotoGallery.GetTeamPhotos(t.TeamId);
			foreach (ModelObjects.PhotoGalleryItem item in items)
			{
				DataAccess.PhotoGallery.RemovePhoto(item);
			}

			DataAccess.PhotoGallery.RemoveTeamPhotoAlbum(new ModelObjects.PhotoGalleryAlbum(0, String.Empty, 0, 0, t.TeamId));

            DB db = DBConnection.GetContext();

			SportsManager.Model.TeamsSeason dbTeamSeason = (from ts in db.TeamsSeasons
															where ts.id == t.Id
															select ts).SingleOrDefault();

			long teamId = dbTeamSeason.TeamId;

			var allGamesForTeam = (from ls in db.LeagueSchedules
								   where ls.HTeamId == dbTeamSeason.id || ls.VTeamId == dbTeamSeason.id
								   select ls.id);

			db.PlayerRecaps.DeleteAllOnSubmit(from pr in db.PlayerRecaps
											  where allGamesForTeam.Contains(pr.GameId)
											  select pr);

			db.LeagueSchedules.DeleteAllOnSubmit(from ls in db.LeagueSchedules
												 where ls.HTeamId == dbTeamSeason.id || ls.VTeamId == dbTeamSeason.id
												 select ls);

			db.TeamsSeasons.DeleteOnSubmit(dbTeamSeason);

			db.SubmitChanges();

			// if no other TeamSeason for given team, delete team definition.
			bool anyMoreTeamsSeasons = (from ts in db.TeamsSeasons
										where ts.TeamId == teamId
										select ts).Any();

			if (!anyMoreTeamsSeasons)
			{
				db.MessageCategories.DeleteAllOnSubmit(from mc in db.MessageCategories
													   where mc.isTeam && mc.AccountId == teamId
													   select mc);

				db.Teams.DeleteOnSubmit((from t2 in db.Teams
										 where t2.id == teamId
										 select t2).Single());

				db.SubmitChanges();

				// remove uploads directory for account
                string storageDir = Globals.UploadDirRoot + "Teams/" + teamId + "/";
                await AzureStorageUtils.RemoveCloudDirectory(storageDir);
			}

			return true;
		}

		static public bool RemoveManager(TeamManager tm)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.DeleteTeamManager", myConnection);
					myCommand.Parameters.Add("@managerSeasonId", SqlDbType.BigInt).Value = tm.Id;
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

        static public IQueryable<TeamManager> GetTeamManagers(long teamId)
        {
            DB db = DBConnection.GetContext();
            return (from tsm in db.TeamSeasonManagers
                    join ts in db.TeamsSeasons on tsm.TeamSeasonId equals ts.id
                    join t in db.Teams on ts.TeamId equals t.id
                    join c in db.Contacts on tsm.ContactId equals c.Id
                    where tsm.TeamSeasonId == teamId
                    select new TeamManager()
                    {
                        Id = c.Id,
                        FirstName = c.FirstName,
                        LastName = c.LastName,
                        MiddleName = c.MiddleName,
                        PhotoURL = Contact.GetPhotoURL(c.Id),                        
                        MgrSeasonId = tsm.id,
                        TeamId = teamId,
                        AccountId = t.AccountId
                    });
        }

		static public TeamManager GetManager(long managerId)
		{
            //SELECT TeamSeasonManager.Id, Teams.AccountId, TeamSeasonManager.ContactId, TeamsSeason.Id
            //FROM TeamSeasonManager 
            //    LEFT JOIN TeamsSeason ON TeamsSeason.Id = TeamSeasonManager.TeamSeasonId
            //    LEFT JOIN Teams ON Teams.Id = TeamsSeason.TeamId
            //WHERE TeamSeasonManager.Id = @id

            DB db = DBConnection.GetContext();
            return (from tsm in db.TeamSeasonManagers
                    join ts in db.TeamsSeasons on tsm.TeamSeasonId equals ts.id
                    join t in db.Teams on ts.TeamId equals t.id
                    join c in db.Contacts on tsm.ContactId equals c.Id
                    where tsm.id == managerId
                    select new TeamManager() {
                        Id = c.Id,
                        FirstName = c.FirstName,
                        LastName = c.LastName,
                        MiddleName = c.MiddleName,
                        PhotoURL = Contact.GetPhotoURL(c.Id),
                        MgrSeasonId = tsm.id,
                        TeamId = tsm.TeamSeasonId,
                        AccountId = t.AccountId
                    }).SingleOrDefault();
		}

		static public long AddManager(TeamManager m)
		{
			long id = 0;

			if (m.AccountId <= 0 || m.TeamId <= 0)
				return 0;


			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.CreateTeamManager", myConnection);
					myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = m.TeamId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					if (dr.Read())
						id = dr.GetInt64(0);
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return id;
		}

		static public bool CopySeasonTeams(long leagueSeasonId, long copyLeagueSeasonId)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.CopySeasonTeams", myConnection);
					myCommand.Parameters.Add("@leagueSeasonId", SqlDbType.BigInt).Value = leagueSeasonId;
					myCommand.Parameters.Add("@copyLeagueSeasonId", SqlDbType.BigInt).Value = copyLeagueSeasonId;
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

        /// <summary>
        /// get all the teams the user is an admin for. Note that this doesn't include Administrator or AccountAdmins
        /// as they are admins for all teams.
        /// </summary>
        /// <param name="accountId"></param>
        /// <param name="userName"></param>
        /// <returns>list of team season id's the user is admin for</returns>
        static public IQueryable<long> GetTeamsAsAdmin(long accountId, string userName)
        {
            long currentSeasonId = DataAccess.Seasons.GetCurrentSeason(accountId);
            DB db = DBConnection.GetContext();

            // get user id from username.
            var contactId = (from c in db.Contacts
                             where c.Email == userName
                             select c.Id).SingleOrDefault();
            // if not contact, can't be a team admin.
            if (contactId != 0)
            {
                // all team season ids in current season.
                var teamsInSeason = (from ts in db.TeamsSeasons
                                     join ls in db.LeagueSeasons on ts.LeagueSeasonId equals ls.id
                                     where ls.SeasonId == currentSeasonId
                                     select ts.id);

                // are there teams to be admin of..
                if (teamsInSeason.Any())
                {
                    // get teams contact is manager of..
                    var mgrList = (from tsm in db.TeamSeasonManagers
                                   where tsm.ContactId == contactId && teamsInSeason.Contains(tsm.TeamSeasonId)
                                   select tsm.TeamSeasonId);

                    // get the list of teams the contact is admin for...
                    string roleId = (from r in db.AspNetRoles
                                  where r.Name == "TeamAdmin"
                                  select r.Id).SingleOrDefault();

                    var teamAdmins = (from cr in db.ContactRoles
                                      where cr.ContactId == contactId && cr.AccountId == accountId && cr.RoleId == roleId &&
                                      teamsInSeason.Contains(cr.RoleData)
                                      select cr.RoleData);

                    return mgrList.Union(teamAdmins);
                }
            }

            return new List<long>().AsQueryable();

            // other with TeamAdministrator role.
    //DECLARE @mgrId bigint

    //SET @mgrId = (SELECT TeamSeasonManager.ContactId
    //                    FROM TeamSeasonManager LEFT JOIN TeamsSeason on TeamsSeason.Id = TeamSeasonManager.TeamSeasonId
    //                    WHERE TeamSeasonId = @teamSeasonId AND ContactId = @contactId)

    //IF (@mgrId = 0 OR @mgrId is NULL)
    //    SET @mgrId = (SELECT Id
    //                  FROM TeamsSeason
    //                  WHERE Id = @teamSeasonId AND TeamId IN
    //                    (SELECT RoleData FROM ContactRoles WHERE ContactId = @contactId AND (RoleName = 'TeamAdmin' OR RoleName = 'TeamPhotoAdmin')))

    //IF @mgrId is NULL
    //    SET @mgrId = 0

    //SELECT @mgrId
        }

		static public bool IsTeamAdmin(ModelObjects.Contact c, long teamId)
		{
			bool isManager = false;

			if (c == null || teamId == 0)
				return false;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.IsTeamManager", myConnection);
					myCommand.Parameters.Add("@contactId", SqlDbType.BigInt).Value = c.Id;
					myCommand.Parameters.Add("@teamSeasonId", SqlDbType.BigInt).Value = teamId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					object result = myCommand.ExecuteScalar();
					if (result != null)
					{
						isManager = ((long)result > 0);
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return isManager;
		}

		static public IQueryable<Contact> GetTeamContacts(long teamSeasonId)
		{
            DB db = DBConnection.GetContext();
            return (from ts in db.TeamsSeasons
                    join rs in db.RosterSeasons on ts.id equals rs.TeamSeasonId
                    join r in db.Rosters on rs.PlayerId equals r.id
                    join c in db.Contacts on r.ContactId equals c.Id
                    where (c.Email != null && c.Email != "") && ts.id == teamSeasonId && !rs.Inactive
                    orderby c.LastName, c.FirstName, c.MiddleName
                    select new Contact(c.Id, c.Email, c.LastName, c.FirstName, c.MiddleName, c.Phone1, c.Phone2,
                        c.Phone3, c.CreatorAccountId, c.StreetAddress, c.City, c.State, c.Zip,
                        c.FirstYear.GetValueOrDefault(), c.DateOfBirth, c.UserId));
		}

	}
}
