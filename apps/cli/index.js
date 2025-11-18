#!/usr/bin/env node

const readline = require('readline');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { Transliterator, hindiSchema, assameseSchema, banglaSchema } = require('@unsigned/transliterator-native');

// Available languages
const languages = [
  { name: 'Hindi (हिंदी)', value: 'hindi', schema: hindiSchema() },
  { name: 'Assamese (অসমীয়া)', value: 'assamese', schema: assameseSchema() },
  { name: 'Bangla (বাংলা)', value: 'bangla', schema: banglaSchema() }
];

// Clear screen
function clearScreen() {
  console.clear();
}

// Print header
function printHeader() {
  console.log(chalk.bold.cyan('\n╔════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║') + chalk.bold.white('       Unsigned Keyboard CLI         ') + chalk.bold.cyan('║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════════════╝\n'));
}

// Print instructions
function printInstructions(languageName) {
  console.log(chalk.yellow(' Instructions:'));
  console.log(chalk.gray('  • Type in English to transliterate to ' + languageName));
  console.log(chalk.gray('  • Use backticks (`) around English words to keep them in English'));
  console.log(chalk.gray('  • Press Ctrl+C to change language or exit\n'));
}

// Start typing session
async function startTyping(selectedLang) {
  const transliterator = new Transliterator(selectedLang.schema);
  let inputBuffer = '';

  clearScreen();
  printHeader();
  console.log(chalk.green('✓ Language:') + chalk.bold(` ${selectedLang.name}\n`));
  printInstructions(selectedLang.name);

  console.log(chalk.cyan('───────────────────────────────────────────────────\n'));

  // Set up readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
  });

  // Handle line input
  rl.on('line', (line) => {
    inputBuffer = line;
    const output = transliterator.transliterate(inputBuffer);

    // Clear the current line and move cursor up
    readline.cursorTo(process.stdout, 0);
    readline.moveCursor(process.stdout, 0, -1);
    readline.clearLine(process.stdout, 0);

    // Print input
    console.log(chalk.gray('Input: ') + chalk.white(inputBuffer));

    // Print transliterated output
    console.log(chalk.bold.green('Output: ') + chalk.bold.cyan(output));
    console.log(chalk.cyan('───────────────────────────────────────────────────'));

    inputBuffer = '';
  });

  // Handle Ctrl+C
  rl.on('SIGINT', async () => {
    rl.close();
    console.log('\n');

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Change Language', value: 'change' },
          { name: 'Continue Typing', value: 'continue' },
          { name: 'Exit', value: 'exit' }
        ]
      }
    ]);

    if (action === 'exit') {
      console.log(chalk.green('\n👋 Thanks for using Unsigned Keyboard!\n'));
      process.exit(0);
    } else if (action === 'change') {
      await selectLanguage();
    } else {
      await startTyping(selectedLang);
    }
  });

  // Show prompt
  console.log(chalk.gray('Type here: '));
}

// Language selection
async function selectLanguage() {
  clearScreen();
  printHeader();

  const { language } = await inquirer.prompt([
    {
      type: 'list',
      name: 'language',
      message: 'Select a language:',
      choices: languages.map(lang => ({
        name: lang.name,
        value: lang
      })),
      pageSize: 10
    }
  ]);

  await startTyping(language);
}

// Main function
async function main() {
  try {
    await selectLanguage();
  } catch (error) {
    if (error.isTtyError) {
      console.error(chalk.red('Error: Terminal not supported'));
    } else {
      console.error(chalk.red('Error:'), error.message);
    }
    process.exit(1);
  }
}

// Run the app
main();
