using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(SportsManager.Startup))]
namespace SportsManager
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
