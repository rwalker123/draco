using System.Web.Mvc;

namespace SportsManager.ViewModels
{
    public class UserPollViewModel : AccountViewModel
    {
        public UserPollViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
            CanVote = this.ContactId > 0;
        }

        public bool CanVote
        {
            get;
            private set;
        }
    }
}