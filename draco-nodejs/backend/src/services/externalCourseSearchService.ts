import { fetchJson, HttpError } from '../utils/fetchJson.js';
import { golfCourseApiConfig } from '../config/golfCourseApi.js';
import { ValidationError } from '../utils/customErrors.js';
import type {
  GolfCourseApiSearchResponse,
  GolfCourseApiDetailResponse,
  GolfCourseApiCourse,
  GolfCourseApiTee,
} from '../types/golfCourseApiTypes.js';
import type {
  ExternalCourseSearchResultType,
  ExternalCourseDetailType,
} from '@draco/shared-schemas';

export interface ExternalCourseSearchParams {
  query?: string;
}

export class ExternalCourseSearchService {
  private buildUrl(path: string): URL {
    return new URL(path, golfCourseApiConfig.baseUrl);
  }

  private getHeaders(): Record<string, string> {
    if (!golfCourseApiConfig.apiKey) {
      throw new ValidationError('Golf Course API key is not configured');
    }
    return {
      Authorization: `Key ${golfCourseApiConfig.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async searchCourses(
    params: ExternalCourseSearchParams,
  ): Promise<ExternalCourseSearchResultType[]> {
    if (!params.query) {
      throw new ValidationError('Search query is required');
    }

    const url = this.buildUrl('/v1/search');
    url.searchParams.set('search_query', params.query);

    try {
      const response = await fetchJson<GolfCourseApiSearchResponse>(url, {
        headers: this.getHeaders(),
        timeoutMs: golfCourseApiConfig.timeoutMs,
      });

      const courses = response.courses ?? [];
      return courses.map((course) => this.mapToSearchResult(course));
    } catch (error) {
      if (error instanceof HttpError) {
        console.error('[golf-course-api] Search failed:', error.message);
        if (error.status === 401) {
          throw new ValidationError('Golf Course API authentication failed');
        }
        if (error.status === 429) {
          throw new ValidationError('Golf Course API rate limit exceeded');
        }
        throw new ValidationError('Unable to search external golf courses');
      }
      throw error;
    }
  }

  async getCourseDetails(externalId: string): Promise<ExternalCourseDetailType> {
    const url = this.buildUrl(`/v1/courses/${externalId}`);

    try {
      const response = await fetchJson<GolfCourseApiDetailResponse>(url, {
        headers: this.getHeaders(),
        timeoutMs: golfCourseApiConfig.timeoutMs,
      });

      if (!response?.course?.id) {
        throw new ValidationError('Invalid course data received from external API');
      }

      return this.mapToDetailResult(response.course);
    } catch (error) {
      if (error instanceof HttpError) {
        if (error.status === 404) {
          throw new ValidationError('Course not found in external database');
        }
        console.error('[golf-course-api] Get details failed:', error.message);
        throw new ValidationError('Unable to fetch course details');
      }
      throw error;
    }
  }

  private mapToSearchResult(course: GolfCourseApiCourse): ExternalCourseSearchResultType {
    const numberOfHoles = this.detectNumberOfHoles(course);

    return {
      externalId: String(course.id),
      name: course.course_name || course.club_name,
      city: course.location?.city ?? null,
      state: course.location?.state ?? null,
      country: course.location?.country ?? null,
      numberOfHoles,
    };
  }

  private mapToDetailResult(course: GolfCourseApiCourse): ExternalCourseDetailType {
    const numberOfHoles = this.detectNumberOfHoles(course);

    // Extract par and handicap from tees
    const maleTees = course.tees?.male ?? [];
    const femaleTees = course.tees?.female ?? [];

    // Get par and handicap from the first tee with hole data
    const mensPar = this.extractParFromTees(maleTees, numberOfHoles);
    const womansPar = this.extractParFromTees(femaleTees, numberOfHoles) || mensPar;
    const mensHandicap = this.extractHandicapFromTees(maleTees, numberOfHoles);
    const womansHandicap = this.extractHandicapFromTees(femaleTees, numberOfHoles) || mensHandicap;

    return {
      externalId: String(course.id),
      name: course.course_name || course.club_name,
      city: course.location?.city ?? null,
      state: course.location?.state ?? null,
      country: course.location?.country ?? null,
      address: course.location?.address ?? null,
      zip: null,
      designer: null,
      yearBuilt: null,
      numberOfHoles,
      mensPar,
      womansPar,
      mensHandicap,
      womansHandicap,
      tees: this.mapTees(maleTees, femaleTees, numberOfHoles),
    };
  }

  private detectNumberOfHoles(course: GolfCourseApiCourse): number {
    // Check tee data for number of holes
    const allTees = [...(course.tees?.male ?? []), ...(course.tees?.female ?? [])];
    for (const tee of allTees) {
      if (tee.number_of_holes) return tee.number_of_holes;
      if (tee.holes?.length) return tee.holes.length;
    }
    return 18;
  }

  private extractParFromTees(tees: GolfCourseApiTee[], numberOfHoles: number): number[] {
    const teeWithHoles = tees.find((t) => t.holes && t.holes.length > 0);
    if (teeWithHoles?.holes) {
      const pars = teeWithHoles.holes.map((h) => h.par);
      return this.ensureArrayLength(pars, numberOfHoles, 4);
    }
    return this.ensureArrayLength([], numberOfHoles, 4);
  }

  private extractHandicapFromTees(tees: GolfCourseApiTee[], numberOfHoles: number): number[] {
    const teeWithHoles = tees.find((t) => t.holes && t.holes.some((h) => h.handicap !== undefined));
    if (teeWithHoles?.holes) {
      const handicaps = teeWithHoles.holes.map((h) => h.handicap ?? 0);
      return this.ensureArrayLength(handicaps, numberOfHoles, (i) => i + 1);
    }
    return this.ensureArrayLength([], numberOfHoles, (i) => i + 1);
  }

  private ensureArrayLength(
    arr: number[],
    length: number,
    defaultValue: number | ((index: number) => number),
  ): number[] {
    if (arr.length === 0) {
      return Array.from({ length }, (_, i) =>
        typeof defaultValue === 'function' ? defaultValue(i) : defaultValue,
      );
    }

    if (arr.length < length) {
      const lastValue = arr[arr.length - 1];
      return [...arr, ...Array(length - arr.length).fill(lastValue)];
    }

    return arr.slice(0, length);
  }

  private mapTees(
    maleTees: GolfCourseApiTee[],
    femaleTees: GolfCourseApiTee[],
    numberOfHoles: number,
  ): ExternalCourseDetailType['tees'] {
    const result: ExternalCourseDetailType['tees'] = [];

    // Process male tees
    for (const tee of maleTees) {
      const distances = this.extractDistances(tee, numberOfHoles);
      const matchingFemale = femaleTees.find((f) => f.tee_name === tee.tee_name);

      result.push({
        teeName: tee.tee_name,
        teeColor: tee.tee_name,
        distances,
        mensRating: tee.course_rating ?? 72.0,
        mensSlope: tee.slope_rating ?? 113,
        womansRating: matchingFemale?.course_rating ?? tee.course_rating ?? 72.0,
        womansSlope: matchingFemale?.slope_rating ?? tee.slope_rating ?? 113,
        nineHoleMensRating: tee.front_course_rating ?? null,
        nineHoleMensSlope: tee.front_slope_rating ?? null,
        nineHoleWomansRating: matchingFemale?.front_course_rating ?? null,
        nineHoleWomansSlope: matchingFemale?.front_slope_rating ?? null,
      });
    }

    // Add female-only tees that don't have a matching male tee
    for (const tee of femaleTees) {
      const hasMatchingMale = maleTees.some((m) => m.tee_name === tee.tee_name);
      if (!hasMatchingMale) {
        const distances = this.extractDistances(tee, numberOfHoles);
        result.push({
          teeName: tee.tee_name,
          teeColor: tee.tee_name,
          distances,
          mensRating: tee.course_rating ?? 72.0,
          mensSlope: tee.slope_rating ?? 113,
          womansRating: tee.course_rating ?? 72.0,
          womansSlope: tee.slope_rating ?? 113,
          nineHoleMensRating: null,
          nineHoleMensSlope: null,
          nineHoleWomansRating: tee.front_course_rating ?? null,
          nineHoleWomansSlope: tee.front_slope_rating ?? null,
        });
      }
    }

    return result;
  }

  private extractDistances(tee: GolfCourseApiTee, numberOfHoles: number): number[] {
    if (tee.holes && tee.holes.length > 0) {
      const distances = tee.holes.map((h) => h.yardage);
      return this.ensureArrayLength(distances, numberOfHoles, 0);
    }
    return this.ensureArrayLength([], numberOfHoles, 0);
  }
}
