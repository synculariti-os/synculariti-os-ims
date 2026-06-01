const fs = require('fs');
const file = 'apps/web/src/components/items/edit-item-dialog.tsx';
let code = fs.readFileSync(file, 'utf8');

// Update defaults setup
const defaultsSearch = `categoryId: item.categoryId,
      }`;
const defaultsReplace = `categoryId: item.categoryId,
        allergens: item.allergens ? item.allergens.join(', ') : '',
        caloriesPerUom: item.caloriesPerUom || 0,
        proteinGrams: item.proteinGrams || 0,
        fatGrams: item.fatGrams || 0,
        carbsGrams: item.carbsGrams || 0,
      }`;
code = code.replace(defaultsSearch, defaultsReplace);

// Update submit payload
const payloadSearch = `body: data,`;
const payloadReplace = `body: {
          ...data,
          allergens: typeof data.allergens === 'string' ? (data.allergens as string).split(',').map(a => a.trim()).filter(Boolean) : data.allergens,
        },`;
code = code.replace(payloadSearch, payloadReplace);

// Update JSX
const jsxSearch = `            <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">`;
const jsxReplace = `            <div className="p-5 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-200 dark:border-zinc-700/50 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                Dietary & Nutrition (per Inventory UOM)
              </h3>
              
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Calories</label>
                  <input type="number" step="0.1" {...register('caloriesPerUom', { valueAsNumber: true })} className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Protein (g)</label>
                  <input type="number" step="0.1" {...register('proteinGrams', { valueAsNumber: true })} className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Fat (g)</label>
                  <input type="number" step="0.1" {...register('fatGrams', { valueAsNumber: true })} className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Carbs (g)</label>
                  <input type="number" step="0.1" {...register('carbsGrams', { valueAsNumber: true })} className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Allergens (comma-separated)</label>
                <input type="text" {...register('allergens')} placeholder="e.g. Dairy, Nuts, Gluten" className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
              </div>
            </div>

            <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">`;
code = code.replace(jsxSearch, jsxReplace);

fs.writeFileSync(file, code);
