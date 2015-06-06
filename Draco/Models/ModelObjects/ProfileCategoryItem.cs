using System.Collections.Generic;

namespace ModelObjects
{
/// <summary>
/// Summary description for ProfileCategoryItem
/// </summary>
	public class ProfileCategoryItem
	{
        public long Id { get; set; } // id (Primary key)
        public long AccountId { get; set; } // AccountId
        public string CategoryName { get; set; } // CategoryName
        public int Priority { get; set; } // Priority

        // Reverse navigation
        public virtual ICollection<ProfileQuestionItem> ProfileQuestions { get; set; } // ProfileQuestion.FK_ProfileQuestion_ProfileCategory

        // Foreign keys
        public virtual Account Account { get; set; } // FK_ProfileCategory_Accounts
        
        public ProfileCategoryItem()
        {
            ProfileQuestions = new List<ProfileQuestionItem>();
        }
	}
}