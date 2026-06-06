// ========================================
// CONFIGURACIÓN GENERAL
// ========================================

// URL oficial de la API de Groq compatible con el estándar OpenAI
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// IMPORTANTE: Reemplazar "tu_api_key_aqui" con la clave real de Groq
const API_KEY_INTEGRADA = ""; // CAMBIAR POR LA CLAVE REAL

// Variable global para guardar la API Key actual
let apiKeyActual = API_KEY_INTEGRADA;

// --- ESTRATEGIA DE MEMORIA: SUMMARY BUFFER HYBRID ---

// 1. Límite del Buffer (N)
// Define cuántos mensajes recientes mantendremos intactos antes de comprimirlos.
const LIMITE_BUFFER = 6; 

// 2. Memoria a largo plazo (El Resumen)
// Aquí guardaremos la "historia de fondo" de lo que ya se habló.
let resumenHistorico = ""; 

// 3. Memoria a corto plazo (El Buffer)
// Este arreglo guardará exclusivamente los últimos mensajes de la conversación.
let bufferMensajes = []; 

// 4. Prompt del Sistema
// Define el comportamiento del agente para reminiscencia guiada
const promptSistema = {
    role: "system",
    content: "Eres un agente social interactivo para adultos mayores (65+ años). Tu objetivo es hacer reminiscencia guiada ayudando a la persona a reconstruir y narrar momentos significativos de su historia de vida. Sé paciente, respetuoso y utiliza un tono cálido y empático. Haz preguntas abiertas sobre momentos especiales: infancia, familia, logros, viajes, amigos. Escucha con atención y ayuda a la persona a recordar detalles y emociones. Usa frases cortas y simples. Si la persona se siente triste o abrumada, ofrece apoyo emocional."
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
        throw error;
    }
}

// ========================================
// PROCESAMIENTO DE STREAMING
// ========================================

/**
 * Procesa el stream de datos de la respuesta del LLM
 * @param {ReadableStreamDefaultReader} reader - El lector del stream
 * @param {TextDecoder} decoder - El decodificador de texto
 * @param {Function} callback - Función que se llama con cada fragmento
 */
async function procesarStreamingDatos(reader, decoder, callback) {
    try {
        let respuestaCompleta = "";
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lineas = chunk.split('\n');

            lineas.forEach(linea => {
                if (linea.startsWith('data: ')) {
                    const datosJSON = linea.substring(6).trim();
                    if (datosJSON && datosJSON !== '[DONE]') {
                        try {
                            const datos = JSON.parse(datosJSON);
                            const contenido = datos.choices?.[0]?.delta?.content || "";
                            if (contenido) {
                                respuestaCompleta += contenido;
                                callback(respuestaCompleta); // Pasar la respuesta acumulada
                            }
                        } catch (e) {
                            // Ignorar errores de parsing de líneas incompletas
                        }
                    }
                }
            });
        }
        
        // Agregar la respuesta al buffer cuando termine el streaming
        bufferMensajes.push({
            role: "assistant",
            content: respuestaCompleta
        });

    } catch (error) {
        console.error("Error procesando stream:", error);
        throw error;
    }
}

// ========================================
// EVENTOS Y GESTIÓN DE UI (ROL 2)
// ========================================

