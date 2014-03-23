using System.Linq;
using System.Web.Http;
using System.Web.Http.OData.Builder;

namespace SportsManager
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            // Web API configuration and services

            // Web API routes
            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                name: "LeagueApi",
                routeTemplate: "api/{controller}/{accountId}/League/{leagueSeasonId}/{action}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );

            config.Routes.MapHttpRoute(
                name: "TeamApi",
                routeTemplate: "api/{controller}/{accountId}/Team/{teamSeasonId}/{action}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );

            //config.Routes.MapHttpRoute(
            //    name: "RoleApi",
            //    routeTemplate: "api/{controller}/{accountId}/Role/{action}/{id}/{roleId}"
            //);

            config.Routes.MapHttpRoute(
                name: "ActionApi",
                routeTemplate: "api/{controller}/{accountId}/{action}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{accountId}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );

            ODataModelBuilder modelBuilder = new ODataConventionModelBuilder();
            modelBuilder.EntitySet<ModelObjects.ContactName>("ContactsOData");
            modelBuilder.EntitySet<ModelObjects.Game>("ScheduleOData");

            Microsoft.Data.Edm.IEdmModel model = modelBuilder.GetEdmModel();
            config.Routes.MapODataRoute("ODataRoute", "odata", model);

            // make JSON the default return.
            var appXmlType = config.Formatters.XmlFormatter.SupportedMediaTypes.FirstOrDefault(t => t.MediaType == "application/xml");
            config.Formatters.XmlFormatter.SupportedMediaTypes.Remove(appXmlType);

        }
    }
}
