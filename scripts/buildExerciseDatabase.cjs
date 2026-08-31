const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../src/data/exerciseCategories');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function writeCategoryFile(filename, varName, exercises) {
  const content = `import { Exercise } from "../../types";

export const ${varName}: Exercise[] = ${JSON.stringify(exercises, null, 2)};
`;
  fs.writeFileSync(path.join(targetDir, filename), content, 'utf8');
  console.log(`Wrote ${exercises.length} exercises to ${filename}`);
}

const categories = [
  { file: 'chest.ts', varName: 'CHEST_EXERCISES', data: require('./data/chest.cjs') },
  { file: 'back.ts', varName: 'BACK_EXERCISES', data: require('./data/back.cjs') },
  { file: 'biceps.ts', varName: 'BICEPS_EXERCISES', data: require('./data/biceps.cjs') },
  { file: 'triceps.ts', varName: 'TRICEPS_EXERCISES', data: require('./data/triceps.cjs') },
  { file: 'shoulders.ts', varName: 'SHOULDERS_EXERCISES', data: require('./data/shoulders.cjs') },
  { file: 'legs.ts', varName: 'LEGS_EXERCISES', data: require('./data/legs.cjs') },
  { file: 'thighs.ts', varName: 'THIGHS_EXERCISES', data: require('./data/thighs.cjs') },
  { file: 'calves.ts', varName: 'CALVES_EXERCISES', data: require('./data/calves.cjs') },
  { file: 'forearms.ts', varName: 'FOREARMS_EXERCISES', data: require('./data/forearms.cjs') },
  { file: 'abs.ts', varName: 'ABS_EXERCISES', data: require('./data/abs.cjs') },
  { file: 'core.ts', varName: 'CORE_EXERCISES', data: require('./data/core.cjs') },
  { file: 'glutes.ts', varName: 'GLUTES_EXERCISES', data: require('./data/glutes.cjs') },
  { file: 'cardio.ts', varName: 'CARDIO_EXERCISES', data: require('./data/cardio.cjs') },
  { file: 'fullBody.ts', varName: 'FULL_BODY_EXERCISES', data: require('./data/fullBody.cjs') },
];

let total = 0;
const idSet = new Set();

for (const cat of categories) {
  for (const ex of cat.data) {
    if (idSet.has(ex.id)) {
      console.warn(`WARNING: Duplicate ID detected: ${ex.id}`);
    }
    idSet.add(ex.id);
  }
  writeCategoryFile(cat.file, cat.varName, cat.data);
  total += cat.data.length;
}

console.log(`Total exercises generated: ${total} across ${categories.length} categories.`);
console.log(`Unique exercise IDs: ${idSet.size}`);
