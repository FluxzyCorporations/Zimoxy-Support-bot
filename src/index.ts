import {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActivityType,
  Interaction,
  GuildMember,
  TextChannel,
  ChannelType,
  Colors,
} from "discord.js";
import dotenv from "dotenv";
import { supabase } from "./supabase.js";

dotenv.config();

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// ==================================
// CONSTANTES DE MARCA ZIMOXY
// ==================================
const ZIMOXY_BLUE = 0x4374ff;
const ZIMOXY_GREEN = 0x38ef7d;
const ZIMOXY_RED = 0xff4757;
const DISCORD_BLURPLE = 0x5865f2;
const ZIMOXY_GOLD = 0xffd700;

const SERVER_IP = process.env.MINECRAFT_SERVER_IP || "play.zimoxy.net";
const WEB_URL = process.env.WEB_URL || "https://zimoxyclient.vercel.app";

// Registro en memoria de usuarios que ya recibieron el primer aviso de Zimoxy AI
const aiWarnedUsers = new Set<string>();
async function getChannel(envKey: string): Promise<TextChannel | null> {
  const id = process.env[envKey];
  if (!id) return null;
  try {
    const ch = await client.channels.fetch(id);
    if (ch && ch.type === ChannelType.GuildText) return ch as TextChannel;
  } catch {}
  return null;
}

// Envía un embed a un canal si está configurado en .env
async function postToChannel(envKey: string, payload: Parameters<TextChannel["send"]>[0]) {
  const ch = await getChannel(envKey);
  if (!ch) return false;
  try {
    await ch.send(payload);
    return true;
  } catch (e) {
    console.warn(`[Setup] No se pudo enviar a ${envKey}:`, e);
    return false;
  }
}

// ============================================================
// EMBEDS POR CANAL
// ============================================================

function embedBienvenida(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_BLUE)
    .setTitle("👋 ¡Bienvenido a Zimoxy! / Welcome to Zimoxy!")
    .setDescription(
      `**🇪🇸 Español:**\n¡Hola! Este es el servidor oficial de **Zimoxy**, la plataforma alterna de Minecraft sin conexión a Microsoft. Regístrate en nuestra web y empieza a jugar.\n\n` +
      `**🇺🇸 English:**\nHello! This is the official **Zimoxy** Discord server — an alternative Minecraft platform with zero connection to Microsoft. Register on our website and start playing.`
    )
    .addFields(
      { name: "🌐 Registrarse / Register", value: `[Portal Web](${WEB_URL}/login.es)`, inline: true },
      { name: "🎮 IP del Servidor", value: `\`${SERVER_IP}\``, inline: true },
      { name: "📋 Reglas / Rules", value: "Lee las reglas antes de jugar. / Read the rules before playing.", inline: false },
    )
    .setFooter({ text: "Zimoxy Platform • play.zimoxy.net" })
    .setTimestamp();
  return { embeds: [embed] };
}

function embedVerificacion(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_GREEN)
    .setTitle("🛡️ Verificación de Miembros / Member Verification")
    .setDescription(
      `**🇪🇸 Bienvenido a Zimoxy**\n` +
      `Para ingresar a la comunidad y desbloquear los canales del servidor, haz clic en el botón verde de abajo.\n` +
      `Al verificarte se te removerá el rol temporal de usuario no verificado y podrás acceder al canal de **roles** para elegir tu idioma (Español o English).\n\n` +
      `**🇺🇸 Welcome to Zimoxy**\n` +
      `To enter the community and unlock server channels, click the green button below.\n` +
      `Upon verifying, the unverified role will be removed, allowing you to access the **roles** channel to pick your language (Español or English).`
    )
    .setFooter({ text: "Zimoxy Security • Sistema de Verificación Oficial" })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("btn_verify_member")
      .setLabel("Verificarme / Verify Me")
      .setStyle(ButtonStyle.Success)
      .setEmoji("✅")
  );

  return { embeds: [embed], components: [row] };
}

function embedRoles(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_BLUE)
    .setTitle("🌐 Selecciona tu Idioma / Select your Language")
    .setDescription(
      `Reacciona con la bandera correspondiente a tu idioma para desbloquear los canales dedicados.\n\n` +
      `React with the flag corresponding to your language to unlock dedicated channels.\n\n` +
      `🇪🇸 — **Español** (Desbloquea comunidad en Español)\n` +
      `🇺🇸 — **English** (Unlocks English community)`
    )
    .setFooter({ text: "Zimoxy Platform • Sistema de Roles e Idiomas" });
  return { embeds: [embed] };
}

function embedReglas(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_RED)
    .setTitle("📋 Reglas de la Plataforma Zimoxy")
    .setDescription("Leer y respetar estas reglas es obligatorio para todos los miembros.")
    .addFields(
      { name: "1️⃣ Respeto", value: "Trata a todos con respeto. Cero tolerancia ante insultos, discriminación o acoso.", inline: false },
      { name: "2️⃣ Canal correcto [SANCIÓN DIRECTA]", value: "⚠️ **El usuario que mande mensajes a los canales que no les corresponde será BANEADO inmediatamente del servidor de Discord.** Respeta cada categoría y su temática.", inline: false },
      { name: "3️⃣ Sin spam ni flood", value: "Prohibido el spam de mensajes, invitaciones externas a otros servidores o publicidad.", inline: false },
      { name: "4️⃣ Cero cheats o trampas", value: "El uso de hacks, mods no autorizados o glitches para obtener ventajas resulta en ban de la plataforma.", inline: false },
      { name: "5️⃣ Contenido adecuado", value: "Terminantemente prohibido el contenido NSFW, violento o inapropiado.", inline: false },
      { name: "6️⃣ Una sola cuenta", value: "Zimoxy permite una cuenta por persona. El multi-account resulta en ban permanente.", inline: false },
      { name: "7️⃣ Decisiones de Staff", value: "El criterio del staff es inapelable. Dudas por ticket en /soporte.", inline: false },
    )
    .setFooter({ text: "Zimoxy Platform • Incumplir las reglas acarrea expulsión o ban permanente" })
    .setTimestamp();
  return { embeds: [embed] };
}

