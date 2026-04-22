import bcrypt from 'bcryptjs';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Role } from '@prisma/client';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../../config/env';
import { prisma } from '../../infrastructure/prisma';
import { badRequest, unauthorized } from '../../shared/http-errors';
import { signAuthToken } from '../../shared/security/jwt';
import { toPublicUser } from '../user/user.service';

type OidcDiscovery = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  userinfo_endpoint?: string;
};

type OidcTx = {
  state: string;
  nonce: string;
  codeVerifier: string;
  redirectAfterLogin?: string;
  createdAt: number;
};

type OidcStartResult = {
  authorizationUrl: string;
  transactionCookie: string;
};

type OidcCompleteInput = {
  code: string;
  state: string;
  transactionCookie: string;
};

let discoveryCache: OidcDiscovery | null = null;
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

function isOidcEnabled() {
  return Boolean(
    env.OIDC_ISSUER && env.OIDC_CLIENT_ID && env.OIDC_CLIENT_SECRET && env.OIDC_REDIRECT_URI
  );
}

function requireOidcEnabled() {
  if (!isOidcEnabled()) {
    throw badRequest('OIDC n est pas configure. Verifie OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET et OIDC_REDIRECT_URI.');
  }
}

function toBase64Url(value: Buffer | string) {
  return Buffer.from(value).toString('base64url');
}

function signTxPayload(payload: string) {
  return createHmac('sha256', env.JWT_SECRET).update(payload).digest('base64url');
}

function encodeOidcTx(tx: OidcTx) {
  const payload = toBase64Url(JSON.stringify(tx));
  const signature = signTxPayload(payload);
  return `${payload}.${signature}`;
}

function decodeOidcTx(cookieValue: string): OidcTx {
  const [payload, signature] = cookieValue.split('.');
  if (!payload || !signature) {
    throw badRequest('Transaction OIDC invalide');
  }

  const expected = signTxPayload(payload);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    throw badRequest('Transaction OIDC invalide (signature)');
  }

  const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as OidcTx;
  if (!parsed.state || !parsed.nonce || !parsed.codeVerifier || !parsed.createdAt) {
    throw badRequest('Transaction OIDC incomplete');
  }

  const ageMs = Date.now() - parsed.createdAt;
  if (ageMs > 10 * 60 * 1000) {
    throw badRequest('Transaction OIDC expiree');
  }

  return parsed;
}

async function fetchOidcDiscovery(): Promise<OidcDiscovery> {
  if (discoveryCache) {
    return discoveryCache;
  }

  requireOidcEnabled();
  const issuer = env.OIDC_ISSUER.replace(/\/$/, '');
  const discoveryUrl = `${issuer}/.well-known/openid-configuration`;
  const response = await fetch(discoveryUrl);

  if (!response.ok) {
    throw badRequest(`Impossible de charger la configuration OIDC: ${response.status}`);
  }

  const discovery = (await response.json()) as OidcDiscovery;
  if (
    !discovery.issuer ||
    !discovery.authorization_endpoint ||
    !discovery.token_endpoint ||
    !discovery.jwks_uri
  ) {
    throw badRequest('Configuration OIDC incomplete depuis le provider');
  }

  discoveryCache = discovery;
  return discovery;
}

async function fetchOidcJwks() {
  if (jwksCache) {
    return jwksCache;
  }

  const discovery = await fetchOidcDiscovery();
  jwksCache = createRemoteJWKSet(new URL(discovery.jwks_uri));
  return jwksCache;
}

