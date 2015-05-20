using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Data.Spatial;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for Field
	/// </summary>
	public class AvailableField
	{
        public long Id { get; set; } // id (Primary key)
        public long AccountId { get; set; } // AccountId
        public string Name { get; set; } // Name
        public string ShortName { get; set; } // ShortName
        public string Comment { get; set; } // Comment
        public string Address { get; set; } // Address
        public string City { get; set; } // City
        public string State { get; set; } // State
        public string ZipCode { get; set; } // ZipCode
        public string Directions { get; set; } // Directions
        public string RainoutNumber { get; set; } // RainoutNumber
        public string Latitude { get; set; } // Latitude
        public string Longitude { get; set; } // Longitude
        //public DbGeography LocationGeo { get; set; }

        // Reverse navigation
        public virtual ICollection<FieldContact> FieldContacts { get; set; } // FieldContacts.FK_FieldContacts_AvailableFields
        public virtual ICollection<WorkoutAnnouncement> WorkoutAnnouncements { get; set; } // WorkoutAnnouncement.FK_WorkoutAnnouncement_AvailableFields

        // Foreign keys
        public virtual Account Account { get; set; } // FK_AvailableFields_Accounts
        
        public AvailableField()
        {
            FieldContacts = new List<FieldContact>();
            WorkoutAnnouncements = new List<WorkoutAnnouncement>();
            //LocationGeo = DbGeography.PointFromText("POINT(" + longitude + " " + latitude + ")", 4326);
        }

	}
}