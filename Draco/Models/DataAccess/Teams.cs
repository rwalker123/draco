using Microsoft.AspNet.Identity;
using ModelObjects;
using SportsManager;
using SportsManager.Models.Utils;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DataAccess
{
	/// <summary>
	/// Summary description for Teams
	/// </summary>
	static public class Teams
	{
        static public Team GetTeamSeason(long teamId)
        {
            DB db = DBConnection.GetContext();
            var team = (from t in db.Teams
                     where t.Id == teamId
                     select t).SingleOrDefault();

            if (team == null)
                return null;

            var currentSeason = DataAccess.Seasons.GetCurrentSeason(team.AccountId);
            var currentLeagues = (from ls in db.LeagueSeasons
                                  where ls.SeasonId == currentSeason
                                  select ls.Id);

            var teamSeason = (from ts in db.TeamsSeasons
                              where ts.TeamId == team.Id && currentLeagues.Contains(ts.LeagueSeasonId)
                              select ts).SingleOrDefault();

            if (teamSeason == null)
                return null;

            return new Team(teamSeason.Id, teamSeason.LeagueSeasonId, teamSeason.Name, teamSeason.DivisionSeasonId, team.Id, team.AccountId);
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
                        join l in db.Leagues on ls.LeagueId equals l.Id
                        where ls.Id == t.LeagueId
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
                    where ts.Id == teamId
                    select ts.Name).SingleOrDefault();
		}

		static public string GetLeagueTeamName(long teamId)
		{
            DB db = DBConnection.GetContext();
            return (from ts in db.TeamsSeasons
                    join ls in db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                    join l in db.Leagues on ls.LeagueId equals l.Id
                    where ts.Id == teamId
                    select l.Name + " " + ts.Name).SingleOrDefault();
		}

		static public Team GetTeam(long teamId)
		{
            DB db = DBConnection.GetContext();

            return (from ts in db.TeamsSeasons
                    join t in db.Teams on ts.TeamId equals t.Id
                    where ts.Id == teamId
                    select new Team()
                    {
                        Id = ts.Id,
                        TeamId = t.Id,
                        AccountId = t.AccountId,
                        DivisionId = ts.DivisionSeasonId,
                        LeagueId = ts.LeagueSeasonId,
                        YouTubeUserId = t.YouTubeUserId,
                        Name = ts.Name
                    }).SingleOrDefault();
		}

		static public long GetTeamSeasonIdFromId(long teamId)
		{
            //DECLARE @accountId bigint
            //DECLARE @currentSeasonId bigint
	
            //SET @accountId = (SELECT AccountId FROM Teams WHERE Teams.Id = @teamId)
            //SET @currentSeasonId = (SELECT SeasonId FROM CurrentSeason WHERE AccountId = @accountId)

            //SELECT TeamsSeason.Id
            //FROM LeagueSeason LEFT JOIN TeamsSeason ON TeamsSeason.LeagueSeasonId = LeagueSeason.Id
            //WHERE LeagueSeason.SeasonId = @currentSeasonId AND TeamsSeason.TeamId = @teamId

            DB db = DBConnection.GetContext();

            long accountId = (from t in db.Teams
                              where t.Id == teamId
                              select t.AccountId).SingleOrDefault();
            if (accountId == 0)
                return 0;

            long currentSeasonId = (from cs in db.CurrentSeasons
                                    where cs.AccountId == accountId
                                    select cs.AccountId).SingleOrDefault();

            if (currentSeasonId == 0)
                return 0;

            return (from ls in db.LeagueSeasons
                    join ts in db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                    where ls.SeasonId == currentSeasonId && ts.TeamId == teamId
                    select ts.Id).SingleOrDefault();
		}

		static public IQueryable<Team> GetTeams(long leagueId)
		{
            DB db = DBConnection.GetContext();

			return (from ts in db.TeamsSeasons
					join t in db.Teams on ts.TeamId equals t.Id
					where ts.LeagueSeasonId == leagueId
					orderby ts.DivisionSeasonId
					select new Team(ts.Id, ts.LeagueSeasonId, ts.Name, ts.DivisionSeasonId, ts.TeamId, t.AccountId));
		}

        static public IQueryable<Team> GetUnassignedTeams(long leagueId)
        {
            DB db = DBConnection.GetContext();

            return (from ts in db.TeamsSeasons
                    join t in db.Teams on ts.TeamId equals t.Id
                    where ts.LeagueSeasonId == leagueId && ts.DivisionSeasonId == 0
                    orderby ts.DivisionSeasonId
                    select new Team(ts.Id, ts.LeagueSeasonId, ts.Name, ts.DivisionSeasonId, ts.TeamId, t.AccountId));
        }

		static public IQueryable<Team> GetAccountTeams(long accountId)
		{
            DB db = DBConnection.GetContext();

            var seasonId = (from s in db.CurrentSeasons
                            where s.AccountId == accountId
                            select s.SeasonId).SingleOrDefault();

            return (from ts in db.TeamsSeasons
                    join t in db.Teams on ts.TeamId equals t.Id
                    join ls in db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                    join l in db.Leagues on ls.LeagueId equals l.Id
                    where t.AccountId == accountId && ls.SeasonId == seasonId
                    orderby l.Name, ts.Name
                    select new Team()
                    {
                        Id = ts.Id,
                        TeamId = t.Id,
                        Name = l.Name + " " + ts.Name,
                        DivisionId = ts.DivisionSeasonId,
                        LeagueId = ts.LeagueSeasonId,
                        YouTubeUserId = t.YouTubeUserId,
                        AccountId = accountId
                    });
		}

        static public IQueryable<Team> GetDivisionTeams(long divisionSeasonId)
        {
            DB db = DBConnection.GetContext();

            return (from t in db.TeamsSeasons
                    where t.DivisionSeasonId == divisionSeasonId
                    orderby t.Name ascending
                    select new Team()
                    {
                        Id = t.Id,
                        LeagueId = t.LeagueSeasonId,
                        Name = t.Name,
                        DivisionId = divisionSeasonId,
                        TeamId = t.TeamId,
                        AccountId = t.Team.AccountId
                    });
        }

		static public bool ModifyTeam(Team team)
		{
            if (String.IsNullOrWhiteSpace(team.Name))
                return false;

            DB db = DBConnection.GetContext();

			SportsManager.Model.TeamsSeason dbTeamSeason = (from ts in db.TeamsSeasons
															where ts.Id == team.Id
															select ts).Single();

			dbTeamSeason.DivisionSeasonId = team.DivisionId;
			dbTeamSeason.Name = team.Name.Trim();

			db.SubmitChanges();

			return true;
		}

        static public bool ModifyYouTubeId(Team team)
        {
            DB db = DBConnection.GetContext();

            SportsManager.Model.Team dbTeam = (from ts in db.Teams
                                                            where ts.Id == team.TeamId
                                                            select ts).Single();

            dbTeam.YouTubeUserId = team.YouTubeUserId;

            db.SubmitChanges();

            return true;
        }

        static public long AddTeam(Team t)
		{
            DB db = DBConnection.GetContext();

			SportsManager.Model.Team dbTeam = new SportsManager.Model.Team()
			{
				AccountId = t.AccountId,
				WebAddress = String.Empty,
                YouTubeUserId = String.Empty
			};

			db.Teams.InsertOnSubmit(dbTeam);
			db.SubmitChanges();

            int nameLength = 25;

            t.Name = t.Name.Trim();

			SportsManager.Model.TeamsSeason dbTeamSeason = new SportsManager.Model.TeamsSeason()
			{
				LeagueSeasonId = t.LeagueId,
				TeamId = dbTeam.Id,
				DivisionSeasonId = t.DivisionId,
				Name = t.Name.Length <= nameLength ? t.Name : t.Name.Substring(0, nameLength)
			};

			db.TeamsSeasons.InsertOnSubmit(dbTeamSeason);
			db.SubmitChanges();

			t.Id = dbTeamSeason.Id;

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
				Teams.RemoveManager(tm.MgrSeasonId);
			}

			var items = DataAccess.PhotoGallery.GetTeamPhotos(t.TeamId);
			foreach (ModelObjects.PhotoGalleryItem item in items)
			{
				await DataAccess.PhotoGallery.RemovePhoto(item);
			}

			await DataAccess.PhotoGallery.RemoveTeamPhotoAlbum(new ModelObjects.PhotoGalleryAlbum(0, String.Empty, 0, 0, t.TeamId));

            DB db = DBConnection.GetContext();

			SportsManager.Model.TeamsSeason dbTeamSeason = (from ts in db.TeamsSeasons
															where ts.Id == t.Id
															select ts).SingleOrDefault();

			long teamId = dbTeamSeason.TeamId;

			var allGamesForTeam = (from ls in db.LeagueSchedules
								   where ls.HTeamId == dbTeamSeason.Id || ls.VTeamId == dbTeamSeason.Id
								   select ls.Id);

			db.PlayerRecaps.DeleteAllOnSubmit(from pr in db.PlayerRecaps
											  where allGamesForTeam.Contains(pr.GameId)
											  select pr);

			db.LeagueSchedules.DeleteAllOnSubmit(from ls in db.LeagueSchedules
												 where ls.HTeamId == dbTeamSeason.Id || ls.VTeamId == dbTeamSeason.Id
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
										 where t2.Id == teamId
										 select t2).Single());

				db.SubmitChanges();

				// remove uploads directory for account
                string storageDir = Globals.UploadDirRoot + "Teams/" + teamId + "/";
                await Storage.Provider.DeleteDirectory(storageDir);
			}

			return true;
		}

		static public bool RemoveManager(long mgrId)
		{
            DB db = DBConnection.GetContext();

            var dbManager = (from t in db.TeamSeasonManagers
                             where mgrId == t.Id
                             select t).SingleOrDefault();

            if (dbManager != null)
            {
                db.TeamSeasonManagers.DeleteOnSubmit(dbManager);
                db.SubmitChanges();
                return true;
            }

            return false;
		}

        static public IQueryable<TeamManager> GetTeamManagers(long teamId)
        {
            DB db = DBConnection.GetContext();
            return (from tsm in db.TeamSeasonManagers
                    join ts in db.TeamsSeasons on tsm.TeamSeasonId equals ts.Id
                    join t in db.Teams on ts.TeamId equals t.Id
                    join c in db.Contacts on tsm.ContactId equals c.Id
                    where tsm.TeamSeasonId == teamId
                    select new TeamManager()
                    {
                        Id = c.Id,
                        FirstName = c.FirstName,
                        LastName = c.LastName,
                        MiddleName = c.MiddleName,
                        PhotoURL = Contact.GetPhotoURL(c.Id),                        
                        MgrSeasonId = tsm.Id,
                        TeamId = teamId,
                        AccountId = t.AccountId,
                        Email = c.Email,
                        Phone1 = c.Phone1,
                        Phone2 = c.Phone2,
                        Phone3 = c.Phone3,
                        BirthDate = c.DateOfBirth
                    });
        }

        static public IQueryable<Player> GetTeamManagersAsPlayer(long teamId)
        {
            DB db = DBConnection.GetContext();
            return (from tsm in db.TeamSeasonManagers
                    join ts in db.TeamsSeasons on tsm.TeamSeasonId equals ts.Id
                    join t in db.Teams on ts.TeamId equals t.Id
                    join c in db.Contacts on tsm.ContactId equals c.Id
                    where tsm.TeamSeasonId == teamId
                    select new Player()
                    {
                        Id = tsm.Id,
                        TeamId = tsm.TeamSeasonId,
                        PlayerNumber = 0,
                        SubmittedWaiver = false,
                        AccountId = t.AccountId,
                        Contact = new Contact(tsm.Contact.Id, tsm.Contact.Email, tsm.Contact.LastName, tsm.Contact.FirstName, tsm.Contact.MiddleName, tsm.Contact.Phone1, tsm.Contact.Phone2, tsm.Contact.Phone3, tsm.Contact.CreatorAccountId, tsm.Contact.StreetAddress, tsm.Contact.City, tsm.Contact.State, tsm.Contact.Zip, tsm.Contact.FirstYear.GetValueOrDefault(), tsm.Contact.DateOfBirth, tsm.Contact.UserId),
                        SubmittedDriversLicense = false,
                        DateAdded = DateTime.MinValue,
                        AffiliationDuesPaid = String.Empty,
                        GamesPlayed = 0
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
                    join ts in db.TeamsSeasons on tsm.TeamSeasonId equals ts.Id
                    join t in db.Teams on ts.TeamId equals t.Id
                    join c in db.Contacts on tsm.ContactId equals c.Id
                    where tsm.Id == managerId
                    select new TeamManager() {
                        Id = c.Id,
                        FirstName = c.FirstName,
                        LastName = c.LastName,
                        MiddleName = c.MiddleName,
                        PhotoURL = Contact.GetPhotoURL(c.Id),
                        MgrSeasonId = tsm.Id,
                        TeamId = tsm.TeamSeasonId,
                        AccountId = t.AccountId,
                        Email = c.Email,
                        Phone1 = c.Phone1,
                        Phone2 = c.Phone2,
                        Phone3 = c.Phone3,
                        BirthDate = c.DateOfBirth
                    }).SingleOrDefault();
		}

		static public long AddManager(TeamManager m)
		{
            DB db = DBConnection.GetContext();

            var isManager = (from tsm in db.TeamSeasonManagers
                             join ts in db.TeamsSeasons on tsm.TeamSeasonId equals ts.Id
                             join t in db.Teams on ts.TeamId equals t.Id
                             join c in db.Contacts on tsm.ContactId equals c.Id
                             where c.Id == m.Id && tsm.TeamSeasonId == m.TeamId
                             select tsm.Id).SingleOrDefault();

            if (isManager > 0)
                return isManager;

            var dbManager = new SportsManager.Model.TeamSeasonManager()
            {
                TeamSeasonId = m.TeamId,
                ContactId = m.Id
            };

            db.TeamSeasonManagers.InsertOnSubmit(dbManager);
            db.SubmitChanges();

            return dbManager.Id;
		}

		static public bool CopySeasonTeams(long leagueSeasonId, long copyLeagueSeasonId)
		{
            //DECLARE @divId bigint
            //DECLARE @oldTeamSeasonId bigint
            //DECLARE @teamId bigint
            //DECLARE @oldDivisionId bigint
            //DECLARE @divisionSeasonId bigint
            //DECLARE @teamSeasonId bigint
            //DECLARE @teamName varchar(25)
	

            //DECLARE teams CURSOR LOCAL FOR SELECT Id, TeamId, Name, DivisionSeasonId FROM TeamsSeason WHERE LeagueSeasonId = @copyLeagueSeasonId
            //OPEN teams
            //FETCH NEXT FROM teams INTO @oldTeamSeasonId, @teamId, @teamName, @oldDivisionId
            //WHILE (@@FETCH_STATUS = 0)
            //BEGIN

            //    SET @divId = (SELECT DivisionId FROM DivisionSeason WHERE Id = @oldDivisionId)
            //    SET @divisionSeasonId = (SELECT Id FROM DivisionSeason WHERE DivisionId = @divId AND LeagueSeasonID = @leagueSeasonId)

            //    INSERT INTO TeamsSeason VALUES(@leagueSeasonId, @teamId, @teamName, @divisionSeasonId)
            //    SET @teamSeasonId = @@IDENTITY

            //    -- copy roster.                
            //    EXEC dbo.CopySeasonRoster @teamSeasonId, @oldTeamSeasonId

            //    -- copy managers.                                        
            //    EXEC dbo.CopySeasonManager @teamSeasonId, @oldTeamSeasonId
        
            //    FETCH NEXT FROM teams INTO @oldTeamSeasonId, @teamId, @teamName, @oldDivisionId
            //END
            DB db = DBConnection.GetContext();
            var teams = (from ts in db.TeamsSeasons
                         where ts.LeagueSeasonId == copyLeagueSeasonId
                         select ts);

            foreach(var t in teams)
            {
                var divId = (from ds in db.DivisionSeasons
                             where ds.Id == t.DivisionSeasonId
                             select ds.DivisionId).SingleOrDefault();

                var divisionSeasonId = (from ds in db.DivisionSeasons
                                        where ds.DivisionId == divId && ds.LeagueSeasonId == leagueSeasonId
                                        select ds.Id).SingleOrDefault();

                var ts = new SportsManager.Model.TeamsSeason()
                {
                    LeagueSeasonId = leagueSeasonId,
                    TeamId = t.TeamId,
                    Name = t.Name,
                    DivisionSeasonId = divisionSeasonId
                };
                db.TeamsSeasons.InsertOnSubmit(ts);
                db.SubmitChanges();

                TeamRoster.CopySeasonRoster(ts.Id, t.Id);
                Leagues.CopySeasonManager(db, ts.Id, t.Id);
                db.SubmitChanges();
            }

            return true;
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
                                     join ls in db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                                     where ls.SeasonId == currentSeasonId
                                     select ts.Id);

                // are there teams to be admin of..
                if (teamsInSeason.Any())
                {
                    // get teams contact is manager of..
                    var mgrList = (from tsm in db.TeamSeasonManagers
                                   where tsm.ContactId == contactId && teamsInSeason.Contains(tsm.TeamSeasonId)
                                   select tsm.TeamSeasonId);

                    // get the list of teams the contact is admin for...
                    string roleId = DataAccess.ContactRoles.GetTeamAdminId();

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

		static public IQueryable<Contact> GetTeamContacts(long teamSeasonId)
		{
            DB db = DBConnection.GetContext();
            return (from ts in db.TeamsSeasons
                    join rs in db.RosterSeasons on ts.Id equals rs.TeamSeasonId
                    join r in db.Rosters on rs.PlayerId equals r.Id
                    join c in db.Contacts on r.ContactId equals c.Id
                    where (c.Email != null && c.Email != "") && ts.Id == teamSeasonId && !rs.Inactive
                    orderby c.LastName, c.FirstName, c.MiddleName
                    select new Contact(c.Id, c.Email, c.LastName, c.FirstName, c.MiddleName, c.Phone1, c.Phone2,
                        c.Phone3, c.CreatorAccountId, c.StreetAddress, c.City, c.State, c.Zip,
                        c.FirstYear.GetValueOrDefault(), c.DateOfBirth, c.UserId));
		}

        static public IQueryable<AccountWelcome> GetWelcomeTextHeaders(long accountId, long teamId)
        {
            DB db = DBConnection.GetContext();
            return (from aw in db.AccountWelcomes
                    where aw.AccountId == accountId && aw.TeamId == teamId
                    orderby aw.OrderNo
                    select new AccountWelcome()
                    {
                        Id = aw.Id,
                        AccountId = accountId,
                        TeamId = teamId,
                        CaptionText = aw.CaptionMenu,
                        OrderNo = aw.OrderNo,
                        WelcomeText = "" // don't return message text.
                    });
        }

        static public IQueryable<AccountWelcome> GetWelcomeText(long accountId, long teamId)
        {
            DB db = DBConnection.GetContext();
            return (from aw in db.AccountWelcomes
                    where aw.AccountId == accountId && aw.TeamId == teamId
                    orderby aw.OrderNo
                    select new AccountWelcome()
                    {
                        Id = aw.Id,
                        AccountId = accountId,
                        TeamId = teamId,
                        CaptionText = aw.CaptionMenu,
                        OrderNo = aw.OrderNo,
                        WelcomeText = aw.WelcomeText
                    });
        }

        static public bool IsTeamMember(long teamSeasonId, string aspNetUserId = null)
        {
            bool isTeamMember = false;

            if (String.IsNullOrEmpty(aspNetUserId))
            {
                aspNetUserId = Globals.GetCurrentUserId();
            }

            if (!String.IsNullOrEmpty(aspNetUserId))
            {
                var contact = DataAccess.Contacts.GetContact(aspNetUserId);
                if (contact == null)
                    return false;
                isTeamMember = DataAccess.TeamRoster.IsTeamMember(contact.Id, teamSeasonId);

            }

            return isTeamMember;
        }

        static public bool IsTeamAdmin(long accountId, long teamSeasonId, string aspNetUserId = null)
        {
            bool isTeamAdmin = false;
            
            if (String.IsNullOrEmpty(aspNetUserId))
            {
                aspNetUserId = Globals.GetCurrentUserId();
            }

            if (!String.IsNullOrEmpty(aspNetUserId))
            {
                // check to see if in AspNetUserRoles as Administrator
                var userManager = Globals.GetUserManager();
                try
                {
                    isTeamAdmin = userManager.IsInRole(aspNetUserId, "Administrator");
                }
                catch (Exception)
                {
                    isTeamAdmin = false;
                }

                if (!isTeamAdmin)
                {
                    var contact = DataAccess.Contacts.GetContact(aspNetUserId);
                    if (contact != null)
                    {
                        // first check to see if this user the manager, they get admin rights to the team.
                        var managers = GetTeamManagers(teamSeasonId);
                        isTeamAdmin = (from m in managers
                                       where m.Id == contact.Id
                                       select m).Any();


                        // if not a manager, see if user was given the team admin role.
                        if (!isTeamAdmin)
                        {
                            DB db = DBConnection.GetContext();

                            var roleId = DataAccess.ContactRoles.GetTeamAdminId();
                            var roles = DataAccess.ContactRoles.GetContactRoles(accountId, contact.Id);
                            if (roles != null)
                                isTeamAdmin = (from r in roles
                                               where r.RoleId == roleId && r.AccountId == accountId && r.RoleData == teamSeasonId
                                               select r).Any();
                        }
                    }
                }
            }

            return isTeamAdmin;
        }
        
        static public bool IsTeamPhotoAdmin(long accountId, long teamSeasonId, string aspNetUserId = null)
        {
            bool isTeamAdmin = false;

            if (String.IsNullOrEmpty(aspNetUserId))
            {
                aspNetUserId = Globals.GetCurrentUserId();
            }

            if (!String.IsNullOrEmpty(aspNetUserId))
            {
                var contact = DataAccess.Contacts.GetContact(aspNetUserId);
                if (contact == null)
                    return false;

                // see if user was given the team photo admin role. Note this only checks for 
                // photo admin, if team admin was desired, that role should have been added
                // in the role list. Team admin/account admin/etc does not imply photo admin.
                DB db = DBConnection.GetContext();

                var roleId = DataAccess.ContactRoles.GetTeamPhotoAdminId();
                var roles = DataAccess.ContactRoles.GetContactRoles(accountId, contact.Id);
                if (roles != null)
                    isTeamAdmin = (from r in roles
                                    where r.RoleId == roleId && r.AccountId == accountId && r.RoleData == teamSeasonId
                                    select r).Any();
            }

            return isTeamAdmin;

        }

        public static TeamStanding GetTeamStanding(long teamSeasonId)
        {
            var team = DataAccess.Teams.GetTeam(teamSeasonId);
            
            var teamStanding = new TeamStanding(teamSeasonId, team.DivisionId, team.Name);

            var completedGames = DataAccess.Schedule.GetTeamCompletedGames(teamSeasonId);

			foreach (Game g in completedGames)
			{
                var isHomeTeam = (g.HomeTeamId == teamSeasonId);
				teamStanding.AddGameResult(isHomeTeam, null, g.HomeScore, g.AwayScore, g.GameStatus);
			}

            return teamStanding;
        }

        public static IQueryable<Team> GetCurrentUserTeams(long accountId)
        {
            DB db = DBConnection.GetContext();

            String aspNetUserId = Globals.GetCurrentUserId();
            if (String.IsNullOrEmpty(aspNetUserId))
                return null;

            var contact = DataAccess.Contacts.GetContact(aspNetUserId);

            if (contact == null)
                return null;

            var rosterId = (from r in db.Rosters
                            where r.ContactId == contact.Id
                            select r.Id).SingleOrDefault();

            if (rosterId == 0)
                return null;

            var seasonId = DataAccess.Seasons.GetCurrentSeason(accountId);
            if (seasonId == 0)
                return null;

            return (from rs in db.RosterSeasons
                    join ts in db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
                    join ls in db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                    where ls.SeasonId == seasonId && rs.PlayerId == rosterId && !rs.Inactive
                    select new Team()
                    {
                        Id = ts.Id,
                        AccountId = accountId,
                        DivisionId = ts.DivisionSeasonId,
                        LeagueId = ts.LeagueSeasonId,
                        Name = ts.Name,
                        TeamId = ts.TeamId
                    });
        }
	}
}
