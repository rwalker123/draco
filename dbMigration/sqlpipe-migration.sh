#!/bin/bash

# sqlpipe-migration.sh
# Usage: ./sqlpipe-migration.sh

# Database connection settings from environment variables
SQLSERVER_HOST="${SQLSERVER_HOST:-}"
SQLSERVER_PORT="${SQLSERVER_PORT:-1433}"
SQLSERVER_DB="${SQLSERVER_DB:-}"
SQLSERVER_USER="${SQLSERVER_USER:-}"
SQLSERVER_PASS="${SQLSERVER_PASS:-}"

POSTGRES_HOST="${POSTGRES_HOST:-host.docker.internal}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-ezrecsports}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASS="${POSTGRES_PASS:-}"

# Check that required SQL Server variables are set
if [ -z "$SQLSERVER_HOST" ] || [ -z "$SQLSERVER_DB" ] || [ -z "$SQLSERVER_USER" ] || [ -z "$SQLSERVER_PASS" ]; then
    echo "Error: Missing required SQL Server environment variables"
    echo "Please set: SQLSERVER_HOST, SQLSERVER_DB, SQLSERVER_USER, SQLSERVER_PASS"
    exit 1
fi

SQLSERVER_CONN="Server=$SQLSERVER_HOST,$SQLSERVER_PORT;Database=$SQLSERVER_DB;User Id=$SQLSERVER_USER;Password=$SQLSERVER_PASS"

POSTGRES_CONN="postgresql://$POSTGRES_USER@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB"

# Array of table names to transfer
TABLES=(
    "aspnetusers"
    "accounttypes"
    "affiliations"
    "accounts"
    "contacts"
    "accounthandouts"
    "accountsettings"
    "accountsurl"
    "teams"
    "accountwelcome"
    "aspnetroles"
    "aspnetuserroles"
    "availablefields"
    "season"
    "league"
    "leagueseason"
    "leagueumpires"
    "leagueschedule"
    "roster"
    "divisiondefs"
    "divisionseason"
    "teamsseason"
    "rosterseason"
    "batstatsum"
    "contactroles"
    "currentseason"
    "displayleagueleaders"
    "fieldcontacts"
    "fieldstatsum"
    "gameejections"
    "gamerecap"
    "golfcourse"
    "golfcourseforcontact"
    "golfstatdef"
    "golferstatsconfiguration"
    "golfteeinformation"
    "golfscore"
    "golferstatsvalue"
    "golfleaguecourses"
    "golfleaguesetup"
    "golfmatch"
    "golfroster"
    "golfmatchscores"
    "hof"
    "hofnomination"
    "hofnominationsetup"
    "leagueevents"
    "leaguefaq"
    "leaguenews"
    "memberbusiness"
    "messagecategory"
    "messagetopic"
    "messagepost"
    "photogalleryalbum"
    "photogallery"
    "pitchstatsum"
    "profilecategory"
    "profilequestion"
    "playerprofile"
    "playerrecap"
    "playerseasonaffiliationdues"
    "playerswantedclassified"
    "playoffsetup"
    "playoffbracket"
    "playoffgame"
    "playoffseeds"
    "sponsors"
    "teamhandouts"
    "teamnews"
    "teamseasonmanager"
    "teamswantedclassified"
    "votequestion"
    "voteoptions"
    "voteanswers"
    "workoutannouncement"
    "workoutregistration"
)

# Name for the sqlpipe container
CONTAINER_NAME="sqlpipe_temp"

# Start sqlpipe server in the background
docker run -d --rm -p 9000:9000 --name $CONTAINER_NAME sqlpipe/sqlpipe:latest

# Wait for the server to be ready
echo "Waiting for sqlpipe server to start..."
until curl -s http://localhost:9000/health > /dev/null; do
    sleep 1
done
echo "sqlpipe server is up."

for TABLE_NAME in "${TABLES[@]}"; do
    echo "Transferring table: $TABLE_NAME"
    RESPONSE=$(curl -s -X POST http://localhost:9000/transfers/create \
      -H "Content-Type: application/json" \
      -d '{
        "source-name": "sqlserver-ezrecsports",
        "source-type": "mssql",
        "source-schema": "dbo",
        "source-connection-string": "'"$SQLSERVER_CONN"'",
        "target-name": "postgres-ezrecsports",
        "target-type": "postgresql",
        "target-schema": "public",
        "target-connection-string": "'"$POSTGRES_CONN"'",
        "source-table": "'"$TABLE_NAME"'",
        "target-table": "'"$TABLE_NAME"'"
      }')

    # echo "Response: $RESPONSE"
    TRANSFER_ID=$(echo "$RESPONSE" | grep -o '"id":."[^"]*' | grep -o '[^"]*$')
    echo "Transfer ID: $TRANSFER_ID"

    # Wait 3 seconds before polling status
    sleep 3

    # Poll for status until not queued or running
    while true; do
        SHOW_RESPONSE=$(curl -s http://localhost:9000/transfers/show/$TRANSFER_ID)
        # echo "Response: $SHOW_RESPONSE"
        STATUS=$(echo "$SHOW_RESPONSE" | grep -o '"status":."[^"]*' | grep -o '[^"]*$')
        echo "Status for $TABLE_NAME: $STATUS"
        if [[ "$STATUS" != "queued" && "$STATUS" != "running" ]]; then
            break
        fi
        sleep 3
    done

    if [[ "$STATUS" != "complete" ]]; then
        echo $SHOW_RESPONSE
        echo "Transfer for $TABLE_NAME did not complete successfully (status: $STATUS). Stopping script."
        docker stop $CONTAINER_NAME
        exit 1
    fi
done

# Stop the sqlpipe container
echo "Stopping sqlpipe container..."
docker stop $CONTAINER_NAME

echo "All tables transferred successfully."             