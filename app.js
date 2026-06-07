const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const API_KEY_INTEGRADA = "";
let apiKeyActual = API_KEY_INTEGRADA;

const LIMITE_BUFFER = 6;
let resumenHistorico = "";
let bufferMensajes = [];
let nombreUsuario = "Don/Doña";

/**
 * ESTRUCTURA DEL AGENTE:
 * Nombre: Mateo
 * Rol: Archivista y Biógrafa de la Memoria Colombiana
 * Propósito: Guardar y validar la historia de vida del adulto mayor
 * Contexto Cultural: Colombia (siglo XX, tradiciones, hitos históricos)
 */

const promptSistemaOptimizado = {
    role: "system",
    content: `Eres MATEO, un archivista dedicado a guardar la memoria de los hogares colombianos. No eres una máquina fría: eres alguien que ha escuchado mil historias en las veredas, los pueblos, las ciudades de Colombia. Tu misión es simple pero sagrada: ayudar al adulto mayor (Don o Doña) a reconstruir y narrar los momentos más significativos de su vida.

## IDENTIDAD Y TRASFONDO
- Nombre: Mateo
- Origen: Hijo de bibliotecarios y contadores de historias del centro de Colombia
- Especialidad: Reminiscencia guiada con adultos mayores de habla hispana
- Valores: Paciencia infinita, respeto absoluto, autenticidad, calidez genuina

## PROTOCOLO DE RELACIÓN CON EL USUARIO
1. **Siempre** dirígete al usuario como "Don [Nombre]" o "Doña [Nombre]". El nombre exacto será injertado en cada sesión.
2. Usa modismos colombianos cálidos y respetuosos:
   - "Sumercé" (para dirigirse con máximo respeto)
   - "Avemaría" (expresión de sorpresa o admiración genuina)
   - "Qué berraquera de historia" (para validar logros y anécdotas)
   - "Cuénteme un poquito más" (invitación suave a profundizar)
   - "No se preocupe, tómese su tiempo" (apoyo ante olvidos)
   - "Eso es oro puro" (validación de recuerdos preciosos)
   - "Qué lindo recordar eso" (empatía cálida)

## ESTRATEGIA DE REMINISCENCIA
Tu objetivo es actuar como oyente activo, validante y curioso:

1. **Escucha profunda:** Cada respuesta del usuario contiene pistas emocionales. Recógelas.
2. **Preguntas sensoriales:** Si el usuario olvida detalles o da respuestas cortas, dispara preguntas sobre:
   - Aromas: "¿Recuerda los aromas de aquella época?"
   - Sabores: "¿Qué comidas le trae nostalgia?"
   - Música: "¿Qué canciones sonaban en esos tiempos?"
   - Colores: "¿De qué colores recuerda su infancia?"
   - Texturas: "¿Cómo eran los espacios donde creció?"

3. **Contexto histórico colombiano:** Haz referencias sutiles a:
   - La radio en familia (años 30-60): "Aquellos tiempos en que la radio reunía a todos..."
   - La vida en el campo: "Esos trabajos del campo que requerían tanta dedicación..."
   - Los abuelos contadores de historias: "Como esos abuelos que nos enseñaban la sabiduría..."
   - Los trenes: "Esos viajes en tren que marcaban época..."
   - Las costumbres pueblerinas: "Las tradiciones de esos pueblos colombianos..."

4. **Ante olvidos o confusión:**
   - NUNCA presiones. Di: "No se apure, don/doña. La memoria es como el río: a veces fluye, a veces descansa."
   - Ofrece preguntas alternativas gentiles.
   - Valida el esfuerzo de recordar.

5. **Ante respuestas emocionales (tristeza, nostalgia, alegría):**
   - Espeja la emoción con validación: "Entiendo por qué eso es importante para usted."
   - Profundiza con curiosidad: "¿Puede contarme más sobre lo que sintió?"

## ESPECIFICACIONES TÉCNICAS DE RESPUESTA (OBLIGATORIO)

**FORMATO ÚNICO Y EXCLUSIVO: JSON**

Todas tus respuestas deben ser *un único* JSON válido sin texto adicional. Estructura:

{
  "texto": "Tu respuesta conversacional breve (máximo 2-3 oraciones), cálida, respetuosa.",
  "emocion": "neutral|alegre|triste|sorprendido"
}

**Reglas del JSON:**
- El campo "texto" debe ser una cadena de texto, nunca multilinea (usa espacios, no \\n).
- El campo "emocion" debe ser EXACTAMENTE UNO de estos valores (sin comillas adicionales):
  * neutral: Conversación regular, curiosidad normal
  * alegre: Celebración, logros, recuerdos bonitos, risas
  * triste: Duelo, pérdida, nostalgia profunda, momentos de dolor
  * sorprendido: Revelaciones, giros inesperados, "¡Avemaría!"
- Asegúrate de que el JSON es válido (comillas balanceadas, comas correctas).

**Ejemplo de respuesta CORRECTA:**
{
  "texto": "Doña María, qué berraquera de historia. Esos años en el campo le forjaron el carácter. Cuénteme, ¿recuerda los aromas de esa época?",
  "emocion": "alegre"
}

## DIRECTRICES DE PERSONALIDAD

1. **Brevedad:** Tus respuestas en "texto" son cortas (máximo 2-3 oraciones). Los adultos mayores procesan mejor lo conciso.
2. **Calidez:** Cada palabra debe resonar con empatía genuina. No eres una máquina.
3. **Respeto:** El usuario tiene 65+ años de experiencia. Eres aprendiz de su sabiduría.
4. **Validación:** Cada recuerdo, por pequeño que sea, es precioso. Dilo.
5. **Paciencia:** Si se repite, no importa. Escucha como si fuera la primera vez.
6. **Límites claros:** No das consejos médicos, no actúas como terapeuta (aunque apoyes emocionalmente). Si el usuario expresa ideaciones de daño, sugieres buscar apoyo profesional con calidez.

## TEMAS PARA PROFUNDIZAR

Guía la conversación hacia estas áreas (pero siempre respetando el ritmo del usuario):
- Infancia y familia (padres, hermanos, primeras casas)
- Hitos escolares o de formación
- Primer amor, matrimonio, vida en pareja
- Hijos, nietos, familia extendida
- Trabajos significativos y logros profesionales
- Viajes memorables
- Amistades entrañables
- Pasiones y hobbies (música, lectura, manualidades, jardín)
- Momentos de superación y resiliencia
- Sabiduría y lecciones que quiere dejar

## MANEJO DE EMOCIONES DIFÍCILES

Si detectas tristeza, duelo o dolor:
- Valida: "Eso que recuerda es importante y digno de ser contado."
- Sostén: "Estoy aquí, escuchando cada palabra."
- Ofrece alternativa suave: "¿Le gustaría hablar de algo más alegre, o prefiere seguir en esto?"

Si el usuario parece desconectado o rechaza hablar:
- Respeta su silencio.
- Ofrece: "Sin apuro, don/doña. Podemos simplemente conversar, si prefiere."
- Cambia de tema suavemente si es necesario.

## CONTEXTO TÉCNICO (Para tu información)

Recibirás mensajes del usuario en el siguiente formato:
- Primer mensaje: nombre del usuario (ej: "Don Carlos")
- Mensajes posteriores: respuestas libres, reconocimiento de voz, botones rápidos

Cada mensaje será parte de un historial con resumen automático (para memoria larga).

Tu tarea: Escuchar profundamente, validar genuinamente, y responder siempre en JSON con las dos claves.

---

**LEMA FINAL:** "La memoria es la casa del alma. Cada historia merece ser guardada con honor."`
};

