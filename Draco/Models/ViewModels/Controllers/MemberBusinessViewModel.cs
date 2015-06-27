using ModelObjects;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SportsManager.ViewModels
{
    public class MemberBusinessViewModel : AccountViewModel
    {
        public MemberBusinessViewModel(System.Web.Mvc.Controller c, long accountId)
            : base(c, accountId)
        {
            CanCreateBusiness = DataAccess.MemberDirectory.CanCreateMemberBusiness(accountId, ContactId);
        }

        public bool CanCreateBusiness
        {
            get;
            set;
        }
    }
}