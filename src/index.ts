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
const ZIMOXY_BLUE     = 0x4374ff;
const ZIMOXY_GREEN    = 0x38ef7d;
const ZIMOXY_RED      = 0xff4757;
const DISCORD_BLURPLE = 0x5865f2;
const ZIMOXY_GOLD     = 0xffd700;

const SERVER_IP = process.env.MINECRAFT_SERVER_IP || "play.zimoxy.net";
const WEB_URL   = process.env.WEB_URL || "https://zimoxyclient.vercel.app";

// Imagen oficial de mascota Zimoxy (Steve saludando)
const ZIMOXY_STEVE_IMG =
  "https://hwcyvqnswnhfixrlgmas.supabase.co/storage/v1/object/sign/zimoxy/Stevezimoxysaludo.png?token=eyJraWQiOiJmNmY1NDg4Zi04YTY5LTRhNmUtYTFmMi1jYTBjY2MzY2YyOWIiLCJhbGciOiJFUzI1NiJ9.eyJ1cmwiOiJ6aW1veHkvU3RldmV6aW1veHlzYWx1ZG8ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5NDkxOTE0NywiZXhwIjozMzcxNzE5MTQ3fQ.ZcofHnzTk5PVYzeYvgDLyFuWNb6K1auN18r28i3ZVKeNpdMkudG5uakkWCILEqwZnJ4ymIhOgeNgkfl2TEzYkA";

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
    .setTitle("👋 Bienvenido a Zimoxy · Welcome to Zimoxy")
    .setDescription(
      `**🇪🇸 Español**\n` +
      `¡Hola! Has llegado al servidor oficial de **Zimoxy**, el cliente alternativo de Minecraft que no requiere cuenta de Microsoft.\n` +
      `Con Zimoxy puedes jugar, personalizar tu personaje con skins y capas exclusivas, y conectarte a servidores compatibles sin ningún vínculo con Microsoft.\n\n` +
      `**🇺🇸 English**\n` +
      `Hello! You've joined the official **Zimoxy** Discord — the alternative Minecraft client that requires no Microsoft account.\n` +
      `With Zimoxy you can play, customize your character with exclusive skins and capes, and connect to compatible servers, completely independent from Microsoft.`
    )
    .addFields(
      { name: "🌐 Registrarse · Register", value: `[Crear cuenta · Create account](${WEB_URL}/login.es)`, inline: true },
      { name: "🎮 Servidor compatible", value: `\`${SERVER_IP}\``, inline: true },
      { name: "📋 Reglas · Rules", value: "Lee las reglas antes de participar. · Please read the rules before participating.", inline: false },
    )
    .setImage(ZIMOXY_STEVE_IMG)
    .setFooter({ text: "Zimoxy Client · zimoxyclient.vercel.app" })
    .setTimestamp();
  return { embeds: [embed] };
}

function embedVerificacion(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_GREEN)
    .setTitle("🛡️ Verificación de Miembros · Member Verification")
    .setDescription(
      `**🇪🇸 Verificación requerida**\n` +
      `Para acceder a los canales de la comunidad Zimoxy, debes verificarte haciendo clic en el botón de abajo.\n` +
      `Una vez verificado, podrás dirigirte al canal de **roles** y elegir tu idioma preferido (🇪🇸 Español / 🇺🇸 English).\n\n` +
      `**🇺🇸 Verification required**\n` +
      `To access the Zimoxy community channels, please verify yourself by clicking the button below.\n` +
      `Once verified, head to the **roles** channel and select your preferred language (🇪🇸 Spanish / 🇺🇸 English).`
    )
    .setImage(ZIMOXY_STEVE_IMG)
    .setFooter({ text: "Zimoxy Security · Sistema de Verificación Oficial" })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("btn_verify_member")
      .setLabel("Verificarme · Verify Me")
      .setStyle(ButtonStyle.Success)
      .setEmoji("✅")
  );

  return { embeds: [embed], components: [row] };
}

function embedRoles(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_BLUE)
    .setTitle("🌐 Selecciona tu Idioma · Select your Language")
    .setDescription(
      `Reacciona con la bandera de tu idioma para desbloquear los canales de la comunidad.\n` +
      `React with your language flag to unlock the community channels.\n\n` +
      `🇪🇸 — **Español** · Desbloquea los canales en español\n` +
      `🇺🇸 — **English** · Unlocks the English channels`
    )
    .setImage(ZIMOXY_STEVE_IMG)
    .setFooter({ text: "Zimoxy Client · Sistema de Roles e Idiomas" });
  return { embeds: [embed] };
}