function embedRules(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_RED)
    .setTitle("📋 Zimoxy Platform Rules")
    .setDescription("Reading and respecting these rules is mandatory for all members.")
    .addFields(
      { name: "1️⃣ Respect", value: "Treat everyone with respect. Zero tolerance for harassment, hate speech, or abuse.", inline: false },
      { name: "2️⃣ Right channel [STRICT BAN]", value: "⚠️ **Any user sending messages in the wrong channels will be directly BANNED from the Discord server.** Keep discussions strictly on-topic for each channel.", inline: false },
      { name: "3️⃣ No spam", value: "Spamming, external Discord invites, or unsolicited advertising is prohibited.", inline: false },
      { name: "4️⃣ No cheats", value: "Using hacks, exploits or unfair modifications will lead to a permanent platform ban.", inline: false },
      { name: "5️⃣ Appropriate content", value: "NSFW, explicit or harmful content is strictly prohibited across all channels.", inline: false },
      { name: "6️⃣ Single account", value: "Only one account per person is allowed on Zimoxy. Multi-accounting results in a ban.", inline: false },
      { name: "7️⃣ Staff decisions", value: "Staff actions are final. Questions must be directed via /support tickets.", inline: false },
    )
    .setFooter({ text: "Zimoxy Platform • Rule violations result in immediate penalties or permanent bans" })
    .setTimestamp();
  return { embeds: [embed] };
}

function embedGuia(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_GREEN)
    .setTitle("🗺️ Guía de Inicio — Zimoxy Network")
    .setDescription("Sigue estos pasos para comenzar a jugar en Zimoxy Network.")
    .addFields(
      { name: "Paso 1 — Crear tu cuenta", value: `Ve a [${WEB_URL}/login.es](${WEB_URL}/login.es) y regístrate con tu usuario de Minecraft y Discord.`, inline: false },
      { name: "Paso 2 — Verificar tu Discord", value: `Usa el comando \`/verificar <tu_usuario>\` en el canal #verificacion-verify.`, inline: false },
      { name: "Paso 3 — Descargar el Launcher", value: "Descarga el instalador oficial de Zimoxy Client desde la web. Instálalo y ábrelo.", inline: false },
      { name: "Paso 4 — Iniciar sesión", value: "Abre el launcher, inicia sesión con tu usuario y contraseña de Zimoxy.", inline: false },
      { name: "Paso 5 — Conectar al servidor", value: `IP: \`${SERVER_IP}\` | Puerto: \`25565\`\nSelecciona el modo de juego y ¡empieza a jugar!`, inline: false },
      { name: "❓ ¿Problemas?", value: "Usa `/soporte` para abrir un ticket o visita el canal #faq.", inline: false },
    )
    .setFooter({ text: "Zimoxy Network • Sin cuenta de Microsoft requerida" })
    .setTimestamp();
  return { embeds: [embed] };
}

function embedGettingStarted(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_GREEN)
    .setTitle("🗺️ Getting Started — Zimoxy Network")
    .setDescription("Follow these steps to start playing on Zimoxy Network.")
    .addFields(
      { name: "Step 1 — Create your account", value: `Go to [${WEB_URL}/login.en](${WEB_URL}/login.en) and register with your Minecraft username and Discord.`, inline: false },
      { name: "Step 2 — Verify your Discord", value: `Use the command \`/verify <your_username>\` in the #verificacion-verify channel.`, inline: false },
      { name: "Step 3 — Download the Launcher", value: "Download the official Zimoxy Client installer from the website. Install and open it.", inline: false },
      { name: "Step 4 — Log in", value: "Open the launcher, log in with your Zimoxy username and password.", inline: false },
      { name: "Step 5 — Connect to the server", value: `IP: \`${SERVER_IP}\` | Port: \`25565\`\nSelect a game mode and start playing!`, inline: false },
      { name: "❓ Having issues?", value: "Use `/support` to open a ticket or visit the #faq channel.", inline: false },
    )
    .setFooter({ text: "Zimoxy Network • No Microsoft account required" })
    .setTimestamp();
  return { embeds: [embed] };
}

function embedFAQ(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_BLUE)
    .setTitle("❓ FAQ — Preguntas Frecuentes / Frequently Asked Questions")
    .addFields(
      { name: "🇪🇸 ¿Necesito cuenta de Microsoft?", value: "**No.** Zimoxy tiene su propio sistema de autenticación. Solo necesitas registrarte en nuestra web.", inline: false },
      { name: "🇺🇸 Do I need a Microsoft account?", value: "**No.** Zimoxy has its own authentication system. Just register on our website.", inline: false },
      { name: "🇪🇸 ¿Cómo cambio mi skin?", value: `Inicia sesión en la web → Ve a tu perfil → Sube tu skin en Jugador → Skins.`, inline: false },
      { name: "🇺🇸 How do I change my skin?", value: `Log in on the web → Go to your profile → Upload your skin in Player → Skins.`, inline: false },
      { name: "🇪🇸 ¿El launcher es de pago?", value: "**No.** El Zimoxy Client es completamente gratuito para todos los miembros registrados.", inline: false },
      { name: "🇺🇸 Is the launcher paid?", value: "**No.** Zimoxy Client is completely free for all registered members.", inline: false },
      { name: "🇪🇸 ¿Cómo abro un ticket de soporte?", value: "Usa `/soporte` en el canal #comandos-bot o escribe en #open-ticket.", inline: false },
      { name: "🇺🇸 How do I open a support ticket?", value: "Use `/support` in #bot-commands or write in #open-ticket.", inline: false },
    )
    .setFooter({ text: "Zimoxy Network • Para más ayuda usa /soporte o /support" })
    .setTimestamp();
  return { embeds: [embed] };
}

function embedRangos(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_GOLD)
    .setTitle("🏅 Rangos de Zimoxy Network / Zimoxy Network Ranks")
    .setDescription("Estos son los rangos disponibles en el ecosistema Zimoxy. Los rangos premium otorgan beneficios exclusivos.\n\nThese are the available ranks in the Zimoxy ecosystem. Premium ranks grant exclusive benefits.")
    .addFields(
      { name: "⬜ PLAYER", value: "Rango gratuito para todos los jugadores registrados. / Free rank for all registered players.", inline: false },
      { name: "🟦 VIP", value: "Acceso a skins y capas exclusivas, prefijo especial en el servidor. / Access to exclusive skins and capes, special prefix on the server.", inline: false },
      { name: "🟪 MVP", value: "Todo lo de VIP + partículas exclusivas, kit especial y prioridad de acceso. / All VIP perks + exclusive particles, special kit and access priority.", inline: false },
      { name: "🟥 STAFF", value: "Miembros del equipo de Zimoxy. Solo por invitación. / Zimoxy team members. By invitation only.", inline: false },
      { name: "🟨 ADMIN", value: "Administradores de la red. Control total del ecosistema. / Network administrators. Full control of the ecosystem.", inline: false },
      { name: "💰 ¿Cómo obtener rangos?", value: `Visita la tienda en [${WEB_URL}](${WEB_URL}) o escribe al staff. / Visit the store at [${WEB_URL}](${WEB_URL}) or contact staff.`, inline: false },
    )
    .setFooter({ text: "Zimoxy Network • Sistema de Rangos" })
    .setTimestamp();
  return { embeds: [embed] };
}

