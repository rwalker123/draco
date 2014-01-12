using System;
using System.Text;

/// <summary>
/// Summary description for PhoneUtils
/// </summary>
public class PhoneUtils
{
	// accepts a un-formatted phone number like 1231234 or 1231231234
	// and formats it like 123-1234 or (123) 123-1234
	static public string FormatPhoneNumber(string phone)
	{
		string formattedPhone = String.Empty;

		if (phone != null)
		{

			if (phone.Length == 7)
			{
				formattedPhone = phone.Substring(0, 3) + "-" + phone.Substring(3);
			}
			else if (phone.Length == 10)
			{
				formattedPhone = "(" + phone.Substring(0, 3) + ") " + phone.Substring(3, 3) + "-" + phone.Substring(6);
			}
			else
			{
				formattedPhone = phone;
			}
		}

		return formattedPhone;
	}
	
	static public string UnformatPhoneNumber(string phone)
	{
		StringBuilder unformattedPhone = new StringBuilder();

		if (phone != null)
		{
			foreach (char c in phone)
			{
				if (Char.IsDigit(c))
					unformattedPhone.Append(c);
			}
		}

		return unformattedPhone.ToString();
	}
}
