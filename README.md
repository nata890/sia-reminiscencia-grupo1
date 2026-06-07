# Agente Social Interactivo - Reminiscencia Guiada (Grupo 1)

Este proyecto es un Agente Social Interactivo (SIA) diseñado específicamente para adultos mayores (65+ años). Su objetivo principal es brindar acompañamiento a través de la reminiscencia guiada, ayudando a reconstruir y narrar momentos significativos de su historia de vida.

El proyecto consiste en una aplicación web autocontenida desarrollada con **HTML, CSS y JavaScript puro**, sin necesidad de frameworks ni backend.

---

## 📋 Instrucciones Generales de Ejecución

### Requisitos previos
- Un navegador web moderno: **Google Chrome** o **Microsoft Edge** (recomendado para máxima compatibilidad)
- Una API Key válida de **Groq** (https://console.groq.com)
- Conexión a Internet (necesaria para el LLM y para la síntesis de voz con ResponsiveVoice)

### Pasos para ejecutar:

1. **Descarga o clona este repositorio** en tu computadora.

2. **Abre el archivo `index.html`** directamente en tu navegador:
   - Haz clic derecho en el archivo → Abrir con → Selecciona tu navegador
   - O arrastra el archivo a una ventana del navegador

3. **Verifica que es seguro:**
   - Si el navegador te pregunta si confías en este archivo, elige "Sí"
   - La aplicación funciona completamente localmente en tu navegador

4. **Lee la pantalla de ética y privacidad** con atención

5. **Ingresa tu API Key** en el campo correspondiente

6. **Acepta los términos** y haz clic en "Iniciar Conversación"

7. **Comienza a conversar:** Puedes escribir tus respuestas o usar el botón de micrófono para hablar

---

## 🔑 Configuración de la API Key (Integrada en el código)

### Para los desarrolladores (Rol 1)

La API Key debe ser configurada **una sola vez** por el equipo de desarrollo en el archivo `app.js`:

```javascript
// En app.js, línea 11:
const API_KEY_INTEGRADA = "tu_api_key_aqui"; // CAMBIAR POR LA CLAVE REAL
```

**Pasos para configurar:**

1. **Obtén una API Key de Groq:**
   - Ve a **https://console.groq.com**
   - Crea una cuenta o inicia sesión
   - En el panel de control, busca **"API Keys"**
   - Copia la clave (comienza con `gsk_`)

2. **O usa Google Gemini:**
   - Ve a **https://makersuite.google.com/app/apikey**
   - Inicia sesión con Google
   - Copia la clave generada

3. **Inserta la clave en `app.js`:**
   ```javascript
   const API_KEY_INTEGRADA = "ejemplo";
   ```

4. **Guarda el archivo** y despliega la aplicación

### Para el adulto mayor (Usuario final)

✅ **La API Key está integrada.** El adulto mayor:
1. Abre la aplicación en su navegador
2. Lee la pantalla de ética y privacidad
3. **Acepta los términos** con un click
4. ¡Listo! Comienza la conversación

**No necesita hacer nada técnico.** Todo es automático.

---

## 🎯 Cómo usar la aplicación

### Pantalla de bienvenida (Ética)
1. **Lee la información importante** sobre qué es esta aplicación
2. **Entiende que es un agente de IA**, no un profesional de la salud
3. **Acepta los términos** con un simple click (checkbox)
4. **Presiona "Iniciar Conversación"** y ¡listo!

### Pantalla de conversación
1. **El agente te hará preguntas** sobre momentos especiales de tu vida
2. **Puedes responder de dos formas:**
   - Escribiendo en el campo de texto
   - Hablando al micrófono (presiona el botón 🎤 Hablar)
3. **El agente escuchará** y responderá con empatía y calidez
4. **Puedes pausar en cualquier momento** con el botón ⏸ Pausa
5. **Cuando termines,** haz clic en "Cerrar Sesión"

### Temas que puedes conversar
- Tus recuerdos más bonitos de la infancia
- Momentos importantes con familia
- Viajes o lugares especiales que visitaste
- Logros de los que estás orgulloso
- Amigos entrañables
- Hobbies o pasiones de tu vida

---

## ♿ Características de Accesibilidad

Esta aplicación ha sido diseñada **pensando especialmente en adultos mayores**:

### Visual
- **Tipografía gigante** (muy fácil de leer)
- **Alto contraste** (blanco y negro para claridad máxima)
- **Botones grandes** (cómodos de presionar)
- **Espaciado generoso** (no está abarrotado)

### Interacción
- **Entrada por texto o voz** (elige la que prefieras)
- **Respuestas pausables** (controla el ritmo)
- **Instrucciones claras** (sin tecnicismos)
- **Navegación simple** (no hay menús complejos)

### Seguridad
- **Sin rastreo** (tu privacidad está protegida)
- **Sin publicidades** (interfaz limpia)
- **Sin cookies de terceros** (funciona localmente)
- **Datos seguros** (no se guardan permanentemente)

---

## 🔧 Requisitos técnicos

- HTML5 / CSS3 / JavaScript ES6+ (sin frameworks)
- Sin necesidad de Node.js, npm o Python
- Conexión a Internet para el LLM (Groq) y para la voz (ResponsiveVoice CDN)

---

## 🎙️ Sistema de voz

La aplicación usa **dos capas de voz** complementarias:

### Síntesis de voz (TTS — el agente habla)
- **Principal:** [ResponsiveVoice.js](https://responsivevoice.org/) — voz **"Spanish Latin American Male"**, cálida y con acento latinoamericano neutro. Adecuada para el avatar y para adultos mayores colombianos.
- **Fallback automático:** Si no hay conexión o ResponsiveVoice falla, se usa la Web Speech API nativa del navegador con `lang: es-CO`.
- **Velocidad adaptativa:** la voz ajusta su ritmo y tono automáticamente según el contenido emocional del texto:
  - Tristeza / duelo → más lento y suave (`rate 0.72`)
  - Confusión / olvido → pausado y claro (`rate 0.75`)
  - Nostalgia → cálido y pausado (`rate 0.80`)
  - Tono por defecto → respetuoso (`rate 0.85`)
  - Alegría / celebración → un poco más vivo (`rate 0.92`)

### Reconocimiento de voz (STT — el usuario habla)
- Usa la **Web Speech API** del navegador (compatible con Chrome y Edge).
- Modo continuo: no se corta por pausas largas (pensado para el ritmo de adultos mayores).
- **Detección automática de fin de habla:** si el usuario hace silencio por 3 segundos, el mensaje se envía directamente al agente sin necesidad de presionar "Enviar".
- El botón cambia a **🛑 Parar grabación** mientras escucha, y vuelve a **🎤 Hablar** al terminar.

### Controles de audio
- **⏸ Pausa / ▶ Reanudar:** detiene y reanuda la voz del agente en cualquier momento.
- Activar el micrófono cancela automáticamente la voz del agente para evitar interferencias.
- Los botones de respuesta rápida también cancelan la voz antes de enviar.

---

## 📝 Estructura del proyecto

```
sia-reminiscencia-grupo1/
├── index.html           # Interfaz completa (HTML + estructura)
├── style.css            # Estilos accesibles para adultos mayores
├── app.js               # Lógica de la aplicación y memoria
├── README.md            # Este archivo
└── .git/                # Control de versiones
```

---

## 👥 Roles y responsabilidades del grupo

### Rol 1: Inferencia y estrategia de memoria
- Conexión al LLM con Groq/Gemini
- Streaming de texto en tiempo real
- Lógica de historial y memoria híbrida
- Sección de arquitectura técnica en el informe

### Rol 2: Interfaz y accesibilidad
- Maquetación HTML/CSS puro
- Diseño accesible para adultos mayores
- Pantalla de ética e IA
- Despliegue en GitHub Pages
- Justificación de decisiones en el informe

### Rol 3: Interacción por voz y flujos conversacionales
- Reconocimiento de voz continuo con Web Speech API (`es-CO`)
- Síntesis de voz con ResponsiveVoice.js (voz latinoamericana cálida) + fallback nativo
- Velocidad adaptativa según emoción detectada en el texto del agente
- Detección automática de fin de habla (pausa de 3 s → auto-envío)
- Botones de respuesta rápida con envío directo al agente
- Botón ⏸ Pausa / ▶ Reanudar compatible con ambas APIs de voz

### Rol 4: Identidad visual y diseño emocional
- Avatar CSS animado con 4 estados emocionales (neutral, alegre, triste, sorprendido)
- Sincronización de emociones con el contenido del agente
- Animaciones de parpadeo, movimiento de pupilas y seguimiento del mouse

### Rol 5: Prompt engineering y personalidad
- Prompt del sistema con personalidad cálida y empática
- Lenguaje adaptado al contexto colombiano ("Don", "Doña")
- Estrategias de continuidad relacional y construcción de vínculo

---

## ✅ Estado del proyecto

- [x] Interfaz accesible para adultos mayores
- [x] Conexión al LLM (Groq) con streaming en tiempo real
- [x] Memoria híbrida (buffer + resumen automático)
- [x] Reconocimiento de voz continuo con auto-envío
- [x] Síntesis de voz con ResponsiveVoice (voz latinoamericana cálida)
- [x] Capacidad adaptativa de ritmo y tono
- [x] Botones de respuesta rápida
- [x] Avatar con 4 estados emocionales
- [ ] Despliegue en GitHub Pages
- [ ] Documentación de arquitectura con diagramas (informe)

---

## 📧 Contacto y soporte

**Grupo 1 - Agentes Inteligentes**
- Programa: Ingeniería en Sistemas / Informática
- Semestre: 9°
- Asignatura: Agentes Inteligentes 1
- Institución: [Tu Universidad]

---

## 📄 Licencia

Este proyecto es de código abierto y puede ser utilizado con fines educativos.

---

**¡Gracias por usar nuestra aplicación!** Esperamos que sea una experiencia grata y significativa de reminiscencia guiada.