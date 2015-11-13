using System.Web.Mvc;

namespace SportsManager.Golf
{
	public class GolfAreaRegistration : AreaRegistration
	{
		public override string AreaName
		{
			get
			{
				return "Golf";
			}
		}

		public override void RegisterArea(AreaRegistrationContext context)
		{
			context.MapRoute(
				"Golf_RosterPlayer",
				"Golf/{controller}/{action}/{accountId}/{seasonId}/{flightId}/{teamId}/{id}"
			);
			context.MapRoute(
				"Golf_Rosters",
				"Golf/{controller}/{action}/{accountId}/{seasonId}/{flightId}/{id}"
			);
			context.MapRoute(
				"Golf_default2",
				"Golf/{controller}/{action}/{accountId}/{seasonId}/{id}"
			);
			// NOTE: this matches the one below with accountId/Id, change long accountId, long seasonId (change seasonId to id)
			//context.MapRoute(
			//    "Golf_default3",
			//    "Golf/{controller}/{action}/{accountId}/{seasonId}"
			//);
			context.MapRoute(
				"Golf_default4",
				"Golf/{controller}/{action}/{accountId}/{id}"
			);
			context.MapRoute(
				"Golf_default5",
				"Golf/{controller}/{action}/{accountId}"
			);
			context.MapRoute(
				"Golf_default",
				"Golf/{controller}/{action}"
			);
		}
	}
}