function embedStore(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_GOLD)
    .setTitle("🛒 Tienda Zimoxy / Zimoxy Store")
    .setDescription("Consigue rangos, cosméticos y paquetes exclusivos para mejorar tu experiencia.\n\nGet ranks, cosmetics and exclusive packages to enhance your experience.")
    .addFields(
      { name: "🟦 Rango VIP / VIP Rank", value: "Skins y capas exclusivas + prefijo en servidor.\nExclusive skins & capes + server prefix.", inline: true },
      { name: "🟪 Rango MVP / MVP Rank", value: "Todo VIP + partículas + kit + prioridad.\nAll VIP + particles + kit + priority.", inline: true },
      { name: "🎨 Pack Cosmético / Cosmetic Pack", value: "Skins y capas premium descargables.\nPremium downloadable skins & capes.", inline: true },
      { name: "💰 Moneda: Z-Coins", value: "La moneda oficial de Zimoxy para comprar en la tienda y apostar en minijuegos.\nThe official Zimoxy currency for the store and minigames.", inline: false },
      { name: "🌐 Comprar / Buy", value: `[Abrir Tienda / Open Store](${WEB_URL})`, inline: false },
    )
    .setFooter({ text: "Zimoxy Network • Todos los pagos son seguros" })
    .setTimestamp();
  return { embeds: [embed] };
}

function embedEstadoServidores(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_GREEN)
    .setTitle("📡 Estado de Servidores — Zimoxy Network")
    .setDescription("Estado en tiempo real de la red de servidores Zimoxy.")
    .addFields(
      { name: "🟢 Survival Privado 1.21", value: `\`${SERVER_IP}\` • Puerto \`25565\`\nModo Survival Vanilla modificado.`, inline: true },
      { name: "🟢 PVP / Anarchy", value: `\`anarchy.zimoxy.net\`\nSin reglas, PVP libre 24/7.`, inline: true },
      { name: "🟢 SkyBlock Custom", value: `\`sky.zimoxy.net\`\nSkyBlock personalizado con economía propia.`, inline: true },
      { name: "🔧 Versión", value: "Minecraft Java 1.21.x", inline: true },
      { name: "🔐 Autenticación", value: "Propia (sin Microsoft)", inline: true },
      { name: "📊 Usa /servidor", value: "Para ver el estado actualizado en cualquier momento.", inline: false },
    )
    .setFooter({ text: "Zimoxy Network • Actualizado automáticamente" })
    .setTimestamp();
  return { embeds: [embed] };
}

function embedServerStatus(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_GREEN)
    .setTitle("📡 Server Status — Zimoxy Network")
    .setDescription("Real-time status of the Zimoxy server network.")
    .addFields(
      { name: "🟢 Private Survival 1.21", value: `\`${SERVER_IP}\` • Port \`25565\`\nModded Vanilla Survival mode.`, inline: true },
      { name: "🟢 PVP / Anarchy", value: `\`anarchy.zimoxy.net\`\nNo rules, free PVP 24/7.`, inline: true },
      { name: "🟢 Custom SkyBlock", value: `\`sky.zimoxy.net\`\nCustom SkyBlock with its own economy.`, inline: true },
      { name: "🔧 Version", value: "Minecraft Java 1.21.x", inline: true },
      { name: "🔐 Authentication", value: "Own system (no Microsoft)", inline: true },
      { name: "📊 Use /server", value: "To see the updated status at any time.", inline: false },
    )
    .setFooter({ text: "Zimoxy Network • Auto-updated" })
    .setTimestamp();
  return { embeds: [embed] };
}

// ============================================================
// COMANDO /setup-canales — envía todos los embeds
// ============================================================
async function runSetupCanales(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.user.id !== ADMIN_ID) {
    await interaction.reply({ content: "❌ Solo el administrador de Zimoxy puede usar este comando.", flags: 64 });
    return;
  }

  await interaction.deferReply({ flags: 64 });

  const tasks: Array<{ key: string; label: string; payload: Parameters<TextChannel["send"]>[0] }> = [
    { key: "CHANNEL_BIENVENIDA",        label: "#bienvenida-welcome",   payload: embedBienvenida() },
    { key: "CHANNEL_VERIFICACION",      label: "#verificacion-verify",  payload: embedVerificacion() },
    { key: "CHANNEL_ROLES",             label: "#roles",                payload: embedRoles() },
    { key: "CHANNEL_REGLAS",            label: "#reglas",               payload: embedReglas() },
    { key: "CHANNEL_RULES",             label: "#rules",                payload: embedRules() },
    { key: "CHANNEL_GUIA",              label: "#guia-inicio",          payload: embedGuia() },
    { key: "CHANNEL_GETTING_STARTED",   label: "#getting-started",      payload: embedGettingStarted() },
    { key: "CHANNEL_FAQ",               label: "#faq",                  payload: embedFAQ() },
    { key: "CHANNEL_RANKS",             label: "#ranks-rangos",         payload: embedRangos() },
    { key: "CHANNEL_STORE",             label: "#store-tienda",         payload: embedStore() },
    { key: "CHANNEL_ESTADO_SERVIDORES", label: "#estado-servidores",    payload: embedEstadoServidores() },
    { key: "CHANNEL_SERVER_STATUS",     label: "#server-status",        payload: embedServerStatus() },
  ];

  const results: string[] = [];
  for (const task of tasks) {
    const ok = await postToChannel(task.key, task.payload);
    results.push(`${ok ? "✅" : "⚠️"} ${task.label}${ok ? "" : " *(sin ID configurado)*"}`);
  }

  const summaryEmbed = new EmbedBuilder()
    .setColor(ZIMOXY_GREEN)
    .setTitle("🔧 Setup de Canales Completado")
    .setDescription(results.join("\n"))
    .setFooter({ text: "Zimoxy-Support • /setup-canales" })
    .setTimestamp();

  await interaction.editReply({ embeds: [summaryEmbed] });
}

