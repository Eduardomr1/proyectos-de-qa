import { test, expect } from './fixtures/a11y.js';
import { AuthPage, TareasPage, nuevoUsuario, registrarse, agregarTarea } from './helpers.js';

test.describe('Accesibilidad Automatizada (A11y - WCAG 2.1 AA)', () => {
  let authPage;
  let tareasPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    tareasPage = new TareasPage(page);
  });

  test.describe('Auditorías WCAG 2.1 AA en Vistas Principales', () => {
    test('la pantalla de login cumple estándares WCAG 2.1 AA sin violaciones', async ({ page, auditarAccesibilidad }) => {
      await authPage.goto();
      await authPage.esperarPantallaLogin();

      await auditarAccesibilidad();
    });

    test('la pantalla de registro cumple estándares WCAG 2.1 AA sin violaciones', async ({ page, auditarAccesibilidad }) => {
      await authPage.goto();
      await authPage.irAModoRegistro();
      await authPage.esperarPantallaRegistro();

      await auditarAccesibilidad();
    });

    test('el estado de error de autenticación cumple estándares WCAG 2.1 AA', async ({ page, auditarAccesibilidad }) => {
      await authPage.goto();
      await authPage.iniciarSesion('no-existe@prueba.com', 'badpassword');
      await authPage.esperarError('Credenciales invalidas');

      await auditarAccesibilidad();
    });

    test('la pantalla de tareas vacía cumple estándares WCAG 2.1 AA', async ({ page, auditarAccesibilidad }) => {
      await registrarse(page);
      await tareasPage.esperarMensajeVacio();

      await auditarAccesibilidad();
    });

    test('la pantalla de tareas con elementos activos y completados cumple WCAG 2.1 AA', async ({ page, auditarAccesibilidad }) => {
      await registrarse(page);
      await tareasPage.agregarTarea('Revisar contraste y etiquetas WCAG');
      await tareasPage.agregarTarea('Verificar navegación por teclado en listas');
      await tareasPage.marcarTarea('Revisar contraste y etiquetas WCAG');

      await expect(tareasPage.obtenerCheckbox('Revisar contraste y etiquetas WCAG')).toBeChecked();
      await auditarAccesibilidad();
    });
  });

  test.describe('Contraste de Colores (WCAG 1.4.3)', () => {
    test('el formulario de autenticación supera las reglas de contraste mínimo', async ({ page, auditarAccesibilidad }) => {
      await authPage.goto();
      await auditarAccesibilidad({ rules: ['color-contrast'] });
    });

    test('el panel principal de tareas y elementos de texto superan contraste mínimo', async ({ page, auditarAccesibilidad }) => {
      await registrarse(page);
      await tareasPage.agregarTarea('Validar contraste de elementos completados');
      await tareasPage.marcarTarea('Validar contraste de elementos completados');

      await auditarAccesibilidad({ rules: ['color-contrast'] });
    });
  });

  test.describe('Estructura Semántica y Roles ARIA (WCAG 1.3.1 y 4.1.2)', () => {
    test('los encabezados y regiones principales definen una jerarquía semántica válida', async ({ page }) => {
      await authPage.goto();
      const main = page.locator('main.container');
      await expect(main).toBeVisible();

      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toHaveText('Iniciar sesion');

      // Validar que en tareas existe encabezado h1 semántico
      await registrarse(page);
      const h1Tareas = page.getByRole('heading', { level: 1 });
      await expect(h1Tareas).toHaveText('Mis tareas');
    });

    test('las alertas y mensajes de error exponen role="alert" para lectores de pantalla', async ({ page }) => {
      await authPage.goto();
      await authPage.iniciarSesion('erroneo@prueba.com', 'pwd123456');

      const alert = page.getByRole('alert');
      await expect(alert).toBeVisible();
      await expect(alert).toHaveAttribute('role', 'alert');
    });

    test('los botones y controles de acción poseen nombres accesibles definidos', async ({ page }) => {
      await registrarse(page);
      await tareasPage.agregarTarea('Revisión de botón eliminar');

      const botonEliminar = page.getByRole('button', { name: 'Eliminar Revisión de botón eliminar' });
      await expect(botonEliminar).toBeVisible();
      await expect(botonEliminar).toHaveAttribute('aria-label', 'Eliminar Revisión de botón eliminar');

      const logoutBtn = page.getByRole('button', { name: 'Cerrar sesion' });
      await expect(logoutBtn).toBeVisible();
    });
  });

  test.describe('Navegación por Teclado y Foco Visible (WCAG 2.1.1 y 2.4.7)', () => {
    test('permite navegar y completar el formulario de login exclusivamente con teclado (Tab y Enter)', async ({ page }) => {
      const usuario = nuevoUsuario();
      await authPage.registrar(usuario.email, usuario.password);
      await tareasPage.cerrarSesion();
      await authPage.esperarPantallaLogin();

      // Iniciar navegación por teclado
      await page.keyboard.press('Tab');
      await expect(authPage.emailInput).toBeFocused();
      await page.keyboard.type(usuario.email);

      await page.keyboard.press('Tab');
      await expect(authPage.passwordInput).toBeFocused();
      await page.keyboard.type(usuario.password);

      await page.keyboard.press('Tab');
      await expect(authPage.loginButton).toBeFocused();

      await page.keyboard.press('Enter');
      await tareasPage.esperarCarga();
    });

    test('permite crear y gestionar tareas utilizando teclado (Tab, Espacio y Enter)', async ({ page }) => {
      await registrarse(page);

      // Foco en el input de nueva tarea
      await tareasPage.newTaskInput.focus();
      await expect(tareasPage.newTaskInput).toBeFocused();
      await page.keyboard.type('Tarea creada con teclado');

      // Presionar Enter en el formulario para agregar
      await page.keyboard.press('Enter');
      await expect(page.getByText('Tarea creada con teclado')).toBeVisible();

      // Navegar con Tab hacia el checkbox y marcar con Barra Espaciadora
      const checkbox = tareasPage.obtenerCheckbox('Tarea creada con teclado');
      await checkbox.focus();
      await expect(checkbox).toBeFocused();
      await page.keyboard.press('Space');
      await expect(checkbox).toBeChecked();
    });
  });

  test.describe('Formularios y Etiquetas Accesibles (WCAG 3.3.2 y 1.3.5)', () => {
    test('los campos de autenticación cuentan con etiquetas asociadas y atributos autocomplete apropiados', async ({ page }) => {
      await authPage.goto();

      await expect(authPage.emailInput).toHaveAttribute('type', 'email');
      await expect(authPage.emailInput).toHaveAttribute('autocomplete', 'email');
      await expect(authPage.emailInput).toHaveAttribute('required', '');

      await expect(authPage.passwordInput).toHaveAttribute('type', 'password');
      await expect(authPage.passwordInput).toHaveAttribute('autocomplete', 'current-password');
      await expect(authPage.passwordInput).toHaveAttribute('required', '');
    });

    test('el campo de nueva tarea dispone de aria-label explícito para tecnologías asistivas', async ({ page }) => {
      await registrarse(page);
      await expect(tareasPage.newTaskInput).toHaveAttribute('aria-label', 'Nueva tarea');
      await expect(tareasPage.newTaskInput).toHaveAttribute('placeholder', 'Nueva tarea');
    });
  });
});
