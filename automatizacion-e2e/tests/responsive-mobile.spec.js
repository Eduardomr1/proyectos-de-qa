import { test, expect } from '@playwright/test';
import { AuthPage, TareasPage, registrarse } from './helpers.js';

test.describe('Pruebas Responsive y Mobile (Viewport 375x667)', () => {
  // Configurar viewport móvil explícito de 375x667 (iPhone SE / estándar móvil compacto)
  test.use({ viewport: { width: 375, height: 667 } });

  let authPage;
  let tareasPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    tareasPage = new TareasPage(page);
  });

  /**
   * Valida que no exista scroll horizontal involuntario en la página.
   * scrollWidth <= clientWidth tanto en documentElement como en body.
   */
  async function verificarSinScrollHorizontal(page, contexto = '') {
    const dimensiones = await page.evaluate(() => {
      const docEl = document.documentElement;
      const body = document.body;
      return {
        docScrollWidth: docEl.scrollWidth,
        docClientWidth: docEl.clientWidth,
        bodyScrollWidth: body.scrollWidth,
        bodyClientWidth: body.clientWidth,
        innerWidth: window.innerWidth,
      };
    });

    const scrollMaximo = Math.max(dimensiones.docScrollWidth, dimensiones.bodyScrollWidth);
    const anchoVisible = Math.min(dimensiones.docClientWidth, dimensiones.innerWidth);

    expect(
      scrollMaximo,
      `No debe haber scroll horizontal en [${contexto}]: scrollWidth (${scrollMaximo}px) debe ser <= clientWidth (${anchoVisible}px)`
    ).toBeLessThanOrEqual(anchoVisible);
  }

  /**
   * Valida que el bounding box del elemento cumpla con el tamaño táctil mínimo (>= 44px).
   * Según pautas WCAG 2.5.5 / Apple Human Interface Guidelines / Android Material Design.
   */
  async function verificarTouchTarget(locator, nombre, { minHeight = 44, minWidth = 44 } = {}) {
    await expect(locator, `El elemento interactivo '${nombre}' debe ser visible`).toBeVisible();
    const box = await locator.boundingBox();
    expect(box, `El elemento '${nombre}' debe tener dimensiones en el DOM`).not.toBeNull();

    expect(
      box.height,
      `La altura del touch target de '${nombre}' (${box.height}px) debe ser >= ${minHeight}px`
    ).toBeGreaterThanOrEqual(minHeight);

    expect(
      box.width,
      `El ancho del touch target de '${nombre}' (${box.width}px) debe ser >= ${minWidth}px`
    ).toBeGreaterThanOrEqual(minWidth);
  }

  test.describe('Prevención de Scroll Horizontal Involuntario (scrollWidth <= clientWidth)', () => {
    test('la pantalla de login no presenta scroll horizontal en 375x667', async ({ page }) => {
      await authPage.goto();
      await authPage.esperarPantallaLogin();
      await verificarSinScrollHorizontal(page, 'Pantalla de Login');
    });

    test('la pantalla de registro no presenta scroll horizontal en 375x667', async ({ page }) => {
      await authPage.goto();
      await authPage.irAModoRegistro();
      await authPage.esperarPantallaRegistro();
      await verificarSinScrollHorizontal(page, 'Pantalla de Registro');
    });

    test('la pantalla de tareas vacía no presenta scroll horizontal en 375x667', async ({ page }) => {
      await registrarse(page);
      await tareasPage.esperarMensajeVacio();
      await verificarSinScrollHorizontal(page, 'Pantalla de Tareas Vacía');
    });

    test('la pantalla de tareas con múltiples elementos no presenta scroll horizontal', async ({ page }) => {
      await registrarse(page);
      await tareasPage.agregarTarea('Revisar layout móvil en 375x667');
      await tareasPage.agregarTarea('Validar ausencia de desbordamiento horizontal');
      await tareasPage.marcarTarea('Revisar layout móvil en 375x667');

      await verificarSinScrollHorizontal(page, 'Lista con tareas activas y completadas');
    });

    test('un título largo continuo no genera scroll horizontal en 375x667 (BUG-003 en mobile)', async ({ page }) => {
      await registrarse(page);
      await tareasPage.agregarTarea('W'.repeat(180));

      await verificarSinScrollHorizontal(page, 'Tarea con título largo continuo');
    });

    test('la alerta de error no genera scroll horizontal en pantalla móvil', async ({ page }) => {
      await authPage.goto();
      await authPage.iniciarSesion('correo-inexistente@prueba.com', 'passwordErroneo');
      await authPage.esperarError('Credenciales invalidas');

      await verificarSinScrollHorizontal(page, 'Alerta de error visible');
    });
  });

  test.describe('Dimensiones de Touch Targets Mínimos (>= 44px)', () => {
    test('todos los controles interactivos de Login cumplen tamaño táctil >= 44px', async ({ page }) => {
      await authPage.goto();
      await authPage.esperarPantallaLogin();

      await verificarTouchTarget(authPage.emailInput, 'Input Email');
      await verificarTouchTarget(authPage.passwordInput, 'Input Contraseña');
      await verificarTouchTarget(authPage.loginButton, 'Botón Entrar');
      await verificarTouchTarget(authPage.switchToRegisterButton, 'Enlace Modo Registro');
    });

    test('todos los controles interactivos de Registro cumplen tamaño táctil >= 44px', async ({ page }) => {
      await authPage.goto();
      await authPage.irAModoRegistro();
      await authPage.esperarPantallaRegistro();

      await verificarTouchTarget(authPage.emailInput, 'Input Email (Registro)');
      await verificarTouchTarget(authPage.passwordInput, 'Input Contraseña (Registro)');
      await verificarTouchTarget(authPage.registerButton, 'Botón Registrarme');
      await verificarTouchTarget(authPage.switchToLoginButton, 'Enlace Modo Login');
    });

    test('los controles principales de gestión de tareas cumplen tamaño táctil >= 44px', async ({ page }) => {
      await registrarse(page);
      await tareasPage.esperarCarga();

      await verificarTouchTarget(tareasPage.logoutButton, 'Botón Cerrar Sesión');
      await verificarTouchTarget(tareasPage.newTaskInput, 'Input Nueva Tarea');
      await verificarTouchTarget(tareasPage.addButton, 'Botón Agregar Tarea');
    });

    test('las acciones individuales de cada tarea (label táctil y botón eliminar) cumplen >= 44px', async ({ page }) => {
      await registrarse(page);
      const nombreTarea = 'Elemento de prueba para touch targets';
      await tareasPage.agregarTarea(nombreTarea);

      const itemTarea = tareasPage.obtenerTarea(nombreTarea);
      const labelTactil = itemTarea.locator('label');
      const botonEliminar = page.getByRole('button', { name: `Eliminar ${nombreTarea}` });

      await verificarTouchTarget(labelTactil, 'Área táctil de selección de tarea');
      await verificarTouchTarget(botonEliminar, 'Botón Eliminar Tarea');
    });
  });

  test.describe('Flujos de Interacción Táctil en Dispositivo Móvil', () => {
    test('permite completar el ciclo de vida de una tarea mediante pulsaciones táctiles', async ({ page }) => {
      await registrarse(page);

      // Agregar tarea
      await tareasPage.newTaskInput.fill('Tarea gestionada en móvil');
      await tareasPage.addButton.click();
      await expect(page.getByText('Tarea gestionada en móvil')).toBeVisible();

      // Completar tarea pulsando el label accesible
      const checkbox = tareasPage.obtenerCheckbox('Tarea gestionada en móvil');
      await tareasPage.obtenerTarea('Tarea gestionada en móvil').locator('label').click();
      await expect(checkbox).toBeChecked();
      await tareasPage.esperarContador('0 pendientes');

      // Desmarcar pulsando nuevamente
      await tareasPage.obtenerTarea('Tarea gestionada en móvil').locator('label').click();
      await expect(checkbox).not.toBeChecked();
      await tareasPage.esperarContador('1 pendiente');

      // Eliminar tarea
      await tareasPage.eliminarTarea('Tarea gestionada en móvil');
      await expect(page.getByText('Tarea gestionada en móvil')).toHaveCount(0);
      await tareasPage.esperarMensajeVacio();
    });

    test('alternar entre Login y Registro responde con fluidez en pantalla táctil', async ({ page }) => {
      await authPage.goto();
      await authPage.esperarPantallaLogin();

      await authPage.switchToRegisterButton.click();
      await authPage.esperarPantallaRegistro();

      await authPage.switchToLoginButton.click();
      await authPage.esperarPantallaLogin();
    });
  });
});
