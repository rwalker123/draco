export const golfCourseApiConfig = {
  apiKey: process.env.GOLF_COURSE_API_KEY || '',
  baseUrl: process.env.GOLF_COURSE_API_BASE_URL || 'https://api.golfcourseapi.com/v1',
  requestsPerDay: 300,
  timeoutMs: 10000,
};
