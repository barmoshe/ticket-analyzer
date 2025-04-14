# Quack.ai Home Assignment - Ticket Analyzer CLI

```
  _____   _          _             _          _                      _                             
 |_   _| (_)   ___  | | __   ___  | |_       / \     _ __     __ _  | |  _   _   ____   ___   _ __ 
   | |   | |  / __| | |/ /  / _ \ | __|     / _ \   | '_ \   / _` | | | | | | | |_  /  / _ \ | '__|
   | |   | | | (__  |   <  |  __/ | |_     / ___ \  | | | | | (_| | | | | |_| |  / /  |  __/ | |   
   |_|   |_|  \___| |_|\_\  \___|  \__|   /_/   \_\ |_| |_|  \__,_| |_|  \__, | /___|  \___| |_|   
                                                                         |___/                     
```

A command-line tool to analyze and categorize support tickets.

## Setup

1. Clone this repository
2. Install dependencies:
```
npm install
```

## Usage

Run the application using one of these commands:

```
npm start
```

or

```
npx zx analyzer.mts
```

## Features

- Reads ticket data from JSON files
- Categorizes tickets based on keywords
- Filters tickets by date
- Generates summary reports
- Interactive CLI interface

## Data Format

Place your ticket data in the `ticketsData` folder using JSON format:

```json
{
  "tickets": [
    {
      "ticketId": "T1001",
      "subject": "Login issue",
      "description": "User cannot login due to forgotten password.",
      "status": "open",
      "created_at": "2025-03-25T10:30:00Z"
    },
    ...
  ]
}
``` 