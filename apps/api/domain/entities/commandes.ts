export type CommandeStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PREPARATION'
  | 'READY'
  | 'COMPLETED';

export type CommandeRow = {
  id: string;
  customerName: string;
  promoCode: string;
  publicToken: string;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
  status: CommandeStatus;
};

export type CommandeItem = {
  id: string;
  cocktailId: string;
  quantity: number;
  cocktailName: string;
  cocktailImage: string | null;
  unitPrice: number;
  lineTotal: number;
};

export type CommandeView = {
  commande: CommandeRow;
  items: CommandeItem[];
};
