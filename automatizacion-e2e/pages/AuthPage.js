import { expect } from '@playwright/test';

/**
 * Page Object que encapsula los formularios de autenticación (Login y Registro).
 */
export class AuthPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Contrasena');
    this.submitButton = page.locator('button[type="submit"]');
    this.loginButton = page.getByRole('button', { name: 'Entrar' });
    this.registerButton = page.getByRole('button', { name: 'Registrarme' });
    this.switchToRegisterButton = page.getByRole('button', {
      name: 'No tengo cuenta, quiero registrarme',
    });
    this.switchToLoginButton = page.getByRole('button', {
      name: 'Ya tengo cuenta, quiero entrar',
    });
    this.alert = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/');
  }

  async irAModoRegistro() {
    await this.switchToRegisterButton.click();
  }

  async irAModoLogin() {
    await this.switchToLoginButton.click();
  }

  async registrar(email, password) {
    await this.goto();
    await this.irAModoRegistro();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.registerButton.click();
  }

  async iniciarSesion(email, password) {
    await this.goto();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async esperarPantallaLogin() {
    await expect(this.heading).toHaveText('Iniciar sesion');
  }

  async esperarPantallaRegistro() {
    await expect(this.heading).toHaveText('Crear cuenta');
  }

  async esperarError(mensaje) {
    await expect(this.alert).toContainText(mensaje);
  }

  async esperarBotonCargando() {
    await expect(this.submitButton).toBeDisabled();
    await expect(this.submitButton).toHaveText('Enviando...');
  }
}