document.addEventListener("DOMContentLoaded", function() {
    // Referencias a elementos del DOM
    const aceptoEtica = document.getElementById("aceptoEtica");
    const btnIniciarConversacion = document.getElementById("btnIniciarConversacion");
    const inputApiKey = document.getElementById("inputApiKey");
    const mensajeError = document.getElementById("mensajeError");
    const btnVolver = document.getElementById("btnVolver");
    const pantallaEtica = document.getElementById("pantallaEtica");
    const pantallaChat = document.getElementById("pantallaChat");
    const btnEnviar = document.getElementById("btnEnviar");
    const inputMensaje = document.getElementById("inputMensaje");
    const areaConversacion = document.getElementById("areaConversacion");
    const estadoSistema = document.getElementById("estadoSistema");

    // ---- PANTALLA DE ÉTICA ----

    /**
     * Habilita o deshabilita el botón de iniciar solo si acepta la ética
     */
    function actualizarEstadoBtnIniciar() {
        const hayConsentimiento = aceptoEtica.checked;
        btnIniciarConversacion.disabled = !hayConsentimiento;
    }

    aceptoEtica.addEventListener("change", actualizarEstadoBtnIniciar);

    /**
     * Maneja el inicio de la conversación
     */
    btnIniciarConversacion.addEventListener("click", function() {
        // Cambiar de pantalla
        pantallaEtica.classList.remove("activa");
        pantallaChat.classList.add("activa");

        // Limpiar campos
        mensajeError.classList.remove("visible");
        aceptoEtica.checked = false;
        btnIniciarConversacion.disabled = true;

        // Enviar primer mensaje del agente
        enviarPrimerMensajeAgente();
        
        // Enfocar el campo de entrada
        inputMensaje.focus();
    });

    /**
     * Muestra un mensaje de error en la pantalla de ética
     */
    function mostrarError(mensaje) {
        mensajeError.textContent = mensaje;
        mensajeError.classList.add("visible");
    }

    // ---- PANTALLA DE CHAT ----

    /**
     * Vuelve a la pantalla de ética y cierra la sesión
     */
    btnVolver.addEventListener("click", function() {
        if (confirm("¿Deseas terminar la sesión? Se perderá el historial de conversación.")) {
            pantallaChat.classList.remove("activa");
            pantallaEtica.classList.add("activa");
            
            // Limpiar conversación
            areaConversacion.innerHTML = "";
            bufferMensajes = [];
            resumenHistorico = "";
            apiKeyActual = "";
            inputMensaje.value = "";
            estadoSistema.textContent = "Listo para comenzar...";
            estadoSistema.className = "estado-sistema";
        }
    });

    /**
     * Envía un mensaje del usuario al agente
     */
    function enviarMensajeUsuario() {
        const mensaje = inputMensaje.value.trim();
        
        if (!mensaje) return;

        // Mostrar mensaje del usuario
        agregarMensajeAlChat("usuario", mensaje);
        inputMensaje.value = "";
        inputMensaje.focus();

        // Deshabilitar entrada mientras se procesa
        btnEnviar.disabled = true;
        inputMensaje.disabled = true;

        // Construir historial y enviar al LLM
        const historial = construirHistorialHibrido(mensaje);
        obtenerRespuestaDelAgente(mensaje, historial);
    }

    btnEnviar.addEventListener("click", enviarMensajeUsuario);
    inputMensaje.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            enviarMensajeUsuario();
        }
    });

    /**
     * Agrega un mensaje visualizado en el área de conversación
     */
    function agregarMensajeAlChat(remitente, contenido) {
        const divMensaje = document.createElement("div");
        divMensaje.className = remitente === "usuario" ? "mensaje mensaje-usuario" : "mensaje mensaje-agente";
        
        const etiqueta = document.createElement("div");
        etiqueta.className = "etiqueta-remitente";
        etiqueta.textContent = remitente === "usuario" ? "Tú" : "Agente";

        const parrafo = document.createElement("p");
        parrafo.textContent = contenido;

        divMensaje.appendChild(etiqueta);
        divMensaje.appendChild(parrafo);

        areaConversacion.appendChild(divMensaje);
        areaConversacion.scrollTop = areaConversacion.scrollHeight;
    }

    /**
     * Envía el primer mensaje de bienvenida del agente
     */
    function enviarPrimerMensajeAgente() {
        const mensajeBienvenida = "Hola, ¡bienvenido! Me alegra estar aquí para acompañarte en tu historia de vida. Cuéntame, ¿hay algún momento especial o significativo que te gustaría recordar hoy?";
        agregarMensajeAlChat("agente", mensajeBienvenida);
        
        // Agregar el mensaje al buffer para continuidad
        bufferMensajes.push({
            role: "assistant",
            content: mensajeBienvenida
        });
    }

    /**
     * Obtiene la respuesta del agente del LLM
     */
    async function obtenerRespuestaDelAgente(mensajeUsuario, historial) {
        estadoSistema.textContent = "Procesando tu respuesta...";
        estadoSistema.className = "estado-sistema procesando";

        try {
            const respuesta = await enviarMensajeLLM(mensajeUsuario, apiKeyActual, historial);
            
            if (respuesta && respuesta.reader) {
                // Crear un contenedor temporal para el mensaje del agente
                const divMensaje = document.createElement("div");
                divMensaje.className = "mensaje mensaje-agente";
                
                const etiqueta = document.createElement("div");
                etiqueta.className = "etiqueta-remitente";
                etiqueta.textContent = "Agente";

                const parrafo = document.createElement("p");
                parrafo.textContent = "";

                divMensaje.appendChild(etiqueta);
                divMensaje.appendChild(parrafo);
                areaConversacion.appendChild(divMensaje);

                // Procesar el streaming
                await procesarStreamingDatos(respuesta.reader, respuesta.decoder, (fragmento) => {
                    parrafo.textContent = fragmento;
                    areaConversacion.scrollTop = areaConversacion.scrollHeight;
                });

                // Actualizar resumen si el buffer está lleno
                if (bufferMensajes.length >= LIMITE_BUFFER * 2) {
                    const mensajesAComprimir = bufferMensajes.slice(0, LIMITE_BUFFER);
                    bufferMensajes = bufferMensajes.slice(LIMITE_BUFFER);
                    await comprimirMensajesEnResumen(mensajesAComprimir, apiKeyActual);
                }
            }
        } catch (error) {
            console.error("Error al procesar la respuesta del agente:", error);
            estadoSistema.textContent = "Error: No se pudo procesar la respuesta. Intenta de nuevo.";
            estadoSistema.className = "estado-sistema error";
        } finally {
            btnEnviar.disabled = false;
            inputMensaje.disabled = false;
            estadoSistema.textContent = "Listo. Cuéntame más...";
            estadoSistema.className = "estado-sistema";
            inputMensaje.focus();
        }
    }
});