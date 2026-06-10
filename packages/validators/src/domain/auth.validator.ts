import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
});

export const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
});

export const assignPermissionToRoleSchema = z.object({
  roleId: z.string().uuid(),
  permissionId: z.string().uuid(),
});

export const assignUserRestaurantRoleSchema = z.object({
  userId: z.string().uuid(),
  restaurantId: z.string().uuid(),
  roleId: z.string().uuid(),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type CreateRoleDto = z.infer<typeof createRoleSchema>;
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;
export type AssignPermissionToRoleDto = z.infer<typeof assignPermissionToRoleSchema>;
export type AssignUserRestaurantRoleDto = z.infer<typeof assignUserRestaurantRoleSchema>;
