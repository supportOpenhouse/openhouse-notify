/**
 * Database seed script.
 * Run with: npm run db:seed
 *
 * Safe to run multiple times — uses upsert everywhere.
 */

import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

/** Must match notificationPanel credentials / createUser (bcrypt cost factor). */
const BCRYPT_ROUNDS = 12

// Use direct (non-pooled) connection for seeding
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL },
  },
})

const ADMIN_USER = {
  email: 'anurag.gautam@openhouse.in',
  name: 'Anurag Gautam',
  role: 'ADMIN' as const,
  status: 'ACTIVE' as const,
}

/**
 * Reads ADMIN_SEED_PASSWORD from the environment and returns a bcrypt hash.
 * The plaintext is never persisted — only set in .env for the duration of seeding.
 */
async function adminPasswordHashFromEnv(): Promise<string | undefined> {
  const plain = process.env.ADMIN_SEED_PASSWORD?.trim()
  if (!plain) return undefined
  if (plain.length < 8) {
    console.warn(
      '⚠️  ADMIN_SEED_PASSWORD is set but shorter than 8 characters — skipping password update.',
    )
    return undefined
  }
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

async function main() {
  console.log('🌱  Seeding database...\n')

  const passwordHash = await adminPasswordHashFromEnv()

  // ── Admin user ────────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { email: ADMIN_USER.email },
    update: {
      name: ADMIN_USER.name,
      role: ADMIN_USER.role,
      status: ADMIN_USER.status,
      ...(passwordHash !== undefined ? { password: passwordHash } : {}),
    },
    create: {
      email: ADMIN_USER.email,
      name: ADMIN_USER.name,
      role: ADMIN_USER.role,
      status: ADMIN_USER.status,
      ...(passwordHash !== undefined ? { password: passwordHash } : {}),
    },
  })

  console.log(`✅  Admin user ready`)
  console.log(`    id     : ${user.id}`)
  console.log(`    email  : ${user.email}`)
  console.log(`    name   : ${user.name}`)
  console.log(`    role   : ${user.role}`)
  console.log(`    status : ${user.status}`)
  console.log(
    `    auth   : ${user.password ? 'bcrypt password set (credentials + Google)' : 'OAuth / set ADMIN_SEED_PASSWORD and re-seed for password login'}`,
  )
  console.log()
  console.log('✨  Seed complete.')
  console.log()
  if (passwordHash) {
    console.log('   Sign in at http://localhost:3000/login with email + password (credentials).')
  } else {
    console.log('   Set ADMIN_SEED_PASSWORD in backend/.env and run db:seed again to enable password login.')
    console.log('   Or sign in with Google — NextAuth will link the Account row to this user.')
  }
}

main()
  .catch((err) => {
    console.error('❌  Seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
