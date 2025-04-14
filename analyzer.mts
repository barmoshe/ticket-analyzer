import inquirer from 'inquirer'
import * as fs from 'fs/promises'
import dayjs from 'dayjs'
import chalk from 'chalk'
import ora from 'ora'
import Table from 'cli-table3'
import figlet from 'figlet'
import path from 'path'

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

// Reads tickets from a JSON file and returns an array of tickets.
async function readTickets(filePath: string): Promise<Ticket[]> {
  const spinner = ora('Reading tickets file...').start()
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    const json = JSON.parse(data)
    spinner.succeed('Tickets loaded successfully')
    return json.tickets as Ticket[]
  } catch (error) {
    spinner.fail('Failed to read or parse the file')
    throw new Error('Failed to read or parse the file.')
  }
}

// Categorizes tickets based on keywords. Tickets that do not match any
// category are added to the "Other" category.
function categorizeTickets(tickets: Ticket[]): Category[] {
  const spinner = ora('Categorizing tickets...').start();

  // Define your categories and keywords.
  const categories: Category[] = [
    { name: 'Login Issues', keywords: ['login', 'password', 'authentication'], tickets: [] },
    { name: 'Payment Problems', keywords: ['payment', 'transaction', 'checkout'], tickets: [] },
    { name: 'Bugs', keywords: ['bug', 'error', 'crash'], tickets: [] },
    { name: 'Performance', keywords: ['slow', 'performance', 'response time'], tickets: [] },
    { name: 'Feature Requests', keywords: ['feature', 'request', 'enhancement'], tickets: [] },
    { name: 'Other', keywords: [], tickets: [] } // Fallback category
  ];

  // Utility to normalize text
  const normalizeText = (text: string): string =>
    text.toLowerCase().replace(/[^\w\s]/g, ' ').trim();

  // Process each ticket
  tickets.forEach(ticket => {
    // Normalize ticket content.
    const subject = ticket.subject ? normalizeText(ticket.subject) : '';
    const description = ticket.description ? normalizeText(ticket.description) : '';
    const searchText = `${subject} ${description}`;

    // Use scoring for each category (skipping 'Other' for score calculation)
    let bestCategory: Category | null = null;
    let maxScore = 0;

    categories.forEach(category => {
      if (category.name === 'Other') return;  // Skip fallback category in scoring

      // Initialize a score for this category
      let score = 0;
      category.keywords.forEach(keyword => {
        // Create a regex that only matches whole words
        const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
        const matches = searchText.match(regex);
        if (matches) {
          score += matches.length;
        }
      });

      // Update best category if this one has more keyword hits
      if (score > maxScore) {
        maxScore = score;
        bestCategory = category;
      }
    });

    // If a category with a score exists, assign the ticket there; otherwise, use "Other"
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

// Filters tickets that were created before the given date.
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

// Generates and displays a summary report including a table with counts per category
// and a detailed list of tickets older than the specified date.
function generateSummary(categories: Category[], oldTickets: Ticket[]) {
  console.log('\n')
  console.log(chalk.bold(figlet.textSync('Ticket Analyzer', { horizontalLayout: 'full' })))
  console.log('\n')
  
  // Create table for category counts.
  const categoryTable = new Table({
    head: [chalk.cyan('Category'), chalk.cyan('Count')],
    style: { head: [], border: [] }
  })
  
  categories.forEach(category => {
    // Color code based on count
    const color = category.tickets.length > 10
      ? chalk.red
      : (category.tickets.length > 5 ? chalk.yellow : chalk.green)
    categoryTable.push([category.name, color(category.tickets.length.toString())])
  })
  
  console.log(chalk.bold('Tickets by Category:'))
  console.log(categoryTable.toString())
  console.log('\n')
  
  // Display tickets older than specified date.
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

// Lists available JSON files from the folder "ticketsData".
async function listFiles(): Promise<string[]> {
  try {
    const folderPath = path.join(process.cwd(), 'ticketsData')
    const files = await fs.readdir(folderPath)
    // Filter only JSON files
    return files.filter(file => file.endsWith('.json')).map(file => path.join(folderPath, file))
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

  while (true) {
    console.clear()
    console.log(chalk.bold.blue('\n=== Ticket Analyzer Tool ===\n'))
    // Show current file selection status
    if (selectedFile) {
      console.log(chalk.green(`Chosen file: ${selectedFile ? path.basename(selectedFile) : 'none'}`))
    } else {
      console.log(chalk.yellow('Chosen file: no file chosen yet'))
    }

    // Display the main menu options
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

      // Option 1: Choose File
      case 'chooseFile': {
        const files = await listFiles()
        if (files.length === 0) {
          console.log(chalk.red('No files available in the tickets_data folder.'))
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
          console.log(chalk.green(`File chosen: ${selectedFile ? path.basename(selectedFile) : 'none'}`))
        }
        // Pause before returning to main menu
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to return to the main menu...' }])
        break
      }

      // Option 2: Categorize Data
      case 'categorizeData': {
        if (!selectedFile) {
          console.log(chalk.red('No file chosen yet. Please choose a file first.'))
          await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to return to the main menu...' }])
          break
        }
        try {
          const tickets = await readTickets(selectedFile)
          const categories = categorizeTickets(tickets)
          // Display categorized data
          console.log(chalk.bold('\nCategorized Tickets:'))
          categories.forEach(category => {
            console.log(chalk.underline(`${category.name} (${category.tickets.length})`))
            category.tickets.forEach(ticket => {
              console.log(`- [${ticket.ticketId}] ${ticket.subject || 'No subject'}`)
            })
            console.log('') // space between categories
          })
        } catch (error) {
          console.log(chalk.red('Error processing file:'), error instanceof Error ? error.message : error)
        }
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to return to the main menu...' }])
        break
      }

      // Option 3: Summary Report
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
            // Calculate date based on selected option
            filterDate = dayjs().subtract(1, dateOption).format('YYYY-MM-DD')
          }
          
          const tickets = await readTickets(selectedFile)
          const categories = categorizeTickets(tickets)
          const oldTickets = filterTicketsByDate(tickets, filterDate)
          generateSummary(categories, oldTickets)
        } catch (error) {
          console.log(chalk.red('Error generating summary report:'), error instanceof Error ? error.message : error)
        }
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to return to the main menu...' }])
        break
      }

      // Option 4: Exit
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
