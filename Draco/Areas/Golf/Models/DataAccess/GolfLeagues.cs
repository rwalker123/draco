using System;
using System.Collections.Generic;
using System.Linq;
using SportsManager;
using SportsManager.Model;

namespace DataAccess.Golf
{
	/// <summary>
	/// Summary description for GolfLeagues
	/// </summary>
	static public class GolfLeagues
	{
		static public IEnumerable<Account> GetGolfLeagues()
		{
            DB db = DBConnection.GetContext();

			return (from a in db.Accounts
					where a.AccountTypeId == 3
					select a);
		}

		static public GolfLeagueSetup GetLeagueSetup(long accountId)
		{
            DB db = DBConnection.GetContext();

			var leagueSetup = (from a in db.GolfLeagueSetups
							   where a.AccountId == accountId
							   select a).SingleOrDefault();

			if (leagueSetup == null)
			{
				leagueSetup = new GolfLeagueSetup();
				leagueSetup.FirstTeeTime = DateTime.Now;
				leagueSetup.AccountId = accountId;
			}

			return leagueSetup;
		}

		static public bool UpdateGolfLeagueSetup(GolfLeagueSetup gls)
		{
			if (gls.AccountId <= 0)
				return false;

            DB db = DBConnection.GetContext();

			GolfLeagueSetup curGls = (from a in db.GolfLeagueSetups
									  where a.AccountId == gls.AccountId
									  select a).SingleOrDefault();

			if (curGls == null)
			{
				db.GolfLeagueSetups.InsertOnSubmit(gls);
				db.SubmitChanges();
			}
			else
			{
				curGls.FirstTeeTime = gls.FirstTeeTime;
				curGls.HolesPerMatch = gls.HolesPerMatch;
				curGls.TimeBetweenTeeTimes = gls.TimeBetweenTeeTimes;
				curGls.LeagueDay = gls.LeagueDay;
				db.SubmitChanges();
			}

			return true;
		}

		public static GolfTeeInformation GetDefaultCourseTee(long accountId, long courseId, bool forWoman)
		{
            DB db = DBConnection.GetContext();

			long? teeId = (from gls in db.GolfLeagueCourses
						   where gls.AccountId == accountId && gls.CourseId == courseId
						   select forWoman ? gls.DefaultWomansTee : gls.DefaultMensTee).SingleOrDefault();

			if (teeId.HasValue)
				return (from ti in db.GolfTeeInformations
						where ti.Id == teeId.Value
						select ti).SingleOrDefault();
			else
				return null;
		}
	}
}