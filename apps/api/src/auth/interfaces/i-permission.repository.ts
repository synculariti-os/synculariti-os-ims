import type { PermissionCode, UserId, RestaurantId, FranchiseGroupId, RoleId, Role } from '@ims/types';

export interface IPermissionRepository {
  resolvePermissions(userId: UserId, restaurantId: RestaurantId): Promise<PermissionCode[]>;
  
  findAllRoles(): Promise<Role[]>;
  findRoleById(roleId: RoleId): Promise<Role | null>;
  createRole(dto: { name: string; description?: string }): Promise<Role>;
  updateRole(roleId: RoleId, dto: { name?: string; description?: string }): Promise<Role>;
  deleteRole(roleId: RoleId): Promise<void>;

  findAllPermissions(): Promise<Array<{ id: string; code: PermissionCode; description: string | null }>>;

  findAllRolePermissions(roleId: RoleId): Promise<Array<{ roleId: RoleId; permissionId: string }>>;
  assignPermissionToRole(roleId: RoleId, permissionId: string): Promise<void>;
  removePermissionFromRole(roleId: RoleId, permissionId: string): Promise<void>;

  findAllUserRestaurantRoles(restaurantId?: RestaurantId): Promise<Array<{ userId: UserId; restaurantId: RestaurantId; roleId: RoleId; userEmail?: string; roleName?: string }>>;
  assignUserRestaurantRole(dto: { userId: UserId; restaurantId: RestaurantId; roleId: RoleId }): Promise<{ userId: UserId; restaurantId: RestaurantId; roleId: RoleId }>;
  removeUserRestaurantRoleByComposite(userId: UserId, restaurantId: RestaurantId, roleId: RoleId): Promise<void>;
  
  getFranchiseGroupForRestaurant(restaurantId: RestaurantId): Promise<FranchiseGroupId | null>;
}
