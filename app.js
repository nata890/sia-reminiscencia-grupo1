// ========================================
// CONFIGURACIÓN GENERAL
// ========================================

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const API_KEY_INTEGRADA = "";
let apiKeyActual = API_KEY_INTEGRADA;

const LIMITE_BUFFER = 6;
let resumenHistorico = "";
let bufferMensajes = [];
let nombreUsuario = "Don/Doña";

const promptSistema = {
    role: "system",
    content: "Eres un agente social interactivo para adultos mayores (65+ años). Tu objetivo es hacer reminiscencia guiada ayudando a la persona a reconstruir y narrar momentos significativos de su historia de vida. Sé paciente, respetuoso y utiliza un tono cálido y empático. Haz preguntas abiertas sobre momentos especiales: infancia, familia, logros, viajes, amigos. Escucha con atención y ayuda a la persona a recordar detalles y emociones. Usa frases cortas y simples. Si la persona se siente triste o abrumada, ofrece apoyo emocional."
};

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

        // Inyectar el nombre en el prompt del sistema
        promptSistema.content = "Eres un agente social interactivo para adultos mayores (65+ años). " +
            "Tu objetivo es hacer reminiscencia guiada ayudando a la persona a reconstruir y narrar " +
            "momentos significativos de su historia de vida. Sé paciente, respetuoso y utiliza un tono " +
            "cálido y empático. Haz preguntas abiertas sobre momentos especiales: infancia, familia, " +
            "logros, viajes, amigos. Escucha con atención y ayuda a la persona a recordar detalles y " +
            "emociones. Usa frases cortas y simples. Si la persona se siente triste o abrumada, ofrece " +
            "apoyo emocional. DEBES llamar al usuario por su nombre («" + nombreUsuario + "») " +
            "en cada saludo o referencia directa.";

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

                await procesarStreamingDatos(respuesta.reader, respuesta.decoder, (fragmento) => {
                    parrafo.textContent = fragmento;
                    areaConversacion.scrollTop = areaConversacion.scrollHeight;
                    if (subtitulosAgente) {
                        subtitulosAgente.textContent = fragmento;
                        subtitulosAgente.scrollTop = subtitulosAgente.scrollHeight;
                    }
                });

                hablarTexto(parrafo.textContent);

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
