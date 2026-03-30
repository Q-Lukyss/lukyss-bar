import { IsIn } from 'class-validator';
import type { CommandeStatus } from '../commandes.constants';
import { COMMANDE_STATUS } from '../commandes.constants';

export class UpdateCommandeStatusDto {
  @IsIn(Object.values(COMMANDE_STATUS))
  status!: CommandeStatus;
}
