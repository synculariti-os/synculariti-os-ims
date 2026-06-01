import { z } from 'zod';

export const createFranchiseGroupSchema = z.object({
  name: z.string().min(1).max(255),
});

export type CreateFranchiseGroupDto = z.infer<typeof createFranchiseGroupSchema>;

export const updateFranchiseGroupSchema = createFranchiseGroupSchema.partial();
export type UpdateFranchiseGroupDto = z.infer<typeof updateFranchiseGroupSchema>;

export const createRestaurantSchema = z.object({
  name: z.string().min(1).max(255),
  franchiseGroupId: z.string().uuid(),
  timezone: z.string().default('UTC'),
});

export type CreateRestaurantDto = z.infer<typeof createRestaurantSchema>;

export const updateRestaurantSchema = createRestaurantSchema.partial();
export type UpdateRestaurantDto = z.infer<typeof updateRestaurantSchema>;
