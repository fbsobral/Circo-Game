import { Resend } from "resend"

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "placeholder")
}
const from = process.env.RESEND_FROM ?? "Circo <noreply@circo.game>"

const emailLogo = `
  <div style="margin-bottom:28px;">
    <span style="color:#c9a84c;font-size:30px;font-weight:700;letter-spacing:0.06em;font-family:Georgia,'Times New Roman',serif;">CIRCO</span>
    <span style="color:#7c5cbf;font-size:13px;font-weight:300;letter-spacing:0.25em;font-family:Arial,sans-serif;margin-left:8px;vertical-align:middle;">GAME</span>
  </div>
`

export async function sendWelcomeEmail(email: string, name: string, loginUrl: string, tempPassword?: string) {
  await getResend().emails.send({
    from,
    to: email,
    subject: "Bem-vindo ao Circo Game 🎪",
    html: `
      <div style="background:#0d0d14;color:#f0eeee;font-family:sans-serif;padding:40px;max-width:500px;margin:0 auto;border-radius:12px;">
        ${emailLogo}
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Você acaba de ser cadastrado na plataforma <strong>Circo Game</strong>. Acompanhe seu progresso, veja suas estrelas e suba no ranking!</p>
        ${tempPassword ? `
        <div style="background:#16162a;border-radius:12px;padding:20px;margin:24px 0;border-left:3px solid #c9a84c;">
          <p style="margin:0 0 8px;font-size:13px;color:#8888aa;">Seus dados de acesso:</p>
          <p style="margin:0 0 4px;font-size:14px;">E-mail: <strong>${email}</strong></p>
          <p style="margin:0;font-size:14px;">Senha provisória: <strong style="color:#c9a84c;font-size:18px;letter-spacing:2px;">${tempPassword}</strong></p>
          <p style="margin:8px 0 0;font-size:12px;color:#8888aa;">Você será solicitado a criar uma nova senha no primeiro acesso.</p>
        </div>
        ` : ""}
        <a href="${loginUrl}" style="display:inline-block;background:#c9a84c;color:#0d0d14;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin:8px 0 24px;">
          Acessar minha conta
        </a>
        <p style="color:#8888aa;font-size:12px;margin-top:32px;">Se você não esperava este e-mail, pode ignorá-lo.</p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(email: string, name: string, resetUrl: string) {
  await getResend().emails.send({
    from,
    to: email,
    subject: "Recuperação de senha — Circo Game",
    html: `
      <div style="background:#0d0d14;color:#f0eeee;font-family:sans-serif;padding:40px;max-width:500px;margin:0 auto;border-radius:12px;">
        ${emailLogo}
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova:</p>
        <a href="${resetUrl}" style="display:inline-block;background:#c9a84c;color:#0d0d14;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin:24px 0;">
          Redefinir senha
        </a>
        <p style="color:#8888aa;font-size:12px;">Este link expira em 1 hora. Se você não solicitou a recuperação, ignore este e-mail.</p>
      </div>
    `,
  })
}

export async function sendStarsNotificationEmail(
  email: string,
  studentName: string,
  classTitle: string,
  classDate: string,
  stars: number,
  note?: string | null,
  totalStars?: number,
) {
  const starEmoji = ["😴", "⭐", "⭐⭐", "⭐⭐⭐"][stars]
  const encouragement =
    stars === 3
      ? "Aula incrível! Continue assim! 🎪"
      : stars === 2
        ? "Boa aula! Você está evoluindo! 🤸"
        : stars === 1
          ? "Continue se dedicando, você vai chegar lá! 💪"
          : "Que tal aparecer na próxima aula? Te esperamos! 🌱"

  await getResend().emails.send({
    from,
    to: email,
    subject: `${starEmoji} Suas estrelas da aula — Circo Game`,
    html: `
      <div style="background:#0d0d14;color:#f0eeee;font-family:sans-serif;padding:40px;max-width:500px;margin:0 auto;border-radius:12px;">
        ${emailLogo}
        <p>Olá, <strong>${studentName}</strong>!</p>
        <p>O professor registrou sua avaliação da aula <strong>${classTitle || classDate}</strong>:</p>
        <div style="background:#16162a;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
          <div style="font-size:48px;margin-bottom:8px;">${starEmoji || "—"}</div>
          <div style="color:#c9a84c;font-size:32px;font-weight:700;">${stars} ${stars === 1 ? "estrela" : "estrelas"}</div>
          ${note ? `<p style="color:#8888aa;font-size:14px;margin-top:12px;font-style:italic;">"${note}"</p>` : ""}
        </div>
        <p style="color:#c9a84c;">${encouragement}</p>
        ${totalStars !== undefined ? `<p style="color:#8888aa;font-size:13px;">Total acumulado: <strong style="color:#f0c040;">${totalStars} ★</strong></p>` : ""}
      </div>
    `,
  })
}

export async function sendMentionEmail(
  email: string,
  mentionedName: string,
  authorName: string,
  context: "post" | "comment",
  postUrl: string,
  preview: string,
) {
  await getResend().emails.send({
    from,
    to: email,
    subject: `${authorName} marcou você no feed — Circo Game`,
    html: `
      <div style="background:#0d0d14;color:#f0eeee;font-family:sans-serif;padding:40px;max-width:500px;margin:0 auto;border-radius:12px;">
        ${emailLogo}
        <p>Olá, <strong>${mentionedName}</strong>!</p>
        <p><strong>${authorName}</strong> marcou você em um ${context === "post" ? "post" : "comentário"} no feed:</p>
        <div style="background:#16162a;border-radius:12px;padding:20px;margin:24px 0;border-left:3px solid #c9a84c;">
          <p style="margin:0;font-size:14px;color:#d0d0e0;font-style:italic;">"${preview}"</p>
        </div>
        <a href="${postUrl}" style="display:inline-block;background:#c9a84c;color:#0d0d14;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin:8px 0 24px;">
          Ver no feed
        </a>
        <p style="color:#8888aa;font-size:12px;margin-top:32px;">Circo Game — Plataforma de gamificação para turmas de circo.</p>
      </div>
    `,
  })
}
