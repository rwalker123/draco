using System;

namespace SportsManager.Model
{
	/// <summary>
	/// Summary description for GolfCourse
	/// </summary>
	public partial class GolfCourse
	{
		public string NameCity
		{
			get
			{
				if (!String.IsNullOrEmpty(City))
					return Name + " (" + City + ")";
				else
					return Name;
			}
		}

		public int GetHoleHandicap(bool isFemale, int holeNo)
		{
			int holeHandicap = 0;

			if (isFemale)
				holeHandicap = WomansHandicap(holeNo);

			if (holeHandicap == 0)
				holeHandicap = MensHandicap(holeNo);

			return holeHandicap;
		}

		public int GetHolePar(bool isFemale, int holeNo)
		{
			int holePar = 0;

			if (isFemale)
				holePar = WomansPar(holeNo);

			if (holePar == 0)
				holePar = MensPar(holeNo);

			return holePar;
		}

		public void MensPar(int holeNo, int parVal)
		{
			switch (holeNo)
			{
				case 1:
					MensPar1 = parVal;
					break;
				case 2:
					MensPar2 = parVal;
					break;
				case 3:
					MensPar3 = parVal;
					break;
				case 4:
					MensPar4 = parVal;
					break;
				case 5:
					MensPar5 = parVal;
					break;
				case 6:
					MensPar6 = parVal;
					break;
				case 7:
					MensPar7 = parVal;
					break;
				case 8:
					MensPar8 = parVal;
					break;
				case 9:
					MensPar9 = parVal;
					break;
				case 10:
					MensPar10 = parVal;
					break;
				case 11:
					MensPar11 = parVal;
					break;
				case 12:
					MensPar12 = parVal;
					break;
				case 13:
					MensPar13 = parVal;
					break;
				case 14:
					MensPar14 = parVal;
					break;
				case 15:
					MensPar15 = parVal;
					break;
				case 16:
					MensPar16 = parVal;
					break;
				case 17:
					MensPar17 = parVal;
					break;
				case 18:
					MensPar18 = parVal;
					break;
			}
		}

		public void MensHandicap(int holeNo, int handicapVal)
		{
			switch (holeNo)
			{
				case 1:
					MensHandicap1 = handicapVal;
					break;
				case 2:
					MensHandicap2 = handicapVal;
					break;
				case 3:
					MensHandicap3 = handicapVal;
					break;
				case 4:
					MensHandicap4 = handicapVal;
					break;
				case 5:
					MensHandicap5 = handicapVal;
					break;
				case 6:
					MensHandicap6 = handicapVal;
					break;
				case 7:
					MensHandicap7 = handicapVal;
					break;
				case 8:
					MensHandicap8 = handicapVal;
					break;
				case 9:
					MensHandicap9 = handicapVal;
					break;
				case 10:
					MensHandicap10 = handicapVal;
					break;
				case 11:
					MensHandicap11 = handicapVal;
					break;
				case 12:
					MensHandicap12 = handicapVal;
					break;
				case 13:
					MensHandicap13 = handicapVal;
					break;
				case 14:
					MensHandicap14 = handicapVal;
					break;
				case 15:
					MensHandicap15 = handicapVal;
					break;
				case 16:
					MensHandicap16 = handicapVal;
					break;
				case 17:
					MensHandicap17 = handicapVal;
					break;
				case 18:
					MensHandicap18 = handicapVal;
					break;
			}
		}

		public void WomansHandicap(int holeNo, int handicapVal)
		{
			switch (holeNo)
			{
				case 1:
					WomansHandicap1 = handicapVal;
					break;
				case 2:
					WomansHandicap2 = handicapVal;
					break;
				case 3:
					WomansHandicap3 = handicapVal;
					break;
				case 4:
					WomansHandicap4 = handicapVal;
					break;
				case 5:
					WomansHandicap5 = handicapVal;
					break;
				case 6:
					WomansHandicap6 = handicapVal;
					break;
				case 7:
					WomansHandicap7 = handicapVal;
					break;
				case 8:
					WomansHandicap8 = handicapVal;
					break;
				case 9:
					WomansHandicap9 = handicapVal;
					break;
				case 10:
					WomansHandicap10 = handicapVal;
					break;
				case 11:
					WomansHandicap11 = handicapVal;
					break;
				case 12:
					WomansHandicap12 = handicapVal;
					break;
				case 13:
					WomansHandicap13 = handicapVal;
					break;
				case 14:
					WomansHandicap14 = handicapVal;
					break;
				case 15:
					WomansHandicap15 = handicapVal;
					break;
				case 16:
					WomansHandicap16 = handicapVal;
					break;
				case 17:
					WomansHandicap17 = handicapVal;
					break;
				case 18:
					WomansHandicap18 = handicapVal;
					break;
			}
		}

