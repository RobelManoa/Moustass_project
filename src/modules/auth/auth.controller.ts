import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { badRequest, unauthorized } from '../../shared/http-errors';
import { env } from '../../config/env';
import { oidcCallbackQuerySchema } from './auth.schemas';
import * as authService from './auth.service';

function getCookieValue(request: Request, key: string) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) {
    return '';
  }

  const chunks = cookieHeader.split(';').map((chunk) => chunk.trim());
  for (const chunk of chunks) {
    const [cookieKey, ...cookieValueParts] = chunk.split('=');
    if (cookieKey === key) {
      return decodeURIComponent(cookieValueParts.join('='));
    }
  }

  return '';
}

function appendTokenToRedirect(redirectTo: string, token: string) {
  try {
    const url = new URL(redirectTo);
    url.searchParams.set('token', token);
    return url.toString();
  } catch {
    const separator = redirectTo.includes('?') ? '&' : '?';
    return `${redirectTo}${separator}token=${encodeURIComponent(token)}`;
  }
}

export const login = asyncHandler(async (request: Request, response: Response) => {
  const result = await authService.login(request.body);
  response.json(result);
});

export const me = asyncHandler(async (request: Request, response: Response) => {
  // Protection explicite contre le cas où auth n'est pas défini
  if (!request.auth?.userId) {
    throw new Error('Authentication required');
  }

  const user = await authService.me(request.auth.userId);
  response.json({ user });
});

export const oidcLogin = asyncHandler(async (request: Request, response: Response) => {
  const redirectAfterLogin =
    typeof request.query.redirect === 'string' ? request.query.redirect : undefined;

  const result = await authService.startOidcLogin(redirectAfterLogin);

  response.cookie('oidc_tx', result.transactionCookie, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth/oidc',
    maxAge: 10 * 60 * 1000,
  });

  response.redirect(result.authorizationUrl);
});

export const oidcCallback = asyncHandler(async (request: Request, response: Response) => {
  const query = oidcCallbackQuerySchema.parse(request.query);
  if (query.error) {
    throw unauthorized(query.error_description || `OIDC error: ${query.error}`);
  }

  if (!query.code || !query.state) {
    throw badRequest('Parametres OIDC manquants (code/state)');
  }

  const transactionCookie = getCookieValue(request, 'oidc_tx');
  if (!transactionCookie) {
    throw badRequest('Cookie de transaction OIDC manquant');
  }

  const result = await authService.completeOidcLogin({
    code: query.code,
    state: query.state,
    transactionCookie,
  });

  response.clearCookie('oidc_tx', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth/oidc',
  });

  if (result.redirectAfterLogin) {
    response.redirect(appendTokenToRedirect(result.redirectAfterLogin, result.token));
    return;
  }

  response.json({ token: result.token, user: result.user });
});