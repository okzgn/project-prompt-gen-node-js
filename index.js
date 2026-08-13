const { generateProjectPrompt } = require('./core/default_to_str');
const fs = require('fs');
const path = require('path');
const promptsDir = '_prompts';

async function main(){
  const cliArgs = getParsedArgs();

  const genFileMode = cliArgs.write !== 'false';
  const addInstructions = cliArgs.instructions || '';
  const targetDir = cliArgs.target || './';
  const targetOutputFile = cliArgs.out || 'project_prompt_' + Date.now() + '.txt';
  const folderToInclude = cliArgs.include ? cliArgs.include.split(',') : [];
  const restrictedDirs = cliArgs.restrict ? cliArgs.restrict.split(',') : [];

  const prompt = await generateUserPrompt(
      genFileMode,
      addInstructions,
      targetDir,
      targetOutputFile,
      folderToInclude,
      restrictedDirs
  );

  if (!genFileMode && prompt) {
    console.log('---');
    console.log('PROMPT:');
    console.log('---');
    process.stdout.write(prompt);
  }
}

async function generateUserPrompt(genFileMode, addInstructions, targetDir, targetOutputFile, folderToInclude, restrictedDirs){
  const promptFinal = await generateProjectPrompt(addInstructions, targetDir, folderToInclude || [], restrictedDirs || []);
    if(genFileMode){ genFile(targetOutputFile, promptFinal); }
    return promptFinal;
}

function genFile(targetFile, prompt){
    try {
        if (!fs.existsSync(promptsDir)) {
            fs.mkdirSync(promptsDir, { recursive: true });
        }
        fs.writeFileSync(path.join(promptsDir, targetFile.replace(/[\\\/]/g, '-').replace(/[^a-zA-Z0-9\-\_\.]/g, '')), prompt);
        console.log('---');
        console.log('CREATED PROMPT FILE:', promptsDir, '/', targetFile);
        console.log(`CREATED PROMPT SIZE: ${(prompt.length / 1024).toFixed(2)} KB`);
        console.log('---');
    }
    catch(e){
        console.error('genFile error:', e.message);
    }
}

function getParsedArgs() {
    const rawArgs = process.argv.slice(2);
    const args = {};

    rawArgs.forEach(arg => {
        if (arg.startsWith('--')) {
            const [key, ...valueParts] = arg.slice(2).split('=');
            const value = valueParts.join('=');
            args[key] = value !== '' ? value : true;
        }
    });

    return args;
}

main();
