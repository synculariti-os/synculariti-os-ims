import { Module } from '@nestjs/common';
import { ItemModule } from '../item/item.module';
import { RecipeService, RECIPE_REPOSITORY_TOKEN } from './recipe.service';
import { RecipeRepository } from './recipe.repository';
import { RECIPE_SERVICE_TOKEN } from './interfaces/i-recipe.service';

@Module({
  imports: [ItemModule],
  providers: [
    {
      provide: RECIPE_REPOSITORY_TOKEN,
      useClass: RecipeRepository,
    },
    {
      provide: RECIPE_SERVICE_TOKEN,
      useClass: RecipeService,
    },
  ],
  exports: [RECIPE_SERVICE_TOKEN],
})
export class RecipeModule {}
