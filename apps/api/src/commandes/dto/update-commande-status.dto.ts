import { IsIn } from 'class-validator';
import { COMMANDE_STATUS } from '../commandes.constants';

export class UpdateCommandeStatusDto {
  @IsIn(Object.values(COMMANDE_STATUS))
  status!: string;
}
