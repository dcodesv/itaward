import { CategoryIdToCollaborators } from "../types";

// Datos de ejemplo: reemplaza con tu API más adelante.
// Avatares de prueba tomados de pravatar (placeholders).
const avatar = (n: number) => `https://i.pravatar.cc/300?img=${n}`;

export const categoryIdToCollaborators: CategoryIdToCollaborators = {
  creatividad: [
    { id: "c1", fullName: "Alex Méndez", avatarUrl: avatar(11) },
    { id: "c2", fullName: "Beatriz Romero", avatarUrl: avatar(12) },
    { id: "c3", fullName: "Carlos Díaz", avatarUrl: avatar(13) },
    { id: "c4", fullName: "Diana Campos", avatarUrl: avatar(14) },
    { id: "c5", fullName: "Eduardo Salas", avatarUrl: avatar(15) },
    { id: "c6", fullName: "Fernanda Cruz", avatarUrl: avatar(16) },
    { id: "c7", fullName: "Gabriel Torres", avatarUrl: avatar(17) },
    { id: "c8", fullName: "Hilda Acosta", avatarUrl: avatar(18) },
    // Colaboradores con múltiples nominaciones
    { id: "i2", fullName: "Sara Molina", avatarUrl: avatar(28) },
    { id: "t2", fullName: "Julia Herrera", avatarUrl: avatar(20) },
    { id: "l1", fullName: "Héctor Molina", avatarUrl: avatar(43) },
  ],
  tecnologia: [
    { id: "t1", fullName: "Iván López", avatarUrl: avatar(19) },
    { id: "t2", fullName: "Julia Herrera", avatarUrl: avatar(20) },
    { id: "t3", fullName: "Kevin Sánchez", avatarUrl: avatar(21) },
    { id: "t4", fullName: "Lucía Prado", avatarUrl: avatar(22) },
    { id: "t5", fullName: "Marco Pérez", avatarUrl: avatar(23) },
    { id: "t6", fullName: "Natalia Rivas", avatarUrl: avatar(24) },
    { id: "t7", fullName: "Óscar Guzmán", avatarUrl: avatar(25) },
    { id: "t8", fullName: "Paula Andrade", avatarUrl: avatar(26) },
    // Colaboradores con múltiples nominaciones
    { id: "c2", fullName: "Beatriz Romero", avatarUrl: avatar(12) },
    { id: "i1", fullName: "Raúl Vargas", avatarUrl: avatar(27) },
    { id: "l3", fullName: "Jorge Ávila", avatarUrl: avatar(45) },
  ],
  innovacion: [
    { id: "i1", fullName: "Raúl Vargas", avatarUrl: avatar(27) },
    { id: "i2", fullName: "Sara Molina", avatarUrl: avatar(28) },
    { id: "i3", fullName: "Tomás Pineda", avatarUrl: avatar(29) },
    { id: "i4", fullName: "Uriel Peña", avatarUrl: avatar(30) },
    { id: "i5", fullName: "Valeria Gómez", avatarUrl: avatar(31) },
    { id: "i6", fullName: "Wendy Miranda", avatarUrl: avatar(32) },
    { id: "i7", fullName: "Ximena Ortiz", avatarUrl: avatar(33) },
    { id: "i8", fullName: "Yahir Chávez", avatarUrl: avatar(34) },
    // Colaboradores con múltiples nominaciones
    { id: "c1", fullName: "Alex Méndez", avatarUrl: avatar(11) },
    { id: "l1", fullName: "Héctor Molina", avatarUrl: avatar(43) },
    { id: "m1", fullName: "Zoe Funes", avatarUrl: avatar(35) },
  ],
  companerismo: [
    { id: "m1", fullName: "Zoe Funes", avatarUrl: avatar(35) },
    { id: "m2", fullName: "Andrés Carpio", avatarUrl: avatar(36) },
    { id: "m3", fullName: "Brenda Ayala", avatarUrl: avatar(37) },
    { id: "m4", fullName: "César Roldán", avatarUrl: avatar(38) },
    { id: "m5", fullName: "Daniela Rivera", avatarUrl: avatar(39) },
    { id: "m6", fullName: "Emilia Flores", avatarUrl: avatar(40) },
    { id: "m7", fullName: "Fabián Herrera", avatarUrl: avatar(41) },
    { id: "m8", fullName: "Gina Valdez", avatarUrl: avatar(42) },
    // Colaboradores con múltiples nominaciones
    { id: "c3", fullName: "Carlos Díaz", avatarUrl: avatar(13) },
    { id: "l2", fullName: "Inés Barrios", avatarUrl: avatar(44) },
  ],
  liderazgo: [
    { id: "l1", fullName: "Héctor Molina", avatarUrl: avatar(43) },
    { id: "l2", fullName: "Inés Barrios", avatarUrl: avatar(44) },
    { id: "l3", fullName: "Jorge Ávila", avatarUrl: avatar(45) },
    { id: "l4", fullName: "Karina Solís", avatarUrl: avatar(46) },
    { id: "l5", fullName: "Leandro Coto", avatarUrl: avatar(47) },
    { id: "l6", fullName: "Mariela Ochoa", avatarUrl: avatar(48) },
    { id: "l7", fullName: "Nicolás Duarte", avatarUrl: avatar(49) },
    { id: "l8", fullName: "Olivia Cañas", avatarUrl: avatar(50) },
    // Colaboradores con múltiples nominaciones
    { id: "c4", fullName: "Diana Campos", avatarUrl: avatar(14) },
    { id: "t2", fullName: "Julia Herrera", avatarUrl: avatar(20) },
    { id: "i2", fullName: "Sara Molina", avatarUrl: avatar(28) },
  ],
};


