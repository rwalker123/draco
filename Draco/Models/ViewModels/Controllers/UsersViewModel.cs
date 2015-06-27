using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using SportsManager.Baseball.ViewModels;
using System;
using System.IO;
using System.Web.Mvc;
using System.Linq;

namespace SportsManager.ViewModels
{
    public class UsersViewModel : AccountViewModel
    {
        public UsersViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
        }

        public int PageSize
        {
            get { return SportsManager.Controllers.ContactsODataController.PageSize; }
        }

        public int AccountFirstYear
        {
            get { return Account.FirstYear;  }
        }
    }
}