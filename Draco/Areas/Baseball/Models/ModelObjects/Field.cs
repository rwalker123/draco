using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Data.Spatial;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for Field
	/// </summary>
	public class Field
	{
		public Field()
		{
		}

		public Field(long fieldId)
            : this()
		{
			Id = fieldId;
		}

		public Field(long fieldId, long accountId, string fieldName, string shortName,
					string fieldComment, string address, string city, string state, string zipCode,
					string directions, string rainoutNumber, string latitude, string longitude)
            : this()
		{
			AccountId = accountId;
			Id = fieldId;

			Name = fieldName;
			ShortName = shortName;
			Comment = fieldComment;
			Address = address;
			City = city;
			State = state;
			ZipCode = zipCode;
			Directions = directions;
			RainoutNumber = rainoutNumber;

            LocationGeo = DbGeography.PointFromText("POINT(" + longitude + " " + latitude + ")", 4326);
		}

		public long Id { get; set; }
		public long AccountId { get; set; }

		public string Name { get; set; }
		public string ShortName { get; set; }
        public string Comment { get; set; }
        public string Address { get; set; }
		public string City { get; set; }
		public string State { get; set; }
		public string ZipCode { get; set; }
		public string Directions { get; set; }
        public string RainoutNumber { get; set; }

		public DbGeography LocationGeo { get; set; }

		virtual public ICollection<FieldContact> FieldContacts { get; set; }
	}
}