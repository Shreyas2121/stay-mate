import { IsEnum } from 'class-validator';
import { ActiveRole } from '../../users/enums/user.enum';

export class SwitchRoleDto {
  @IsEnum(ActiveRole)
  activeRole: ActiveRole;
}
