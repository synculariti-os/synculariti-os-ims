import { SetMetadata } from '@nestjs/common';
import type { PermissionCode } from '@ims/types';

export const REQUIRED_PERMISSION_KEY = 'required_permission';

export const RequirePermission = (permission: PermissionCode) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, permission);
