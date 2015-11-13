using System.Web.Mvc;

namespace SportsManager.Baseball
{
    public class BaseballAreaRegistration : AreaRegistration
    {
        public override string AreaName
        {
            get
            {
                return "Baseball";
            }
        }

        public override void RegisterArea(AreaRegistrationContext context)
        {
            context.MapRoute(
                "Baseball_default2",
                "Baseball/{controller}/{action}/{accountId}/{seasonId}/{id}"
            );
            context.MapRoute(
                "Baseball_default1",
                "Baseball/{controller}/{action}/{accountId}/{id}"
            );
            context.MapRoute(
                "Baseball_default3",
                "Baseball/{controller}/{action}/{accountId}"
            );
            context.MapRoute(
                "Baseball_default",
                "Baseball/{controller}/{action}"
            );
        }
    }
}
