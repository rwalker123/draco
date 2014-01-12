using System.Collections.Generic;
using System.Linq;
using SportsManager;
using SportsManager.Model;

namespace DataAccess.Golf
{
	public static class GolfRosters
	{
		public static IEnumerable<GolfRoster> GetRoster(long teamSeasonId)
		{
            DB db = DBConnection.GetContext();

			return (from gr in db.GolfRosters
					where gr.TeamSeasonId == teamSeasonId && gr.IsActive == true
					select gr);
		}

		public static IEnumerable<GolfRoster> GetSubs(long seasonId)
		{
            DB db = DBConnection.GetContext();

			return (from gr in db.GolfRosters
					where gr.IsSub && gr.SubSeasonId == seasonId && gr.IsActive == true
					select gr);
		}

		public static IEnumerable<Contact> GetAvailableSubs(long accountId, long seasonId)
		{
            DB db = DBConnection.GetContext();

			var playersOnTeam = (from ls in db.LeagueSeasons
								 join ts in db.TeamsSeasons on ls.id equals ts.LeagueSeasonId
								 join gr in db.GolfRosters on ts.id equals gr.TeamSeasonId
								 where gr.IsActive == true && ls.SeasonId == seasonId
								 select gr.ContactId).Distinct();

			var currentSubs = (from gr in db.GolfRosters
							   where gr.IsSub && gr.SubSeasonId == seasonId && gr.IsActive == true
							   select gr.ContactId);

			// if you aren't on a team, you can be signed.
			return (from c in db.Contacts
					where c.CreatorAccountId == accountId && !playersOnTeam.Contains(c.Id) && !currentSubs.Contains(c.Id)
					select c);
		}

		public static IEnumerable<Contact> GetAvailableGolfers(long accountId, long flightId)
		{
            DB db = DBConnection.GetContext();

			var playersOnTeam = (from ls in db.LeagueSeasons
								 join ts in db.TeamsSeasons on ls.id equals ts.LeagueSeasonId
								 join gr in db.GolfRosters on ts.id equals gr.TeamSeasonId
								 where ls.id == flightId && gr.IsActive == true
								 select gr.ContactId).Distinct();

			// if you aren't on a team, you can be signed.
			return (from c in db.Contacts
					where c.CreatorAccountId == accountId && !playersOnTeam.Contains(c.Id)
					select c);
		}

		public static IEnumerable<GolfRoster> GetActivePlayers(long seasonId, long flightId)
		{
            DB db = DBConnection.GetContext();

			return (from ts in db.TeamsSeasons
					join gr in db.GolfRosters on ts.id equals gr.TeamSeasonId
					where ts.LeagueSeasonId == flightId && gr.IsActive == true
					select gr);
		}

		public static long AddRosterPlayer(GolfRoster rosterPlayer)
		{
            DB db = DBConnection.GetContext();

			db.GolfRosters.InsertOnSubmit(rosterPlayer);
			db.SubmitChanges();

			return rosterPlayer.Id;
		}

		public static bool SignPlayer(long seasonId, long teamSeasonId, long contactId)
		{
            DB db = DBConnection.GetContext();

			// trying to sign a sub.
			if (teamSeasonId == 0)
			{
				GolfRoster subPlayer = (from gr in db.GolfRosters
										where gr.IsSub == true && gr.SubSeasonId == seasonId && gr.ContactId == contactId
										select gr).SingleOrDefault();
				if (subPlayer != null)
				{
					subPlayer.IsActive = true;
					db.SubmitChanges();
				}
				else
				{
					subPlayer = new GolfRoster()
					{
						ContactId = (int)contactId,
						TeamSeasonId = teamSeasonId,
						IsActive = true,
						IsSub = true,
						SubSeasonId = seasonId
					};

					db.GolfRosters.InsertOnSubmit(subPlayer);
					db.SubmitChanges();
				}
			}
			else
			{
				// is player already on team but inactive?
				GolfRoster rosterPlayer = (from gr in db.GolfRosters
										   where gr.TeamSeasonId == teamSeasonId && gr.ContactId == contactId
										   select gr).SingleOrDefault();
				if (rosterPlayer != null)
				{
					rosterPlayer.IsActive = true;
					db.SubmitChanges();
				}
				else
				{
					// see if player is listed as a sub. 
					rosterPlayer = (from gr in db.GolfRosters
									where gr.IsSub == true && gr.SubSeasonId == seasonId && gr.ContactId == contactId
									select gr).SingleOrDefault();

					if (rosterPlayer != null)
					{
						rosterPlayer.IsActive = true;
						rosterPlayer.TeamSeasonId = teamSeasonId;
						rosterPlayer.IsSub = false;
						rosterPlayer.SubSeasonId = 0;

						db.SubmitChanges();
					}
					else
					{
						rosterPlayer = new GolfRoster()
						{
							ContactId = (int)contactId,
							TeamSeasonId = teamSeasonId,
							IsActive = true,
							IsSub = false,
							SubSeasonId = 0
						};

						db.GolfRosters.InsertOnSubmit(rosterPlayer);
						db.SubmitChanges();
					}
				}
			}

			return true;
		}