// =====================================================
// FUNCIÓN: Buscar canal "Registros" en todos los guilds
// =====================================================
export async function getRegistrosChannel(): Promise<TextChannel | null> {
  const channelId = process.env.CHANNEL_REGISTROS || process.env.DISCORD_REGISTROS_CHANNEL_ID;
  if (channelId) {
    try {
      const ch = await client.channels.fetch(channelId);
      if (ch && ch.type === ChannelType.GuildText) return ch as TextChannel;
    } catch {}
  }
  // Fallback: buscar por nombre en todos los guilds
  for (const [, guild] of client.guilds.cache) {
    const channel = guild.channels.cache.find(
      (c) => (c.name.includes("registros") || c.name.includes("registro")) && c.type === ChannelType.GuildText
    );
    if (channel) return channel as TextChannel;
  }
  return null;
}

// =====================================================
// FUNCIÓN EXPORTABLE: Publicar nuevo registro de usuario
// =====================================================
export async function publishNewRegistration({
  username,
  discordId,
  discordUsername,
  discordGlobalName,
  discordAvatar,
  minecraftUUID,
}: {
  username: string;
  discordId: string;
  discordUsername: string;
  discordGlobalName: string;
  discordAvatar: string | null;
  minecraftUUID: string;
}) {
  const channel = await getRegistrosChannel();
  if (!channel) {
    console.log("[Registros] Canal 'registros' no encontrado en ningún servidor.");
    return;
  }

  const avatarUrl = discordAvatar
    ? `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.png?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordId) % 6}.png`;

  const registroEmbed = new EmbedBuilder()
    .setColor(ZIMOXY_GREEN)
    .setTitle("🎮 ¡Nuevo Jugador se ha Unido a Zimoxy!")
    .setDescription(
      `Un nuevo usuario ha creado su cuenta en la plataforma **Zimoxy**.\n¡Bienvenido a la plataforma alterna de Minecraft sin conexión a Microsoft!`
    )
    .setThumbnail(avatarUrl)
    .addFields(
      {
        name: "🧑‍💻 Jugador de Minecraft",
        value: `\`${username}\``,
        inline: true,
      },
      {
        name: "⭐ Nivel",
        value: `\`0\` *(Recién llegado)*`,
        inline: true,
      },
      {
        name: "🏅 Rango",
        value: `PLAYER`,
        inline: true,
      },
      {
        name: "🔵 Discord",
        value: `<@${discordId}>\n\`@${discordUsername}\`\n**${discordGlobalName}**`,
        inline: true,
      },
      {
        name: "🎲 UUID de Minecraft",
        value: `\`\`\`${minecraftUUID}\`\`\``,
        inline: false,
      }
    )
    .setImage(
      `https://mc-heads.net/banner/${username}`
    )
    .setFooter({
      text: "Zimoxy Ecosystem • Regístrate en play.zimoxy.net",
      iconURL: avatarUrl,
    })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("Ver en Zimoxy Web")
      .setStyle(ButtonStyle.Link)
      .setURL(`${WEB_URL}`)
      .setEmoji("🌐"),
    new ButtonBuilder()
      .setLabel("Conectar al Servidor")
      .setStyle(ButtonStyle.Link)
      .setURL(`https://minecraft.wiki`)
      .setEmoji("🎮")
  );

  await channel.send({ embeds: [registroEmbed], components: [row] });
}

// ==================================
// HELPERS: DM al admin
// ==================================
const ADMIN_ID = process.env.ADMIN_DISCORD_ID || "";

async function sendAdminDM(content: string) {
  if (!ADMIN_ID) return;
  try {
    const user = await client.users.fetch(ADMIN_ID);
    await user.send(content);
  } catch (err) {
    console.warn("[DM Admin] No se pudo enviar DM:", err);
  }
}

function setOnlinePresence() {
  client.user?.setPresence({
    activities: [
      {
        name: `${SERVER_IP} | /ayuda`,
        type: ActivityType.Playing,
      },
    ],
    status: "online",
  });
}

// ==================================
// EVENT: Bot listo y en línea
// ==================================
client.on("clientReady", async (c) => {
  console.log(`🤖 Zimoxy-Support está en línea como ${c.user.tag}!`);

  // Forzar presencia online
  setOnlinePresence();

  // Listar guilds conectados
  for (const [, guild] of c.guilds.cache) {
    console.log(`  ✅ Conectado al servidor: ${guild.name} (${guild.memberCount} miembros)`);
  }

  // DM de inicio al admin
  const startTime = new Date().toLocaleString("es-ES", { timeZone: "America/Caracas" });
  await sendAdminDM(
    `🟢 **Zimoxy-Support está en línea**\n` +
    `> Bot: \`${c.user.tag}\`\n` +
    `> Hora: \`${startTime}\`\n` +
    `> Servidores: \`${c.guilds.cache.size}\`\n` +
    `> Estado: **ACTIVO** ✅`
  );

  // Refrescar presencia cada 30 min (Discord a veces la resetea)
  setInterval(() => {
    setOnlinePresence();
  }, 30 * 60 * 1000);
});

// ==================================
// SHUTDOWN: DM cuando el bot se apaga
// ==================================
async function handleShutdown(signal: string) {
  console.log(`\n[Shutdown] Señal recibida: ${signal}`);
  const stopTime = new Date().toLocaleString("es-ES", { timeZone: "America/Caracas" });

  try {
    await sendAdminDM(
      `🔴 **Zimoxy-Support se ha desconectado**\n` +
      `> Señal: \`${signal}\`\n` +
      `> Hora: \`${stopTime}\`\n` +
      `> Estado: **OFFLINE** ❌\n` +
      `> *(Reinicia el bot para volver a ponerlo en línea)*`
    );
  } catch {}

  client.destroy();
  process.exit(0);
}

