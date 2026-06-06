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

    function enviarPrimerMensajeAgente() {
        var saludo = "Hola " + nombreUsuario + ", ¡bienvenido/a! Me alegra estar aquí para acompañarle " +
            "en su historia de vida. Cuénteme, " + nombreUsuario + ", ¿hay algún momento especial " +
            "o significativo que le gustaría recordar hoy?";
        agregarMensajeAlChat("agente", saludo);

        bufferMensajes.push({
            role: "assistant",
            content: saludo
        });
    }

    async function obtenerRespuestaDelAgente(mensajeUsuario, historial) {
        estadoSistema.textContent = "Procesando tu respuesta...";
        estadoSistema.className = "estado-sistema procesando";

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
                });

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
