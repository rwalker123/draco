using System.Linq;

namespace ModelObjects
{
    public class HOFClass
    {
        public int Year { get; set; }
        public int MemberCount { get; set; }
        public IQueryable<HOFMember> Members { get; set; }
    }
}