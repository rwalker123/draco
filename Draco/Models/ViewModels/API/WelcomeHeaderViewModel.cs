using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SportsManager.ViewModels.API
{
    public class WelcomeHeaderViewModel
    {
        public long Id { get; set; }
        public long AccountId { get; set; }
        public short OrderNo { get; set; }
        public string CaptionMenu { get; set; }
        public long? TeamId { get; set; }
        public String WelcomeText { get { return String.Empty; } }
    }
}