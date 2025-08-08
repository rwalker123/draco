#!/bin/bash

# NOTE: this uses psql to import CSV files into PostgreSQL. However, the export from SQL Server
# wasn't figured out to work. Using sqlpipe script instead.

# PostgreSQL connection details
PGHOST="localhost"
PGPORT="5432"
PGDATABASE="ezrecsports"
PGUSER="postgres"
PGPASSWORD=""

export PGPASSWORD

# Folder containing CSV files
CSV_FOLDER="./DatabaseExports"

# List of tables in the same order as your CREATE TABLE statements
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

# If a table name is passed as an argument, only import that table
if [[ $# -ge 1 ]]; then
    TABLE="$1"
    CSV_FILE="$CSV_FOLDER/$TABLE.csv"
    if [[ -f "$CSV_FILE" ]]; then
        echo "Importing $CSV_FILE into $TABLE (skipping first 2 lines)..."
        tail -n +3 "$CSV_FILE" | psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "\COPY \"$TABLE\" FROM STDIN CSV NULL 'NULL'"
    else
        echo "CSV file $CSV_FILE not found, skipping $TABLE."
    fi
else
    # Import all tables
    for TABLE in "${TABLES[@]}"; do
        CSV_FILE="$CSV_FOLDER/$TABLE.csv"
        if [[ -f "$CSV_FILE" ]]; then
            echo "Importing $CSV_FILE into $TABLE (skipping first 2 lines)..."
            tail -n +3 "$CSV_FILE" | psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "\COPY \"$TABLE\" FROM STDIN CSV NULL 'NULL'"
        else
            echo "CSV file $CSV_FILE not found, skipping $TABLE."
        fi
    done
fi