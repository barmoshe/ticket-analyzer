# Support Ticket Analyzer - Bar Moshe

A command-line tool that analyzes and categorizes support tickets from JSON or CSV files.


## Setup

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

## Usage

Run the analyzer:
```bash
npm start
```

## Features

- Parses JSON or CSV files containing support tickets
- Categorizes tickets by common keywords (login, payment, bug, etc.)
- Generates summary reports including:
  - Ticket counts per category
  - List of tickets older than a specified date
- Interactive command-line interface

## Input Data Format

### JSON Format
Create a JSON file with the following structure:

```json
{
  "tickets": [
    {
      "ticketId": "T1001",
      "subject": "Login issue",
      "description": "User cannot login due to forgotten password.",
      "status": "open",
      "created_at": "2025-03-25T10:30:00Z"
    }
  ]
}
```

### CSV Format
Create a CSV file with the following columns (headers are required):
- ticketId (or id)
- subject
- description
- status
- created_at (or created or date)

Example CSV:
```csv
ticketId,subject,description,status,created_at
T1001,Login issue,User cannot login due to forgotten password.,open,2025-03-25T10:30:00Z
T1002,Payment failure,Payment did not go through for order #456.,closed,2025-03-20
```

```
  _____   _          _             _          _                      _                             
 |_   _| (_)   ___  | | __   ___  | |_       / \     _ __     __ _  | |  _   _   ____   ___   _ __ 
   | |   | |  / __| | |/ /  / _ \ | __|     / _ \   | '_ \   / _` | | | | | | | |_  /  / _ \ | '__|
   | |   | | | (__  |   <  |  __/ | |_     / ___ \  | | | | | (_| | | | | |_| |  / /  |  __/ | |   
   |_|   |_|  \___| |_|\_\  \___|  \__|   /_/   \_\ |_| |_|  \__,_| |_|  \__, | /___|  \___| |_|   
                                                                         |___/                     