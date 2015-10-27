using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ModelObjects
{
    public class AspNetRole
    {
        public string Id { get; set; } // Id (Primary key)
        public string Name { get; set; } // Name

        // Reverse navigation
        public virtual ICollection<AspNetUser> AspNetUsers { get; set; } // Many to many mapping

        public AspNetRole()
        {
            AspNetUsers = new List<AspNetUser>();
        }
    }
}