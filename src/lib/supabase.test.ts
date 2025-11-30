/**
 * Archivo de prueba para verificar la conexión a Supabase
 * Puedes eliminar este archivo una vez que todo esté funcionando
 */

import { supabase } from "./supabase";

/**
 * Función para probar la conexión a Supabase
 * Llama a esta función desde la consola del navegador o desde cualquier componente
 */
export async function testSupabaseConnection() {
  try {
    // Intentar hacer una consulta simple (esto fallará si no hay tablas, pero verificará la conexión)
    const { data, error } = await supabase.from("_test").select("*").limit(1);

    if (error) {
      // Si el error es de conexión, mostrar mensaje
      if (error.code === "PGRST116" || error.message.includes("relation")) {
        console.log("✅ Supabase conectado correctamente (la tabla _test no existe, pero la conexión funciona)");
        return true;
      }
      console.error("❌ Error en Supabase:", error);
      return false;
    }

    console.log("✅ Supabase conectado correctamente");
    return true;
  } catch (error) {
    console.error("❌ Error al conectar con Supabase:", error);
    console.log("💡 Asegúrate de haber configurado las variables de entorno en .env.local");
    return false;
  }
}

