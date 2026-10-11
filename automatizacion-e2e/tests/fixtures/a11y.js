import AxeBuilder from '@axe-core/playwright';
import { test as baseTest, expect } from '@playwright/test';

/**
 * Reglas estándar WCAG 2.1 AA utilizadas en auditorías de accesibilidad.
 */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Genera una instancia configurada de AxeBuilder apuntando a la página dada,
 * evaluando por defecto el estándar WCAG 2.1 Nivel A y AA.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} [opciones]
 * @param {string[]} [opciones.tags] Etiquetas WCAG a incluir
 * @param {string[]} [opciones.rules] Reglas específicas a incluir
 * @param {string[]} [opciones.disableRules] Reglas específicas a ignorar
 * @param {string|string[]} [opciones.include] Selectores CSS de contenedores a auditar
 * @param {string|string[]} [opciones.exclude] Selectores CSS de contenedores a omitir
 * @returns {AxeBuilder}
 */
export function crearAuditorA11y(page, opciones = {}) {
  const {
    tags = WCAG_TAGS,
    rules = [],
    disableRules = [],
    include = null,
    exclude = null,
  } = opciones;

  let builder = new AxeBuilder({ page }).withTags(tags);

  if (rules.length > 0) {
    builder = builder.withRules(rules);
  }
  if (disableRules.length > 0) {
    builder = builder.disableRules(disableRules);
  }
  if (include) {
    const includes = Array.isArray(include) ? include : [include];
    for (const sel of includes) {
      builder = builder.include(sel);
    }
  }
  if (exclude) {
    const excludes = Array.isArray(exclude) ? exclude : [exclude];
    for (const sel of excludes) {
      builder = builder.exclude(sel);
    }
  }

  return builder;
}

/**
 * Ejecuta una auditoría de accesibilidad completa y valida que no existan
 * violaciones según las reglas configuradas.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} [opciones] Opciones para personalizar la auditoría
 * @returns {Promise<import('axe-core').AxeResults>}
 */
export async function auditarA11y(page, opciones = {}) {
  const builder = crearAuditorA11y(page, opciones);
  const results = await builder.analyze();

  const formattedViolations = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    helpUrl: v.helpUrl,
    nodes: v.nodes.map((n) => ({
      html: n.html,
      target: n.target,
      failureSummary: n.failureSummary,
    })),
  }));

  expect(
    results.violations,
    `Se encontraron violaciones de accesibilidad WCAG 2.1 AA:\n${JSON.stringify(formattedViolations, null, 2)}`
  ).toEqual([]);

  return results;
}

/**
 * Fixture extendido de Playwright con inyección del auditor `hacerAuditoriaA11y`.
 */
export const test = baseTest.extend({
  /**
   * Helper fixture para auditar la página activa con WCAG 2.1 AA.
   */
  auditarAccesibilidad: async ({ page }, use) => {
    await use(async (opciones = {}) => auditarA11y(page, opciones));
  },
});

export { expect };
