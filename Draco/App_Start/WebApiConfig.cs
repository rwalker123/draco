using BasicAuthentication.Filters;
using ModelObjects;
using SportsManager.ViewModels.API;
using System.Linq;
using System.Web.Http;
using System.Web.Http.OData.Builder;
using System.Web.Http.OData.Extensions;

namespace SportsManager
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            // Web API configuration and services
            config.Filters.Add(new IdentityBasicAuthenticationAttribute());
            
            // Web API configuration and services
            // Configure Web API to use only bearer token authentication.
            //config.SuppressDefaultHostAuthentication();
            //config.Filters.Add(new HostAuthenticationFilter(OAuthDefaults.AuthenticationType));

            // Web API routes
            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                name: "NoAccountIdAPI",
                routeTemplate: "api/{controller}/{action}"
            );


            config.Routes.MapHttpRoute(
                name: "TeamGameApi",
                routeTemplate: "api/{controller}/{accountId}/Team/{teamSeasonId}/Game/{gameId}/{action}/{playerId}"
            );

            config.Routes.MapHttpRoute(
                name: "TopicsApi",
                routeTemplate: "api/{controller}/{accountId}/Topics/{topicId}/{action}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );

            config.Routes.MapHttpRoute(
                name: "CategoriesApi",
                routeTemplate: "api/{controller}/{accountId}/Categories/{categoryId}/{action}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );

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
            modelBuilder.EntitySet<ContactNameViewModel>("ContactsOData");
            modelBuilder.EntitySet<Game>("ScheduleOData");

            Microsoft.Data.Edm.IEdmModel model = modelBuilder.GetEdmModel();
            config.Routes.MapODataServiceRoute("ODataRoute", "odata", model);

            // make JSON the default return.
            var appXmlType = config.Formatters.XmlFormatter.SupportedMediaTypes.FirstOrDefault(t => t.MediaType == "application/xml");
            config.Formatters.XmlFormatter.SupportedMediaTypes.Remove(appXmlType);

        }
    }
}
