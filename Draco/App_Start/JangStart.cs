using Jang.Jazz;
[assembly: WebActivator.PreApplicationStartMethod(typeof(SportsManager.JangStart), "Start")]

namespace SportsManager
{
    public static class JangStart
    {
        /// <summary>
        /// Starts the application
        /// </summary>
        public static void Start()
        {
            //There are several view engines available for Jang
            //Jazz is the default one
            Jang.Infrastructure.DependencyResolver.Current.Register(typeof(Jang.IViewEngine), new JazzViewEngine());
        }
    }
}
