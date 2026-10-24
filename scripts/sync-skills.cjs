// Usage : node scripts/sync-skills.cjs          -> copie .agents/skills vers .claude/skills
//         node scripts/sync-skills.cjs --check  -> échoue si les deux dossiers divergent
const path = require('node:path');
const {syncSkills, SOURCE, TARGET} = require('./lib/skills.cjs');

const check = process.argv.includes('--check');
const {skills, problems} = syncSkills(path.resolve(__dirname, '..'), {check});

for (const problem of problems) console.error(problem);
if (problems.length) {
  if (check) console.error('Corriger dans .agents/skills puis lancer : npm run skills:sync');
  process.exitCode = 1;
} else {
  console.log(`Skills : ${skills.length} skill(s), ${TARGET} ${check ? 'conforme à' : 'synchronisé depuis'} ${SOURCE}.`);
}
