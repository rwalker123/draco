using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SportsManager.Models.Helpers
{
	public static class JQGridHelpers
	{
		public static HtmlString BuildGridColumnDefinitions<T>()
		{
			//return new HtmlString("colNames: ['Name'], " +
			//                        "colModel: [" +
			//                        "{ name: 'Name', index: 'Name', width: 180, editable: true, sortable: false }," +
			//                        "],");

			System.Text.StringBuilder colNames = new System.Text.StringBuilder();
			colNames.Append("colNames: [");

			System.Text.StringBuilder colModels = new System.Text.StringBuilder();
			colModels.Append("colModel: [");

			bool firstTime = true;

			var info = typeof(SportsManager.Golf.ViewModels.TeamViewModel).GetProperties();
			foreach (var i in info)
			{
				bool include = true;

				object[] o = i.GetCustomAttributes(typeof(System.ComponentModel.DataAnnotations.ScaffoldColumnAttribute), false);
				if (o.Length > 0)
				{
					System.ComponentModel.DataAnnotations.ScaffoldColumnAttribute sca = (System.ComponentModel.DataAnnotations.ScaffoldColumnAttribute)o[o.Length - 1];
					include = (sca.Scaffold);
				}

				if (include)
				{
					colNames.Append(String.Format("'{0}'", i.Name));
					colModels.Append(String.Format("{{ name: '{0}', index: '{1}', width: 80, editable: true }}", i.Name, i.Name));
					if (!firstTime)
					{
						colNames.Append(",");
						colModels.Append(",");
					}
					else
						firstTime = false;
				}

				o = i.GetCustomAttributes(typeof(System.ComponentModel.DataAnnotations.ValidationAttribute), false);

				//o = i.GetCustomAttributes(typeof(System.ComponentModel.DataAnnotations.StringLengthAttribute), false);
				//o = i.GetCustomAttributes(typeof(System.ComponentModel.DataAnnotations.EditableAttribute), false);
				//o = i.GetCustomAttributes(typeof(System.ComponentModel.DataAnnotations.DataTypeAttribute), false);
			}

			colNames.Append("],");
			colModels.Append("],");


			return new HtmlString(colNames.Append(colModels.ToString()).ToString());
		}
	}
}


