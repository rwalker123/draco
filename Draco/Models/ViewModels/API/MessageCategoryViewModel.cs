using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SportsManager.ViewModels.API
{
    public class MessageCategoryViewModel
    {
        public long Id { get; set; } 
        public long AccountId { get; set; } 
        public int Order { get; set; } // -> CategoryOrder
        public string Name { get; set; } // -> CategoryName
        public string Description { get; set; }  // -> CategoryDescription
        public bool AllowAnonymousPost { get; set; } 
        public bool AllowAnonymousTopic { get; set; } 
        public bool IsTeam { get; set; } 
        public bool IsModerated { get; set; } 
        public MessagePostViewModel LastPost { get; set; } // -> GetLastPostForCategory(dbMessageCategory.Id),
        public int NumberOfThreads { get; set; } // -> GetNumberOfThreadsForCategory(dbMessageCategory.Id)

    }
}