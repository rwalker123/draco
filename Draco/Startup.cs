using Autofac;
using Autofac.Integration.Mvc;
using Autofac.Integration.WebApi;
using Microsoft.Owin;
using ModelObjects;
using Owin;
using System.Reflection;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Routing;

[assembly: OwinStartupAttribute(typeof(SportsManager.Startup))]
namespace SportsManager
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            // AutoFac IOC
            var builder = new ContainerBuilder();

            var config = new HttpConfiguration(); // if using OWIN, don't use this: GlobalConfiguration.Configuration;

            WebApiConfig.Register(config);

            // Register your MVC controllers.
            builder.RegisterControllers(Assembly.GetExecutingAssembly()); 
            builder.RegisterApiControllers(Assembly.GetExecutingAssembly());


            builder.RegisterType<DB>()
                   .AsSelf()
                   .InstancePerRequest();

            //builder.RegisterFilterProvider();
            //builder.RegisterWebApiFilterProvider(config);

            var container = builder.Build();

            config.DependencyResolver = new AutofacWebApiDependencyResolver(container);

            DependencyResolver.SetResolver(new AutofacDependencyResolver(container));
            app.UseAutofacMiddleware(container);
            app.UseAutofacMvc();
            app.UseAutofacWebApi(config);
            app.UseWebApi(config);

            ConfigureAuth(app);
        }
    }
}
