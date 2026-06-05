// URL oficial de la API de Groq compatible con el estándar OpenAI
const API_URL = 'https://api.groq.com/openai/v1/chat/completions'; // 

// --- ESTRATEGIA DE MEMORIA: SUMMARY BUFFER HYBRID ---

// 1. Límite del Buffer (N)
// Define cuántos mensajes recientes mantendremos intactos antes de comprimirlos.
// Un número entre 6 y 10 es ideal para mantener inmediatez sin saturar al LLM.
const LIMITE_BUFFER = 6; 

// 2. Memoria a largo plazo (El Resumen)
// Aquí guardaremos la "historia de fondo" de lo que ya se habló.
let resumenHistorico = ""; 

// 3. Memoria a corto plazo (El Buffer)
// Este arreglo guardará exclusivamente los últimos mensajes de la conversación.
let bufferMensajes = []; 

// 4. Prompt del Sistema
// Aunque tu compañero del Rol 5 diseñará el prompt final con la personalidad exacta,
// necesitamos definir esta variable base para armar nuestros paquetes de memoria.
const promptSistema = {
    role: "system",
    content: "Eres un agente social interactivo para adultos mayores. Tu objetivo es hacer reminiscencia guiada. Sé paciente, respetuoso y utiliza un tono cálido."
};

/**
 * Ensambla el paquete completo de mensajes (System Prompt + Resumen + Buffer)
 * y actualiza el buffer con el nuevo mensaje del usuario.
 * @param {string} mensajeUsuario - El nuevo mensaje dicho por el adulto mayor.
 * @returns {Array} El historial completo formateado para la API de Groq.
 */
function construirHistorialHibrido(mensajeUsuario) {
    // 1. Agregamos el nuevo mensaje del usuario al buffer (Memoria a corto plazo)
    bufferMensajes.push({
        role: "user",
        content: mensajeUsuario
    });

    // 2. Preparamos el arreglo final que enviaremos al LLM
    let historialFinal = [];

    // 3. Añadimos el Prompt del Sistema (Siempre debe ir primero)
    historialFinal.push(promptSistema);

    // 4. Añadimos el Resumen Histórico (Si existe)
    // Le indicamos al LLM que esto es un resumen de lo hablado anteriormente
    if (resumenHistorico !== "") {
        historialFinal.push({
            role: "system",
            content: `Resumen de la conversación anterior: ${resumenHistorico}`
        });
    }

    // 5. Añadimos todo el contenido actual del Buffer (Los últimos N mensajes)
    // Usamos el operador spread (...) para añadir los elementos del arreglo uno por uno
    historialFinal.push(...bufferMensajes);

    // 6. Retornamos el paquete listo
    return historialFinal;
}

/**
 * Tarea en segundo plano para comprimir los mensajes viejos en un resumen.
 * Realiza una llamada "no-streaming" al LLM.
 * @param {Array} mensajesAComprimir - Los mensajes viejos que vamos a sacar del buffer.
 * @param {string} apiKey - La clave de Groq.
 */
async function comprimirMensajesEnResumen(mensajesAComprimir, apiKey) {
    console.log("Iniciando compresión de memoria en segundo plano...");

    // 1. Preparamos el texto que le daremos al LLM para resumir
    let textoDeMensajesViejos = "";
    mensajesAComprimir.forEach(msg => {
        // Formateamos para que el LLM sepa quién dijo qué
        const emisor = msg.role === "user" ? "Adulto Mayor" : "Agente";
        textoDeMensajesViejos += `${emisor}: ${msg.content}\n`;
    });

    // 2. Armamos el prompt específico para la tarea de resumir
    // Si ya existe un resumen anterior, le pedimos que lo actualice.
    const promptResumen = `
        A continuación se presenta un fragmento de una conversación entre un adulto mayor y un agente social.
        ${resumenHistorico ? `Resumen previo de la conversación: "${resumenHistorico}"` : ""}
        
        Nuevos mensajes a incorporar al resumen:
        ${textoDeMensajesViejos}
        
        Tu tarea es escribir un ÚNICO PÁRRAFO resumiendo de qué se ha hablado hasta ahora. 
        Mantén los detalles importantes de la vida del adulto mayor. No escribas nada más que el resumen.
    `;

    const payloadCompresion = {
        model: 'llama-3.3-70b-versatile', 
        messages: [{ role: "user", content: promptResumen }],
        temperature: 0.3, // Temperatura baja (0.0-0.3) para respuestas lógicas, precisas y estrictas. Ideal para resumir sin inventar.
        max_tokens: 300, 
        stream: false // ¡Clave! Queremos la respuesta completa de golpe, sin streaming.
    };

    try {
        const respuesta = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payloadCompresion)
        });

        if (!respuesta.ok) {
            throw new Error(`Error comprimiendo: ${respuesta.status}`);
        }

        const datosJSON = await respuesta.json();
        
        // 3. Extraemos el nuevo resumen y actualizamos nuestra variable global
        const nuevoResumen = datosJSON.choices[0].message.content;
        resumenHistorico = nuevoResumen.trim();
        
        console.log("Compresión exitosa. Nuevo resumen histórico:", resumenHistorico);

    } catch (error) {
        console.error("Fallo al intentar resumir el historial:", error);
    }
}

/**
 * Función principal para enviar el mensaje al LLM
 * @param {string} mensajeUsuario - El texto que el adulto mayor acaba de decir
 * @param {string} apiKey - La clave generada en la consola de Groq
 * @param {Array} historialConversacion - El arreglo con la memoria del chat (tarea futura)
 */

async function enviarMensajeLLM(mensajeUsuario, apiKey, historialConversacion) {
    
    // Configuramos el cuerpo de la petición
    const configuracionPeticion = {
        model: 'llama-3.3-70b-versatile', // Modelo recomendado para buen balance
        messages: historialConversacion,  // Pasamos todo el historial
        temperature: 0.7, // Creatividad media para un tono natural y conversacional
        max_tokens: 500, // Límite de tamaño de la respuesta
        stream: true // ¡Clave para tu tarea! Permite recibir el texto en fragmentos 
    };

    try {
        // Realizamos la petición HTTP con fetch puro
        const respuesta = await fetch(API_URL, {
            method: 'POST', // 
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(configuracionPeticion)
        });

        if (!respuesta.ok) {
            throw new Error(`Error en la API: ${respuesta.status}`);
        }

        // Aquí es donde procesaremos el streaming en el siguiente paso
        console.log("Conexión exitosa. Preparado para leer el stream de datos.");
        
        // --- NUEVO: Preparación para leer el stream ---
        
        // 1. Obtenemos el "lector" del stream de la respuesta
        const reader = respuesta.body.getReader();
        // 2. Necesitamos un decodificador para convertir los datos crudos a texto
        const decoder = new TextDecoder('utf-8');

        // Retornamos el lector y el decodificador para que la función
        // que maneje el streaming (la siguiente tarea) pueda usarlos.
        return { reader, decoder };

    } catch (error) {
        console.error("Hubo un problema conectando con el LLM:", error);
    }
}