function embedReglas(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_RED)
    .setTitle("📋 Reglamento de la Comunidad Zimoxy")
    .setDescription("El cumplimiento de estas normas es obligatorio para todos los miembros. Su incumplimiento conlleva sanciones inmediatas.")
    .addFields(
      { name: "1️⃣ Respeto", value: "Trata a todos con respeto. Cero tolerancia ante insultos, discriminación o acoso de cualquier tipo.", inline: false },
      { name: "2️⃣ Canal correcto ⚠️ BANEO DIRECTO", value: "**Enviar mensajes en canales que no corresponden es motivo de BAN inmediato del servidor.** Respeta la temática de cada canal.", inline: false },
      { name: "3️⃣ Sin spam ni publicidad", value: "Prohibido el spam de mensajes, invitaciones externas a otros servidores o cualquier tipo de publicidad no autorizada.", inline: false },
      { name: "4️⃣ Sin modificaciones no autorizadas", value: "El uso de hacks, exploits o mods que otorguen ventajas injustas resulta en ban permanente de la plataforma Zimoxy.", inline: false },
      { name: "5️⃣ Contenido apropiado", value: "Queda terminantemente prohibido el contenido NSFW, violento, explícito o inapropiado para la comunidad.", inline: false },
      { name: "6️⃣ Una cuenta por persona", value: "Zimoxy permite una sola cuenta por persona. El uso de múltiples cuentas resulta en ban permanente de todas ellas.", inline: false },
      { name: "7️⃣ Respeto al Staff", value: "Las decisiones del equipo de Zimoxy son finales. Las apelaciones se gestionan únicamente por ticket en /soporte.", inline: false },
    )
    .setImage(ZIMOXY_STEVE_IMG)
    .setFooter({ text: "Zimoxy Client · El incumplimiento acarrea expulsión o ban permanente" })
    .setTimestamp();
  return { embeds: [embed] };
}

function embedRules(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_RED)
    .setTitle("📋 Zimoxy Community Rules")
    .setDescription("Compliance with these rules is mandatory for all members. Violations result in immediate penalties.")
    .addFields(
      { name: "1️⃣ Respect", value: "Treat everyone with respect. Zero tolerance for harassment, hate speech, discrimination, or any form of abuse.", inline: false },
      { name: "2️⃣ Right channel ⚠️ INSTANT BAN", value: "**Posting in incorrect channels will result in an IMMEDIATE BAN from the Discord server.** Keep all discussions strictly on-topic for each channel.", inline: false },
      { name: "3️⃣ No spam or advertising", value: "Spamming, posting external Discord invites, or any unsolicited advertising is strictly prohibited.", inline: false },
      { name: "4️⃣ No unauthorized modifications", value: "Using hacks, exploits or unfair mods on Zimoxy results in a permanent platform ban.", inline: false },
      { name: "5️⃣ Appropriate content", value: "NSFW, violent, explicit or harmful content is strictly prohibited across all channels.", inline: false },
      { name: "6️⃣ Single account", value: "Only one account per person is allowed. Multi-accounting leads to a permanent ban on all associated accounts.", inline: false },
      { name: "7️⃣ Respect Staff decisions", value: "Staff decisions are final. Appeals must be submitted exclusively through /support tickets.", inline: false },
    )
    .setImage(ZIMOXY_STEVE_IMG)
    .setFooter({ text: "Zimoxy Client · Rule violations result in immediate penalties or permanent bans" })
    .setTimestamp();
  return { embeds: [embed] };
}

function embedGuia(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_GREEN)
    .setTitle("🗺️ Guía de Inicio — Zimoxy Client")
    .setDescription("Sigue estos pasos para comenzar a jugar usando **Zimoxy Client**, el cliente alternativo de Minecraft sin cuenta de Microsoft.")
    .addFields(
      { name: "Paso 1 — Crear tu cuenta", value: `Accede a [${WEB_URL}/login.es](${WEB_URL}/login.es) y regístrate con tu usuario de Minecraft y tu Discord.`, inline: false },
      { name: "Paso 2 — Verificar tu Discord", value: "Usa el comando `/verificar <tu_usuario>` en el canal #verificacion-verify para vincular tu cuenta.", inline: false },
      { name: "Paso 3 — Descargar Zimoxy Client", value: "Descarga el instalador oficial desde el portal web. Instálalo y ábrelo en tu PC.", inline: false },
      { name: "Paso 4 — Iniciar sesión", value: "Abre el cliente Zimoxy, inicia sesión con tu usuario y contraseña registrados.", inline: false },
      { name: "Paso 5 — Conectar al servidor", value: `IP: \`${SERVER_IP}\` · Puerto: \`25565\`\nSelecciona el modo de juego y ¡empieza a jugar sin necesidad de Microsoft!`, inline: false },
      { name: "❓ ¿Necesitas ayuda?", value: "Usa `/soporte` para abrir un ticket o visita el canal #faq.", inline: false },
    )
    .setImage(ZIMOXY_STEVE_IMG)
    .setFooter({ text: "Zimoxy Client · Sin cuenta de Microsoft requerida" })
    .setTimestamp();
  return { embeds: [embed] };
}

function embedGettingStarted(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_GREEN)
    .setTitle("🗺️ Getting Started — Zimoxy Client")
    .setDescription("Follow these steps to start playing using **Zimoxy Client**, the alternative Minecraft client that requires no Microsoft account.")
    .addFields(
      { name: "Step 1 — Create your account", value: `Go to [${WEB_URL}/login.en](${WEB_URL}/login.en) and register with your Minecraft username and Discord.`, inline: false },
      { name: "Step 2 — Verify your Discord", value: "Use the command `/verify <your_username>` in the #verificacion-verify channel to link your account.", inline: false },
      { name: "Step 3 — Download Zimoxy Client", value: "Download the official installer from the web portal. Install and open it on your PC.", inline: false },
      { name: "Step 4 — Log in", value: "Open the Zimoxy Client, then log in with your registered username and password.", inline: false },
      { name: "Step 5 — Connect to a server", value: `IP: \`${SERVER_IP}\` · Port: \`25565\`\nSelect a game mode and start playing, no Microsoft needed!`, inline: false },
      { name: "❓ Need help?", value: "Use `/support` to open a ticket or visit the #faq channel.", inline: false },
    )
    .setImage(ZIMOXY_STEVE_IMG)
    .setFooter({ text: "Zimoxy Client · No Microsoft account required" })
    .setTimestamp();
  return { embeds: [embed] };
}

