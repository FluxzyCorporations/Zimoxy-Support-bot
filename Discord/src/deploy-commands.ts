import { REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId) {
  console.error("❌ Error: DISCORD_BOT_TOKEN y DISCORD_CLIENT_ID son obligatorios en .env");
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName("verificar")
    .setDescription("Vincula tu Discord con tu usuario de Minecraft en Zimoxy")
    .addStringOption((opt) =>
      opt
        .setName("usuario")
        .setDescription("Tu nombre de usuario de Minecraft en Zimoxy")
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(16)
    ),

  new SlashCommandBuilder()
    .setName("perfil")
    .setDescription("Consulta el perfil, rango y skin de un jugador Zimoxy")
    .addUserOption((opt) =>
      opt
        .setName("jugador")
        .setDescription("Jugador de Discord a consultar (opcional)")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("servidor")
    .setDescription("Muestra el estado en vivo de los servidores de Zimoxy Network"),

  new SlashCommandBuilder()
    .setName("soporte")
    .setDescription("Abre un ticket de soporte técnico en Zimoxy")
    .addStringOption((opt) =>
      opt
        .setName("asunto")
        .setDescription("Describe brevemente en qué necesitas ayuda")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("skin")
    .setDescription("Muestra la skin de Minecraft de un jugador Zimoxy")
    .addStringOption((opt) =>
      opt
        .setName("usuario")
        .setDescription("Nombre de usuario de Minecraft")
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(16)
    ),

  new SlashCommandBuilder()
    .setName("rango")
    .setDescription("Consulta el rango de un jugador en Zimoxy")
    .addStringOption((opt) =>
      opt
        .setName("usuario")
        .setDescription("Nombre de usuario de Minecraft")
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(16)
    ),

  new SlashCommandBuilder()
    .setName("ayuda")
    .setDescription("Muestra todos los comandos y enlaces del ecosistema Zimoxy"),

  new SlashCommandBuilder()
    .setName("setup-canales")
    .setDescription("[ADMIN] Envía los mensajes oficiales a todos los canales configurados"),

  new SlashCommandBuilder()
    .setName("zimoxyai")
    .setDescription("Hazle una pregunta o pídele algo a la Inteligencia Artificial de Zimoxy")
    .addStringOption((opt) =>
      opt
        .setName("pregunta")
        .setDescription("Tu pregunta o mensaje para Zimoxy AI")
        .setRequired(true)
    ),
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log("🔄 Registrando comandos Slash de Zimoxy-Support...");
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log(`✅ Comandos registrados en el servidor de pruebas (${guildId}).`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log("✅ Comandos registrados globalmente en Discord.");
    }
  } catch (error) {
    console.error("❌ Error al registrar comandos:", error);
  }
})();