async function fetchUserInfo(discovery: OidcDiscovery, accessToken: string) {
  if (!discovery.userinfo_endpoint) {
    return null;
  }

  const response = await fetch(discovery.userinfo_endpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as Record<string, unknown>;
}

function buildOidcRedirect(redirectAfterLogin?: string) {
  const preferred = redirectAfterLogin?.trim();
  if (preferred) {
    return preferred;
  }

  const fallback = env.OIDC_POST_LOGIN_REDIRECT.trim();
  if (fallback) {
    return fallback;
  }

  return '';
}

function generateRandomB64(size = 32) {
  return randomBytes(size).toString('base64url');
}

function buildCodeChallenge(codeVerifier: string) {
  return createHash('sha256').update(codeVerifier).digest('base64url');
}

async function exchangeOidcCode(discovery: OidcDiscovery, code: string, codeVerifier: string) {
  const tokenResponse = await fetch(discovery.token_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.OIDC_REDIRECT_URI,
      client_id: env.OIDC_CLIENT_ID,
      client_secret: env.OIDC_CLIENT_SECRET,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenResponse.ok) {
    throw unauthorized(`Echec echange OIDC (status ${tokenResponse.status})`);
  }

  const tokenJson = (await tokenResponse.json()) as {
    id_token?: string;
    access_token?: string;
  };

  if (!tokenJson.id_token) {
    throw unauthorized('ID token OIDC manquant');
  }

  return {
    idToken: tokenJson.id_token,
    accessToken: tokenJson.access_token,
  };
}

function mergeIdentityFromUserInfo(
  identity: { email: string; name: string },
  userInfo: Record<string, unknown> | null
) {
  if (!userInfo) {
    return identity;
  }

  const next = { ...identity };
  if (!next.email && typeof userInfo.email === 'string') {
    next.email = userInfo.email;
  }
  if (!next.name && typeof userInfo.name === 'string') {
    next.name = userInfo.name;
  }

  return next;
}

async function verifyOidcIdentity(
  discovery: OidcDiscovery,
  idToken: string,
  expectedNonce: string,
  accessToken?: string
) {
  const jwks = await fetchOidcJwks();
  const verified = await jwtVerify(idToken, jwks, {
    issuer: discovery.issuer,
    audience: env.OIDC_CLIENT_ID,
  });
  const claims = verified.payload as Record<string, unknown>;

  if (claims.nonce !== expectedNonce) {
    throw unauthorized('Nonce OIDC invalide');
  }

  let identity = {
    email: typeof claims.email === 'string' ? claims.email : '',
    name: typeof claims.name === 'string' ? claims.name : '',
  };

  if ((!identity.email || !identity.name) && accessToken) {
    const userInfo = await fetchUserInfo(discovery, accessToken);
    identity = mergeIdentityFromUserInfo(identity, userInfo);
  }

  if (!identity.email) {
    throw unauthorized('Le provider OIDC n a pas retourne d email');
  }

  const normalizedEmail = identity.email.toLowerCase().trim();
  const displayName = identity.name.trim() || normalizedEmail.split('@')[0] || 'User';
  return { normalizedEmail, displayName };
}

async function findOrCreateOidcUser(email: string, name: string) {
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    return user;
  }

  const randomPassword = generateRandomB64(32);
  const passwordHash = await bcrypt.hash(randomPassword, 12);
  user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: Role.USER,
    },
  });

  return user;
}

export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase().trim() },
  });

  if (!user) {
    // On ne dit pas "email inexistant" en prod pour éviter l'énumération
    throw unauthorized('Identifiants invalides');
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw unauthorized('Identifiants invalides');
  }

  const token = signAuthToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    clientName: env.CLIENT_NAME,
  });

  return {
    token,
    user: toPublicUser(user),
  };
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    // Tu peux ajouter select ici pour être encore plus strict
  });

  if (!user) {
    throw unauthorized('Utilisateur introuvable');
  }

  return toPublicUser(user);
}

export async function startOidcLogin(redirectAfterLogin?: string): Promise<OidcStartResult> {
  requireOidcEnabled();
  const discovery = await fetchOidcDiscovery();

  const state = generateRandomB64();
  const nonce = generateRandomB64();
  const codeVerifier = generateRandomB64(48);
  const codeChallenge = buildCodeChallenge(codeVerifier);
  const tx: OidcTx = {
    state,
    nonce,
    codeVerifier,
    redirectAfterLogin: buildOidcRedirect(redirectAfterLogin),
    createdAt: Date.now(),
  };

  const query = new URLSearchParams({
    client_id: env.OIDC_CLIENT_ID,
    response_type: 'code',
    scope: env.OIDC_SCOPES,
    redirect_uri: env.OIDC_REDIRECT_URI,
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return {
    authorizationUrl: `${discovery.authorization_endpoint}?${query.toString()}`,
    transactionCookie: encodeOidcTx(tx),
  };
}

export async function completeOidcLogin(input: OidcCompleteInput) {
  requireOidcEnabled();
  const discovery = await fetchOidcDiscovery();
  const tx = decodeOidcTx(input.transactionCookie);

  if (tx.state !== input.state) {
    throw unauthorized('Etat OIDC invalide');
  }

  const tokenExchange = await exchangeOidcCode(discovery, input.code, tx.codeVerifier);
  const identity = await verifyOidcIdentity(
    discovery,
    tokenExchange.idToken,
    tx.nonce,
    tokenExchange.accessToken
  );
  const user = await findOrCreateOidcUser(identity.normalizedEmail, identity.displayName);

  const token = signAuthToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    clientName: env.CLIENT_NAME,
  });

  return {
    token,
    user: toPublicUser(user),
    redirectAfterLogin: tx.redirectAfterLogin,
  };
}