# Agente Social Interactivo - Reminiscencia Guiada (Grupo 1)

Este proyecto es un Agente Social Interactivo (SIA) diseñado específicamente para adultos mayores (65+ años). Su objetivo principal es brindar acompañamiento a través de la reminiscencia guiada, ayudando a reconstruir y narrar momentos significativos de su historia de vida.

El proyecto consiste en una aplicación web autocontenida desarrollada con HTML, CSS y JavaScript puro, sin necesidad de frameworks ni backend[cite: 1, 11, 12]. 

## Instrucciones Generales de Ejecución

Al ser un proyecto autocontenido, no requiere la instalación de dependencias adicionales (como Node.js o Python)[cite: 1, 12]. Para ejecutar el agente:

1. Clona o descarga este repositorio en tu computadora.
2. Abre el archivo `index.html` directamente en tu navegador (Se recomienda Google Chrome o Microsoft Edge para compatibilidad total con la Web Speech API)[cite: 1, 26].
3. Otorgar permisos de micrófono cuando el navegador lo solicite para permitir la interacción por voz.

## 🔑 Configuración de la API Key (LLM)

El agente utiliza inteligencia artificial generativa para procesar la conversación en tiempo real. Para que funcione correctamente, debes configurar tu propia API Key.

**Paso a paso:**
1. Genera una API Key válida en la plataforma correspondiente (Groq o Google Gemini).
2. Abre la aplicación en el navegador (`index.html`).
3. En la pantalla inicial (pantalla de bienvenida y ética), encontrarás un campo de texto designado para la "API Key".
4. Pega tu clave de forma segura en ese campo y presiona el botón de "Iniciar Conversación".
*(Nota de seguridad: La clave solo se almacena temporalmente en la memoria del navegador durante la sesión y nunca se envía a servidores de terceros que no sean el endpoint oficial del LLM).*