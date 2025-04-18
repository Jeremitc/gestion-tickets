// hash_script.js
const bcrypt = require('bcrypt');

// --- ¡CAMBIA ESTA CONTRASEÑA POR LA QUE QUIERES HASHEAR! ---
//const password = 'Miamor123'  CONTRASEÑA DE JEREMI
const password = 'Miau123:)';  // CONTRASEÑA DE ZENAIDA
// -----------------------------------------------------------

const saltRounds = 10; // Número de rondas (10 es un buen valor por defecto)

console.log(`Generando hash para: "${password}"`);

bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) {
        console.error("Error al generar el hash:", err);
    } else {
        console.log("¡Hash generado con éxito!");
        console.log("-------------------------------------");
        console.log(hash); // <--- Este es el hash que necesitas copiar
        console.log("-------------------------------------");
        console.log("Copia la línea de arriba (el hash) y pégala en tu comando UPDATE de SQL.");
    }
});


// COMANDO SQL para actualizar la contraseña en la base de datos CON HASH

//-- Actualizar usuario con id = 1
//UPDATE users
//SET password_hash = 'HASH_PARA_MIAMOR123'  -- Pega aquí el hash //generado para Miamor123
//WHERE id = 1;
//
//-- Actualizar usuario con id = 2
//UPDATE users
//SET password_hash = 'HASH_PARA_MIAU123'   -- Pega aquí el hash //generado para Miau123:)
//WHERE id = 2;