function embedFAQ(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_BLUE)
    .setTitle("❓ FAQ — Preguntas Frecuentes · Frequently Asked Questions")
    .addFields(
      { name: "🇪🇸 ¿Necesito cuenta de Microsoft?", value: "**No.** Zimoxy tiene su propio sistema de autenticación. Solo necesitas registrarte en nuestro portal web.", inline: false },
      { name: "🇺🇸 Do I need a Microsoft account?", value: "**No.** Zimoxy has its own authentication system. Simply register on our web portal.", inline: false },
      { name: "🇪🇸 ¿Cómo cambio mi skin?", value: "Inicia sesión en el portal web → Ve a tu perfil → Sube tu skin en Jugador → Skins.", inline: false },
      { name: "🇺🇸 How do I change my skin?", value: "Log in to the web portal → Go to your profile → Upload your skin under Player → Skins.", inline: false },
      { name: "🇪🇸 ¿Zimoxy Client es de pago?", value: "**No.** Zimoxy Client es completamente gratuito para todos los miembros registrados en la plataforma.", inline: false },
      { name: "🇺🇸 Is Zimoxy Client free?", value: "**No.** Zimoxy Client is completely free for all registered members of the platform.", inline: false },
      { name: "🇪🇸 ¿Cómo abro un ticket de soporte?", value: "Usa `/soporte` en el canal #comandos-bot o escribe en #open-ticket.", inline: false },
      { name: "🇺🇸 How do I open a support ticket?", value: "Use `/support` in #bot-commands or write in #open-ticket.", inline: false },
    )
    .setImage(ZIMOXY_STEVE_IMG)
    .setFooter({ text: "Zimoxy Client · Para más ayuda usa /soporte o /support" })
    .setTimestamp();
  return { embeds: [embed] };
}

function embedRangos(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_GOLD)
    .setTitle("🏅 Rangos de Zimoxy · Zimoxy Ranks")
    .setDescription(
      "Estos son los rangos disponibles en el ecosistema Zimoxy. Los rangos premium otorgan beneficios exclusivos dentro del cliente y los servidores compatibles.\n\n" +
      "These are the available ranks in the Zimoxy ecosystem. Premium ranks grant exclusive perks within the client and compatible servers."
    )
    .addFields(
      { name: "⬜ PLAYER", value: "Rango gratuito para todos los jugadores registrados. · Free rank for all registered players.", inline: false },
      { name: "🟦 VIP", value: "Skins y capas exclusivas, prefijo especial en el chat del servidor. · Exclusive skins & capes, special prefix in server chat.", inline: false },
      { name: "🟪 MVP", value: "Todo lo de VIP + partículas exclusivas, kit especial y prioridad de acceso. · All VIP perks + exclusive particles, special kit and access priority.", inline: false },
      { name: "🟥 STAFF", value: "Miembros del equipo de Zimoxy. Solo por invitación. · Zimoxy team members. By invitation only.", inline: false },
      { name: "🟨 ADMIN", value: "Administradores de la plataforma. Control total del ecosistema Zimoxy. · Platform administrators. Full control of the Zimoxy ecosystem.", inline: false },
      { name: "💰 ¿Cómo obtener rangos? · How to get ranks?", value: `Visita el portal en [${WEB_URL}](${WEB_URL}) o contacta con el staff. · Visit the portal at [${WEB_URL}](${WEB_URL}) or contact the staff.`, inline: false },
    )
    .setImage(ZIMOXY_STEVE_IMG)
    .setFooter({ text: "Zimoxy Client · Sistema de Rangos y Beneficios" })
    .setTimestamp();
  return { embeds: [embed] };
}

function embedStore(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_GOLD)
    .setTitle("🛒 Tienda Zimoxy · Zimoxy Store")
    .setDescription(
      "Consigue rangos, cosméticos y paquetes exclusivos para potenciar tu experiencia en la plataforma Zimoxy.\n\n" +
      "Get ranks, cosmetics and exclusive packages to enhance your experience on the Zimoxy platform."
    )
    .addFields(
      { name: "🟦 Rango VIP · VIP Rank", value: "Skins y capas exclusivas + prefijo en servidores compatibles.\nExclusive skins & capes + prefix in compatible servers.", inline: true },
      { name: "🟪 Rango MVP · MVP Rank", value: "Todo lo de VIP + partículas + kit + prioridad de acceso.\nAll VIP perks + particles + kit + access priority.", inline: true },
      { name: "🎨 Pack Cosmético · Cosmetic Pack", value: "Skins y capas premium descargables para el cliente.\nPremium downloadable skins & capes for the client.", inline: true },
      { name: "💰 Moneda: Z-Coins", value: "La moneda oficial de Zimoxy para comprar en la tienda y apostar en minijuegos compatibles.\nThe official Zimoxy currency for the store and compatible minigames.", inline: false },
      { name: "🌐 Comprar · Buy", value: `[Abrir Portal de Tienda · Open Store Portal](${WEB_URL})`, inline: false },
    )
    .setImage(ZIMOXY_STEVE_IMG)
    .setFooter({ text: "Zimoxy Client · Todos los pagos son procesados de forma segura" })
    .setTimestamp();
  return { embeds: [embed] };
}

