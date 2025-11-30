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
};

export type CategoryIdToCollaborators = Record<number, Collaborator[]>;
