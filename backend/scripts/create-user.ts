/**
 * Create (or update password for) a user with email + bcrypt password for NextAuth
 * credentials login. Intended for @gmail.com / @googlemail.com addresses that can
 * later link Google OAuth (allowDangerousEmailAccountLinking on the frontend).
 *
 * Password: set CREATE_USER_PASSWORD in the environment (recommended), or pass
 * --password=... (visible in shell history — avoid on shared machines).
 *
 * Usage (from backend/):
 *   CREATE_USER_PASSWORD='...' npm run db:create-user -- --email=you@gmail.com --execute
 *   CREATE_USER_PASSWORD='...' npm run db:create-user -- --email=you@gmail.com --name="You" --role=ADMIN --execute
 *
 * Flags:
 *   --email=           Required.
 *   --name=            Optional; defaults to a title-cased local-part of the email.
 *   --role=            One of Prisma Role enum (default: VIEWER).
 *   --any-email        Skip @gmail.com / @googlemail.com check (e.g. Google Workspace).
 *   --update           If the user exists, update password (and name if --name given).
 *   --execute          Perform create/update (otherwise dry-run only).
 */
/* eslint-disable no-console -- CLI script */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, Role, UserStatus, type Prisma } from '@prisma/client';

/** Must match prisma/seed.ts and Frontend credentials provider expectations. */
const BCRYPT_ROUNDS = 12;

const GMAIL_HOST = /@(gmail|googlemail)\.com$/i;

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL },
  },
});

const ROLE_VALUES = new Set<string>(Object.values(Role));

function parseArg(prefix: string): string | undefined {
  const raw = process.argv.find((a) => a.startsWith(prefix));
  if (!raw) return undefined;
  return raw.slice(prefix.length);
}

function parseArgs() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(`
create-user — insert a User row (email + bcrypt password) for credentials sign-in.

Password:
  Prefer CREATE_USER_PASSWORD in the environment (min 8 characters).
  Or pass --password=... (discouraged on shared hosts).

Options:
  --email=           Required.
  --name=            Display name (optional).
  --role=            ${Array.from(ROLE_VALUES).sort().join(' | ')} (default: VIEWER)
  --any-email        Allow non-Gmail domains.
  --update           Update an existing user (password; name if provided).
  --password=        Plaintext password (optional if CREATE_USER_PASSWORD is set).
  --execute          Write to the database.

Examples:
  CREATE_USER_PASSWORD='secret12345' npm run db:create-user -- --email=you@gmail.com --execute
  CREATE_USER_PASSWORD='secret12345' npm run db:create-user -- --email=you@gmail.com --role=ADMIN --execute
`);
    process.exit(0);
  }

  const email = parseArg('--email=')?.trim().toLowerCase();
  const nameArg = parseArg('--name=')?.trim();
  const roleArg = parseArg('--role=')?.trim();
  const passwordArg = parseArg('--password=');
  const anyEmail = argv.includes('--any-email');
  const update = argv.includes('--update');
  const execute = argv.includes('--execute');

  return { email, nameArg, roleArg, passwordArg, anyEmail, update, execute };
}

function defaultNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'User';
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function assertGmail(email: string, anyEmail: boolean): void {
  if (anyEmail) return;
  if (!GMAIL_HOST.test(email)) {
    console.error(
      'Error: email must be @gmail.com or @googlemail.com (use --any-email for other domains).',
    );
    process.exit(1);
  }
}

function resolvePassword(passwordArg: string | undefined): { plain: string; source: 'env' | 'arg' } {
  const fromEnv = process.env.CREATE_USER_PASSWORD?.trim();
  const plain = (passwordArg ?? fromEnv)?.trim();
  if (!plain) {
    console.error(
      'Error: set CREATE_USER_PASSWORD in the environment or pass --password=... (min 8 characters).',
    );
    process.exit(1);
  }
  if (plain.length < 8) {
    console.error('Error: password must be at least 8 characters.');
    process.exit(1);
  }
  return { plain, source: passwordArg !== undefined && passwordArg.trim() !== '' ? 'arg' : 'env' };
}

async function main() {
  const { email, nameArg, roleArg, passwordArg, anyEmail, update, execute } = parseArgs();

  if (!email) {
    console.error('Error: --email= is required. Use --help for usage.');
    process.exit(1);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Error: invalid email format.');
    process.exit(1);
  }

  assertGmail(email, anyEmail);

  let role: Role = Role.VIEWER;
  if (roleArg) {
    if (!ROLE_VALUES.has(roleArg)) {
      console.error(`Error: invalid --role=. Must be one of: ${[...ROLE_VALUES].sort().join(', ')}`);
      process.exit(1);
    }
    role = roleArg as Role;
  }

  const name = nameArg && nameArg.length > 0 ? nameArg : defaultNameFromEmail(email);
  const { plain, source } = resolvePassword(passwordArg);
  const passwordHash = await bcrypt.hash(plain, BCRYPT_ROUNDS);

  if (source === 'arg') {
    console.warn('Warning: password taken from --password= (consider CREATE_USER_PASSWORD instead).\n');
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing && !update) {
    console.error(
      `Error: user already exists (${existing.id}). Use --update to change password, or pick another email.`,
    );
    process.exit(1);
  }

  const plan = existing
    ? `UPDATE user ${existing.id} — set new password${nameArg ? ' and name' : ''}`
    : `CREATE user — email=${email} name=${name} role=${role} status=${UserStatus.ACTIVE}`;

  console.log(`\n${plan}\n`);

  if (!execute) {
    console.log('Dry run only. Re-run with --execute to apply.\n');
    return;
  }

  const data: Prisma.UserCreateInput = {
    email,
    name,
    password: passwordHash,
    role,
    status: UserStatus.ACTIVE,
    emailVerified: new Date(),
  };

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        password: passwordHash,
        ...(nameArg ? { name } : {}),
        status: UserStatus.ACTIVE,
        emailVerified: existing.emailVerified ?? new Date(),
      },
    });
    console.log(`Updated user ${existing.id} (${email}).\n`);
  } else {
    const user = await prisma.user.create({ data });
    console.log(`Created user ${user.id} (${email}).`);
    console.log(`  role   : ${user.role}`);
    console.log(`  name   : ${user.name}`);
    console.log('  Sign in with email + password on the frontend /login page.\n');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