process.on("SIGINT",  () => handleShutdown("SIGINT (Ctrl+C)"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("unhandledRejection", (err: any) => {
  console.warn("[Advertencia No Capturada]:", err?.message || err);
});
process.on("uncaughtException", async (err: any) => {
  console.error("[Error Fatal]:", err);
  if (err?.code === 10062) return; // Ignorar interacciones expiradas
  const stopTime = new Date().toLocaleString("es-ES", { timeZone: "America/Caracas" });
  try {
    await sendAdminDM(
      `⚠️ **Zimoxy-Support cayó por error inesperado**\n` +
      `> Error: \`${err.message}\`\n` +
      `> Hora: \`${stopTime}\`\n` +
      `> Estado: **CAÍDO** 💥`
    );
  } catch {}
});

// ==================================
// EVENT: Nuevo miembro en el servidor
// ==================================
client.on("guildMemberAdd", async (member: GuildMember) => {
  try {
    // 1. Asignar prefijo '[ZY] ' al apodo / nombre visible (nickname)
    try {
      const baseName = member.displayName || member.user.username;
      if (!baseName.startsWith("[ZY] ")) {
        // Discord tiene un límite de 32 caracteres para nicknames
        const newNickname = `[ZY] ${baseName}`.slice(0, 32);
        await member.setNickname(newNickname);
        console.log(`[Nickname] Nombre visible actualizado a: ${newNickname}`);
      }
    } catch (nickErr: any) {
      console.warn(`[Nickname] No se pudo cambiar el apodo de ${member.user.tag}:`, nickErr.message);
    }

    // 2. Asignar rol no verificado si está configurado
    const unverifiedRoleId = process.env.ROLE_NO_VERIFICADO;
    if (unverifiedRoleId) {
      try {
        await member.roles.add(unverifiedRoleId);
        console.log(`[AutoRole] Rol no verificado asignado a ${member.user.tag}`);
      } catch (err: any) {
        console.warn(`[AutoRole] Error asignando rol no verificado:`, err.message);
      }
    }

    const guild = member.guild;
    const welcomeEmbed = new EmbedBuilder()
      .setColor(ZIMOXY_BLUE)
      .setTitle("🎮 ¡Bienvenido a Zimoxy!")
      .setDescription(
        `¡Hola, ${member.user.username}! 👋\n\nAcabas de llegar al servidor oficial de **Zimoxy**, la plataforma alterna de Minecraft sin conexión a Microsoft.\n\nPara desbloquear los canales, dirígete a <#${process.env.CHANNEL_VERIFICACION || "verificacion"}> y haz clic en el botón de **Verificarme**.`
      )
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        {
          name: "🌐 Registrarse en la Web",
          value: `[Crear cuenta en Zimoxy](${WEB_URL}/login.es)`,
          inline: true,
        },
        {
          name: "🎮 IP del Servidor",
          value: `\`${SERVER_IP}\``,
          inline: true,
        },
        {
          name: "🛡️ Primer Paso",
          value: "Haz clic en el botón de verificación en el canal correspondiente.",
          inline: false,
        }
      )
      .setFooter({ text: "Zimoxy Platform • Plataforma Alterna de Minecraft" })
      .setTimestamp();

    if (guild.systemChannel) {
      await guild.systemChannel.send({
        content: `<@${member.user.id}>`,
        embeds: [welcomeEmbed],
      });
    }
  } catch (err) {
    console.error("[Welcome Error]:", err);
  }
});

// ======================================
// EVENT: Slash Commands y Botones
// ======================================
client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

  // ─────────── SLASH COMMANDS ───────────
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

    // ════════════════════════════════════
    // /setup-canales — Envío masivo admin
    // ════════════════════════════════════
    if (commandName === "setup-canales") {
      await runSetupCanales(interaction);
      return;
    }

    // ════════════════════════════════════
    // /zimoxyai — Asistente Inteligente Gemini
    // ════════════════════════════════════
    if (commandName === "zimoxyai") {
      const prompt = interaction.options.getString("pregunta", true);
      await interaction.deferReply();

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        await interaction.editReply({
          content: "❌ La API de Gemini no está configurada en el bot.",
        });
        return;
      }

      try {
        const systemInstruction = 
          "Eres Zimoxy AI, la inteligencia artificial oficial y asistente de la plataforma Zimoxy. " +
          "Zimoxy es una plataforma alterna de Minecraft sin conexión a Microsoft. " +
          "Responde de manera amable, útil, concisa y gamer. Responde en el idioma en que te hablen (español o inglés).";

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemInstruction}\n\nPregunta del usuario: ${prompt}` }],
              },
            ],
          }),
        });

        const data = await res.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!replyText) {
          const errMsg = data.error?.message || "No se pudo generar respuesta de la IA.";
          await interaction.editReply({ content: `⚠️ Error de Zimoxy AI: ${errMsg}` });
          return;
        }

        // Si la respuesta excede 4000 caracteres, recortarla
        const safeText = replyText.length > 4000 ? replyText.slice(0, 3990) + "..." : replyText;

        const embedsToSend: EmbedBuilder[] = [];

        // Comprobar si es la primera vez que el usuario usa Zimoxy AI
        const userId = interaction.user.id;
        const isFirstTime = !aiWarnedUsers.has(userId);

        const aiLogoUrl = "https://hwcyvqnswnhfixrlgmas.supabase.co/storage/v1/object/sign/zimoxy/ZimoxyAI.png?token=eyJraWQiOiJmNmY1NDg4Zi04YTY5LTRhNmUtYTFmMi1jYTBjY2MzY2YyOWIiLCJhbGciOiJFUzI1NiJ9.eyJ1cmwiOiJ6aW1veHkvWmltb3h5QUkucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5NDg5MTk5NiwiZXhwIjoxODI2NDI3OTk2fQ.zahCx63b9h_yLKMKbwjRPVS-LRojDilwF8HOsSOuT9A-3wxpHLj05fQ641UiejS-dtXCj78anbOABrpfQPMgUg";

        if (isFirstTime) {
          aiWarnedUsers.add(userId);
          const noticeEmbed = new EmbedBuilder()
            .setColor(0xffb703) // Color ámbar/advertencia
            .setTitle("⚠️ Aviso importante sobre Zimoxy AI")
            .setThumbnail(aiLogoUrl)
            .setDescription(
              "Hola, esta es tu primera vez usando **Zimoxy AI**.\n\n" +
              "• **Uso Responsable:** Esta IA **no es ilimitada**. Se recomienda no usarla constantemente y reservarla solo para preguntas necesarias.\n" +
              "• **Solo Texto:** Por ahora **no es capaz de generar imágenes, archivos ni nada que no sea texto**."
            )
            .setFooter({ text: "Este aviso informativo solo se mostrará una vez.", iconURL: aiLogoUrl });
          embedsToSend.push(noticeEmbed);
        }

        const aiEmbed = new EmbedBuilder()
          .setColor(0x8a2be2)
          .setAuthor({
            name: "Zimoxy AI • Asistente Inteligente",
            iconURL: aiLogoUrl,
          })
          .setThumbnail(aiLogoUrl)
          .setDescription(safeText)
          .addFields({
            name: "💬 Pregunta",
            value: `*${prompt.length > 100 ? prompt.slice(0, 97) + "..." : prompt}*`,
          })
          .setFooter({
            text: `Solicitado por ${interaction.user.username} • Powered by Gemini`,
            iconURL: interaction.user.displayAvatarURL(),
          })
          .setTimestamp();

        embedsToSend.push(aiEmbed);

        await interaction.editReply({ embeds: embedsToSend });
      } catch (err: any) {
        console.error("[ZimoxyAI Error]:", err);
        await interaction.editReply({
          content: `❌ Ocurrió un error al consultar a Zimoxy AI: ${err.message || "Error desconocido"}`,
        });
      }
      return;
    }

    // ════════════════════════════
    // /ayuda — Menú de Ayuda Zimoxy
    // ════════════════════════════
    if (commandName === "ayuda") {
      const helpEmbed = new EmbedBuilder()
        .setColor(ZIMOXY_BLUE)
        .setTitle("📖 Zimoxy-Support | Centro de Ayuda")
        .setDescription(
          `**Zimoxy Network** es un ecosistema completo de servidores privados de Minecraft con launcher propio, skins y cosméticos exclusivos — sin ninguna conexión a Microsoft.\n\n**Comandos disponibles:**`
        )
        .addFields(
          {
            name: "🔹 `/verificar <usuario>`",
            value: "Vincula tu Discord con tu nombre de jugador de Minecraft en Zimoxy.",
          },
          {
            name: "🔹 `/perfil [jugador]`",
            value: "Muestra el perfil, nivel, rango, skin y estadísticas de un jugador.",
          },
          {
            name: "🔹 `/servidor`",
            value: "Consulta el estado en vivo de los servidores de Zimoxy Network.",
          },
          {
            name: "🔹 `/soporte [asunto]`",
            value: "Abre un ticket de ayuda interactivo con el equipo Zimoxy.",
          },
          {
            name: "🔹 `/skin <usuario>`",
            value: "Muestra la skin de Minecraft de un jugador de Zimoxy.",
          },
          {
            name: "🔹 `/rango <usuario>`",
            value: "Consulta el rango actual de un jugador dentro de Zimoxy.",
          },
          {
            name: "🔹 `/ayuda`",
            value: "Muestra este menú.",
          },
          {
            name: "🌐 Accesos Rápidos",
            value: `[Registrarse](${WEB_URL}/login.es) • [Web Oficial](${WEB_URL}) • IP: \`${SERVER_IP}\``,
          }
        )
        .setFooter({ text: "Zimoxy-Support • Sistema de Gestión Activa" })
        .setTimestamp();

      await interaction.reply({ embeds: [helpEmbed], flags: 64 });
    }

    // ══════════════════════════════════
    // /servidor — Estado del Servidor
    // ══════════════════════════════════
    if (commandName === "servidor") {
      const serverEmbed = new EmbedBuilder()
        .setColor(ZIMOXY_GREEN)
        .setTitle("🟢 Red de Servidores Zimoxy — En Línea")
        .setDescription(
          "El ecosistema de servidores privados **Zimoxy** está activo y funcionando correctamente.\n\n**Sistema independiente de Microsoft** con autenticación propia, skins exclusivas y launcher dedicado."
        )
        .addFields(
          { name: "🌐 IP de Conexión", value: `\`${SERVER_IP}\``, inline: true },
          { name: "🔌 Puerto", value: `\`25565\``, inline: true },
          { name: "📡 Estado", value: "🟢 **ONLINE**", inline: true },
          { name: "🎨 Sistema de Skins", value: "✅ Activo (Exclusivo Zimoxy)", inline: true },
          { name: "🚀 Launcher", value: "✅ Zimoxy Client", inline: true },
          { name: "🛡️ Auth", value: "✅ Autenticación Propia", inline: true },
          {
            name: "📋 Modos de Juego",
            value: "Survival • Creative • SkyBlock *(Próximamente)*",
            inline: false,
          },
          {
            name: "📥 ¿Cómo Conectarse?",
            value: `1. Registra tu cuenta en [${WEB_URL}](${WEB_URL}/login.es).\n2. Descarga e instala el **Zimoxy Launcher**.\n3. Inicia sesión y conecta a \`${SERVER_IP}\`.`,
            inline: false,
          }
        )
        .setFooter({ text: "Zimoxy Network • Gestión Activa" })
        .setTimestamp();

      await interaction.reply({ embeds: [serverEmbed] });
    }

    // ══════════════════════════════════
    // /verificar — Vincular Cuenta
    // ══════════════════════════════════
    if (commandName === "verificar") {
      const mcUser = interaction.options.getString("usuario", true);
      const discordId = interaction.user.id;
      const discordTag = interaction.user.username;

      await interaction.deferReply({ flags: 64 });

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", mcUser)
        .maybeSingle();

      if (error || !data) {
        const notFoundEmbed = new EmbedBuilder()
          .setColor(ZIMOXY_RED)
          .setTitle("❌ Jugador No Encontrado en Zimoxy")
          .setDescription(
            `No encontramos el usuario de Minecraft **${mcUser}** registrado en Zimoxy.\n\nPara crear tu cuenta y unirte al ecosistema:`
          )
          .addFields({
            name: "📝 Registrarse",
            value: `[Haz clic aquí → Portal de Registro](${WEB_URL}/login.es)`,
          });
        await interaction.editReply({ embeds: [notFoundEmbed] });
        return;
      }

      await supabase
        .from("profiles")
        .update({ discord_id: discordId, discord_username: discordTag })
        .eq("username", mcUser);

      const successEmbed = new EmbedBuilder()
        .setColor(ZIMOXY_GREEN)
        .setTitle("✅ Cuenta Zimoxy Verificada")
        .setDescription(
          `Tu Discord ha sido vinculado exitosamente al jugador **${mcUser}** en Zimoxy Network.`
        )
        .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: "🎮 Jugador", value: `\`${mcUser}\``, inline: true },
          { name: "⭐ Nivel", value: `\`${data.level ?? 0}\``, inline: true },
          { name: "🏅 Rango", value: `${data.role ?? "PLAYER"}`, inline: true },
          { name: "🔵 Discord", value: `<@${discordId}>`, inline: true }
        )
        .setFooter({ text: "Zimoxy Ecosystem • Verificación de Cuenta" })
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });
    }

    // ══════════════════════════════════
    // /perfil — Ver Perfil de Jugador
    // ══════════════════════════════════
    if (commandName === "perfil") {
      const targetUser = interaction.options.getUser("jugador") || interaction.user;
      await interaction.deferReply();

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("discord_id", targetUser.id)
        .maybeSingle();

      if (error || !data) {
        const notLinkedEmbed = new EmbedBuilder()
          .setColor(ZIMOXY_RED)
          .setTitle("❌ Perfil No Encontrado")
          .setDescription(
            `<@${targetUser.id}> no tiene una cuenta de **Zimoxy** vinculada.\n\nUsa \`/verificar <usuario>\` para vincular tu Discord o regístrate en la web.`
          );
        await interaction.editReply({ embeds: [notLinkedEmbed] });
        return;
      }

      const profileEmbed = new EmbedBuilder()
        .setColor(ZIMOXY_BLUE)
        .setTitle(`👤 Perfil Zimoxy — ${data.username}`)
        .setThumbnail(
          targetUser.displayAvatarURL({ size: 256 })
        )
        .addFields(
          { name: "🎮 Minecraft", value: `\`${data.username}\``, inline: true },
          { name: "⭐ Nivel", value: `\`${data.level ?? 0}\``, inline: true },
          { name: "🏅 Rango", value: `${data.role ?? "PLAYER"}`, inline: true },
          { name: "🔵 Discord", value: `<@${targetUser.id}>\n\`@${targetUser.username}\``, inline: true },
          { name: "💰 Monedas", value: `\`${data.coins ?? 0}\` coins`, inline: true },
          {
            name: "🎨 Skin",
            value: data.skin_url
              ? `[Ver Skin](${data.skin_url})`
              : "*(Sin skin personalizada)*",
            inline: true,
          },
          {
            name: "📅 Miembro desde",
            value: `<t:${Math.floor(new Date(data.created_at).getTime() / 1000)}:D>`,
            inline: false,
          }
        )
        .setImage(`https://mc-heads.net/banner/${data.username}`)
        .setFooter({ text: "Zimoxy Ecosystem • Perfiles de Jugador" })
        .setTimestamp();

      await interaction.editReply({ embeds: [profileEmbed] });
    }

    // ══════════════════════════════════
    // /skin — Ver Skin de un Jugador
    // ══════════════════════════════════
    if (commandName === "skin") {
      const mcUser = interaction.options.getString("usuario", true);

      const skinEmbed = new EmbedBuilder()
        .setColor(ZIMOXY_BLUE)
        .setTitle(`🎨 Skin de ${mcUser} en Zimoxy`)
        .setDescription("Vista 3D de la skin exclusiva del jugador en el ecosistema Zimoxy.")
        .setImage(`https://mc-heads.net/player/${mcUser}/200`)
        .setThumbnail(`https://mc-heads.net/head/${mcUser}/100`)
        .setFooter({
          text: "Zimoxy Skins • Cosméticos Exclusivos del Ecosistema",
        })
        .setTimestamp();

      await interaction.reply({ embeds: [skinEmbed] });
    }

    // ══════════════════════════════════
    // /rango — Ver Rango de un Jugador
    // ══════════════════════════════════
    if (commandName === "rango") {
      const mcUser = interaction.options.getString("usuario", true);
      await interaction.deferReply();

      const { data } = await supabase
        .from("profiles")
        .select("role, coins, level")
        .eq("username", mcUser)
        .maybeSingle();

      if (!data) {
        await interaction.editReply({
          content: `❌ El jugador **${mcUser}** no está registrado en Zimoxy.`,
        });
        return;
      }

      const rangoEmbed = new EmbedBuilder()
        .setColor(ZIMOXY_GOLD)
        .setTitle(`🏅 Rango de ${mcUser} en Zimoxy`)
        .addFields(
          { name: "🏅 Rango Actual", value: `**${data.role ?? "PLAYER"}**`, inline: true },
          { name: "⭐ Nivel", value: `\`${data.level ?? 0}\``, inline: true },
          { name: "💰 Monedas", value: `\`${data.coins ?? 0}\` coins`, inline: true }
        )
        .setThumbnail(`https://mc-heads.net/head/${mcUser}/100`)
        .setFooter({ text: "Zimoxy Ecosystem • Sistema de Rangos" })
        .setTimestamp();

      await interaction.editReply({ embeds: [rangoEmbed] });
    }

    // ══════════════════════════════════
    // /soporte — Ticket de Soporte
    // ══════════════════════════════════
    if (commandName === "soporte") {
      const asunto = interaction.options.getString("asunto") || "Consulta general";

      const supportEmbed = new EmbedBuilder()
        .setColor(DISCORD_BLURPLE)
        .setTitle("🛠️ Soporte Técnico | Zimoxy Network")
        .setDescription(
          `Hola <@${interaction.user.id}>, tu solicitud ha sido recibida:\n> **${asunto}**\n\nSelecciona la categoría de tu problema para recibir ayuda rápidamente:`
        )
        .setFooter({ text: "Zimoxy-Support • Atención al Jugador" });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("support_launcher")
          .setLabel("Launcher")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("🚀"),
        new ButtonBuilder()
          .setCustomId("support_skins")
          .setLabel("Skins y Cosméticos")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🎨"),
        new ButtonBuilder()
          .setCustomId("support_cuenta")
          .setLabel("Cuenta y Acceso")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("👤"),
        new ButtonBuilder()
          .setCustomId("support_bug")
          .setLabel("Reportar Bug")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🐛")
      );

      await interaction.reply({ embeds: [supportEmbed], components: [row], flags: 64 });
    }
  }

  // ─────────── BUTTONS ───────────
  if (interaction.isButton()) {
    // 1. Botón de Verificación de Miembro
    if (interaction.customId === "btn_verify_member") {
      try {
        const member = interaction.member as GuildMember;
        const unverifiedRoleId = process.env.ROLE_NO_VERIFICADO;
        const sinCategoriaRoleId = process.env.ROLE_SIN_CATEGORIA;

        // Remover rol no verificado
        if (unverifiedRoleId && member.roles.cache.has(unverifiedRoleId)) {
          await member.roles.remove(unverifiedRoleId);
        }

        // Asignar rol sin-categoria
        if (sinCategoriaRoleId && !member.roles.cache.has(sinCategoriaRoleId)) {
          await member.roles.add(sinCategoriaRoleId);
          console.log(`[Verify] Rol 'Sin-categoria' otorgado a ${member.user.tag}`);
        }

        const rolesChannelId = process.env.CHANNEL_ROLES;
        await interaction.reply({
          content: `✅ **¡Te has verificado exitosamente!**\nSe te ha asignado el rol temporal de acceso.\nDirígete al canal <#${rolesChannelId || "roles"}> y reacciona con tu bandera (🇪🇸 o 🇺🇸) para elegir tu idioma y desbloquear tus canales.`,
          flags: 64,
        });
        return;
      } catch (err: any) {
        console.error("[Verify Button Error]:", err);
        await interaction.reply({
          content: "❌ Ocurrió un error al procesar tu verificación. Consulta con un administrador.",
          flags: 64,
        });
        return;
      }
    }

    const responses: Record<string, string> = {
      support_launcher:
        "🚀 **Soporte de Launcher Zimoxy:**\n1. Asegúrate de tener **Java 21** o superior instalado.\n2. Descarga el instalador desde la web oficial de Zimoxy.\n3. Si ves pantalla negra, asigna mínimo **2 GB de RAM** en los ajustes.\n4. Si el launcher no inicia, intenta ejecutarlo como **Administrador**.\n5. Para errores de autenticación, desconecta y vuelve a vincular tu Discord en [la web](${WEB_URL}).",
      support_skins:
        "🎨 **Soporte de Skins y Cosméticos Zimoxy:**\nLas skins se gestionan de forma exclusiva desde el portal web de Zimoxy. Para cambiar tu skin:\n1. Inicia sesión en [la web de Zimoxy](${WEB_URL}).\n2. Ve a tu **Perfil → Personalización**.\n3. Sube tu skin en formato 64x64 o 128x128 (HD).\n4. Los cambios se aplican en tiempo real en el servidor.",
      support_cuenta:
        "👤 **Soporte de Cuenta y Acceso:**\nSi tienes problemas para iniciar sesión:\n1. Verifica que tu correo y contraseña sean correctos.\n2. Recuerda que el acceso usa tu **usuario de Minecraft**, no el de Microsoft.\n3. Si perdiste acceso, escribe a un administrador con tu **Discord vinculado** para verificación de identidad.",
      support_bug:
        "🐛 **Reporte de Bug recibido.**\nGracias por reportar un problema en Zimoxy. Por favor describe el error con el mayor detalle posible:\n- ¿Cuándo ocurrió?\n- ¿Qué estabas haciendo?\n- ¿Capturas de pantalla o logs?\n\nUn miembro del equipo revisará tu reporte a la brevedad.",
    };

    const reply = responses[interaction.customId];
    if (reply) {
      await interaction.reply({ content: reply, flags: 64 });
    }
  }
});

