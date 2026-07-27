/* ============================================================================
 *  Zambon OS — Cliente de API del frontend
 *  Capa única de acceso al backend NestJS (mismo origen: /api/v1).
 *  Sin dependencias externas. Maneja el JWT, el refresh y la sesión.
 *
 *  Uso:
 *    const data = await ZambonAPI.get('/results?periodId=...');
 *    await ZambonAPI.login(username, password);
 *    ZambonAPI.requireAuth();   // redirige al login si no hay sesión
 * ==========================================================================*/
(function (global) {
  'use strict';

  const BASE = '/api/v1';
  const TOKEN_KEY = 'zambon.accessToken';
  const REFRESH_KEY = 'zambon.refreshToken';
  const USER_KEY = 'zambon.user';
  const LOGIN_PAGE = '/loginf/code.html';

  // ---- Estado de sesión (localStorage) ------------------------------------
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }
  function getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY);
  }
  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch {
      return null;
    }
  }
  function setSession(payload) {
    if (payload.accessToken) localStorage.setItem(TOKEN_KEY, payload.accessToken);
    if (payload.refreshToken) localStorage.setItem(REFRESH_KEY, payload.refreshToken);
    if (payload.user) localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  }
  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // ---- Núcleo de petición -------------------------------------------------
  async function request(method, path, body, opts) {
    opts = opts || {};
    const headers = { Accept: 'application/json' };
    const token = getToken();
    if (token && !opts.noAuth) headers['Authorization'] = 'Bearer ' + token;

    const init = { method, headers };
    if (body !== undefined && body !== null) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    let res = await fetch(BASE + path, init);

    // Un 401 con sesión activa: intenta refrescar el token una vez.
    if (res.status === 401 && !opts.noAuth && !opts._retried && getRefreshToken()) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        return request(method, path, body, Object.assign({}, opts, { _retried: true }));
      }
    }

    if (res.status === 401 && !opts.noAuth) {
      // Sesión inválida definitivamente → al login.
      clearSession();
      redirectToLogin();
      throw new ApiError(401, 'Sesión expirada');
    }

    return parseResponse(res);
  }

  async function parseResponse(res) {
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const payload = isJson ? await res.json().catch(() => null) : await res.text();

    if (!res.ok) {
      const message =
        (payload && payload.message) || res.statusText || 'Error de red';
      throw new ApiError(res.status, Array.isArray(message) ? message.join(', ') : message, payload);
    }
    return payload;
  }

  async function tryRefresh() {
    try {
      const res = await fetch(BASE + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: getRefreshToken() }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setSession(data);
      return true;
    } catch {
      return false;
    }
  }

  function ApiError(status, message, payload) {
    this.name = 'ApiError';
    this.status = status;
    this.message = message;
    this.payload = payload;
  }
  ApiError.prototype = Object.create(Error.prototype);

  // ---- Sesión / navegación ------------------------------------------------
  function redirectToLogin() {
    if (!location.pathname.endsWith('code.html') || !location.pathname.includes('loginf')) {
      location.href = LOGIN_PAGE;
    }
  }

  /** Redirige al login si no hay sesión. Llamar al tope de cada página protegida. */
  function requireAuth() {
    if (!getToken()) {
      redirectToLogin();
      return false;
    }
    return true;
  }

  async function login(username, password) {
    const data = await request('POST', '/auth/login', { username, password }, { noAuth: true });
    setSession(data);
    return data;
  }

  async function logout() {
    try {
      await request('POST', '/auth/logout');
    } catch {
      /* aunque falle, limpiamos localmente */
    }
    clearSession();
    location.href = LOGIN_PAGE;
  }

  /** Ruta de inicio según el rol principal del usuario. */
  function homePathForRole(roles) {
    // Empleado ve poco: entra a su resumen. El resto entra al home general.
    return '/home/code.html';
  }

  // ---- Helpers de presentación (consistentes en todo el FE) ---------------
  const DASH = '—'; // '—' guion largo para "sin dato"

  /** Devuelve el valor o '—' si es null/undefined/''. */
  function orDash(v) {
    if (v === null || v === undefined || v === '') return DASH;
    return v;
  }

  /** Formatea dinero en pesos colombianos, o '—' si no hay dato. */
  function money(v) {
    if (v === null || v === undefined || v === '' || isNaN(Number(v))) return DASH;
    return '$' + Number(v).toLocaleString('es-CO', { maximumFractionDigits: 0 });
  }

  /** Formatea un porcentaje (recibe fracción 0..n), o '—'. */
  function percent(v, decimals) {
    if (v === null || v === undefined || v === '' || isNaN(Number(v))) return DASH;
    return (Number(v) * 100).toFixed(decimals == null ? 0 : decimals) + '%';
  }

  /** Iniciales para avatares. */
  function initials(name) {
    if (!name) return '';
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('');
  }

  /** Escapa texto para inserción segura en HTML. */
  function escapeHtml(s) {
    if (s === null || s === undefined) return DASH;
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ---- Helpers de UI compartidos (sidebar, toast, confirm) ----------------

  /** Rellena el perfil del sidebar (usuario + rol) desde la sesión. */
  function fillSidebar() {
    var u = getUser() || {};
    document.querySelectorAll('[data-user-name]').forEach(function (n) {
      n.textContent = u.username || DASH;
    });
    document.querySelectorAll('[data-user-role]').forEach(function (n) {
      n.textContent = (u.roles && u.roles[0]) || DASH;
    });
  }

  /** Notificación efímera (feedback de acciones de escritura). type: ok | error. */
  function toast(message, type) {
    var host = document.getElementById('z-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'z-toast-host';
      host.style.cssText =
        'position:fixed;right:20px;bottom:20px;z-index:1400;display:flex;flex-direction:column;gap:8px;';
      document.body.appendChild(host);
    }
    var t = document.createElement('div');
    var ok = type !== 'error';
    t.style.cssText =
      'padding:12px 16px;border-radius:12px;font:500 14px Poppins,sans-serif;' +
      'color:' + (ok ? '#303300' : '#ffdad6') + ';' +
      'background:' + (ok ? '#c3cd17' : '#93000a') + ';' +
      'box-shadow:0 4px 20px rgba(0,0,0,.4);max-width:360px;' +
      'opacity:0;transform:translateY(8px);transition:opacity .2s,transform .2s;';
    t.textContent = message;
    host.appendChild(t);
    requestAnimationFrame(function () { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
    setTimeout(function () {
      t.style.opacity = '0'; t.style.transform = 'translateY(8px)';
      setTimeout(function () { t.remove(); }, 250);
    }, 3200);
  }

  /** Confirmación simple (para acciones irreversibles como cerrar periodo). */
  function confirmAction(message) {
    return window.confirm(message);
  }

  // ---- API pública --------------------------------------------------------
  global.ZambonAPI = {
    get: (path, opts) => request('GET', path, null, opts),
    post: (path, body, opts) => request('POST', path, body, opts),
    patch: (path, body, opts) => request('PATCH', path, body, opts),
    put: (path, body, opts) => request('PUT', path, body, opts),
    del: (path, opts) => request('DELETE', path, null, opts),

    login,
    logout,
    requireAuth,
    getUser,
    getToken,
    clearSession,
    homePathForRole,

    // helpers de formato
    orDash,
    money,
    percent,
    initials,
    escapeHtml,
    DASH,
    ApiError,

    // helpers de UI
    fillSidebar,
    toast,
    confirmAction,
  };
})(window);
