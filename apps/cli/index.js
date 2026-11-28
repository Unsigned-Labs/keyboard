#!/usr/bin/env node

const readline = require('readline');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { PackStore } = require('@unsigned/transliterator-native');
const { loadPacks, inputMethods, convertLine } = require('./packs');

// Usage: unsigned-keyboard [--packs <dir>]... [--input-method <id>] [--text "<text>"]
function parseArgs(argv) {
  const args = { packs: [], inputMethod: null, text: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--packs') args.packs.push(argv[++i]);
    else if (argv[i] === '--input-method') args.inputMethod = argv[++i];
    else if (argv[i] === '--text') args.text = argv[++i];
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const store = new PackStore();
loadPacks(store, args.packs, (file, error) => {
  console.error(chalk.red(`Skipped ${file}: ${error.message}`));
});
const languages = inputMethods(store).map((im) => ({ name: im.name, value: im.id }));

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
  console.log(chalk.gray('  • Other spellings from the dictionary are listed under each line'));
  console.log(chalk.gray('  • Press Ctrl+C to change language or exit\n'));
}

// Start typing session
async function startTyping(selectedLang) {
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
    const { output, words } = convertLine(store, selectedLang.value, inputBuffer);

    // Clear the current line and move cursor up
    readline.cursorTo(process.stdout, 0);
    readline.moveCursor(process.stdout, 0, -1);
    readline.clearLine(process.stdout, 0);

    // Print input
    console.log(chalk.gray('Input: ') + chalk.white(inputBuffer));

    // Print transliterated output
    console.log(chalk.bold.green('Output: ') + chalk.bold.cyan(output));
    for (const { word, candidates } of words) {
      const others = candidates.slice(1).map((c) => c.text);
      if (others.length > 1) console.log(chalk.gray(`  ${word}: ${others.join(' · ')}`));
    }
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
  if (args.text !== null) {
    const id = args.inputMethod || (languages[0] && languages[0].value);
    console.log(convertLine(store, id, args.text).output);
    return;
  }
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
