using System;
using System.Collections.Generic;
using System.Text;
using System.Web.Mvc;

namespace SportsManager.ViewModels
{
    public class DiscussionsViewModel : AccountViewModel
    {
        public DiscussionsViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
        }
    }
}