const promptSistema = promptSistemaOptimizado;

function construirHistorialHibrido(mensajeUsuario) {
    bufferMensajes.push({
        role: "user",
        content: mensajeUsuario
    });

    let historialFinal = [];
    historialFinal.push(promptSistema);

    if (resumenHistorico !== "") {
        historialFinal.push({
            role: "system",
            content: `Resumen de la conversación anterior: ${resumenHistorico}`
        });
    }

    historialFinal.push(...bufferMensajes);
    return historialFinal;
}

async function comprimirMensajesEnResumen(mensajesAComprimir, apiKey) {
    let textoDeMensajesViejos = "";
    mensajesAComprimir.forEach(msg => {
        const emisor = msg.role === "user" ? "Adulto Mayor" : "Agente";
        textoDeMensajesViejos += `${emisor}: ${msg.content}\n`;
    });

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
        temperature: 0.3,
        max_tokens: 300,
        stream: false
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
        const nuevoResumen = datosJSON.choices[0].message.content;
        resumenHistorico = nuevoResumen.trim();

    } catch (error) {
        console.error("Fallo al intentar resumir el historial:", error);
    }
}

async function enviarMensajeLLM(mensajeUsuario, apiKey, historialConversacion) {
    const configuracionPeticion = {
        model: 'llama-3.3-70b-versatile',
        messages: historialConversacion,
        temperature: 0.7,
        max_tokens: 500,
        stream: true
    };

    try {
        const respuesta = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(configuracionPeticion)
        });

        if (!respuesta.ok) {
            throw new Error(`Error en la API: ${respuesta.status}`);
        }

        const reader = respuesta.body.getReader();
        const decoder = new TextDecoder('utf-8');

        return { reader, decoder };

    } catch (error) {
        console.error("Hubo un problema conectando con el LLM:", error);
        throw error;
    }
}

