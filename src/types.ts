export type Category = {
  id: number;
  name: string;
  description?: string;
  emoji?: string;
};

export type Collaborator = {
  id: number;
  fullName: string;
  avatarUrl: string;
  role?: string;
  lotteryName?: string;
  lotteryShout?: string;
};

export type CategoryIdToCollaborators = Record<number, Collaborator[]>;
