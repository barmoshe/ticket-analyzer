# Support Ticket Analyzer - Bar Moshe

A command-line tool that analyzes and categorizes support tickets from JSON files.


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

- Parses JSON files containing support tickets
- Categorizes tickets by common keywords (login, payment, bug, etc.)
- Generates summary reports including:
  - Ticket counts per category
  - List of tickets older than a specified date
- Interactive command-line interface

## Input Data Format

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

```
  _____   _          _             _          _                      _                             
 |_   _| (_)   ___  | | __   ___  | |_       / \     _ __     __ _  | |  _   _   ____   ___   _ __ 
   | |   | |  / __| | |/ /  / _ \ | __|     / _ \   | '_ \   / _` | | | | | | | |_  /  / _ \ | '__|
   | |   | | | (__  |   <  |  __/ | |_     / ___ \  | | | | | (_| | | | | |_| |  / /  |  __/ | |   
   |_|   |_|  \___| |_|\_\  \___|  \__|   /_/   \_\ |_| |_|  \__,_| |_|  \__, | /___|  \___| |_|   
                                                                         |___/                     