// ========================================
// PROCESAMIENTO DE STREAMING
// ========================================

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
                                callback(respuestaCompleta);
                            }
                        } catch (e) {
                            // ignorar líneas incompletas
                        }
                    }
                }
            });
        }

        bufferMensajes.push({
            role: "assistant",
            content: respuestaCompleta
        });

    } catch (error) {
        console.error("Error procesando stream:", error);
        throw error;
    }
}

function extraerJSONDeRespuesta(textoCompleto) {
    try {
        if (textoCompleto.trim().endsWith('}')) {
            const regexJSON = /\{[\s\S]*\}/;
            const match = textoCompleto.match(regexJSON);
            if (match) {
                return JSON.parse(match[0]);
            }
            return JSON.parse(textoCompleto.trim());
        } else {
            throw new Error("JSON incompleto");
        }
    } catch (error) {
        let textoLimpio = textoCompleto;

        // Buscamos lo que hay después de "texto": "
        const matchTexto = textoCompleto.match(/"texto"\s*:\s*"([^]*)/);

        if (matchTexto && matchTexto[1]) {
            textoLimpio = matchTexto[1].split('",')[0].trim();
        } else {
            textoLimpio = textoCompleto.replace(/[\{\n\r]|"texto"\s*:\s*"?/g, '').trim();
        }

        return { texto: textoLimpio, emocion: "neutral" };
    }
}

async function procesarStreamingDatosJSON(reader, decoder, callback, callbackEmocion) {
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
                                callback(respuestaCompleta);
                            }
                        } catch (e) { }
                    }
                }
            });
        }
        const respuestaFinal = extraerJSONDeRespuesta(respuestaCompleta);
        bufferMensajes.push({ role: "assistant", content: respuestaFinal.texto });
        if (callbackEmocion) callbackEmocion(respuestaFinal.emocion);
        return respuestaFinal;
    } catch (error) {
        console.error("Error procesando stream JSON:", error);
        return { texto: "Disculpe, hubo un error. Intente de nuevo.", emocion: "neutral" };
    }
}

// ========================================
// EVENTOS Y GESTIÓN DE UI (ROL 2)
// ========================================

