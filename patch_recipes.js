const fs = require('fs');
const file = 'apps/web/src/components/recipes/recipes-table.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add import
const importSearch = `import { ChefHat, Pencil, Trash2, Plus, Scale, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';`;
const importReplace = `import { ChefHat, Pencil, Trash2, Plus, Scale, ChevronDown, ChevronRight, Loader2, Info } from 'lucide-react';
import type { RecipeNutritionReport } from '@ims/types';`;
code = code.replace(importSearch, importReplace);

// Add state
const stateSearch = `  const [ingredients, setIngredients] = useState<RecipeIngredient[] | null>(null);`;
const stateReplace = `  const [ingredients, setIngredients] = useState<RecipeIngredient[] | null>(null);
  const [nutrition, setNutrition] = useState<RecipeNutritionReport | null>(null);`;
code = code.replace(stateSearch, stateReplace);

// Add fetch
const fetchSearch = `      const data = await apiClient<{ data: RecipeIngredient[] }>(\`/recipes/\${recipe.id}/ingredients\`);
      setIngredients(data.data || []);`;
const fetchReplace = `      const [ingRes, nutRes] = await Promise.all([
        apiClient<{ data: RecipeIngredient[] }>(\`/recipes/\${recipe.id}/ingredients\`),
        apiClient<{ data: RecipeNutritionReport }>(\`/recipes/\${recipe.id}/nutrition\`).catch(() => null)
      ]);
      setIngredients(ingRes.data || []);
      if (nutRes) setNutrition(nutRes.data);`;
code = code.replace(fetchSearch, fetchReplace);

// Add nutrition JSX right above the ingredients map
const renderSearch = `      <div className="space-y-2">`;
const renderReplace = `      {nutrition && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-4 flex gap-6 items-start">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-800/50 rounded-lg shrink-0">
            <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Nutrition & Dietary Summary (Base Recipe Yield)</h4>
            <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
              <div><span className="block text-emerald-600/70 dark:text-emerald-400/70 text-xs uppercase tracking-wider font-semibold mb-0.5">Calories</span><span className="font-medium text-emerald-900 dark:text-emerald-100">{nutrition.calories} kcal</span></div>
              <div><span className="block text-emerald-600/70 dark:text-emerald-400/70 text-xs uppercase tracking-wider font-semibold mb-0.5">Protein</span><span className="font-medium text-emerald-900 dark:text-emerald-100">{nutrition.proteinGrams} g</span></div>
              <div><span className="block text-emerald-600/70 dark:text-emerald-400/70 text-xs uppercase tracking-wider font-semibold mb-0.5">Fat</span><span className="font-medium text-emerald-900 dark:text-emerald-100">{nutrition.fatGrams} g</span></div>
              <div><span className="block text-emerald-600/70 dark:text-emerald-400/70 text-xs uppercase tracking-wider font-semibold mb-0.5">Carbs</span><span className="font-medium text-emerald-900 dark:text-emerald-100">{nutrition.carbsGrams} g</span></div>
            </div>
            {nutrition.allergens.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Contains:</span>
                {nutrition.allergens.map(a => (
                  <span key={a} className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 rounded-full text-xs font-bold border border-red-200 dark:border-red-800/50">
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">`;
code = code.replace(renderSearch, renderReplace);

fs.writeFileSync(file, code);
