import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";

if (!process.env.TOKEN) throw new Error("TOKEN secret is missing");
if (!process.env.CLIENT_ID) throw new Error("CLIENT_ID secret is missing");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

function decisionCode() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const r = (s, l) =>
    Array.from({ length: l }, () => s[Math.floor(Math.random() * s.length)]).join("");
  return `${r(letters, 1)}${r(numbers, 2)}-${r(letters, 1)}${r(numbers, 2)}`;
}

const HIRE_SHEET =
  "https://docs.google.com/spreadsheets/d/1pMu1J3WRe3eKiW6lqa6c00hU7FugLMHbF35LyPVmd-w/export?format=csv&gid=103592681";
const PROMOTE_SHEET =
  "https://docs.google.com/spreadsheets/d/1pMu1J3WRe3eKiW6lqa6c00hU7FugLMHbF35LyPVmd-w/export?format=csv&gid=942337148";

const RANKS = {
  "ملازم": "1483442401354715137",
  "وكيل ضابط أول": "1483442331364495370",
  "وكيل ضابط": "1483442299387248673",
  "رقيب أول": "1483442278264471716",
  "رقيب": "1483442228373487626",
  "عريف": "1483442157955055716",
  "وكيل عريف": "1483253616692170933",
  "حارس": "1483132901515067514",
};

const RANK_ORDER = [
  "ملازم", "وكيل ضابط أول", "وكيل ضابط",
  "رقيب أول", "رقيب", "عريف", "وكيل عريف", "حارس",
];

const APPROVAL_CHOICES = [
  { name: "قائد الشرطة", value: "1483143249014296739" },
  { name: "نائب قائد الشرطة", value: "1483474508630331462" },
  { name: "قائد الحرس", value: "1483143272183365652" },
  { name: "نائب قائد الحرس", value: "1483474540876140564" },
  { name: "قائد الدفاع", value: "1483143294941663323" },
  { name: "نائب قائد الدفاع", value: "1483474573755289670" },
  { name: "مدير الكراج", value: "1483143318505263194" },
  { name: "نائب مدير الكراج", value: "1483474599781073057" },
];

