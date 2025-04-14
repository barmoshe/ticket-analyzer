import inquirer from 'inquirer'
import * as fs from 'fs/promises'
import dayjs from 'dayjs'
import chalk from 'chalk'
import ora from 'ora'
import Table from 'cli-table3'
import figlet from 'figlet'
import path from 'path'
import { parse } from 'csv-parse/sync'

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------
interface Ticket {
  ticketId: string
  subject?: string
  description: string
  status: string
  created_at: string
}

interface Category {
  name: string
  keywords: string[]
  tickets: Ticket[]
}

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

// Reads tickets from a JSON or CSV file and returns an array of tickets.
async function readTickets(filePath: string, format: 'json' | 'csv'): Promise<Ticket[]> {
  const spinner = ora('Reading tickets file...').start()
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    let tickets: Ticket[]
    
    if (format === 'json') {
      const json = JSON.parse(data)
      tickets = json.tickets as Ticket[]
    } else {
      // Parse CSV data
      const records = parse(data, {
        columns: true,
        skip_empty_lines: true
      })
      tickets = records.map((record: any) => ({
        ticketId: record.ticketId || record.id,
        subject: record.subject || '',
        description: record.description || '',
        status: record.status || 'unknown',
        created_at: record.created_at || record.created || record.date
      }))
    }
    
    spinner.succeed('Tickets loaded successfully')
    return tickets
  } catch (error) {
    spinner.fail('Failed to read or parse the file')
    throw new Error('Failed to read or parse the file.')
  }
}

function categorizeTickets(tickets: Ticket[]): Category[] {
  const spinner = ora('Categorizing tickets...').start();

  const categories: Category[] = [
    { name: 'Login Issues', keywords: ['login', 'password', 'authentication'], tickets: [] },
    { name: 'Payment Problems', keywords: ['payment', 'transaction', 'checkout'], tickets: [] },
    { name: 'Bugs', keywords: ['bug', 'error', 'crash'], tickets: [] },
    { name: 'Performance', keywords: ['slow', 'performance', 'response time'], tickets: [] },
    { name: 'Feature Requests', keywords: ['feature', 'request', 'enhancement'], tickets: [] },
    { name: 'Other', keywords: [], tickets: [] }
  ];

  const normalizeText = (text: string): string =>
    text.toLowerCase().replace(/[^\w\s]/g, ' ').trim();

  tickets.forEach(ticket => {
    const subject = ticket.subject ? normalizeText(ticket.subject) : '';
    const description = ticket.description ? normalizeText(ticket.description) : '';
    const searchText = `${subject} ${description}`;

    let bestCategory: Category | null = null;
    let maxScore = 0;

    categories.forEach(category => {
      if (category.name === 'Other') return;

      let score = 0;
      category.keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
        const matches = searchText.match(regex);
        if (matches) {
          score += matches.length;
        }
      });

      if (score > maxScore) {
        maxScore = score;
        bestCategory = category;
      }
    });

    if (bestCategory && maxScore > 0) {
      (bestCategory as Category).tickets.push(ticket);
    } else {
      const otherCategory = categories.find(cat => cat.name === 'Other');
      if (otherCategory) {
        otherCategory.tickets.push(ticket);
      }
    }
  });

  spinner.succeed('Tickets categorized successfully')
  return categories
}

function filterTicketsByDate(tickets: Ticket[], date: string): Ticket[] {
  const spinner = ora('Filtering tickets by date...').start()
  const filterDate = dayjs(date)
  const filteredTickets = tickets.filter(ticket => {
    try {
      const ticketDate = dayjs(ticket.created_at)
      return ticketDate.isBefore(filterDate)
    } catch (error) {
      return false
    }
  })
  spinner.succeed('Tickets filtered successfully')
  return filteredTickets
}

function generateSummary(categories: Category[], oldTickets: Ticket[]) {
  console.log('\n')
  console.log(chalk.bold(figlet.textSync('Ticket Analyzer', { horizontalLayout: 'full' })))
  console.log('\n')
  
  const categoryTable = new Table({
    head: [chalk.cyan('Category'), chalk.cyan('Count')],
    style: { head: [], border: [] }
  })
  
  categories.forEach(category => {
    const color = category.tickets.length > 10
      ? chalk.red
      : (category.tickets.length > 5 ? chalk.yellow : chalk.green)
    categoryTable.push([category.name, color(category.tickets.length.toString())])
  })
  
  console.log(chalk.bold('Tickets by Category:'))
  console.log(categoryTable.toString())
  console.log('\n')
  
  console.log(chalk.bold('Tickets older than specified date:'))
  if (oldTickets.length === 0) {
    console.log(chalk.italic('No tickets found older than the specified date.'))
  } else {
    const ticketTable = new Table({
      head: [chalk.cyan('ID'), chalk.cyan('Subject'), chalk.cyan('Created At'), chalk.cyan('Status')],
      style: { head: [], border: [] },
      wordWrap: true,
      wrapOnWordBoundary: true
    })
    oldTickets.forEach(ticket => {
      const statusColor = ticket.status === 'open'
        ? chalk.red(ticket.status)
        : ticket.status === 'pending'
          ? chalk.yellow(ticket.status)
          : chalk.green(ticket.status)
      ticketTable.push([
        ticket.ticketId,
        ticket.subject || 'No subject',
        dayjs(ticket.created_at).format('YYYY-MM-DD'),
        statusColor
      ])
    })
    console.log(ticketTable.toString())
  }
  
  console.log('\n')
}

