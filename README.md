# Agente Social Interactivo - Reminiscencia Guiada (Grupo 1)

Este proyecto es un Agente Social Interactivo (SIA) diseñado específicamente para adultos mayores (65+ años). Su objetivo principal es brindar acompañamiento a través de la reminiscencia guiada, ayudando a reconstruir y narrar momentos significativos de su historia de vida.

El proyecto consiste en una aplicación web autocontenida desarrollada con **HTML, CSS y JavaScript puro**, sin necesidad de frameworks ni backend.

---

## 📋 Instrucciones Generales de Ejecución

### Requisitos previos
- Un navegador web moderno: **Google Chrome** o **Microsoft Edge** (recomendado para máxima compatibilidad)
- Una API Key válida de:
  - **Groq** (https://console.groq.com)
  - **Google Gemini** (https://makersuite.google.com/app/apikey)
- Conexión a Internet

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

- HTML5
- CSS3
- JavaScript ES6+
- Sin necesidad de Node.js, npm o Python
- Funciona offline después de cargar (excepto para las llamadas a la API de IA)

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

### Rol 3: Procesamiento de voz (futuro)
- Reconocimiento de voz (Web Speech API)
- Síntesis de voz (TTS)
- Pausas y controles de audio

### Rol 4: Persistencia y datos (futuro)
- Almacenamiento de sesiones
- Exportación de conversaciones
- Base de datos local

### Rol 5: Prompt engineering y personalidad (futuro)
- Diseño final del system prompt
- Personalidad y tono del agente
- Validación de respuestas empáticas

---

## 🚀 Próximos pasos

- [ ] Integración de Web Speech API para entrada/salida de voz
- [ ] Persistencia de sesiones con IndexedDB
- [ ] Exportación de conversaciones en PDF
- [ ] Validación de respuestas empáticas
- [ ] Pruebas con adultos mayores reales
- [ ] Despliegue en GitHub Pages
- [ ] Documentación de arquitectura con diagramas

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