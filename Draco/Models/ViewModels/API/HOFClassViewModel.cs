using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SportsManager.ViewModels.API
{
    public class HOFClassViewModel
    {
        public int Year { get; set; }
        public int MemberCount { get; set; }
        public IEnumerable<HOFMemberViewModel> Members { get; set; }
    }
}