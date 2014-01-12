
namespace SportsManager.Model
{
    /// <summary>
    /// Summary description for GolfTee
    /// </summary>
    public partial class GolfTeeInformation
    {
        public int HoleDistance(int holeNo)
        {
            switch (holeNo)
            {
                case 1:
                    return DistanceHole1;

                case 2:
                    return DistanceHole2;

                case 3:
                    return DistanceHole3;

                case 4:
                    return DistanceHole4;

                case 5:
                    return DistanceHole5;

                case 6:
                    return DistanceHole6;

                case 7:
                    return DistanceHole7;

                case 8:
                    return DistanceHole8;

                case 9:
                    return DistanceHole9;

                case 10:
                    return DistanceHole10;

                case 11:
                    return DistanceHole11;

                case 12:
                    return DistanceHole12;

                case 13:
                    return DistanceHole13;

                case 14:
                    return DistanceHole14;

                case 15:
                    return DistanceHole15;

                case 16:
                    return DistanceHole16;

                case 17:
                    return DistanceHole17;

                case 18:
                    return DistanceHole18;
            }

            return 0;
        }

        public void SetHoleDistance(int holeNo, int distance)
        {
            switch (holeNo)
            {
                case 1:
                    DistanceHole1 = distance;
                    break;

                case 2:
                    DistanceHole2 = distance;
                    break;

                case 3:
                    DistanceHole3 = distance;
                    break;

                case 4:
                    DistanceHole4 = distance;
                    break;

                case 5:
                    DistanceHole5 = distance;
                    break;

                case 6:
                    DistanceHole6 = distance;
                    break;

                case 7:
                    DistanceHole7 = distance;
                    break;

                case 8:
                    DistanceHole8 = distance;
                    break;

                case 9:
                    DistanceHole9 = distance;
                    break;

                case 10:
                    DistanceHole10 = distance;
                    break;

                case 11:
                    DistanceHole11 = distance;
                    break;

                case 12:
                    DistanceHole12 = distance;
                    break;

                case 13:
                    DistanceHole13 = distance;
                    break;

                case 14:
                    DistanceHole14 = distance;
                    break;

                case 15:
                    DistanceHole15 = distance;
                    break;

                case 16:
                    DistanceHole16 = distance;
                    break;

                case 17:
                    DistanceHole17 = distance;
                    break;

                case 18:
                    DistanceHole18 = distance;
                    break;
            }
        }
    }
}