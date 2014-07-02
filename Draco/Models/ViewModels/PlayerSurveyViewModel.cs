using System.Web.Mvc;

namespace SportsManager.ViewModels
{
    public class PlayerSurveyViewModel : AccountViewModel
    {
        public PlayerSurveyViewModel(Controller c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            TeamSeasonId = teamSeasonId;
        }
        
        public PlayerSurveyViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
        }

        public long TeamSeasonId
        {
            get;
            set;
        }
    }
}