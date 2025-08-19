# Cleanup Service

## Overview

The Cleanup Service automatically removes expired player classifieds from the database. Player classifieds are only valid for 45 days after creation, after which they are automatically deleted.

## Features

- **Automatic Cleanup**: Runs daily at 2:00 AM to remove expired classifieds
- **Batch Processing**: Processes records in batches of 25 to avoid long-running transactions
- **Manual Trigger**: Provides endpoints for manual cleanup execution (requires database.cleanup permission)
- **Status Monitoring**: Tracks service status and next scheduled cleanup (requires database.cleanup permission)
- **Comprehensive Logging**: Logs all cleanup operations with detailed statistics

## Security

### Access Control

The cleanup service API endpoints are protected by role-based access control:

- **Automatic cleanup**: Runs automatically without user intervention
- **Manual cleanup endpoints**: Require `database.cleanup` permission
- **Status endpoints**: Require `database.cleanup` permission

### Permission Assignment

The `database.cleanup` permission is automatically assigned to users with the `Administrator` role, following the principle of least privilege for database maintenance operations.

## How It Works

### Automatic Cleanup Schedule

The service automatically starts when the application starts and runs cleanup operations daily at 2:00 AM. It:

1. Calculates the cutoff date (45 days ago)
2. Finds expired records in both `playerswantedclassified` and `teamswantedclassified` tables
3. Deletes expired records in batches of 25
4. Logs the results of each cleanup operation

### Batch Processing

Records are processed in batches to:
- Prevent long-running database transactions
- Maintain database performance
- Allow for graceful handling of large numbers of expired records

### Expiration Logic

- **Players Wanted**: Deleted if `datecreated` is older than 45 days
- **Teams Wanted**: Deleted if `datecreated` is older than 45 days

## API Endpoints

### POST /api/cleanup/trigger

Manually triggers cleanup of expired data.

**Authentication**: Required (Bearer token)
**Permission**: `database.cleanup` required

**Response**:
```json
{
  "success": true,
  "message": "Cleanup completed successfully",
  "data": {
    "expiredPlayersWanted": 5,
    "expiredTeamsWanted": 3,
    "totalDeleted": 8
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: database.cleanup permission required

### GET /api/cleanup/status

Returns the current status of the cleanup service.

**Authentication**: Required (Bearer token)
**Permission**: `database.cleanup` required

**Response**:
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "nextCleanup": "2024-12-20T02:00:00.000Z",
    "lastCleanup": null
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: database.cleanup permission required

## Configuration

The service is configured with the following constants:

- **BATCH_SIZE**: 25 records per batch
- **CLEANUP_HOUR**: 2 (2:00 AM)
- **CLEANUP_INTERVAL_MS**: 24 hours (24 * 60 * 60 * 1000 ms)

## Logging

The service provides comprehensive logging:

- Service startup and shutdown
- Daily cleanup execution with statistics
- Error handling and recovery
- Manual cleanup operations

Example log output:
```
🧹 Cleanup service started. First cleanup scheduled for 2024-12-20T02:00:00.000Z
🧹 Starting daily cleanup of expired data...
🧹 Cleanup completed in 150ms. Deleted 8 expired classifieds:
  - Players Wanted: 5
  - Teams Wanted: 3
```

## Testing

### Unit Tests

Run the test suite:
```bash
npm test -- cleanupService.test.ts
```

### Manual Testing

Test the service manually:
```bash
npx tsx scripts/test-cleanup.ts
```

## Integration

The cleanup service is automatically integrated into the application:

1. **Service Factory**: Available through `ServiceFactory.getCleanupService()`
2. **App Startup**: Automatically started when the application starts
3. **Route Integration**: Cleanup endpoints are available at `/api/cleanup/*`
4. **Permission System**: Integrated with role-based access control

## Monitoring

### Health Checks

Monitor the service through:
- Application health endpoint (`/health`)
- Cleanup status endpoint (`/api/cleanup/status`) - requires permission
- Application logs

### Performance Metrics

The service logs:
- Cleanup duration
- Number of records processed
- Batch processing efficiency
- Error rates

## Troubleshooting

### Common Issues

1. **Service Not Starting**: Check application logs for startup errors
2. **Cleanup Not Running**: Verify the service is running via status endpoint
3. **Database Errors**: Check database connectivity and permissions
4. **Permission Denied**: Ensure user has `database.cleanup` permission

### Debug Mode

Enable debug logging by setting the log level to debug in your environment configuration.

## Future Enhancements

Potential improvements:
- Configurable expiration periods
- Soft delete with recovery options
- Email notifications for cleanup operations
- Metrics collection and reporting
- Cleanup history tracking
- Configurable cleanup schedules per account
- Additional database maintenance permissions for granular control
