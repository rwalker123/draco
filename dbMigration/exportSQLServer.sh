#!/bin/bash

# Uses sqlcmd to export tables from a SQL Server database to CSV files. This didn't work 
# very well with the psql import script, so this is a separate script to export the data.
# Using sqlpipe script instead.

# Database connection details
SERVER="sql2k1202.discountasp.net"
DATABASE="SQL2012_152800_ezrecsports"
USERNAME="SQL2012_152800_ezrecsports_user"
PASSWORD="Z3aB46yx!"

# Output folder for CSV files
OUTPUT_FOLDER="./DatabaseExports"

# Create output folder if it doesn't exist
if [ -d "$OUTPUT_FOLDER" ]; then
    rm -rf "$OUTPUT_FOLDER"/*
else
    mkdir -p "$OUTPUT_FOLDER"
fi

SKIP_TABLES=("AspNetUserClaims" "ASPStateTempApplications" "ASPStateTempSessions" "ASPStateTempSessions2")

# Get all table names
TABLES=$(sqlcmd -S "$SERVER" -d "$DATABASE" -U "$USERNAME" -P "$PASSWORD" -h -1 -C -Q "SET NOCOUNT ON; SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'" | tr -d '\r')

# Export each table to a CSV
for TABLE in $TABLES; do
    SKIP=0
    for SKIP_TABLE in "${SKIP_TABLES[@]}"; do
        if [[ "$TABLE" == $SKIP_TABLE ]]; then
            echo "Skipping $TABLE"
            SKIP=1
            break
        fi
    done
    if [ $SKIP -eq 1 ]; then
        continue
    fi
    
    OUTPUT_FILE="$OUTPUT_FOLDER/$TABLE.csv"
    sqlcmd -S "$SERVER" -d "$DATABASE" -U "$USERNAME" -P "$PASSWORD" -C -y0 -Q "SET NOCOUNT ON; SELECT * FROM [$TABLE]" -s "," -W -o "$OUTPUT_FILE"
    echo "Exported $TABLE to $OUTPUT_FILE"
done