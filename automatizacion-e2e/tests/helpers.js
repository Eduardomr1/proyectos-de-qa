import { AuthPage } from '../pages/AuthPage.js';
import { TareasPage } from '../pages/TareasPage.js';

import { auditarA11y, crearAuditorA11y, WCAG_TAGS } from './fixtures/a11y.js';

export { AuthPage, TareasPage, auditarA11y, crearAuditorA11y, WCAG_TAGS };

/** Cada prueba usa un email unico para no chocar con datos de corridas previas. */
export function nuevoUsuario() {
  const marca = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return { email: `e2e-${marca}@prueba.com`, password: 'secret123' };
}

/** Registra un usuario nuevo desde la interfaz y deja la sesion iniciada usando POM. */
export async function registrarse(page, usuario = nuevoUsuario()) {
  const authPage = new AuthPage(page);
  const tareasPage = new TareasPage(page);
  await authPage.registrar(usuario.email, usuario.password);
  await tareasPage.esperarCarga();
  return usuario;
}

/** Agrega una tarea desde la interfaz y espera a que aparezca en la lista usando POM. */
export async function agregarTarea(page, titulo) {
  const tareasPage = new TareasPage(page);
  await tareasPage.agregarTarea(titulo);
}
