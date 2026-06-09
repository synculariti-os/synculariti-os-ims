export { AUTH_ADMIN_SERVICE_TOKEN } from '../../core/core.symbols';
import type { 
  PermissionCode, SafeUser, UserId, RestaurantId, RoleId, Role 
} from '@ims/types';

export interface CreateRoleDto {
  name: string;
  description?: string;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
}

export interface AssignUserRestaurantRoleDto {
  userId: UserId;
  restaurantId: RestaurantId;
  roleId: RoleId;
}

export interface RemoveUserRestaurantRoleDto {
  userId: UserId;
  restaurantId: RestaurantId;
  roleId: RoleId;
}

export interface IAuthAdminService {
  listRoles(): Promise<Role[]>;
  getRoleById(roleId: RoleId): Promise<Role>;
  createRole(dto: CreateRoleDto): Promise<Role>;
  updateRole(roleId: RoleId, dto: UpdateRoleDto): Promise<Role>;
  deleteRole(roleId: RoleId): Promise<void>;
  
  listPermissions(): Promise<Array<{ id: string; code: PermissionCode; description: string | null }>>;
  
  listRolePermissions(roleId: RoleId): Promise<Array<{ roleId: RoleId; permissionId: string }>>;
  assignPermissionToRole(roleId: RoleId, permissionId: string): Promise<void>;
  removePermissionFromRole(roleId: RoleId, permissionId: string): Promise<void>;
  
  listUserRestaurantRoles(restaurantId?: RestaurantId): Promise<Array<{ userId: UserId; restaurantId: RestaurantId; roleId: RoleId; userEmail?: string; roleName?: string }>>;
  assignUserRestaurantRole(dto: AssignUserRestaurantRoleDto): Promise<void>;
  removeUserRestaurantRole(dto: RemoveUserRestaurantRoleDto): Promise<void>;
  
  listUsers(): Promise<SafeUser[]>;
}
