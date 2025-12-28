/**
 * Types for the external GolfCourseAPI.com responses.
 * These represent the raw API response structure based on their OpenAPI spec.
 * See: https://api.golfcourseapi.com/docs/api/openapi.yml
 */

export interface GolfCourseApiHole {
  par: number;
  yardage: number;
  handicap?: number;
}

export interface GolfCourseApiTee {
  tee_name: string;
  course_rating?: number;
  slope_rating?: number;
  bogey_rating?: number;
  total_yards?: number;
  total_meters?: number;
  number_of_holes?: number;
  par_total?: number;
  front_course_rating?: number;
  front_slope_rating?: number;
  front_bogey_rating?: number;
  back_course_rating?: number;
  back_slope_rating?: number;
  back_bogey_rating?: number;
  holes?: GolfCourseApiHole[];
}

export interface GolfCourseApiLocation {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface GolfCourseApiCourse {
  id: number;
  club_name: string;
  course_name: string;
  location?: GolfCourseApiLocation;
  tees?: {
    male?: GolfCourseApiTee[];
    female?: GolfCourseApiTee[];
  };
}

export interface GolfCourseApiSearchResponse {
  courses: GolfCourseApiCourse[];
}

export interface GolfCourseApiDetailResponse {
  course: GolfCourseApiCourse;
}
