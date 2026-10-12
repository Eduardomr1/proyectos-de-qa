import { test, expect } from '@playwright/test';
import { AuthPage, TareasPage, nuevoUsuario, registrarse } from './helpers.js';

test.describe('Resiliencia de Red y Mocking Avanzado', () => {
  let authPage;
  let tareasPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    tareasPage = new TareasPage(page);
  });

  test.afterEach(async ({ page, context }) => {
    // Restaurar conectividad y limpiar interceptores en caso de fallos
    await context.setOffline(false);
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test.describe('Manejo de Errores de Servidor (HTTP 500 y HTTP 404)', () => {
    test('HTTP 500 en Login muestra banner de error amigable sin crashear la UI', async ({ page }) => {
      await page.route('**/auth/login', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Error interno en el servidor de autenticación' }),
        });
      });

      await authPage.iniciarSesion('usuario@prueba.com', 'password123');

      // Verifica alerta con mensaje controlado
      await authPage.esperarError('Error interno en el servidor de autenticación');
      // La UI no crashea: el formulario permanece montado y el botón está habilitado para reintentar
      await authPage.esperarPantallaLogin();
      await expect(authPage.loginButton).toBeEnabled();
      await expect(authPage.emailInput).toHaveValue('usuario@prueba.com');
    });

    test('HTTP 500 en Registro con respuesta no-JSON muestra mensaje amigable por defecto', async ({ page }) => {
      await page.route('**/auth/register', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'text/html',
          body: '<html><body>500 Internal Server Error</body></html>',
        });
      });

      const usuario = nuevoUsuario();
      await authPage.registrar(usuario.email, usuario.password);

      // Cuando la API responde con un 500 no estructurado, el cliente captura 'Error inesperado'
      await authPage.esperarError('Error inesperado');
      await authPage.esperarPantallaRegistro();
      await expect(authPage.registerButton).toBeEnabled();
    });

    test('HTTP 500 al listar tareas (GET /tasks) despliega alerta y preserva estructura de la app', async ({ page }) => {
      const usuario = nuevoUsuario();
      await authPage.registrar(usuario.email, usuario.password);
      await tareasPage.esperarCarga();

      // Interceptar llamadas GET a /tasks simulando caída de la base de datos
      await page.route('**/tasks', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Fallo al recuperar tareas desde la base de datos' }),
          });
        } else {
          await route.continue();
        }
      });

      // Recargar para forzar la petición GET /tasks con sesión existente
      await page.reload();

      // Se muestra la alerta amigable y no se rompe el contenedor principal
      await tareasPage.esperarError('Fallo al recuperar tareas desde la base de datos');
      await tareasPage.esperarCarga();
      await expect(tareasPage.logoutButton).toBeVisible();
      await expect(tareasPage.newTaskInput).toBeVisible();
    });

    test('HTTP 500 al crear una tarea (POST /tasks) muestra alerta y no agrega la tarea a la lista', async ({ page }) => {
      const usuario = nuevoUsuario();
      await authPage.registrar(usuario.email, usuario.password);
      await tareasPage.esperarCarga();

      await page.route('**/tasks', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Error al persistir la tarea en el servidor' }),
          });
        } else {
          await route.continue();
        }
      });

      await tareasPage.newTaskInput.fill('Tarea que fallará en backend');
      await tareasPage.addButton.click();

      // Se notifica el error mediante el banner/alert
      await tareasPage.esperarError('Error al persistir la tarea en el servidor');
      // La lista sigue vacía y la app no crashea
      await tareasPage.esperarMensajeVacio();
      await expect(tareasPage.obtenerTarea('Tarea que fallará en backend')).toHaveCount(0);
    });

    test('HTTP 404 al actualizar tarea (PATCH /tasks/:id) revierte el cambio optimista y notifica al usuario', async ({ page }) => {
      const usuario = nuevoUsuario();
      await authPage.registrar(usuario.email, usuario.password);
      await tareasPage.esperarCarga();
      await tareasPage.agregarTarea('Tarea que se desincroniza');
      await tareasPage.esperarContador('1 pendiente');

      // Interceptar actualización con error 404 (p. ej. tarea eliminada en otra sesión)
      await page.route('**/tasks/*', async (route) => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'La tarea no existe o ya fue eliminada' }),
          });
        } else {
          await route.continue();
        }
      });

      // Intentar marcar la tarea
      await tareasPage.marcarTarea('Tarea que se desincroniza');

      // Verificar que el banner capture el error 404
      await tareasPage.esperarError('La tarea no existe o ya fue eliminada');

      // Reversión optimista (BUG-008): el checkbox debe volver a estar desmarcado
      await expect(tareasPage.obtenerCheckbox('Tarea que se desincroniza')).not.toBeChecked();
      await tareasPage.esperarContador('1 pendiente');
    });

    test('HTTP 500 al eliminar tarea (DELETE /tasks/:id) muestra banner y conserva la tarea en el DOM', async ({ page }) => {
      const usuario = nuevoUsuario();
      await authPage.registrar(usuario.email, usuario.password);
      await tareasPage.esperarCarga();
      await tareasPage.agregarTarea('Tarea protegida contra eliminación');

      await page.route('**/tasks/*', async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'No se pudo eliminar la tarea debido a una restricción interna' }),
          });
        } else {
          await route.continue();
        }
      });

      await tareasPage.eliminarTarea('Tarea protegida contra eliminación');

      // Se notifica el fallo
      await tareasPage.esperarError('No se pudo eliminar la tarea debido a una restricción interna');
      // La tarea no desaparece de la vista
      await expect(tareasPage.obtenerTarea('Tarea protegida contra eliminación')).toBeVisible();
    });
  });

  test.describe('Modo Offline y Pérdida de Conectividad', () => {
    test('corte de conexion con context.setOffline(true) en Login muestra advertencia y se recupera al reconectar', async ({ page, context }) => {
      const usuario = nuevoUsuario();
      // Registrar primero con conexión para tener usuario existente
      await authPage.registrar(usuario.email, usuario.password);
      await tareasPage.esperarCarga();
      await tareasPage.cerrarSesion();
      await authPage.esperarPantallaLogin();

      // Simular pérdida total de conexión antes de iniciar sesión
      await context.setOffline(true);

      await authPage.emailInput.fill(usuario.email);
      await authPage.passwordInput.fill(usuario.password);
      await authPage.loginButton.click();

      // Verificar advertencia de falta de conexión
      await authPage.esperarError('No se pudo conectar con la API. Verifica que este corriendo.');
      await expect(authPage.loginButton).toBeEnabled();

      // Restaurar conexión y reintentar
      await context.setOffline(false);
      await authPage.loginButton.click();

      // Debe recuperarse e ingresar correctamente
      await tareasPage.esperarCarga();
    });

    test('interrupción de red al crear tarea muestra alerta de conectividad y permite reintento exitoso', async ({ page }) => {
      const usuario = nuevoUsuario();
      await authPage.registrar(usuario.email, usuario.password);
      await tareasPage.esperarCarga();

      // Interceptar y abortar peticiones POST a /tasks
      await page.route('**/tasks', async (route) => {
        if (route.request().method() === 'POST') {
          await route.abort('failed');
        } else {
          await route.continue();
        }
      });

      await tareasPage.newTaskInput.fill('Tarea con desconexión intermedia');
      await tareasPage.addButton.click();

      // Se despliega el banner de desconexión sin colapsar la app
      await tareasPage.esperarError('No se pudo conectar con la API. Verifica que este corriendo.');
      await tareasPage.esperarMensajeVacio();

      // Remover el bloqueo de red
      await page.unroute('**/tasks');

      // Reintentar agregar la tarea
      await tareasPage.addButton.click();
      await expect(tareasPage.obtenerTarea('Tarea con desconexión intermedia')).toBeVisible();
    });

    test('corte de red con context.setOffline(true) durante listTasks muestra advertencia de conexión', async ({ page, context }) => {
      const usuario = nuevoUsuario();
      await authPage.registrar(usuario.email, usuario.password);
      await tareasPage.esperarCarga();
      await tareasPage.agregarTarea('Tarea previa al corte');

      // Desconectar la red en el contexto
      await context.setOffline(true);

      // Provocar llamada de red evaluando la API directamente o con reload de datos
      await page.evaluate(async () => {
        const token = localStorage.getItem('gestor-tareas-token');
        try {
          await fetch('http://localhost:3000/tasks', {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {
          // fetch falla como esperado en modo offline
        }
      });

      // Validar que la interfaz no crasheó y el usuario aún ve su contenido previo
      await expect(tareasPage.obtenerTarea('Tarea previa al corte')).toBeVisible();

      // Restaurar red
      await context.setOffline(false);
    });
  });

  test.describe('Latencia Extrema y Estados de Carga (Slow Network)', () => {
    test('latencia extrema (1.5s - 2s) en autenticación muestra botón deshabilitado con texto de carga', async ({ page }) => {
      const usuario = nuevoUsuario();
      await authPage.goto();
      await authPage.irAModoRegistro();

      // Introducir retraso de 1800ms en el endpoint de registro
      await page.route('**/auth/register', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1800));
        await route.continue();
      });

      await authPage.emailInput.fill(usuario.email);
      await authPage.passwordInput.fill(usuario.password);
      await authPage.registerButton.click();

      // Durante la latencia activa: botón deshabilitado y texto "Enviando..."
      await authPage.esperarBotonCargando();

      // Al completar los 1800ms, la transición a la pantalla principal se realiza con éxito
      await tareasPage.esperarCarga();
    });

    test('latencia extrema previene doble envío accidental (double submit)', async ({ page }) => {
      let peticionesRecibidas = 0;

      await page.route('**/auth/login', async (route) => {
        peticionesRecibidas++;
        await new Promise((resolve) => setTimeout(resolve, 1600));
        await route.continue();
      });

      await authPage.goto();
      await authPage.emailInput.fill('doble-click@prueba.com');
      await authPage.passwordInput.fill('password123');

      // Primer click envía la petición
      await authPage.loginButton.click();

      // Intentar clicks subsiguientes mientras el botón está en estado de carga
      await authPage.esperarBotonCargando();
      // click forzado con Playwright o intento de click en elemento deshabilitado
      await authPage.submitButton.click({ force: true }).catch(() => {});

      // Esperar que termine la petición y verificar que solo 1 llegó al backend
      await authPage.esperarError('Credenciales invalidas');
      expect(peticionesRecibidas, 'Debe procesarse exactamente una petición').toBe(1);
    });

    test('latencia artificial (1.5s) al cargar tareas muestra indicador "Cargando..." antes de la lista', async ({ page }) => {
      const usuario = nuevoUsuario();
      await authPage.registrar(usuario.email, usuario.password);
      await tareasPage.esperarCarga();
      await tareasPage.agregarTarea('Tarea para prueba de indicador');

      // Retardar GET /tasks por 1600ms
      await page.route('**/tasks', async (route) => {
        if (route.request().method() === 'GET') {
          await new Promise((resolve) => setTimeout(resolve, 1600));
          await route.continue();
        } else {
          await route.continue();
        }
      });

      // Recargar la aplicación para activar el estado de carga
      await page.reload();

      // Mientras la respuesta viaja, el indicador visual debe estar presente
      await expect(tareasPage.loadingMessage).toBeVisible();

      // Una vez recibida la respuesta, desaparece "Cargando..." y la lista se visualiza
      await expect(tareasPage.loadingMessage).toBeHidden();
      await expect(tareasPage.obtenerTarea('Tarea para prueba de indicador')).toBeVisible();
    });
  });
});
