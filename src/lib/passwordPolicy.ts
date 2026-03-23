/**
 * Password policy enforcement.
 *
 * Checks:
 * 1. Minimum length (12 characters)
 * 2. Not in the list of top common/breached passwords
 */

const COMMON_PASSWORDS = new Set([
  '123456', '123456789', '12345678', '12345', '1234567',
  'password', 'password1', 'password12', 'password123', 'password1234',
  'iloveyou', 'admin', 'welcome', 'monkey', 'login',
  'abc123', 'starwars', 'dragon', 'master', 'hello',
  'freedom', 'whatever', 'qazwsx', 'trustno1', 'batman',
  '111111', '1234567890', 'sunshine', 'princess', 'letmein',
  'shadow', 'superman', 'michael', 'football', 'charlie',
  'donald', 'password2', 'qwerty', 'qwerty123', 'qwertyuiop',
  'ashley', 'bailey', 'access', 'baseball', 'solo',
  'passw0rd', 'p@ssword', 'p@ssw0rd', 'hunter2', 'hunter',
  'mustang', 'jessica', 'thomas', 'ranger', 'buster',
  'hockey', 'soccer', 'biteme', 'robert', 'george',
  '696969', '777777', '1111111', '12341234', 'aa123456',
  'monkey123', 'nicole', 'samsung', 'qwerty1', 'azerty',
  'abc1234567', 'passpass', 'pass123', 'test1234', 'test123456',
  'changeme', 'changeme123', 'admin123', 'root123', 'toor',
  'superman1', 'batman123', 'spiderman', 'iloveyou1', 'iloveu',
  'loveme', 'fuckyou', 'fuckyou1', 'sex', 'god',
  'cheese', 'butter', 'cheese123', 'maggie', 'loveyou',
  'lol123', 'flower', 'zxcvbnm', 'zxcvbn', '123321',
  '123abc', '1234abcd', 'abcd1234', 'abc12345', 'abcdefgh',
  'abcdef', 'qwe123', '1q2w3e4r', '1q2w3e', 'q1w2e3r4',
  'dragon1', 'dragon12', 'harley', 'dakota', 'maverick',
  'cookie', 'matrix', 'jordan', 'jordan23', 'michael1',
  'password11', 'password01', 'pass1234', 'hello123', 'hello1234',
  'welcome1', 'welcome123', 'welcome12', 'adminadmin',
  'pass@word1', 'p@$$w0rd', 'passw0rd1', 'Passw0rd', 'Password1',
  'Password123', 'P@ssword1', 'P@ssword', 'Pa$$w0rd', 'Pa$$word',
]);

export type PasswordPolicyResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Validates a password against the password policy.
 * Returns { ok: true } if valid, or { ok: false, reason } if not.
 */
export function checkPasswordPolicy(password: string): PasswordPolicyResult {
  if (!password || password.length < 12) {
    return { ok: false, reason: 'Password must be at least 12 characters long.' };
  }

  if (COMMON_PASSWORDS.has(password) || COMMON_PASSWORDS.has(password.toLowerCase())) {
    return {
      ok: false,
      reason: 'This password is too common. Please choose a more unique password.',
    };
  }

  return { ok: true };
}
