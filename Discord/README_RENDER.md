# 🤖 Zimoxy Discord Bot — Despliegue en Render (24/7)

Esta carpeta contiene todo lo necesario para subir y mantener tu bot de Discord activo 24/7 en [Render.com](https://render.com).

---

## 🚀 Pasos para desplegar en Render

### Paso 1: Subir la carpeta `Discord` a GitHub
1. Sube esta carpeta a tu repositorio de GitHub (o un repo nuevo como `ZimoxyNetwork/discord-bot`).

### Paso 2: Crear el servicio en Render
1. Entra a tu cuenta en [dashboard.render.com](https://dashboard.render.com).
2. Haz clic en **"New +"** (arriba a la derecha) y selecciona **"Web Service"** (¡es 100% gratis!).
3. Conecta tu repositorio de GitHub donde subiste el bot.
4. Completa la configuración básica:
   * **Name:** `zimoxy-discord-bot`
   * **Region:** La más cercana (ej: Oregon o Frankfurt)
   * **Branch:** `main` (o `master`)
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
   * **Instance Type:** `Free`

### Paso 3: Configurar las Variables de Entorno
1. En la misma pantalla o en la pestaña **Environment**, haz clic en **"Add Environment Variable"** o **"Add from .env"**.
2. Abre el archivo [`VARIABLES_RENDER.txt`](VARIABLES_RENDER.txt) y copia y pega todas las variables.
3. Haz clic en **Create Web Service** (o **Save Changes**).

---

## ⚡ ¿Cómo se mantiene activo 24/7 en el plan gratuito?

El bot incluye un **servidor HTTP de monitoreo ligero** en el puerto `10000` (definido en `process.env.PORT`). 

Render detectará este puerto automáticamente y marcará el servicio como **"Healthy"** (saludable).

Para evitar que el plan gratuito de Render se suspenda por inactividad tras 15 minutos:
1. Copia la URL pública que Render le asigna a tu servicio (ej: `https://zimoxy-discord-bot.onrender.com`).
2. Entra a un servicio gratuito de ping como [cron-job.org](https://cron-job.org) o [uptimerobot.com](https://uptimerobot.com).
3. Configura un ping HTTP cada **10 minutos** a esa URL.
4. ¡Tu bot se mantendrá **activo 24/7 sin apagarse nunca**!

---

## 📋 Comandos incluidos en el Bot

* `/verificar` — Vincula la cuenta de Discord con Minecraft Zimoxy.
* `/zimoxyai` — Responde preguntas usando la IA oficial de Google Gemini.
* `/servidor` — Muestra el estado en vivo de los servidores de Zimoxy.
* `/perfil` — Consulta estadísticas, saldo y rango de un jugador.
* `/skin` — Muestra la skin actual del jugador.
* `/rango` — Consulta el rango en el servidor.
* `/ayuda` — Muestra todos los comandos disponibles.
* `/setup-canales` — [ADMIN] Publica los mensajes oficiales en los canales configurados.
