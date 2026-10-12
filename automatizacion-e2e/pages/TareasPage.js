import { expect } from '@playwright/test';

/**
 * Page Object que encapsula la pantalla principal de gestión de tareas.
 */
export class TareasPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Mis tareas' });
    this.logoutButton = page.getByRole('button', { name: 'Cerrar sesion' });
    this.newTaskInput = page.getByLabel('Nueva tarea');
    this.addButton = page.getByRole('button', { name: 'Agregar' });
    this.emptyMessage = page.getByText('Todavia no tienes tareas. Agrega la primera arriba.');
    this.taskItems = page.locator('ul.tasks li');
    this.completedItems = page.locator('ul.tasks li.done');
    this.alert = page.getByRole('alert');
    this.loadingMessage = page.getByText('Cargando...');
  }

  async esperarCarga() {
    await expect(this.heading).toBeVisible();
  }

  async esperarError(mensaje) {
    await expect(this.alert).toContainText(mensaje);
  }

  async agregarTarea(titulo) {
    await this.newTaskInput.fill(titulo);
    await this.addButton.click();
    await this.page.getByText(titulo, { exact: true }).waitFor();
  }

  obtenerTarea(titulo) {
    return this.page.locator('ul.tasks li', { hasText: titulo });
  }

  obtenerCheckbox(titulo) {
    return this.obtenerTarea(titulo).getByRole('checkbox');
  }

  async marcarTarea(titulo) {
    await this.obtenerCheckbox(titulo).click();
  }

  async eliminarTarea(titulo) {
    await this.page.getByRole('button', { name: `Eliminar ${titulo}` }).click();
  }

  async cerrarSesion() {
    await this.logoutButton.click();
  }

  async esperarContador(textoEsperado) {
    await expect(this.page.getByText(textoEsperado)).toBeVisible();
  }

  async esperarMensajeVacio() {
    await expect(this.emptyMessage).toBeVisible();
  }
}
