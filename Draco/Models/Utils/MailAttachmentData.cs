using System.Collections.Generic;

namespace SportsManager.Models.Utils
{
    public class AttachmentData
    {
        public string fileUri { get; set; }
        public string fileName { get; set; }
    }

    public class EmailUsersData
    {
        public string Subject { get; set; }
        public string Message { get; set; }
        public int ToType { get; set; }
        public IEnumerable<long> To { get; set; }
        public IEnumerable<AttachmentData> Attachments { get; set; }
    }

}