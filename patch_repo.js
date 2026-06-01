const fs = require('fs');
const file = 'apps/api/src/item/item.repository.ts';
let code = fs.readFileSync(file, 'utf8');

// In findById, it selects from items and then constructs ItemWithOverride
// In listParLevels, it selects and constructs
const append = `
      allergens: Array.isArray(item.itemAllergens) ? item.itemAllergens : [],
      caloriesPerUom: Number(item.itemCaloriesPerUom || 0),
      proteinGrams: Number(item.itemProteinGrams || 0),
      fatGrams: Number(item.itemFatGrams || 0),
      carbsGrams: Number(item.itemCarbsGrams || 0),`;

const replaceTarget1 = `effectiveIsActive: hasOverride ? Boolean(item.overrideIsActive) : Boolean(item.itemIsActive),
    };`;

const replaceString1 = `effectiveIsActive: hasOverride ? Boolean(item.overrideIsActive) : Boolean(item.itemIsActive),${append}
    };`;

code = code.replace(replaceTarget1, replaceString1);

const replaceTarget2 = `effectiveIsActive: hasOverride ? Boolean(item.overrideIsActive) : Boolean(item.itemIsActive),
      };`;

const replaceString2 = `effectiveIsActive: hasOverride ? Boolean(item.overrideIsActive) : Boolean(item.itemIsActive),${append}
      };`;

code = code.replace(replaceTarget2, replaceString2);

// Wait, the select clause needs to actually fetch these!
// findById:
const selectSearch = `'items.is_active as itemIsActive',
        'items.created_at as itemCreatedAt',
        'items.updated_at as itemUpdatedAt',`;

const selectReplace = `'items.is_active as itemIsActive',
        'items.created_at as itemCreatedAt',
        'items.updated_at as itemUpdatedAt',
        'items.allergens as itemAllergens',
        'items.calories_per_uom as itemCaloriesPerUom',
        'items.protein_grams as itemProteinGrams',
        'items.fat_grams as itemFatGrams',
        'items.carbs_grams as itemCarbsGrams',`;

// Replace all occurrences (findById and listParLevels)
code = code.split(selectSearch).join(selectReplace);

fs.writeFileSync(file, code);
