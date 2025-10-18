# Retrosheet Scoring System Specification

This document provides a comprehensive overview of the Retrosheet event file format used to record baseball games. It is designed to guide developers or language models in building applications that can parse, generate, or validate Retrosheet-style game data.

## 📦 File Format Overview

- Plain text, ASCII-encoded  
- One record per line  
- Fields separated by commas  
- DOS-style line endings (`\r\n`)  
- Each line begins with a record type identifier

## 🧩 Record Types

| Record Type | Description |
|-------------|-------------|
| `id`        | Unique game identifier |
| `version`   | Format version (optional) |
| `info`      | Game metadata (date, teams, weather, etc.) |
| `start`     | Starting lineup |
| `sub`       | Substitutions |
| `play`      | Play-by-play data |
| `data`      | Optional statistical summaries |
| `com`       | Comments or notes |
| `pad`       | Padding (ignored) |

## 📝 Play Record Format

The `play` record is the core of the system. Example:  
`play,1,0,smith001,12,BX,7/F`

| Field        | Meaning                        |
|--------------|--------------------------------|
| `play`       | Record type                    |
| `1`          | Inning number                  |
| `0`          | Half-inning (`0` = top, `1` = bottom) |
| `smith001`   | Batter ID                      |
| `12`         | Count: 1 ball, 2 strikes       |
| `BX`         | Pitch sequence                 |
| `7/F`        | Result: fly out to left field  |

## 🎯 Pitch Sequence Codes

Each letter represents a pitch outcome:

| Code | Meaning           |
|------|-------------------|
| `B`  | Ball              |
| `C`  | Called strike     |
| `S`  | Swinging strike   |
| `F`  | Foul              |
| `X`  | Ball put in play  |
| `T`  | Foul tip          |
| `H`  | Hit by pitch      |
| `I`  | Intentional ball  |

## 🧠 Result Codes (Examples)

| Code   | Meaning                     |
|--------|-----------------------------|
| `7/F`  | Fly out to left field       |
| `K`    | Strikeout                   |
| `HR`   | Home run                    |
| `SB2`  | Stolen base, second         |
| `CS3`  | Caught stealing, third      |
| `E5`   | Error by third baseman      |

Multiple codes can be chained to describe complex plays.

## 🧾 Metadata Records

### `id` Record  
`id,DET202304060`

### `info` Record  
`info,date,2023/04/06`  
`info,site,DET`  
`info,weather,clear`

### `start` Record  
`start,smith001,"John Smith",1,3,LF`

| Field        | Meaning                        |
|--------------|--------------------------------|
| `start`      | Record type                    |
| `smith001`   | Player ID                      |
| `"John Smith"` | Name                        |
| `1`          | Batting order position         |
| `3`          | Team ID (home/away)            |
| `LF`         | Position                       |

## 🧪 Sample Game Snippet

```
id,DET202304060
info,date,2023/04/06
info,site,DET
start,smith001,"John Smith",1,0,LF
play,1,0,smith001,12,BX,7/F
play,1,0,jones002,00,CX,HR
sub,jones002,"Mike Jones",1,0,RF
```

## 🛠️ Implementation Notes

- All player IDs must be unique per game  
- Pitch sequences are optional but recommended  
- Result codes must follow Retrosheet conventions  
- Comments (`com`) and padding (`pad`) are ignored by parsers  

## 🔗 Resources

- [Retrosheet Event File Specification](https://www.retrosheet.org/eventfile.htm)  
- [Retrosheet Scoring System History](https://www.retrosheet.org/sc-hist.htm)  
- [Retrosheet Home Page](https://www.retrosheet.org/)