		public void WomansPar(int holeNo, int parVal)
		{
			switch (holeNo)
			{
				case 1:
					WomansPar1 = parVal;
					break;
				case 2:
					WomansPar2 = parVal;
					break;
				case 3:
					WomansPar3 = parVal;
					break;
				case 4:
					WomansPar4 = parVal;
					break;
				case 5:
					WomansPar5 = parVal;
					break;
				case 6:
					WomansPar6 = parVal;
					break;
				case 7:
					WomansPar7 = parVal;
					break;
				case 8:
					WomansPar8 = parVal;
					break;
				case 9:
					WomansPar9 = parVal;
					break;
				case 10:
					WomansPar10 = parVal;
					break;
				case 11:
					WomansPar11 = parVal;
					break;
				case 12:
					WomansPar12 = parVal;
					break;
				case 13:
					WomansPar13 = parVal;
					break;
				case 14:
					WomansPar14 = parVal;
					break;
				case 15:
					WomansPar15 = parVal;
					break;
				case 16:
					WomansPar16 = parVal;
					break;
				case 17:
					WomansPar17 = parVal;
					break;
				case 18:
					WomansPar18 = parVal;
					break;
			}
		}


		public int MensPar(int holeNo)
		{
			switch (holeNo)
			{
				case 1:
					return MensPar1;
				case 2:
					return MensPar2;
				case 3:
					return MensPar3;
				case 4:
					return MensPar4;
				case 5:
					return MensPar5;
				case 6:
					return MensPar6;
				case 7:
					return MensPar7;
				case 8:
					return MensPar8;
				case 9:
					return MensPar9;
				case 10:
					return MensPar10;
				case 11:
					return MensPar11;
				case 12:
					return MensPar12;
				case 13:
					return MensPar13;
				case 14:
					return MensPar14;
				case 15:
					return MensPar15;
				case 16:
					return MensPar16;
				case 17:
					return MensPar17;
				case 18:
					return MensPar18;
			}

			return 0;
		}

		public int WomansPar(int holeNo)
		{
			switch (holeNo)
			{
				case 1:
					return WomansPar1;
				case 2:
					return WomansPar2;
				case 3:
					return WomansPar3;
				case 4:
					return WomansPar4;
				case 5:
					return WomansPar5;
				case 6:
					return WomansPar6;
				case 7:
					return WomansPar7;
				case 8:
					return WomansPar8;
				case 9:
					return WomansPar9;
				case 10:
					return WomansPar10;
				case 11:
					return WomansPar11;
				case 12:
					return WomansPar12;
				case 13:
					return WomansPar13;
				case 14:
					return WomansPar14;
				case 15:
					return WomansPar15;
				case 16:
					return WomansPar16;
				case 17:
					return WomansPar17;
				case 18:
					return WomansPar18;
			}

			return 0;
		}

		public int MensHandicap(int holeNo)
		{
			switch (holeNo)
			{
				case 1:
					return MensHandicap1;
				case 2:
					return MensHandicap2;
				case 3:
					return MensHandicap3;
				case 4:
					return MensHandicap4;
				case 5:
					return MensHandicap5;
				case 6:
					return MensHandicap6;
				case 7:
					return MensHandicap7;
				case 8:
					return MensHandicap8;
				case 9:
					return MensHandicap9;
				case 10:
					return MensHandicap10;
				case 11:
					return MensHandicap11;
				case 12:
					return MensHandicap12;
				case 13:
					return MensHandicap13;
				case 14:
					return MensHandicap14;
				case 15:
					return MensHandicap15;
				case 16:
					return MensHandicap16;
				case 17:
					return MensHandicap17;
				case 18:
					return MensHandicap18;
			}

			return 0;
		}

		public int WomansHandicap(int holeNo)
		{
			switch (holeNo)
			{
				case 1:
					return WomansHandicap1;
				case 2:
					return WomansHandicap2;
				case 3:
					return WomansHandicap3;
				case 4:
					return WomansHandicap4;
				case 5:
					return WomansHandicap5;
				case 6:
					return WomansHandicap6;
				case 7:
					return WomansHandicap7;
				case 8:
					return WomansHandicap8;
				case 9:
					return WomansHandicap9;
				case 10:
					return WomansHandicap10;
				case 11:
					return WomansHandicap11;
				case 12:
					return WomansHandicap12;
				case 13:
					return WomansHandicap13;
				case 14:
					return WomansHandicap14;
				case 15:
					return WomansHandicap15;
				case 16:
					return WomansHandicap16;
				case 17:
					return WomansHandicap17;
				case 18:
					return WomansHandicap18;
			}

			return 0;
		}
	}
}