// ==================================
// EVENT: Reacciones para roles de idioma
// ==================================
client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  try {
    if (reaction.partial) await reaction.fetch();
    const message = reaction.message;
    const rolesChannelId = process.env.CHANNEL_ROLES;

    if (message.channelId !== rolesChannelId) return;

    const guild = message.guild;
    if (!guild) return;

    const member = await guild.members.fetch(user.id);
    if (!member) return;

    const emojiName = reaction.emoji.name;
    const sinCategoriaRoleId = process.env.ROLE_SIN_CATEGORIA;
    const verificadoRoleId = process.env.ROLE_VERIFICADO;

    if (emojiName === "🇪🇸") {
      const roleEs = process.env.ROLE_ESPANOL;
      if (roleEs) {
        await member.roles.add(roleEs);
        console.log(`[RoleAdd] Rol 🇪🇸 Español asignado a ${user.tag}`);
      }
      // Quitar rol sin-categoria
      if (sinCategoriaRoleId && member.roles.cache.has(sinCategoriaRoleId)) {
        await member.roles.remove(sinCategoriaRoleId);
        console.log(`[RoleAdd] Rol 'Sin-categoria' removido de ${user.tag}`);
      }
      // Otorgar rol verificado para permitir registro en web
      if (verificadoRoleId && !member.roles.cache.has(verificadoRoleId)) {
        await member.roles.add(verificadoRoleId);
        console.log(`[RoleAdd] Rol 'Verificado' otorgado a ${user.tag}`);
      }
    } else if (emojiName === "🇺🇸") {
      const roleEn = process.env.ROLE_ENGLISH;
      if (roleEn) {
        await member.roles.add(roleEn);
        console.log(`[RoleAdd] Rol 🇺🇸 English asignado a ${user.tag}`);
      }
      // Quitar rol sin-categoria
      if (sinCategoriaRoleId && member.roles.cache.has(sinCategoriaRoleId)) {
        await member.roles.remove(sinCategoriaRoleId);
        console.log(`[RoleAdd] Rol 'Sin-categoria' removido de ${user.tag}`);
      }
      // Otorgar rol verificado para permitir registro en web
      if (verificadoRoleId && !member.roles.cache.has(verificadoRoleId)) {
        await member.roles.add(verificadoRoleId);
        console.log(`[RoleAdd] Rol 'Verificado' otorgado a ${user.tag}`);
      }
    }
  } catch (err: any) {
    console.warn("[ReactionAdd Error]:", err.message);
  }
});

