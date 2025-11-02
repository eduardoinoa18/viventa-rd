// @ts-nocheck
import { test, expect } from '@playwright/test'

async function gotoApply(page, params: Record<string,string> = {}) {
  const qs = new URLSearchParams({ e2e: '1', ...params }).toString()
  await page.goto(`/apply?${qs}`)
}

async function fillRequiredFields(page) {
  await page.getByLabel('Nombre *').fill('Juan Pérez')
  await page.getByLabel('Email *').fill('juan@example.com')
  await page.getByLabel('Teléfono *').fill('809-555-1234')
  await page.getByLabel('¿Por qué quieres unirte a VIVENTA? *').fill('Tengo 10 años de experiencia y quiero unirme a VIVENTA por su red y tecnología avanzada. Me enfoco en Punta Cana.')
}

test('apply: happy path without resume (agent)', async ({ page }) => {
  await gotoApply(page)
  await fillRequiredFields(page)
  await page.getByRole('button', { name: 'Enviar Solicitud' }).click()
  await expect(page.getByText('¡Solicitud Enviada!')).toBeVisible()
})

test('apply: validation error for missing required fields', async ({ page }) => {
  await gotoApply(page)
  await page.getByRole('button', { name: 'Enviar Solicitud' }).click()
  await expect(page.getByText('Por favor completa todos los campos requeridos')).toBeVisible()
})

test('apply: failure path shows error and re-enables button', async ({ page }) => {
  await gotoApply(page, { fail: '1' })
  await fillRequiredFields(page)
  const submit = page.getByRole('button', { name: 'Enviar Solicitud' })
  await submit.click()
  await expect(page.getByText('No se pudo enviar la solicitud')).toBeVisible()
  await expect(submit).toBeEnabled()
})