		public static GolfRoster GetRosterPlayer(long rosterPlayerId)
		{
            DB db = DBConnection.GetContext();

			return (from gr in db.GolfRosters
					where gr.Id == rosterPlayerId
					select gr).SingleOrDefault();
		}

		public static bool ModifyRosterPlayer(GolfRoster rosterPlayer)
		{
            DB db = DBConnection.GetContext();

			GolfRoster dbRosterPlayer = (from gr in db.GolfRosters
										 where gr.Id == rosterPlayer.Id
										 select gr).SingleOrDefault();

			if (dbRosterPlayer == null)
				return false;

			dbRosterPlayer.IsActive = rosterPlayer.IsActive;
			dbRosterPlayer.Contact.FirstName = rosterPlayer.Contact.FirstName;
			dbRosterPlayer.Contact.MiddleName = rosterPlayer.Contact.MiddleName;
			dbRosterPlayer.Contact.LastName = rosterPlayer.Contact.LastName;
			dbRosterPlayer.Contact.IsFemale = rosterPlayer.Contact.IsFemale;

			dbRosterPlayer.InitialDifferential = rosterPlayer.InitialDifferential;

			dbRosterPlayer.IsSub = rosterPlayer.IsSub;
			dbRosterPlayer.SubSeasonId = rosterPlayer.SubSeasonId;

			db.SubmitChanges();

			return true;
		}

		public static bool RemoveRosterPlayer(long rosterPlayerId, bool deleteContact, bool asSub)
		{
            DB db = DBConnection.GetContext();

			GolfRoster rosterPlayer = (from gr in db.GolfRosters
									   where gr.Id == rosterPlayerId
									   select gr).SingleOrDefault();

			if (rosterPlayer == null)
				return false;

			// put into sub list, don't need to delete anything.
			if (asSub)
			{
				rosterPlayer.TeamSeasonId = 0;
				rosterPlayer.IsActive = true;
				db.SubmitChanges();

				return true;
			}

			long contactId = rosterPlayer.ContactId;

			// can only delete if player doesn't have any scores for the team.
			bool hasAnyScoresForTeam = (from gms in db.GolfMatchScores
										where gms.PlayerId == rosterPlayerId && rosterPlayer.TeamSeasonId == gms.TeamId
										select gms).Any();

			if (hasAnyScoresForTeam)
				rosterPlayer.IsActive = false;
			else
				db.GolfRosters.DeleteOnSubmit(rosterPlayer);

			// submit this much, check to see if we can delete contact next.
			db.SubmitChanges();

			// check to see if we can delete the contact, we can if they have no scores and are not on any team.
			if (!hasAnyScoresForTeam && deleteContact)
			{
				bool onAnyTeams = (from gr in db.GolfRosters
								   where gr.ContactId == contactId
								   select gr).Any();

				bool hasAnyScores = (from gs in db.GolfScores
									 where gs.ContactId == contactId
									 select gs).Any();

				if (!onAnyTeams && !hasAnyScores)
				{
					Contact dbContact = (from c in db.Contacts
										 where c.Id == contactId
										 select c).Single();

					db.Contacts.DeleteOnSubmit(dbContact);

					db.SubmitChanges();
				}
			}

			return true;
		}
	}
}