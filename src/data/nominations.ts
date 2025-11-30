// Datos simulados de nominaciones de múltiples usuarios
// En producción, esto vendría de una API que agrega todas las nominaciones

// Estructura: userId -> { categoryId -> collaboratorId }
export type UserNominations = Record<string, Record<string, string>>;

// Datos de ejemplo: múltiples usuarios con sus nominaciones
export const mockUserNominations: UserNominations = {
  user1: {
    creatividad: "c1", // Alex Méndez
    tecnologia: "t2", // Julia Herrera
    innovacion: "i2", // Sara Molina
    companerismo: "m1", // Zoe Funes
    liderazgo: "l1", // Héctor Molina
  },
  user2: {
    creatividad: "c2", // Beatriz Romero
    tecnologia: "t1", // Iván López
    innovacion: "i1", // Raúl Vargas
    companerismo: "m2", // Andrés Carpio
    liderazgo: "l2", // Inés Barrios
  },
  user3: {
    creatividad: "c1", // Alex Méndez (duplicado)
    tecnologia: "t2", // Julia Herrera (duplicado)
    innovacion: "i2", // Sara Molina (duplicado)
    companerismo: "m3", // Brenda Ayala
    liderazgo: "l3", // Jorge Ávila
  },
  user4: {
    creatividad: "c3", // Carlos Díaz
    tecnologia: "t3", // Kevin Sánchez
    innovacion: "i3", // Tomás Pineda
    companerismo: "m1", // Zoe Funes (duplicado)
    liderazgo: "l1", // Héctor Molina (duplicado)
  },
  user5: {
    creatividad: "c2", // Beatriz Romero (duplicado)
    tecnologia: "t4", // Lucía Prado
    innovacion: "i1", // Raúl Vargas (duplicado)
    companerismo: "m4", // César Roldán
    liderazgo: "l4", // Karina Solís
  },
  user6: {
    creatividad: "c4", // Diana Campos
    tecnologia: "t2", // Julia Herrera (duplicado)
    innovacion: "i4", // Uriel Peña
    companerismo: "m5", // Daniela Rivera
    liderazgo: "l5", // Leandro Coto
  },
  // Ejemplo: usuario que vota a la misma persona en todas las categorías
  user7: {
    creatividad: "c1", // Alex Méndez
    tecnologia: "c1", // Alex Méndez (misma persona)
    innovacion: "c1", // Alex Méndez (misma persona)
    companerismo: "c1", // Alex Méndez (misma persona)
    liderazgo: "c1", // Alex Méndez (misma persona)
  },
  user8: {
    creatividad: "t2", // Julia Herrera
    tecnologia: "t2", // Julia Herrera (misma persona)
    innovacion: "t2", // Julia Herrera (misma persona)
    companerismo: "t2", // Julia Herrera (misma persona)
    liderazgo: "t2", // Julia Herrera (misma persona)
  },
};

// Función helper para obtener todas las nominaciones agregadas por categoría
export function getNominationsByCategory(): Record<
  string,
  { collaboratorId: string; count: number }[]
> {
  const result: Record<string, Record<string, number>> = {};

  // Contar votos por categoría y colaborador
  Object.values(mockUserNominations).forEach((userNominations) => {
    Object.entries(userNominations).forEach(([categoryId, collaboratorId]) => {
      if (!result[categoryId]) {
        result[categoryId] = {};
      }
      result[categoryId][collaboratorId] =
        (result[categoryId][collaboratorId] || 0) + 1;
    });
  });

  // Convertir a array ordenado por count
  const formatted: Record<string, { collaboratorId: string; count: number }[]> =
    {};
  Object.entries(result).forEach(([categoryId, votes]) => {
    formatted[categoryId] = Object.entries(votes)
      .map(([collaboratorId, count]) => ({ collaboratorId, count }))
      .sort((a, b) => b.count - a.count);
  });

  return formatted;
}

// Función helper para obtener el total de nominaciones
export function getTotalNominations(): number {
  return Object.values(mockUserNominations).reduce(
    (total, userNominations) =>
      total + Object.values(userNominations).filter((id) => id !== null).length,
    0
  );
}

// Función helper para obtener las nominaciones de un usuario específico
export function getUserNominations(
  userId: string
): Record<string, string> | null {
  return mockUserNominations[userId] || null;
}

// Función helper para obtener cuántas categorías ha votado un usuario
export function getCategoriesVotedByUser(userId: string): number {
  const userNominations = getUserNominations(userId);
  if (!userNominations) return 0;
  return Object.values(userNominations).filter((id) => id !== null).length;
}