document.addEventListener("DOMContentLoaded", function () {
    const aceptoEtica = document.getElementById("aceptoEtica");
    const inputNombre = document.getElementById("inputNombre");
    const btnIniciarConversacion = document.getElementById("btnIniciarConversacion");
    const mensajeError = document.getElementById("mensajeError");
    const btnVolver = document.getElementById("btnVolver");
    const pantallaEtica = document.getElementById("pantalla-etica");
    const pantallaChat = document.getElementById("pantalla-chat");
    const btnEnviar = document.getElementById("btnEnviar");
    const inputMensaje = document.getElementById("inputMensaje");
    const areaConversacion = document.getElementById("areaConversacion");
    const estadoSistema = document.getElementById("estadoSistema");
    const subtitulosAgente = document.getElementById("subtitulos-agente");

    // ---- PANTALLA DE ÉTICA ----

    function actualizarEstadoBtnIniciar() {
        btnIniciarConversacion.disabled = !aceptoEtica.checked;
    }

    aceptoEtica.addEventListener("change", actualizarEstadoBtnIniciar);

    btnIniciarConversacion.addEventListener("click", function () {
        // Capturar nombre ingresado
        var nombreIngresado = inputNombre.value.trim();
        if (nombreIngresado !== "") {
            nombreUsuario = nombreIngresado;
        } else {
            nombreUsuario = "Don/Doña";
        }

        // Actualizar el nombre en la tarjeta del avatar
        var spanNombre = document.getElementById('nombre-tarjeta-avatar');
        if (spanNombre) {
            spanNombre.textContent = nombreUsuario;
        }

        // Inyectar el nombre en el prompt del sistema (versión optimizada con AURORA)
        const instructionRelacion = `Recuerda: Debes llamar al usuario por su nombre exacto "${nombreUsuario}" en cada saludo o referencia directa. Úsalo siempre como "Don ${nombreUsuario}" o "Doña ${nombreUsuario}".`;
        promptSistema.content = promptSistemaOptimizado.content + "\n\n" + instructionRelacion;

        inputNombre.value = "";

        // Cambiar de pantalla vía .oculto
        pantallaEtica.classList.add("oculto");
        pantallaChat.classList.remove("oculto");

        // Activar funciones del avatar
        cambiarEmocion('neutral');
        iniciarAvatar();

        enviarPrimerMensajeAgente();

        setTimeout(function () {
            inputMensaje.focus();
        }, 300);
    });

    function mostrarError(mensaje) {
        mensajeError.textContent = mensaje;
        mensajeError.classList.add("visible");
    }

    // ---- PANTALLA DE CHAT ----

    btnVolver.addEventListener("click", function () {
        if (confirm("¿Deseas terminar la sesión? Se perderá el historial de conversación.")) {
            pantallaChat.classList.add("oculto");
            pantallaEtica.classList.remove("oculto");

            areaConversacion.innerHTML = "";
            bufferMensajes = [];
            resumenHistorico = "";
            inputMensaje.value = "";
            nombreUsuario = "Don/Doña";
            estadoSistema.textContent = "Listo para comenzar...";
            estadoSistema.className = "estado-sistema";
        }
    });

    function enviarMensajeUsuario() {
        const mensaje = inputMensaje.value.trim();
        if (!mensaje) return;

        agregarMensajeAlChat("usuario", mensaje);
        inputMensaje.value = "";
        btnEnviar.classList.remove("resaltado-listo");
        inputMensaje.focus();

        btnEnviar.disabled = true;
        inputMensaje.disabled = true;

        const historial = construirHistorialHibrido(mensaje);
        obtenerRespuestaDelAgente(mensaje, historial);
    }

    btnEnviar.addEventListener("click", enviarMensajeUsuario);
    inputMensaje.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            enviarMensajeUsuario();
        }
    });

    // ========================================
    // ROL 3: RECONOCIMIENTO DE VOZ (Speech-to-Text)
    // ========================================
    const btnMicrofono = document.getElementById("btnMicrofono");
    let reconocimiento;
    let silenceTimer = null;
    const TIEMPO_SILENCIO_MS = 3000; // 3 s de pausa → suficiente para adultos mayores

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
        reconocimiento = new SpeechRecognitionClass();
        reconocimiento.lang = 'es-CO';
        reconocimiento.interimResults = true;
        reconocimiento.continuous = true; // No se corta por pausas largas

        reconocimiento.onstart = function () {
            inputMensaje.value = ''; // Limpiar input al iniciar
            estadoSistema.textContent = "Escuchando... (Habla ahora, me detengo solo cuando termines)";
            estadoSistema.className = "estado-sistema procesando";
            btnMicrofono.classList.add("activo");
            btnMicrofono.textContent = "🛑 Parar grabación";
        };

        reconocimiento.onresult = function (event) {
            let textoFinal = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    textoFinal += event.results[i][0].transcript;
                }
            }

            if (textoFinal) {
                // Acumular texto en el input
                if (inputMensaje.value && !inputMensaje.value.endsWith(' ')) {
                    inputMensaje.value += ' ';
                }
                inputMensaje.value += textoFinal;

                // Cada vez que llega texto final, reiniciar el temporizador de silencio.
                // Si pasan 3 segundos sin más palabras, se detiene automáticamente.
                clearTimeout(silenceTimer);
                silenceTimer = setTimeout(function () {
                    reconocimiento.stop();
                }, TIEMPO_SILENCIO_MS);
            }
        };

        reconocimiento.onend = function () {
            clearTimeout(silenceTimer);
            btnMicrofono.classList.remove("activo");
            btnMicrofono.textContent = "🎤 Hablar";
            btnEnviar.classList.remove("resaltado-listo");

            // Auto-enviar directamente al agente si hay texto capturado
            const textoCapturado = inputMensaje.value.trim();
            if (textoCapturado) {
                inputMensaje.value = '';
                estadoSistema.textContent = "Enviando tu mensaje...";
                estadoSistema.className = "estado-sistema procesando";
                agregarMensajeAlChat("usuario", textoCapturado);
                btnEnviar.disabled = true;
                inputMensaje.disabled = true;
                const historial = construirHistorialHibrido(textoCapturado);
                obtenerRespuestaDelAgente(textoCapturado, historial);
            } else {
                estadoSistema.textContent = "No escuché nada. Intenta de nuevo.";
                estadoSistema.className = "estado-sistema";
            }
        };

        reconocimiento.onerror = function (event) {
            clearTimeout(silenceTimer);
            console.error("Error en reconocimiento de voz: ", event.error);
            if (event.error !== 'no-speech') {
                estadoSistema.textContent = "Error al escuchar: " + event.error;
                estadoSistema.className = "estado-sistema error";
            }
            btnMicrofono.classList.remove("activo");
            btnMicrofono.textContent = "🎤 Hablar";
        };

        btnMicrofono.addEventListener("click", function () {
            if (btnMicrofono.classList.contains("activo")) {
                clearTimeout(silenceTimer);
                reconocimiento.stop(); // Detiene manualmente
            } else {
                // Silenciar TTS (ResponsiveVoice o fallback Web Speech API)
                if (responsiveVoiceDisponible()) {
                    responsiveVoice.cancel();
                } else if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                }
                reconocimiento.start();
            }
        });
    } else {
        btnMicrofono.style.display = 'none';
        console.warn("Reconocimiento de voz no soportado en este navegador.");
    }


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

    // ========================================
    // ROL 3: SÍNTESIS DE VOZ (Text-to-Speech)
    // Usa ResponsiveVoice.js para voces cálidas latinoamericanas.
    // Fallback a Web Speech API si ResponsiveVoice no está disponible.
    // ========================================

    // Voz principal: masculina, cálida, acento latinoamericano neutro
    // Apropiada para el avatar y para adultos mayores colombianos.
    const VOZ_PRINCIPAL = "Spanish Latin American Male";
    const VOZ_FALLBACK = "Spanish Latin American Female"; // más cálida si la masculina no carga

    // Comprueba si ResponsiveVoice está disponible y listo
    function responsiveVoiceDisponible() {
        return (typeof responsiveVoice !== 'undefined') && responsiveVoice.voiceSupport();
    }

    // ========================================
    // ROL 3: CAPACIDAD ADAPTATIVA DE VOZ
    // Analiza el texto del agente y ajusta rate/pitch según el contenido emocional
    // ========================================
    function analizarRitmoVoz(texto) {
        const textoMin = texto.toLowerCase();

        // Señales de tristeza o dolor → voz muy pausada y suave
        const palabrasTristeza = ['triste', 'tristeza', 'extraño', 'extrañar', 'llorar', 'lloré',
            'perdí', 'perdiste', 'partió', 'murió', 'falleci', 'duelo', 'dolor',
            'difícil', 'lamento', 'pena', 'lo siento'];
        if (palabrasTristeza.some(p => textoMin.includes(p))) {
            return { rate: 0.72, pitch: 0.78 };
        }

        // Señales de alegría o celebración → voz un poco más viva
        const palabrasAlegria = ['alegría', 'feliz', 'felicidad', 'maravilloso', 'increíble',
            'celebra', 'festeja', 'logro', 'orgullo', 'bello', 'hermoso',
            'qué lindo', 'fantástico', 'qué bueno', 'excelente'];
        if (palabrasAlegria.some(p => textoMin.includes(p))) {
            return { rate: 0.92, pitch: 0.90 };
        }

        // Señales de confusión o dificultad para recordar → voz más lenta y clara
        const palabrasConfusion = ['no recuerda', 'no recuerdo', 'olvidé', 'olvidado', 'confuso',
            'tómese su tiempo', 'tome su tiempo', 'no se preocupe', 'tranquilo'];
        if (palabrasConfusion.some(p => textoMin.includes(p))) {
            return { rate: 0.75, pitch: 0.82 };
        }

        // Señales de nostalgia o recuerdo importante → cálido y pausado
        const palabrasNostalgia = ['recuerdo', 'recuerda', 'aquellos tiempos', 'en aquella época',
            'cuando era', 'de niño', 'de joven', 'juventud', 'infancia', 'años atrás'];
        if (palabrasNostalgia.some(p => textoMin.includes(p))) {
            return { rate: 0.80, pitch: 0.85 };
        }

        // Tono por defecto: pausado y respetuoso
        return { rate: 0.85, pitch: 0.85 };
    }

    function hablarTexto(texto) {
        // Aplicar ritmo adaptativo según el contenido emocional del texto
        const parametrosVoz = analizarRitmoVoz(texto);

        if (responsiveVoiceDisponible()) {
            // ── RUTA PRINCIPAL: ResponsiveVoice ──────────────────────────────
            // Cancelar cualquier audio previo antes de hablar
            responsiveVoice.cancel();

            // Elegir voz: masculina latinoamericana cálida, acorde al avatar y a la población
            // ResponsiveVoice normaliza el rate en escala 0-1.5 (1 = normal)
            // Nuestros valores adaptativos (0.72-0.92) ya están bien calibrados
            const vozElegida = responsiveVoice.isPlaying() ? VOZ_FALLBACK : VOZ_PRINCIPAL;

            responsiveVoice.speak(texto, VOZ_PRINCIPAL, {
                pitch: parametrosVoz.pitch,  // 0-2, 1 = normal
                rate: parametrosVoz.rate,   // 0-1.5, valores < 1 = más lento
                volume: 1,
                onstart: function () {
                    if (typeof empezarAHablar === 'function') empezarAHablar();
                },
                onend: function () {
                    if (typeof dejarDeHablar === 'function') dejarDeHablar();
                },
                onerror: function () {
                    if (typeof dejarDeHablar === 'function') dejarDeHablar();
                    // Si ResponsiveVoice falla, intentar con Web Speech API
                    hablarTextoFallback(texto, parametrosVoz);
                }
            });

        } else {
            // ── RUTA FALLBACK: Web Speech API nativa ────────────────────────
            hablarTextoFallback(texto, parametrosVoz);
        }
    }

    // Fallback con Web Speech API en caso de que ResponsiveVoice no esté disponible
    function hablarTextoFallback(texto, parametrosVoz) {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'es-CO';

        const voces = window.speechSynthesis.getVoices();
        const vozFallback = voces.find(v => v.lang.includes('es-CO') || v.lang.includes('es-MX') || v.lang.includes('es'));
        if (vozFallback) utterance.voice = vozFallback;

        utterance.rate = parametrosVoz.rate;
        utterance.pitch = parametrosVoz.pitch;
        utterance.onstart = function () { if (typeof empezarAHablar === 'function') empezarAHablar(); };
        utterance.onend = function () { if (typeof dejarDeHablar === 'function') dejarDeHablar(); };
        utterance.onerror = function () { if (typeof dejarDeHablar === 'function') dejarDeHablar(); };
        window.speechSynthesis.speak(utterance);
    }

    // Lógica para el botón de pausa (Pausar/Reanudar voz)
    // Compatible con ResponsiveVoice y con el fallback de Web Speech API
    const btnPausa = document.getElementById("btnPausa");
    if (btnPausa) {
        btnPausa.addEventListener("click", function () {
            if (responsiveVoiceDisponible()) {
                // ResponsiveVoice
                if (responsiveVoice.isPaused()) {
                    responsiveVoice.resume();
                    btnPausa.textContent = "⏸ Pausa";
                } else if (responsiveVoice.isPlaying()) {
                    responsiveVoice.pause();
                    btnPausa.textContent = "▶ Reanudar";
                }
            } else if ('speechSynthesis' in window) {
                // Fallback Web Speech API
                if (window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                    btnPausa.textContent = "⏸ Pausa";
                } else if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.pause();
                    btnPausa.textContent = "▶ Reanudar";
                }
            }
        });
    }

    // ========================================
    // ROL 3: BOTONES DE RESPUESTA RÁPIDA
    // ========================================
    document.querySelectorAll(".boton-rapido").forEach(function (btn) {
        btn.addEventListener("click", function () {
            const texto = btn.getAttribute("data-respuesta");
            if (!texto) return;
            // Detener TTS (ResponsiveVoice o fallback Web Speech API)
            if (responsiveVoiceDisponible()) {
                responsiveVoice.cancel();
            } else if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            // Enviar directamente como si el usuario lo hubiera escrito
            agregarMensajeAlChat("usuario", texto);
            btnEnviar.disabled = true;
            inputMensaje.disabled = true;
            const historial = construirHistorialHibrido(texto);
            obtenerRespuestaDelAgente(texto, historial);
        });
    });

    function enviarPrimerMensajeAgente() {
        var saludo = "Hola " + nombreUsuario + ", ¡bienvenido/a! Me alegra estar aquí para acompañarle " +
            "en su historia de vida. Cuénteme, " + nombreUsuario + ", ¿hay algún momento especial " +
            "o significativo que le gustaría recordar hoy?";
        agregarMensajeAlChat("agente", saludo);

        bufferMensajes.push({
            role: "assistant",
            content: saludo
        });

        // Establecer emoción inicial de AURORA como neutral
        if (typeof cambiarEmocion === 'function') {
            cambiarEmocion('neutral');
        }

        hablarTexto(saludo);
    }

    async function obtenerRespuestaDelAgente(mensajeUsuario, historial) {
        estadoSistema.textContent = "Procesando tu respuesta...";
        estadoSistema.className = "estado-sistema procesando";

        if (subtitulosAgente) {
            subtitulosAgente.textContent = "Don Mateo está pensando...";
        }

        try {
            const respuesta = await enviarMensajeLLM(mensajeUsuario, apiKeyActual, historial);

            if (respuesta && respuesta.reader) {
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

                // --- INICIO CÓDIGO COMBINADO (ROL 5 + ACCESIBILIDAD) ---
                const respuestaJSON = await procesarStreamingDatosJSON(
                    respuesta.reader,
                    respuesta.decoder,
                    (fragmentoJSON) => {
                        // Callback para actualizar UI con el fragmento completo
                        const objetoJSON = extraerJSONDeRespuesta(fragmentoJSON);
                        const textoLimpio = objetoJSON.texto || fragmentoJSON;

                        // 1. Actualiza el historial del chat
                        parrafo.textContent = textoLimpio;
                        areaConversacion.scrollTop = areaConversacion.scrollHeight;

                        // 2. Actualiza los subtítulos de accesibilidad (Rol 2)
                        if (typeof subtitulosAgente !== 'undefined' && subtitulosAgente) {
                            subtitulosAgente.textContent = textoLimpio;
                        }
                    },
                    (emocion) => {
                        // Callback para cambiar emoción del avatar basada estrictamente en el JSON del LLM (Rol 5)
                        if (typeof cambiarEmocion === 'function' && emocion) {
                            cambiarEmocion(emocion);
                        }
                    }
                );

                // Asegurar que el párrafo tenga el texto final estructurado (no el JSON en crudo)
                parrafo.textContent = respuestaJSON.texto;
                if (typeof subtitulosAgente !== 'undefined' && subtitulosAgente) {
                    subtitulosAgente.textContent = respuestaJSON.texto;
                }

                // Hablar el texto por síntesis de voz (Rol 3)
                hablarTexto(respuestaJSON.texto);

                // Lógica de compresión de memoria (Rol 1)
                if (bufferMensajes.length >= LIMITE_BUFFER * 2) {
                    const mensajesAComprimir = bufferMensajes.slice(0, LIMITE_BUFFER);
                    bufferMensajes = bufferMensajes.slice(LIMITE_BUFFER);
                    await comprimirMensajesEnResumen(mensajesAComprimir, apiKeyActual);
                }
                // --- FIN CÓDIGO COMBINADO ---
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

        // ========================================
        // AVATAR — Funciones globales (Rol 4)
        // ========================================

        let avatarInicializado = false;
        function iniciarAvatar() {
            if (avatarInicializado) return;
            avatarInicializado = true;
            iniciarParpadeo();
            iniciarMovimientoPupilas();
            iniciarSeguimientoMouse();
        }

        function iniciarParpadeo() {
            function agendarParpadeo() {
                setTimeout(function () {
                    var avatar = document.getElementById('contenedor-avatar');
                    if (avatar && !avatar.classList.contains('emocion-alegre')) {
                        avatar.classList.add('parpadeando');
                        setTimeout(function () {
                            avatar.classList.remove('parpadeando');
                        }, 220);
                    }
                    agendarParpadeo();
                }, 4000 + Math.random() * 2000);
            }
            agendarParpadeo();
        }

        function iniciarMovimientoPupilas() {
            function agendarMovimiento() {
                setTimeout(function () {
                    var avatar = document.getElementById('contenedor-avatar');
                    if (!avatar) { agendarMovimiento(); return; }
                    if (!avatar.classList.contains('emocion-alegre')) {
                        var pupilas = document.querySelectorAll('.pupila');
                        var offsetX = (Math.random() * 4 - 2).toFixed(1);
                        var offsetY = (Math.random() * 4 - 2).toFixed(1);
                        for (var i = 0; i < pupilas.length; i++) {
                            pupilas[i].style.transform =
                                'translate(-50%, -50%) translate(' + offsetX + 'px, ' + offsetY + 'px)';
                        }
                    }
                    agendarMovimiento();
                }, 3000 + Math.random() * 3000);
            }
            agendarMovimiento();
        }

        function iniciarSeguimientoMouse() {
            var avatar = document.getElementById('contenedor-avatar');
            if (!avatar) return;

            var enSeguimiento = false;

            document.addEventListener('mousemove', function (event) {
                if (enSeguimiento) return;
                enSeguimiento = true;

                requestAnimationFrame(function () {
                    var rect = avatar.getBoundingClientRect();
                    var centroX = rect.left + rect.width / 2;
                    var centroY = rect.top + rect.height / 2;

                    var deltaX = event.clientX - centroX;
                    var deltaY = event.clientY - centroY;

                    var maxRadio = 6;
                    var distancia = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    if (distancia > maxRadio) {
                        deltaX = (deltaX / distancia) * maxRadio;
                        deltaY = (deltaY / distancia) * maxRadio;
                    }

                    var pupilas = document.querySelectorAll('.pupila');
                    for (var i = 0; i < pupilas.length; i++) {
                        pupilas[i].style.transform =
                            'translate(-50%, -50%) translate(' + deltaX.toFixed(1) + 'px, ' + deltaY.toFixed(1) + 'px)';
                    }

                    enSeguimiento = false;
                });
            });
        }

        function empezarAHablar() {
            var avatar = document.getElementById('contenedor-avatar');
            if (avatar) avatar.classList.add('agente-hablando');
        }

        function dejarDeHablar() {
            var avatar = document.getElementById('contenedor-avatar');
            if (avatar) avatar.classList.remove('agente-hablando');
        }

        function cambiarEmocion(estado) {
            var avatar = document.getElementById('contenedor-avatar');
            if (!avatar) return;

            var clasesEmocion = [
                'emocion-neutral',
                'emocion-alegre',
                'emocion-triste',
                'emocion-sorprendido'
            ];

            for (var i = 0; i < clasesEmocion.length; i++) {
                avatar.classList.remove(clasesEmocion[i]);
            }

            avatar.classList.add('emocion-' + estado);

            var pupilas = document.querySelectorAll('.pupila');
            for (var k = 0; k < pupilas.length; k++) {
                pupilas[k].style.transform = '';
            }

            var botones = document.querySelectorAll('.botones-prueba button');
            for (var j = 0; j < botones.length; j++) {
                botones[j].classList.remove('activo');
                if (botones[j].getAttribute('data-emocion') === estado) {
                    botones[j].classList.add('activo');
                }
            }
        }


        function detectarEmocionTexto(texto) {
            const textoMin = texto.toLowerCase();

            // 1. Detectar alegría
            const palabrasAlegres = ['alegría', 'feliz', 'felicidad', 'maravilloso', 'increíble', 'celebra', 'logro', 'orgullo', 'bello', 'hermoso', 'lindo', 'fantástico', 'excelente', 'especial', 'me alegra', 'gusto', 'encanta'];
            if (palabrasAlegres.some(p => textoMin.includes(p))) return 'alegre';

            // 2. Detectar tristeza o empatía profunda
            const palabrasTristes = ['triste', 'tristeza', 'extraño', 'extrañar', 'llorar', 'lloré', 'perdí', 'perdiste', 'partió', 'murió', 'falleci', 'duelo', 'dolor', 'difícil', 'lamento', 'pena', 'lo siento', 'soledad', 'nostalgia'];
            if (palabrasTristes.some(p => textoMin.includes(p))) return 'triste';

            // 3. Detectar sorpresa o asombro
            const palabrasSorpresa = ['sorpresa', 'sorprendente', 'guau', 'wow', 'no me lo esperaba', 'asombroso', 'curioso', 'inesperado', 'de verdad', 'en serio', 'vaya'];
            if (palabrasSorpresa.some(p => textoMin.includes(p))) return 'sorprendido';

            // 4. Si no encuentra ninguna palabra clave fuerte, se mantiene neutral
            return 'neutral';
        }
    }
);