client.on("messageReactionRemove", async (reaction, user) => {
  if (user.bot) return;

  try {
    if (reaction.partial) await reaction.fetch();
    const message = reaction.message;
    const rolesChannelId = process.env.CHANNEL_ROLES;

    if (message.channelId !== rolesChannelId) return;

    const guild = message.guild;
    if (!guild) return;

    const member = await guild.members.fetch(user.id);
    if (!member) return;

    const emojiName = reaction.emoji.name;
    if (emojiName === "🇪🇸") {
      const roleEs = process.env.ROLE_ESPANOL;
      if (roleEs) {
        await member.roles.remove(roleEs);
        console.log(`[RoleRemove] Rol 🇪🇸 Español removido de ${user.tag}`);
      }
    } else if (emojiName === "🇺🇸") {
      const roleEn = process.env.ROLE_ENGLISH;
      if (roleEn) {
        await member.roles.remove(roleEn);
        console.log(`[RoleRemove] Rol 🇺🇸 English removido de ${user.tag}`);
      }
    }
  } catch (err: any) {
    console.warn("[ReactionRemove Error]:", err.message);
  }
});

// ==================================
// INICIAR SESIÓN EN DISCORD
// ==================================
const token = process.env.DISCORD_BOT_TOKEN;
if (token && token.length > 20 && !token.includes("tu_token")) {
  client.login(token).catch((err) => {
    console.error("❌ Error al iniciar sesión en Discord:", err.message);
  });
} else {
  console.log("ℹ️  Configura DISCORD_BOT_TOKEN en las variables de entorno para activar el bot.");
}

// ==================================
// SERVIDOR HTTP PARA HEALTH CHECKS EN RENDER (PUERTO $PORT / 10000)
// Permite que Render Web Service mantenga el bot activo 24/7
// ==================================
import http from "node:http";

const PORT = Number(process.env.PORT) || 10000;
const healthServer = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      service: "Zimoxy Discord Bot",
      status: "online",
      tag: client.user?.tag || "conectando...",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    })
  );
});

healthServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Servidor HTTP de monitoreo activo en el puerto ${PORT} (Render Health Check)`);
});
