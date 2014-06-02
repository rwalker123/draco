using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ModelObjects
{
    public class LeaderCategory
    {
        public LeaderCategory()
        {
            NumDecimals = 0;
            TrimLeadingZero = false;
        }

        public String Name { get; set; }
        public String Id { get; set; }
        public int NumDecimals { get; set; }
        public bool TrimLeadingZero { get; set; }
    }


}