function embedEstadoServidores(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_GREEN)
    .setTitle("📡 Servidores Compatibles con Zimoxy Client")
    .setDescription("Estado en tiempo real de los servidores actualmente disponibles para Zimoxy Client. Todos son accesibles sin cuenta de Microsoft.")
    .addFields(
      { name: "🟢 Survival Privado 1.21", value: `\`${SERVER_IP}\` · Puerto \`25565\`\nModo Survival con modificaciones propias del ecosistema Zimoxy.`, inline: true },
      { name: "🟢 PVP / Anarchy", value: "`anarchy.zimoxy.net`\nSin reglas, PVP libre 24/7.", inline: true },
      { name: "🟢 SkyBlock Custom", value: "`sky.zimoxy.net`\nSkyBlock personalizado con economía propia de Zimoxy.", inline: true },
      { name: "🔧 Versión", value: "Minecraft Java 1.21.x", inline: true },
      { name: "🔐 Autenticación", value: "Sistema propio Zimoxy (sin Microsoft)", inline: true },
      { name: "📊 Actualizar estado", value: "Usa `/servidor` en cualquier momento para ver el estado actualizado.", inline: false },
    )
    .setImage(ZIMOXY_STEVE_IMG)
    .setFooter({ text: "Zimoxy Client · Estado de servidores actualizado automáticamente" })
    .setTimestamp();
  return { embeds: [embed] };
}

