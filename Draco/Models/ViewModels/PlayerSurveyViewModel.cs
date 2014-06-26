using System.Web.Mvc;

namespace SportsManager.ViewModels
{
    public class PlayerSurveyViewModel : AccountViewModel
    {
        public PlayerSurveyViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
        }
    }
}