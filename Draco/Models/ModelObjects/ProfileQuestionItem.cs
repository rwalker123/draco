using System.Collections.Generic;

namespace ModelObjects
{
/// <summary>
/// Summary description for ProfileQuestionItem
/// </summary>
	public class ProfileQuestionItem
	{
        public long Id { get; set; } // id (Primary key)
        public long CategoryId { get; set; } // CategoryId
        public string Question { get; set; } // Question
        public int QuestionNum { get; set; } // QuestionNum

        // Reverse navigation
        public virtual ICollection<ProfileQuestionAnswer> PlayerProfiles { get; set; } // PlayerProfile.FK_PlayerProfile_ProfileQuestion

        // Foreign keys
        public virtual ProfileCategoryItem ProfileCategory { get; set; } // FK_ProfileQuestion_ProfileCategory
        
        public ProfileQuestionItem()
        {
            PlayerProfiles = new List<ProfileQuestionAnswer>();
        }
	}
}