const commands = [
  new SlashCommandBuilder()
    .setName("إعطاء-رتبة")
    .setDescription("إعطاء رتبة لـ شخص")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(o => o.setName("الشخص").setDescription("منشن").setRequired(true))
    .addRoleOption(o => o.setName("role1").setDescription("Role").setRequired(true))
    .addRoleOption(o => o.setName("role2").setDescription("Role2 (اختياري)").setRequired(false)),

  new SlashCommandBuilder()
    .setName("إزالة-رتبة")
    .setDescription("إزالة رتبة من شخص")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(o => o.setName("الشخص").setDescription("منشن").setRequired(true))
    .addRoleOption(o => o.setName("role1").setDescription("Role").setRequired(true))
    .addRoleOption(o => o.setName("role2").setDescription("Role2 (اختياري)").setRequired(false)),

  new SlashCommandBuilder()
    .setName("تغيير-اسم")
    .setDescription("تغيير اسم شخص")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(o => o.setName("الشخص").setDescription("منشن").setRequired(true))
    .addStringOption(o => o.setName("الاسم").setDescription("الاسم الجديد").setRequired(true)),

  new SlashCommandBuilder()
    .setName("إرجاع-الاسم-الأصلي")
    .setDescription("إرجاع الاسم الأصلي للشخص")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(o => o.setName("الشخص").setDescription("منشن").setRequired(true)),

  new SlashCommandBuilder()
    .setName("توظيف-دفعة")
    .setDescription("توظيف الوظائف المعتمدة")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addRoleOption(o => o.setName("role1").setDescription("الرول الوظيفي").setRequired(true))
    .addStringOption(o =>
      o.setName("اعتماد").setDescription("رتبتك القيادية").setRequired(true).addChoices(...APPROVAL_CHOICES)
    ),

  new SlashCommandBuilder()
    .setName("ترقيات")
    .setDescription("إدارة ترقيات الوظائف المعتمدة")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption(o =>
      o.setName("اعتماد").setDescription("رتبتك القيادية").setRequired(true).addChoices(...APPROVAL_CHOICES)
    ),

  new SlashCommandBuilder()
    .setName("إضافة-سجل-الوظيفي")
    .setDescription("إضافة سجل وظيفي لعضو عبر DM")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(o => o.setName("الشخص").setDescription("منشن").setRequired(true))
    .addStringOption(o => o.setName("السبب").setDescription("السجل / السبب").setRequired(true))
    .addStringOption(o =>
      o.setName("الوظيفة").setDescription("الوظيفة").setRequired(true).addChoices(
        { name: "إدارة الشرطة", value: "إدارة الشرطة" },
        { name: "شركة الرائد للحراسة", value: "شركة الرائد للحراسة" },
        { name: "الدفاع المدني", value: "الدفاع المدني" },
        { name: "كراج ميكانيكي", value: "كراج ميكانيكي" }
      )
    ),

  // ✅ أمر لجنة الرقابة
  new SlashCommandBuilder()
    .setName("لجنة-الرقابة")
    .setDescription("قرار لجنة الرقابة للترقية")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(o => o.setName("الشخص").setDescription("منشن الشخص").setRequired(true))
    .addStringOption(o =>
      o.setName("الرتبة-الحالية").setDescription("الرتبة الحالية").setRequired(true)
        .addChoices(...RANK_ORDER.map(r => ({ name: r, value: r })))
    )
    .addStringOption(o =>
      o.setName("الرتبة-الجديدة").setDescription("الرتبة الجديدة").setRequired(true)
        .addChoices(...RANK_ORDER.map(r => ({ name: r, value: r })))
    )
    .addStringOption(o =>
      o.setName("الوظيفة").setDescription("الوظيفة").setRequired(true).addChoices(
        { name: "إدارة الشرطة", value: "إدارة الشرطة" },
        { name: "شركة الرائد للحراسة", value: "شركة الرائد للحراسة" },
        { name: "الدفاع المدني", value: "الدفاع المدني" },
        { name: "كراج ميكانيكي", value: "كراج ميكانيكي" }
      )
    ),

].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("تم تسجيل الأوامر ✅");
  } catch (err) {
    console.error("فشل تسجيل الأوامر:", err);
  }
})();

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // ✅ تنفيذ أمر لجنة الرقابة
  if (interaction.commandName === "لجنة-الرقابة") {
    const member = interaction.options.getMember("الشخص");
    const oldRank = interaction.options.getString("الرتبة-الحالية", true);
    const newRank = interaction.options.getString("الرتبة-الجديدة", true);
    const job = interaction.options.getString("الوظيفة", true);

    if (!member) {
      return interaction.reply({ content: "❌ خطأ", ephemeral: true });
    }

    try {
      if (RANKS[oldRank]) await member.roles.remove(RANKS[oldRank]);
      if (RANKS[newRank]) await member.roles.add(RANKS[newRank]);

      await interaction.channel.send(
`**بعد مراجعة الجهود المبذولة للمذكور <@${member.id}> من قبل <@&1484710458438193272> قررنا بما هو اتي :

قبول ترشيحه من رتبة <@&${RANKS[oldRank]}> الى رتبة <@&${RANKS[newRank]}>

اعانك الله على مهامك والامانة المترتبة على رتبتك الحالية

خالص التقدير 
<@&1484710458438193272>
${job}

\`\`\`${decisionCode()}\`\`\`**`
      );

      await interaction.reply({ content: "✅ تم التنفيذ", ephemeral: true });

    } catch {
      await interaction.reply({ content: "❌ فشل التنفيذ", ephemeral: true });
    }
  }
});

client.login(TOKEN);