function embedServerStatus(): Parameters<TextChannel["send"]>[0] {
  const embed = new EmbedBuilder()
    .setColor(ZIMOXY_GREEN)
    .setTitle("📡 Servers Compatible with Zimoxy Client")
    .setDescription("Real-time status of the servers currently available for Zimoxy Client. All are accessible without a Microsoft account.")
    .addFields(
      { name: "🟢 Private Survival 1.21", value: `\`${SERVER_IP}\` · Port \`25565\`\nSurvival mode with Zimoxy ecosystem custom modifications.`, inline: true },
      { name: "🟢 PVP / Anarchy", value: "`anarchy.zimoxy.net`\nNo rules, free PVP 24/7.", inline: true },
      { name: "🟢 Custom SkyBlock", value: "`sky.zimoxy.net`\nCustom SkyBlock with Zimoxy's own economy.", inline: true },
      { name: "🔧 Version", value: "Minecraft Java 1.21.x", inline: true },
      { name: "🔐 Authentication", value: "Zimoxy own system (no Microsoft)", inline: true },
      { name: "📊 Update status", value: "Use `/server` at any time to get the latest server status.", inline: false },
    )
    .setImage(ZIMOXY_STEVE_IMG)
    .setFooter({ text: "Zimoxy Client · Server status auto-updated" })
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
    .setFooter({ text: "Zimoxy-Support · /setup-canales" })
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
    .setTitle("🎮 ¡Nuevo Miembro en Zimoxy!")
    .setDescription(
      `Un nuevo usuario ha completado su registro en **Zimoxy Client**, la plataforma alternativa de Minecraft sin conexión a Microsoft.\n¡Bienvenido al ecosistema!`
    )
    .setThumbnail(avatarUrl)
    .addFields(
      { name: "🧑‍💻 Usuario de Minecraft", value: `\`${username}\``, inline: true },
      { name: "⭐ Nivel", value: "`0` *(Recién llegado)*", inline: true },
      { name: "🏅 Rango", value: "PLAYER", inline: true },
      { name: "🔵 Discord", value: `<@${discordId}>\n\`@${discordUsername}\`\n**${discordGlobalName}**`, inline: true },
      { name: "🎲 UUID de Minecraft", value: `\`\`\`${minecraftUUID}\`\`\``, inline: false },
    )
    .setImage(`https://mc-heads.net/banner/${username}`)
    .setFooter({ text: "Zimoxy Client · zimoxyclient.vercel.app", iconURL: avatarUrl })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("Ver Portal Zimoxy")
      .setStyle(ButtonStyle.Link)
      .setURL(`${WEB_URL}`)
      .setEmoji("🌐"),
    new ButtonBuilder()
      .setLabel("Descargar Zimoxy Client")
      .setStyle(ButtonStyle.Link)
      .setURL(`${WEB_URL}/login.es`)
      .setEmoji("📥")
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
        name: `${WEB_URL} | /ayuda`,
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
  setOnlinePresence();

  for (const [, guild] of c.guilds.cache) {
    console.log(`  ✅ Conectado al servidor: ${guild.name} (${guild.memberCount} miembros)`);
  }

  const startTime = new Date().toLocaleString("es-ES", { timeZone: "America/Caracas" });
  await sendAdminDM(
    `🟢 **Zimoxy-Support está en línea**\n` +
    `> Bot: \`${c.user.tag}\`\n` +
    `> Hora: \`${startTime}\`\n` +
    `> Servidores: \`${c.guilds.cache.size}\`\n` +
    `> Estado: **ACTIVO** ✅`
  );

  setInterval(() => { setOnlinePresence(); }, 30 * 60 * 1000);
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
  if (err?.code === 10062) return;
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
    try {
      const baseName = member.displayName || member.user.username;
      if (!baseName.startsWith("[ZY] ")) {
        const newNickname = `[ZY] ${baseName}`.slice(0, 32);
        await member.setNickname(newNickname);
        console.log(`[Nickname] Nombre visible actualizado a: ${newNickname}`);
      }
    } catch (nickErr: any) {
      console.warn(`[Nickname] No se pudo cambiar el apodo de ${member.user.tag}:`, nickErr.message);
    }

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
        `¡Hola, **${member.user.username}**! 👋\n\n` +
        `Acabas de unirte al servidor oficial de **Zimoxy**, el cliente alternativo de Minecraft que no requiere cuenta de Microsoft.\n\n` +
        `Para desbloquear los canales, dirígete a <#${process.env.CHANNEL_VERIFICACION || "verificacion"}> y haz clic en el botón de **Verificarme**.`
      )
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "🌐 Crear cuenta en Zimoxy", value: `[Accede al portal de registro](${WEB_URL}/login.es)`, inline: true },
        { name: "🎮 Servidor compatible", value: `\`${SERVER_IP}\``, inline: true },
        { name: "🛡️ Primer paso", value: "Ve al canal de verificación y haz clic en el botón verde para desbloquear la comunidad.", inline: false },
      )
      .setImage(ZIMOXY_STEVE_IMG)
      .setFooter({ text: "Zimoxy Client · La plataforma alternativa de Minecraft" })
      .setTimestamp();

    if (guild.systemChannel) {
      await guild.systemChannel.send({ content: `<@${member.user.id}>`, embeds: [welcomeEmbed] });
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

  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

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
        await interaction.editReply({ content: "❌ La API de Gemini no está configurada en el bot." });
        return;
      }

      try {
        const systemInstruction =
          "Eres Zimoxy AI, la inteligencia artificial oficial y asistente de la plataforma Zimoxy. " +
          "Zimoxy es un cliente alternativo de Minecraft que no requiere cuenta de Microsoft. " +
          "Responde de manera amable, útil, concisa y gamer. Responde en el idioma en que te hablen (español o inglés).";

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: `${systemInstruction}\n\nPregunta del usuario: ${prompt}` }] }],
          }),
        });

        const data = await res.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!replyText) {
          const errMsg = data.error?.message || "No se pudo generar respuesta de la IA.";
          await interaction.editReply({ content: `⚠️ Error de Zimoxy AI: ${errMsg}` });
          return;
        }

        const safeText = replyText.length > 4000 ? replyText.slice(0, 3990) + "..." : replyText;
        const embedsToSend: EmbedBuilder[] = [];
        const userId = interaction.user.id;
        const isFirstTime = !aiWarnedUsers.has(userId);

        const aiLogoUrl = "https://hwcyvqnswnhfixrlgmas.supabase.co/storage/v1/object/sign/zimoxy/ZimoxyAI.png?token=eyJraWQiOiJmNmY1NDg4Zi04YTY5LTRhNmUtYTFmMi1jYTBjY2MzY2YyOWIiLCJhbGciOiJFUzI1NiJ9.eyJ1cmwiOiJ6aW1veHkvWmltb3h5QUkucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5NDg5MTk5NiwiZXhwIjoxODI2NDI3OTk2fQ.zahCx63b9h_yLKMKbwjRPVS-LRojDilwF8HOsSOuT9A-3wxpHLj05fQ641UiejS-dtXCj78anbOABrpfQPMgUg";

        if (isFirstTime) {
          aiWarnedUsers.add(userId);
          const noticeEmbed = new EmbedBuilder()
            .setColor(0xffb703)
            .setTitle("⚠️ Aviso importante sobre Zimoxy AI")
            .setThumbnail(aiLogoUrl)
            .setDescription(
              "Hola, esta es tu primera vez usando **Zimoxy AI**.\n\n" +
              "• **Uso Responsable:** Esta IA **no es ilimitada**. Se recomienda reservarla solo para preguntas necesarias.\n" +
              "• **Solo Texto:** Por ahora **no es capaz de generar imágenes, archivos ni nada que no sea texto**."
            )
            .setFooter({ text: "Este aviso informativo solo se mostrará una vez.", iconURL: aiLogoUrl });
          embedsToSend.push(noticeEmbed);
        }

        const aiEmbed = new EmbedBuilder()
          .setColor(0x8a2be2)
          .setAuthor({ name: "Zimoxy AI · Asistente Inteligente", iconURL: aiLogoUrl })
          .setThumbnail(aiLogoUrl)
          .setDescription(safeText)
          .addFields({ name: "💬 Pregunta", value: `*${prompt.length > 100 ? prompt.slice(0, 97) + "..." : prompt}*` })
          .setFooter({ text: `Solicitado por ${interaction.user.username} · Powered by Gemini`, iconURL: interaction.user.displayAvatarURL() })
          .setTimestamp();

        embedsToSend.push(aiEmbed);
        await interaction.editReply({ embeds: embedsToSend });
      } catch (err: any) {
        console.error("[ZimoxyAI Error]:", err);
        await interaction.editReply({ content: `❌ Ocurrió un error al consultar a Zimoxy AI: ${err.message || "Error desconocido"}` });
      }
      return;
    }

    // ════════════════════════════
    // /ayuda
    // ════════════════════════════
    if (commandName === "ayuda") {
      const helpEmbed = new EmbedBuilder()
        .setColor(ZIMOXY_BLUE)
        .setTitle("📖 Zimoxy-Support | Centro de Ayuda")
        .setDescription(
          `**Zimoxy** es la plataforma y cliente alternativo de Minecraft que no requiere ninguna conexión ni cuenta de Microsoft. Incluye launcher propio, skins y cosméticos exclusivos.\n\n**Comandos disponibles:**`
        )
        .addFields(
          { name: "🔹 `/verificar <usuario>`", value: "Vincula tu Discord con tu nombre de usuario de Minecraft registrado en Zimoxy." },
          { name: "🔹 `/perfil [jugador]`",    value: "Muestra el perfil, nivel, rango, skin y estadísticas de un jugador de Zimoxy." },
          { name: "🔹 `/servidor`",             value: "Consulta el estado en vivo de los servidores compatibles con Zimoxy Client." },
          { name: "🔹 `/soporte [asunto]`",     value: "Abre un ticket de ayuda interactivo con el equipo de Zimoxy." },
          { name: "🔹 `/skin <usuario>`",        value: "Muestra la skin de Minecraft de un jugador registrado en Zimoxy." },
          { name: "🔹 `/rango <usuario>`",       value: "Consulta el rango actual de un jugador dentro del ecosistema Zimoxy." },
          { name: "🔹 `/zimoxyai <pregunta>`",   value: "Consulta a Zimoxy AI, el asistente inteligente oficial de la plataforma." },
          { name: "🔹 `/ayuda`",                value: "Muestra este menú de comandos." },
          { name: "🌐 Accesos Rápidos",          value: `[Registrarse](${WEB_URL}/login.es) · [Portal Oficial](${WEB_URL}) · IP: \`${SERVER_IP}\`` },
        )
        .setImage(ZIMOXY_STEVE_IMG)
        .setFooter({ text: "Zimoxy-Support · Sistema de Gestión Activa" })
        .setTimestamp();

      await interaction.reply({ embeds: [helpEmbed], flags: 64 });
    }

    // ══════════════════════════════════
    // /servidor
    // ══════════════════════════════════
    if (commandName === "servidor") {
      const serverEmbed = new EmbedBuilder()
        .setColor(ZIMOXY_GREEN)
        .setTitle("🟢 Servidores Compatibles con Zimoxy Client — En Línea")
        .setDescription(
          "Los servidores del ecosistema **Zimoxy** están activos y funcionando correctamente.\n\n" +
          "Zimoxy es un **sistema independiente de Microsoft** con autenticación propia, skins exclusivas y cliente dedicado. No se requiere cuenta de Microsoft para conectarse."
        )
        .addFields(
          { name: "🌐 IP de Conexión", value: `\`${SERVER_IP}\``, inline: true },
          { name: "🔌 Puerto", value: "`25565`", inline: true },
          { name: "📡 Estado", value: "🟢 **ONLINE**", inline: true },
          { name: "🎨 Sistema de Skins", value: "✅ Activo (Exclusivo Zimoxy)", inline: true },
          { name: "🚀 Cliente", value: "✅ Zimoxy Client", inline: true },
          { name: "🛡️ Autenticación", value: "✅ Sistema propio (sin Microsoft)", inline: true },
          { name: "📋 Modos de Juego", value: "Survival · Creative · SkyBlock *(Próximamente)*", inline: false },
          { name: "📥 ¿Cómo Conectarse?", value: `1. Crea tu cuenta en [${WEB_URL}](${WEB_URL}/login.es).\n2. Descarga e instala **Zimoxy Client** desde el portal.\n3. Inicia sesión y conecta a \`${SERVER_IP}\`.`, inline: false },
        )
        .setImage(ZIMOXY_STEVE_IMG)
        .setFooter({ text: "Zimoxy Client · Portal en zimoxyclient.vercel.app" })
        .setTimestamp();

      await interaction.reply({ embeds: [serverEmbed] });
    }

    // ══════════════════════════════════
    // /verificar
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
          .setTitle("❌ Usuario No Encontrado en Zimoxy")
          .setDescription(
            `No encontramos el usuario de Minecraft **\`${mcUser}\`** registrado en la plataforma Zimoxy.\n\nPara crear tu cuenta y unirte al ecosistema, accede al portal de registro:`
          )
          .addFields({ name: "📝 Crear cuenta", value: `[Accede al portal de registro → ${WEB_URL}/login.es](${WEB_URL}/login.es)` })
          .setImage(ZIMOXY_STEVE_IMG)
          .setFooter({ text: "Zimoxy Client · zimoxyclient.vercel.app" });
        await interaction.editReply({ embeds: [notFoundEmbed] });
        return;
      }

      await supabase
        .from("profiles")
        .update({ discord_id: discordId, discord_username: discordTag })
        .eq("username", mcUser);

      const successEmbed = new EmbedBuilder()
        .setColor(ZIMOXY_GREEN)
        .setTitle("✅ Cuenta Zimoxy Verificada Exitosamente")
        .setDescription(`Tu Discord ha sido vinculado correctamente al jugador **\`${mcUser}\`** en la plataforma Zimoxy.`)
        .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: "🎮 Usuario de Minecraft", value: `\`${mcUser}\``, inline: true },
          { name: "⭐ Nivel", value: `\`${data.level ?? 0}\``, inline: true },
          { name: "🏅 Rango", value: `${data.role ?? "PLAYER"}`, inline: true },
          { name: "🔵 Discord", value: `<@${discordId}>`, inline: true },
        )
        .setImage(ZIMOXY_STEVE_IMG)
        .setFooter({ text: "Zimoxy Client · Verificación de cuenta completada" })
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });
    }

    // ══════════════════════════════════
    // /perfil
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
          .setDescription(`<@${targetUser.id}> no tiene una cuenta de **Zimoxy** vinculada a su Discord.\n\nUsa \`/verificar <usuario>\` para vincular tu cuenta o regístrate en el portal web.`)
          .setImage(ZIMOXY_STEVE_IMG)
          .setFooter({ text: "Zimoxy Client · zimoxyclient.vercel.app" });
        await interaction.editReply({ embeds: [notLinkedEmbed] });
        return;
      }

      const profileEmbed = new EmbedBuilder()
        .setColor(ZIMOXY_BLUE)
        .setTitle(`👤 Perfil Zimoxy — ${data.username}`)
        .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: "🎮 Minecraft", value: `\`${data.username}\``, inline: true },
          { name: "⭐ Nivel", value: `\`${data.level ?? 0}\``, inline: true },
          { name: "🏅 Rango", value: `${data.role ?? "PLAYER"}`, inline: true },
          { name: "🔵 Discord", value: `<@${targetUser.id}>\n\`@${targetUser.username}\``, inline: true },
          { name: "💰 Z-Coins", value: `\`${data.coins ?? 0}\` coins`, inline: true },
          { name: "🎨 Skin", value: data.skin_url ? `[Ver Skin](${data.skin_url})` : "*(Sin skin personalizada)*", inline: true },
          { name: "📅 Miembro desde", value: `<t:${Math.floor(new Date(data.created_at).getTime() / 1000)}:D>`, inline: false },
        )
        .setImage(`https://mc-heads.net/banner/${data.username}`)
        .setFooter({ text: "Zimoxy Client · Perfiles de la plataforma" })
        .setTimestamp();

      await interaction.editReply({ embeds: [profileEmbed] });
    }

    // ══════════════════════════════════
    // /skin
    // ══════════════════════════════════
    if (commandName === "skin") {
      const mcUser = interaction.options.getString("usuario", true);
      const skinEmbed = new EmbedBuilder()
        .setColor(ZIMOXY_BLUE)
        .setTitle(`🎨 Skin de ${mcUser} — Zimoxy Client`)
        .setDescription("Vista 3D de la skin exclusiva del jugador dentro del ecosistema Zimoxy.")
        .setImage(`https://mc-heads.net/player/${mcUser}/200`)
        .setThumbnail(`https://mc-heads.net/head/${mcUser}/100`)
        .setFooter({ text: "Zimoxy Client · Cosméticos y Skins Exclusivas" })
        .setTimestamp();

      await interaction.reply({ embeds: [skinEmbed] });
    }

    // ══════════════════════════════════
    // /rango
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
        await interaction.editReply({ content: `❌ El jugador **\`${mcUser}\`** no está registrado en Zimoxy.` });
        return;
      }

      const rangoEmbed = new EmbedBuilder()
        .setColor(ZIMOXY_GOLD)
        .setTitle(`🏅 Rango de ${mcUser} en Zimoxy`)
        .addFields(
          { name: "🏅 Rango Actual", value: `**${data.role ?? "PLAYER"}**`, inline: true },
          { name: "⭐ Nivel", value: `\`${data.level ?? 0}\``, inline: true },
          { name: "💰 Z-Coins", value: `\`${data.coins ?? 0}\` coins`, inline: true },
        )
        .setThumbnail(`https://mc-heads.net/head/${mcUser}/100`)
        .setImage(ZIMOXY_STEVE_IMG)
        .setFooter({ text: "Zimoxy Client · Sistema de Rangos y Beneficios" })
        .setTimestamp();

      await interaction.editReply({ embeds: [rangoEmbed] });
    }

    // ══════════════════════════════════
    // /soporte
    // ══════════════════════════════════
    if (commandName === "soporte") {
      const asunto = interaction.options.getString("asunto") || "Consulta general";
      const supportEmbed = new EmbedBuilder()
        .setColor(DISCORD_BLURPLE)
        .setTitle("🛠️ Soporte Técnico | Zimoxy Client")
        .setDescription(
          `Hola <@${interaction.user.id}>, tu solicitud ha sido recibida:\n> **${asunto}**\n\n` +
          `Selecciona la categoría que mejor describa tu problema para recibir asistencia rápida:`
        )
        .setImage(ZIMOXY_STEVE_IMG)
        .setFooter({ text: "Zimoxy-Support · Atención al Usuario" });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("support_launcher").setLabel("Zimoxy Client").setStyle(ButtonStyle.Primary).setEmoji("🚀"),
        new ButtonBuilder().setCustomId("support_skins").setLabel("Skins y Cosméticos").setStyle(ButtonStyle.Secondary).setEmoji("🎨"),
        new ButtonBuilder().setCustomId("support_cuenta").setLabel("Cuenta y Acceso").setStyle(ButtonStyle.Secondary).setEmoji("👤"),
        new ButtonBuilder().setCustomId("support_bug").setLabel("Reportar Bug").setStyle(ButtonStyle.Danger).setEmoji("🐛"),
      );

      await interaction.reply({ embeds: [supportEmbed], components: [row], flags: 64 });
    }
  }

  // ─────────── BUTTONS ───────────
  if (interaction.isButton()) {
    if (interaction.customId === "btn_verify_member") {
      try {
        const member = interaction.member as GuildMember;
        const unverifiedRoleId = process.env.ROLE_NO_VERIFICADO;
        const sinCategoriaRoleId = process.env.ROLE_SIN_CATEGORIA;

        if (unverifiedRoleId && member.roles.cache.has(unverifiedRoleId)) {
          await member.roles.remove(unverifiedRoleId);
        }
        if (sinCategoriaRoleId && !member.roles.cache.has(sinCategoriaRoleId)) {
          await member.roles.add(sinCategoriaRoleId);
          console.log(`[Verify] Rol 'Sin-categoria' otorgado a ${member.user.tag}`);
        }

        const rolesChannelId = process.env.CHANNEL_ROLES;
        await interaction.reply({
          content: `✅ **¡Verificación completada!**\nSe te ha asignado acceso inicial a la comunidad.\nDirígete al canal <#${rolesChannelId || "roles"}> y reacciona con tu bandera (🇪🇸 o 🇺🇸) para elegir tu idioma y desbloquear todos los canales.`,
          flags: 64,
        });
        return;
      } catch (err: any) {
        console.error("[Verify Button Error]:", err);
        await interaction.reply({ content: "❌ Ocurrió un error al procesar tu verificación. Por favor contacta con un administrador.", flags: 64 });
        return;
      }
    }

    const responses: Record<string, string> = {
      support_launcher:
        `🚀 **Soporte de Zimoxy Client:**\n1. Asegúrate de tener **Java 21** o superior instalado en tu PC.\n2. Descarga la última versión del instalador desde [${WEB_URL}](${WEB_URL}).\n3. Si ves pantalla negra al iniciar, asigna mínimo **2 GB de RAM** en los ajustes del cliente.\n4. Si el cliente no inicia, intenta ejecutarlo como **Administrador**.\n5. Para errores de autenticación, desvincula y vuelve a vincular tu Discord desde [el portal](${WEB_URL}).`,
      support_skins:
        `🎨 **Soporte de Skins y Cosméticos Zimoxy:**\nLas skins se gestionan de forma exclusiva desde el portal web de Zimoxy. Para cambiar tu skin:\n1. Inicia sesión en [${WEB_URL}](${WEB_URL}).\n2. Ve a tu **Perfil → Personalización**.\n3. Sube tu skin en formato 64x64 o 128x128 (HD).\n4. Los cambios se aplican en tiempo real en los servidores compatibles.`,
      support_cuenta:
        `👤 **Soporte de Cuenta y Acceso:**\nSi tienes problemas para iniciar sesión en Zimoxy:\n1. Verifica que tu correo y contraseña sean correctos en el portal.\n2. Recuerda que el acceso usa tu **usuario de Minecraft registrado en Zimoxy**, no el de Microsoft.\n3. Si perdiste acceso, contacta con un administrador adjuntando tu **Discord vinculado** para verificación de identidad.`,
      support_bug:
        `🐛 **Reporte de Bug recibido.**\nGracias por reportar un problema en la plataforma Zimoxy. Por favor describe el error con el mayor detalle posible:\n- ¿Cuándo y dónde ocurrió?\n- ¿Qué estabas haciendo en ese momento?\n- ¿Capturas de pantalla o logs de error disponibles?\n\nUn miembro del equipo Zimoxy revisará tu reporte a la brevedad posible.`,
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
      if (roleEs) { await member.roles.add(roleEs); console.log(`[RoleAdd] Rol 🇪🇸 Español asignado a ${user.tag}`); }
      if (sinCategoriaRoleId && member.roles.cache.has(sinCategoriaRoleId)) { await member.roles.remove(sinCategoriaRoleId); }
      if (verificadoRoleId && !member.roles.cache.has(verificadoRoleId)) { await member.roles.add(verificadoRoleId); }
    } else if (emojiName === "🇺🇸") {
      const roleEn = process.env.ROLE_ENGLISH;
      if (roleEn) { await member.roles.add(roleEn); console.log(`[RoleAdd] Rol 🇺🇸 English asignado a ${user.tag}`); }
      if (sinCategoriaRoleId && member.roles.cache.has(sinCategoriaRoleId)) { await member.roles.remove(sinCategoriaRoleId); }
      if (verificadoRoleId && !member.roles.cache.has(verificadoRoleId)) { await member.roles.add(verificadoRoleId); }
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
      if (roleEs) { await member.roles.remove(roleEs); console.log(`[RoleRemove] Rol 🇪🇸 Español removido de ${user.tag}`); }
    } else if (emojiName === "🇺🇸") {
      const roleEn = process.env.ROLE_ENGLISH;
      if (roleEn) { await member.roles.remove(roleEn); console.log(`[RoleRemove] Rol 🇺🇸 English removido de ${user.tag}`); }
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
  console.log("ℹ️  Configura DISCORD_BOT_TOKEN en bot/.env para activar el bot.");
}
