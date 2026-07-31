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

  /**
   * Redirige al login si no hay sesión. Llamar al tope de cada página protegida.
   *
   * Si la contraseña la asignó un tercero (alta masiva o reset del admin),
   * muestra el diálogo de cambio obligatorio. Se hace aquí, en la capa común,
   * para que valga en las 19 pantallas sin repetirlo en cada una.
   */
  function requireAuth() {
    if (!getToken()) {
      redirectToLogin();
      return false;
    }
    const user = getUser();
    if (user && user.mustChangePassword) {
      showPasswordChangeModal();
    }

    // Ajustes de barra y sidebar comunes a todas las pantallas. Se hacen aquí y
    // no en fillSidebar() porque solo una de las cinco pantallas la invoca.
    onReady(function () {
      applyNavPermissions();
      applyRoleVisibility();
      mountLogoutButton();
      removeDeadTopbarIcons();
    });

    // Bloquea la pantalla si el rol no puede verla (entrada por URL directa).
    return enforcePagePermission();
  }

  // ---- Permisos de navegación ---------------------------------------------

  /**
   * Qué secciones puede ver cada rol.
   *
   * Es una capa de presentación, no de seguridad: el backend ya rechaza con 403
   * lo que no corresponde. Sirve para no ofrecer pantallas que fallarían al
   * abrirse, que es lo que hace parecer que el sistema está roto.
   */
  var NAV_PERMISSIONS = {
    ADMIN: ['home', 'calculof', 'resultsf', 'reportesf', 'adminf'],
    NOMINA: ['home', 'calculof', 'resultsf', 'reportesf'],
    GERENTE: ['home', 'resultsf', 'reportesf'],
    COORDINADOR: ['home', 'resultsf', 'reportesf'],
    EMPLEADO: ['home', 'resultsf'],
  };

  /** Secciones permitidas para el usuario actual (unión de sus roles). */
  function allowedSections() {
    var user = getUser() || {};
    var roles = user.roles || [];
    var allowed = {};
    roles.forEach(function (role) {
      (NAV_PERMISSIONS[role] || []).forEach(function (section) {
        allowed[section] = true;
      });
    });
    // Sin rol reconocido queda lo mínimo: su propio resumen y resultados.
    if (Object.keys(allowed).length === 0) {
      allowed.home = true;
      allowed.resultsf = true;
    }
    return allowed;
  }

  /** Sección a la que apunta un enlace, deducida de su href. */
  function sectionOfHref(href) {
    var match = String(href || '').match(
      /(home|calculof|resultsf|reportesf|adminf|loginf)/,
    );
    return match ? match[1] : null;
  }

  /** Oculta del menú lateral las secciones que el rol no puede abrir. */
  function applyNavPermissions() {
    var allowed = allowedSections();
    document.querySelectorAll('a.z-nav-item').forEach(function (link) {
      var section = sectionOfHref(link.getAttribute('href'));
      if (section && !allowed[section]) link.remove();
    });
  }

  /**
   * Si se entra por URL directa a una pantalla no permitida, redirige al inicio
   * en vez de dejar una pantalla que carga y falla con errores de permiso.
   */
  function enforcePagePermission() {
    var section = sectionOfHref(location.pathname);
    if (!section || section === 'loginf') return true;

    if (!allowedSections()[section]) {
      location.href = '/home/code.html';
      return false;
    }
    return true;
  }

  /** Ejecuta cuando el DOM esté listo (los scripts corren antes del sidebar). */
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  // ---- Cambio de contraseña obligatorio -----------------------------------

  /**
   * Diálogo modal, sin salida posible salvo cambiando la contraseña: no se
   * cierra con Escape, ni clic afuera, ni botón de cancelar. La única
   * alternativa es cerrar sesión.
   */
  function showPasswordChangeModal() {
    if (document.getElementById('zambon-pwd-modal')) return; // ya visible

    const overlay = document.createElement('div');
    overlay.id = 'zambon-pwd-modal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'zambon-pwd-title');
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;' +
      'justify-content:center;padding:1rem;background:rgba(15,23,42,.75);' +
      'backdrop-filter:blur(2px)';

    // Este diálogo se inyecta desde JS, así que no hereda las clases de la
    // hoja compartida: los colores van en línea, tomados del mismo tema oscuro
    // (surface-container #1e2020, on-surface #e2e2e2, primary #c3cd17).
    // `color-scheme:dark` en el contenedor evita que el navegador pinte los
    // <input type="password"> con su fondo blanco por defecto.
    var pwdField =
      'width:100%;padding:.6rem .75rem;border:1px solid rgba(255,255,255,.1);' +
      'border-radius:8px;background:rgba(26,28,28,.55);color:#e2e2e2;' +
      'font-family:inherit;font-size:.9rem';

    overlay.innerHTML = [
      '<div style="color-scheme:dark;background:#1e2020;border-radius:14px;max-width:26rem;',
      'width:100%;padding:1.75rem;border:1px solid rgba(255,255,255,.06);',
      'box-shadow:0 20px 45px rgba(0,0,0,.5)">',
      '<h2 id="zambon-pwd-title" style="margin:0 0 .5rem;font-size:1.15rem;',
      'font-weight:650;color:#e2e2e2">Cambia tu contraseña</h2>',
      '<p style="margin:0 0 1.25rem;font-size:.875rem;line-height:1.5;color:#c8c8ae">',
      'Tu contraseña actual fue asignada por un administrador. Para proteger tu ',
      'cuenta, define una nueva antes de continuar.</p>',
      '<form id="zambon-pwd-form" novalidate>',
      '<label style="display:block;font-size:.8rem;font-weight:600;color:#c8c8ae;',
      'margin-bottom:.3rem">Contraseña actual</label>',
      '<input id="zambon-pwd-current" type="password" autocomplete="current-password" ',
      'style="' + pwdField + ';margin-bottom:.9rem" required>',
      '<label style="display:block;font-size:.8rem;font-weight:600;color:#c8c8ae;',
      'margin-bottom:.3rem">Nueva contraseña</label>',
      '<input id="zambon-pwd-new" type="password" autocomplete="new-password" ',
      'style="' + pwdField + ';margin-bottom:.9rem" required>',
      '<label style="display:block;font-size:.8rem;font-weight:600;color:#c8c8ae;',
      'margin-bottom:.3rem">Repite la nueva contraseña</label>',
      '<input id="zambon-pwd-repeat" type="password" autocomplete="new-password" ',
      'style="' + pwdField + '" required>',
      '<p id="zambon-pwd-error" role="alert" style="display:none;margin:.75rem 0 0;',
      'font-size:.8rem;color:#ffb4ab"></p>',
      '<button id="zambon-pwd-submit" type="submit" style="width:100%;margin-top:1.25rem;',
      'padding:.7rem;border:0;border-radius:8px;background:#c3cd17;color:#303300;',
      'font-size:.9rem;font-weight:600;cursor:pointer">Guardar y continuar</button>',
      '<button id="zambon-pwd-logout" type="button" style="width:100%;margin-top:.5rem;',
      'padding:.55rem;border:0;border-radius:8px;background:transparent;color:#92927a;',
      'font-size:.8rem;cursor:pointer">Cerrar sesión</button>',
      '</form></div>',
    ].join('');

    document.body.appendChild(overlay);
    // Evita que la página de fondo se desplace mientras el diálogo está abierto.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const el = (id) => document.getElementById(id);
    const errorBox = el('zambon-pwd-error');
    const submit = el('zambon-pwd-submit');
    setTimeout(() => el('zambon-pwd-current').focus(), 50);

    function fail(message) {
      errorBox.textContent = message;
      errorBox.style.display = 'block';
    }

    el('zambon-pwd-logout').addEventListener('click', function () {
      document.body.style.overflow = previousOverflow;
      logout();
    });

    el('zambon-pwd-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      errorBox.style.display = 'none';

      const currentPassword = el('zambon-pwd-current').value;
      const newPassword = el('zambon-pwd-new').value;
      const repeat = el('zambon-pwd-repeat').value;

      if (newPassword.length < 8) {
        return fail('La nueva contraseña debe tener al menos 8 caracteres.');
      }
      if (newPassword !== repeat) {
        return fail('Las dos contraseñas nuevas no coinciden.');
      }
      if (newPassword === currentPassword) {
        return fail('La nueva contraseña debe ser distinta de la actual.');
      }

      submit.disabled = true;
      submit.textContent = 'Guardando…';
      try {
        await request('PATCH', '/users/me/password', { currentPassword, newPassword });

        // El backend ya bajó el flag; se refleja en la sesión local para que el
        // diálogo no reaparezca al navegar a otra pantalla.
        const user = getUser() || {};
        user.mustChangePassword = false;
        localStorage.setItem(USER_KEY, JSON.stringify(user));

        document.body.style.overflow = previousOverflow;
        overlay.remove();
      } catch (err) {
        submit.disabled = false;
        submit.textContent = 'Guardar y continuar';
        fail(
          err && err.message
            ? err.message
            : 'No se pudo cambiar la contraseña. Inténtalo de nuevo.',
        );
      }
    });
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

  /** ¿El usuario tiene alguno de estos roles? */
  function hasRole() {
    const user = getUser();
    const mine = (user && user.roles) || [];
    const wanted = Array.prototype.slice.call(arguments);
    return wanted.some((r) => mine.indexOf(r) !== -1);
  }

  /**
   * Personal de la operación (ADMIN/NÓMINA): ve el tablero completo, carga
   * ventas y ejecuta cálculos. El resto de roles solo consulta lo suyo.
   */
  function isStaff() {
    return hasRole('ADMIN', 'NOMINA');
  }

  /**
   * Ve a más de una persona (jefes y staff). Un EMPLEADO solo se ve a sí mismo,
   * así que los filtros por equipo no le aportan nada.
   */
  function seesOthers() {
    return hasRole('ADMIN', 'NOMINA', 'GERENTE', 'COORDINADOR');
  }

  /**
   * Oculta los nodos marcados con `data-role` que no correspondan al usuario.
   * Uso en el markup: data-role="staff" | "sees-others" | "employee-only".
   * Se retiran del DOM (no se ocultan por CSS) para que no queden accesibles.
   */
  function applyRoleVisibility(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-role]').forEach((node) => {
      const need = node.getAttribute('data-role');
      let ok = true;
      if (need === 'staff') ok = isStaff();
      else if (need === 'sees-others') ok = seesOthers();
      else if (need === 'employee-only') ok = !isStaff();
      if (!ok) node.remove();
    });
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

  /**
   * Añade "Cerrar sesión" bajo el perfil del sidebar.
   *
   * Se inserta desde aquí y no en cada HTML para que las cinco pantallas con
   * sidebar lo tengan igual sin poder desincronizarse.
   */
  function mountLogoutButton() {
    // El bloque de perfil es el último hijo del sidebar (clase mt-auto).
    var profile = document.querySelector('aside .mt-auto');
    if (!profile) return;
    // Se busca dentro del propio contenedor: requireAuth() puede ejecutarse más
    // de una vez y no debe apilar botones.
    if (profile.querySelector('#z-logout')) return;

    var button = document.createElement('button');
    button.id = 'z-logout';
    button.type = 'button';
    button.className = 'z-nav-item w-full mt-4';
    button.style.cssText =
      'display:flex;align-items:center;gap:.75rem;width:100%;padding:.6rem .5rem;' +
      'border:0;background:transparent;color:rgba(255,255,255,.62);cursor:pointer;' +
      'font:inherit;font-size:.875rem;border-radius:10px;text-align:left;' +
      'transition:background-color .16s ease-out,color .16s ease-out;';
    button.innerHTML =
      '<span class="material-symbols-outlined" style="font-size:20px">logout</span>' +
      'Cerrar sesión';

    // Realce solo con ratón: en táctil el hover se queda pegado tras el toque.
    if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      button.addEventListener('mouseenter', function () {
        button.style.backgroundColor = 'rgba(255,255,255,.06)';
        button.style.color = '#fff';
      });
      button.addEventListener('mouseleave', function () {
        button.style.backgroundColor = 'transparent';
        button.style.color = 'rgba(255,255,255,.62)';
      });
    }

    button.addEventListener('click', function () {
      confirmAction('¿Cerrar sesión?', { confirmLabel: 'Cerrar sesión' }).then(function (ok) {
        if (ok) logout();
      });
    });

    profile.appendChild(button);
  }

  /**
   * Retira los iconos decorativos de la barra superior (campana, engranaje y
   * avatar): no tienen comportamiento asociado, y un control que no responde
   * al clic se lee como una función rota. El perfil y el cierre de sesión
   * viven en el sidebar.
   */
  function removeDeadTopbarIcons() {
    var topbar = document.querySelector('.z-topbar');
    if (!topbar) return;

    topbar.querySelectorAll('button').forEach(function (btn) {
      // Solo los que no tienen manejador propio ni destino declarado.
      if (btn.id || btn.dataset.keep || btn.onclick) return;
      var icon = btn.querySelector('.material-symbols-outlined');
      var name = icon ? icon.textContent.trim() : '';
      if (name === 'notifications' || name === 'settings') btn.remove();
    });

    // El avatar es un div sin acción: se identifica por el icono "person".
    topbar.querySelectorAll('div').forEach(function (node) {
      if (node.children.length !== 1) return;
      var icon = node.querySelector('.material-symbols-outlined');
      if (icon && icon.textContent.trim() === 'person') node.remove();
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

  // ---- Diálogos ------------------------------------------------------------
  //
  // Reemplazan a confirm() y prompt() nativos, que ignoran el tema del sistema
  // y aparecen anclados al navegador. Ambos devuelven una promesa.

  var Z_SURFACE = '#1e2020';
  var Z_TEXT = '#e2e2e2';
  var Z_MUTED = '#c8c8ae';
  var Z_ACCENT = '#c3cd17';
  var Z_DANGER = '#ffb4ab';

  /** Contenedor del diálogo: velo, centrado y bloqueo del scroll de fondo. */
  function buildDialog(labelledBy) {
    var overlay = document.createElement('div');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', labelledBy);
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:1300;display:flex;align-items:center;' +
      'justify-content:center;padding:1rem;background:rgba(0,0,0,.6);' +
      'backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)';

    var panel = document.createElement('div');
    panel.style.cssText =
      'background:' + Z_SURFACE + ';border:1px solid rgba(255,255,255,.06);' +
      'border-radius:1rem;padding:1.5rem;width:100%;max-width:26rem;' +
      'box-shadow:0 20px 45px rgba(0,0,0,.45);font-family:Poppins,sans-serif;' +
      'opacity:0;transform:scale(.97);' +
      'transition:opacity 180ms var(--z-ease,cubic-bezier(.23,1,.32,1)),' +
      'transform 180ms var(--z-ease,cubic-bezier(.23,1,.32,1))';
    overlay.appendChild(panel);

    var previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.appendChild(overlay);
    requestAnimationFrame(function () {
      panel.style.opacity = '1';
      panel.style.transform = 'scale(1)';
    });

    return {
      overlay: overlay,
      panel: panel,
      close: function () {
        document.body.style.overflow = previousOverflow;
        overlay.remove();
      },
    };
  }

  /** Botón con la identidad del sistema. variant: primary | ghost | danger. */
  function dialogButton(label, variant) {
    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    var background =
      variant === 'primary' ? Z_ACCENT : variant === 'danger' ? '#93000a' : 'rgba(255,255,255,.05)';
    var color =
      variant === 'primary' ? '#303300' : variant === 'danger' ? '#ffdad6' : Z_TEXT;
    button.style.cssText =
      'flex:1;padding:.6rem 1rem;border:0;border-radius:.75rem;cursor:pointer;' +
      'font:600 14px Poppins,sans-serif;letter-spacing:.02em;' +
      'background:' + background + ';color:' + color + ';' +
      'transition:background-color 160ms cubic-bezier(.23,1,.32,1),transform 160ms cubic-bezier(.23,1,.32,1)';
    button.addEventListener('mousedown', function () { button.style.transform = 'scale(0.97)'; });
    button.addEventListener('mouseup', function () { button.style.transform = 'scale(1)'; });
    button.addEventListener('mouseleave', function () { button.style.transform = 'scale(1)'; });
    return button;
  }

  /**
   * Confirmación. `options.danger` tiñe el botón de acción para las operaciones
   * irreversibles (cerrar un periodo, desactivar a alguien).
   *
   * Devuelve una promesa: los llamadores deben usar `await`.
   */
  function confirmAction(message, options) {
    options = options || {};
    return new Promise(function (resolve) {
      var dialog = buildDialog('z-confirm-title');
      var lines = String(message).split('\n');

      var title = document.createElement('h2');
      title.id = 'z-confirm-title';
      title.textContent = options.title || lines[0];
      title.style.cssText =
        'margin:0 0 .5rem;font-size:1.05rem;font-weight:650;color:' + Z_TEXT;
      dialog.panel.appendChild(title);

      var rest = (options.title ? lines : lines.slice(1)).join('\n').trim();
      if (rest) {
        var body = document.createElement('p');
        body.textContent = rest;
        body.style.cssText =
          'margin:0 0 1.25rem;font-size:.875rem;line-height:1.5;color:' + Z_MUTED +
          ';white-space:pre-line';
        dialog.panel.appendChild(body);
      }

      var actions = document.createElement('div');
      actions.style.cssText = 'display:flex;gap:.5rem;margin-top:1.25rem';
      var cancel = dialogButton(options.cancelLabel || 'Cancelar', 'ghost');
      var accept = dialogButton(options.confirmLabel || 'Confirmar', options.danger ? 'danger' : 'primary');
      actions.appendChild(cancel);
      actions.appendChild(accept);
      dialog.panel.appendChild(actions);

      function finish(result) {
        document.removeEventListener('keydown', onKey);
        dialog.close();
        resolve(result);
      }
      function onKey(e) {
        if (e.key === 'Escape') finish(false);
        if (e.key === 'Enter') finish(true);
      }

      cancel.addEventListener('click', function () { finish(false); });
      accept.addEventListener('click', function () { finish(true); });
      dialog.overlay.addEventListener('click', function (e) {
        if (e.target === dialog.overlay) finish(false); // clic fuera = cancelar
      });
      document.addEventListener('keydown', onKey);
      setTimeout(function () { accept.focus(); }, 50);
    });
  }

  /**
   * Formulario modal. `fields` es una lista de
   * `{ name, label, type, value, options, required, hint }`;
   * `type` admite 'text', 'number', 'date' y 'select' (con `options`
   * `[{ value, label }]`).
   *
   * Resuelve con un objeto `{ name: valor }`, o `null` si se cancela.
   */
  function promptForm(titleText, fields, options) {
    options = options || {};
    return new Promise(function (resolve) {
      var dialog = buildDialog('z-form-title');

      var title = document.createElement('h2');
      title.id = 'z-form-title';
      title.textContent = titleText;
      title.style.cssText =
        'margin:0 0 1.25rem;font-size:1.05rem;font-weight:650;color:' + Z_TEXT;
      dialog.panel.appendChild(title);

      var form = document.createElement('form');
      form.noValidate = true;
      form.style.cssText = 'display:flex;flex-direction:column;gap:.9rem';

      var controls = {};
      fields.forEach(function (field) {
        var wrapper = document.createElement('label');
        wrapper.style.cssText = 'display:flex;flex-direction:column;gap:.3rem';

        var caption = document.createElement('span');
        caption.textContent = field.label + (field.required ? ' *' : '');
        caption.style.cssText =
          'font-size:.75rem;font-weight:600;letter-spacing:.01em;color:' + Z_MUTED;
        wrapper.appendChild(caption);

        var control;
        if (field.type === 'select') {
          control = document.createElement('select');
          (field.options || []).forEach(function (option) {
            var node = document.createElement('option');
            node.value = option.value;
            node.textContent = option.label;
            if (String(option.value) === String(field.value)) node.selected = true;
            control.appendChild(node);
          });
        } else {
          control = document.createElement('input');
          control.type = field.type || 'text';
          control.value = field.value == null ? '' : field.value;
        }
        control.style.cssText =
          'width:100%;background:rgba(26,28,28,.5);color:' + Z_TEXT + ';border:0;' +
          'border-bottom:2px solid #474834;border-radius:.5rem .5rem 0 0;' +
          'padding:.5rem .75rem;font:400 15px Poppins,sans-serif;outline:none;' +
          'transition:border-color 200ms ease';
        control.addEventListener('focus', function () { control.style.borderBottomColor = Z_ACCENT; });
        control.addEventListener('blur', function () { control.style.borderBottomColor = '#474834'; });
        wrapper.appendChild(control);

        if (field.hint) {
          var hint = document.createElement('span');
          hint.textContent = field.hint;
          hint.style.cssText = 'font-size:.7rem;color:' + Z_MUTED + ';opacity:.75';
          wrapper.appendChild(hint);
        }

        controls[field.name] = control;
        form.appendChild(wrapper);
      });

      var error = document.createElement('p');
      error.setAttribute('role', 'alert');
      error.style.cssText =
        'display:none;margin:.25rem 0 0;font-size:.78rem;color:' + Z_DANGER;
      form.appendChild(error);

      var actions = document.createElement('div');
      actions.style.cssText = 'display:flex;gap:.5rem;margin-top:.5rem';
      var cancel = dialogButton('Cancelar', 'ghost');
      var accept = dialogButton(options.submitLabel || 'Guardar', 'primary');
      actions.appendChild(cancel);
      actions.appendChild(accept);
      form.appendChild(actions);
      dialog.panel.appendChild(form);

      function finish(result) {
        document.removeEventListener('keydown', onKey);
        dialog.close();
        resolve(result);
      }
      function onKey(e) { if (e.key === 'Escape') finish(null); }

      cancel.addEventListener('click', function () { finish(null); });
      accept.addEventListener('click', function () { form.requestSubmit ? form.requestSubmit() : submit(); });
      dialog.overlay.addEventListener('click', function (e) {
        if (e.target === dialog.overlay) finish(null);
      });
      document.addEventListener('keydown', onKey);
      form.addEventListener('submit', function (e) { e.preventDefault(); submit(); });

      function submit() {
        var values = {};
        for (var i = 0; i < fields.length; i++) {
          var field = fields[i];
          var value = String(controls[field.name].value || '').trim();
          if (field.required && !value) {
            error.textContent = 'Completa el campo «' + field.label + '».';
            error.style.display = 'block';
            controls[field.name].focus();
            return;
          }
          values[field.name] = value;
        }
        if (options.validate) {
          var message = options.validate(values);
          if (message) {
            error.textContent = message;
            error.style.display = 'block';
            return;
          }
        }
        finish(values);
      }

      setTimeout(function () {
        var first = fields[0] && controls[fields[0].name];
        if (first) first.focus();
      }, 50);
    });
  }

  // ---- Periodos: meses y ciclos -------------------------------------------
  // Un ciclo agrupa 4 meses y guarda como `periodMonth` su ÚLTIMO mes (Ciclo1
  // → 4). Etiquetarlo con ese número lo haría leerse como "abril", así que la
  // regla de etiquetado vive aquí y no repartida por once pantallas.

  const MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                       'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  function periodLabel(p) {
    if (p.periodType !== 'CYCLE' || !p.cycleNumber) {
      return p.periodYear + '-' + String(p.periodMonth).padStart(2, '0');
    }
    const first = (p.cycleNumber - 1) * 4;
    return p.periodYear + ' · Ciclo ' + p.cycleNumber +
           ' (' + MONTH_NAMES[first] + '–' + MONTH_NAMES[first + 3] + ')';
  }

  /**
   * Periodos ordenados y etiquetados. `kind` filtra por tipo:
   *   'month' → cálculo, novedades, garantizado, ventas (lo que liquida)
   *   'cycle' → pesos, curva, cuotas (lo que se parametriza por ciclo)
   *   'all'   → reportes y resultados, que sí miran ambos
   */
  async function listPeriods(kind) {
    const rows = await request('GET', '/periods');
    const wanted = kind === 'cycle' ? 'CYCLE' : kind === 'month' ? 'MONTH' : null;
    return rows
      .filter((p) => !wanted || p.periodType === wanted)
      .sort((a, b) =>
        b.periodYear - a.periodYear ||
        a.periodType.localeCompare(b.periodType) ||
        b.periodMonth - a.periodMonth)
      .map((p) => Object.assign({}, p, { label: periodLabel(p) }));
  }

  /** Llena un <select> con los periodos del tipo pedido. Devuelve las filas. */
  async function fillPeriodSelect(selectOrId, kind, opts) {
    const sel = typeof selectOrId === 'string'
      ? document.getElementById(selectOrId)
      : selectOrId;
    if (!sel) return [];

    const rows = await listPeriods(kind);
    const options = opts || {};
    sel.innerHTML = '';
    if (options.placeholder) {
      const o = document.createElement('option');
      o.value = '';
      o.textContent = options.placeholder;
      sel.appendChild(o);
    }
    rows.forEach(function (p) {
      const o = document.createElement('option');
      o.value = p.periodId;
      o.textContent = p.label;
      sel.appendChild(o);
    });
    // Sin marcador, el primero queda seleccionado: es el periodo más reciente.
    if (!options.placeholder && rows.length) sel.value = rows[0].periodId;
    return rows;
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
    showPasswordChangeModal,
    getUser,
    getToken,
    clearSession,
    homePathForRole,
    hasRole,
    isStaff,
    seesOthers,
    applyRoleVisibility,

    // helpers de formato
    orDash,
    money,
    percent,
    initials,
    escapeHtml,
    DASH,
    ApiError,

    // periodos
    listPeriods,
    fillPeriodSelect,
    periodLabel,

    // helpers de UI
    fillSidebar,
    toast,
    confirmAction,
    promptForm,
  };
})(window);