// Lists available files from the folder "ticketsData".
async function listFiles(format: 'json' | 'csv'): Promise<string[]> {
  try {
    const folderPath = path.join(process.cwd(), 'ticketsData')
    const files = await fs.readdir(folderPath)
    return files
      .filter(file => format === 'json' ? file.endsWith('.json') : file.endsWith('.csv'))
      .map(file => path.join(folderPath, file))
  } catch (error) {
    console.error(chalk.red('Error reading ticketsData folder:'), error)
    return []
  }
}

// ---------------------------------------------------------------------------
// Main Menu Loop
// ---------------------------------------------------------------------------
async function main() {
  let selectedFile: string | null = null
  let selectedFormat: 'json' | 'csv' = 'json' // Initialize with a default value

  while (true) {
    console.clear()
    console.log(chalk.bold.blue('\n=== Ticket Analyzer Tool ===\n'))
    if (selectedFile) {
      console.log(chalk.green(`Chosen file: ${selectedFile ? path.basename(selectedFile) : 'none'}`))
    } else {
      console.log(chalk.yellow('Chosen file: no file chosen yet'))
    }

    const menuAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'menuOption',
        message: 'Please select an option:',
        choices: [
          { name: '1. Choose File', value: 'chooseFile' },
          { name: '2. Categorize Data', value: 'categorizeData' },
          { name: '3. Summary Report', value: 'summaryReport' },
          { name: '4. Exit', value: 'exit' }
        ]
      }
    ])

    switch (menuAnswer.menuOption) {
      case 'chooseFile': {
        const formatAnswer = await inquirer.prompt([
          {
            type: 'list',
            name: 'format',
            message: 'Select file format:',
            choices: [
              { name: 'JSON', value: 'json' },
              { name: 'CSV', value: 'csv' }
            ]
          }
        ])

        const files = await listFiles(formatAnswer.format)
        if (files.length === 0) {
          console.log(chalk.red(`No ${formatAnswer.format.toUpperCase()} files available in the tickets_data folder.`))
        } else {
          const fileChoice = await inquirer.prompt([
            {
              type: 'list',
              name: 'fileSelected',
              message: 'Select a file:',
              choices: files.map(file => ({
                name: path.basename(file),
                value: file
              }))
            }
          ])
          selectedFile = fileChoice.fileSelected
          selectedFormat = formatAnswer.format
          console.log(chalk.green(`File chosen: ${selectedFile ? path.basename(selectedFile) : 'none'}`))
        }
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to return to the main menu...' }])
        break
      }

      case 'categorizeData': {
        if (!selectedFile) {
          console.log(chalk.red('No file chosen yet. Please choose a file first.'))
          await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to return to the main menu...' }])
          break
        }
        try {
          const tickets = await readTickets(selectedFile, selectedFormat)
          const categories = categorizeTickets(tickets)
          console.log(chalk.bold('\nCategorized Tickets:'))
          categories.forEach(category => {
            console.log(chalk.underline(`${category.name} (${category.tickets.length})`))
            category.tickets.forEach(ticket => {
              console.log(`- [${ticket.ticketId}] ${ticket.subject || 'No subject'}`)
            })
            console.log('')
          })
        } catch (error) {
          console.log(chalk.red('Error processing file:'), error instanceof Error ? error.message : error)
        }
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to return to the main menu...' }])
        break
      }

      case 'summaryReport': {
        if (!selectedFile) {
          console.log(chalk.red('No file chosen yet. Please choose a file first.'))
          await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to return to the main menu...' }])
          break
        }
        try {
          const { dateOption } = await inquirer.prompt([
            {
              type: 'list',
              name: 'dateOption',
              message: 'Select a time period to filter tickets:',
              choices: [
                { name: 'Past day', value: 'day' },
                { name: 'Past week', value: 'week' },
                { name: 'Past month', value: 'month' },
                { name: 'Past year', value: 'year' },
                { name: 'Custom date', value: 'custom' }
              ]
            }
          ])
          
          let filterDate: string
          
          if (dateOption === 'custom') {
            const response = await inquirer.prompt([
              {
                type: 'input',
                name: 'customDate',
                message: 'Enter a date (YYYY-MM-DD) to filter tickets older than this date:',
                default: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                validate: (input: string) => dayjs(input).isValid() || 'Please enter a valid date (YYYY-MM-DD)'
              }
            ])
            filterDate = response.customDate
          } else {
            filterDate = dayjs().subtract(1, dateOption).format('YYYY-MM-DD')
          }
          
          const tickets = await readTickets(selectedFile, selectedFormat)
          const categories = categorizeTickets(tickets)
          const oldTickets = filterTicketsByDate(tickets, filterDate)
          generateSummary(categories, oldTickets)
        } catch (error) {
          console.log(chalk.red('Error generating summary report:'), error instanceof Error ? error.message : error)
        }
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to return to the main menu...' }])
        break
      }

      case 'exit': {
        console.log(chalk.green('Exiting the CLI. Thank you for using Ticket Analyzer!'))
        process.exit(0)
      }

      default:
        break
    }
  }
}

main().catch(error => {
  console.error(chalk.red('An unexpected error occurred:'), error)
})
