// Regras de "é aniversário neste dia", sem acesso ao banco (usável no navegador).

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

// "MM-DD" da data de nascimento (dia UTC, como as colunas @db.Date).
export function birthMonthDay(birthDate: Date | string): string {
  return new Date(birthDate).toISOString().slice(5, 10)
}

// O dia "AAAA-MM-DD" é aniversário de quem nasceu em "MM-DD"?
// Quem nasceu em 29/02 comemora em 28/02 nos anos não bissextos.
export function isBirthdayOn(monthDay: string | null | undefined, ymd: string): boolean {
  if (!monthDay) return false
  const day = ymd.slice(5, 10)
  if (monthDay === day) return true
  return monthDay === "02-29" && day === "02-28" && !isLeapYear(Number(ymd.slice(0, 4)))
}
