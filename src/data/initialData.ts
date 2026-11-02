/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_11_LAMPIRAN, SuratKeluar, SuratMasuk, WartaTelegram } from '../types';

/**
 * Clean Slate: Seluruh data dummy/sampel ditiadakan untuk mode produksi input data riil.
 */
export const INITIAL_SURAT_MASUK: SuratMasuk[] = [];
export const INITIAL_SURAT_KELUAR: SuratKeluar[] = [];
export const INITIAL_WARTA_TELEGRAM: WartaTelegram[] = [];

const LOCAL_STORAGE_KEYS = {
  SURAT_MASUK: 'simonas_surat_masuk_v2_real',
  SURAT_KELUAR: 'simonas_surat_keluar_v2_real',
  TELEGRAM: 'simonas_telegram_v2_real',
  USER_ROLE: 'simonas_user_role_v1',
  INITIALIZED_CLEAN: 'simonas_clean_slate_initialized'
};

// Known dummy IDs from previous sample data
const DUMMY_IDS = new Set([
  'sm-001', 'sm-002', 'sm-003', 'sm-004', 'sm-005',
  'sk-001', 'sk-002', 'sk-003', 'sk-004',
  'tr-001', 'tr-002', 'tr-003'
]);

function filterOutDummy<T extends { id: string }>(items: T[]): T[] {
  return items.filter(item => !DUMMY_IDS.has(item.id));
}

export function loadSuratMasuk(): SuratMasuk[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.SURAT_MASUK);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return filterOutDummy(parsed);
      }
    }
  } catch (e) {
    console.error('Failed to read surat masuk from storage:', e);
  }
  return [];
}

export function saveSuratMasuk(data: SuratMasuk[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SURAT_MASUK, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save surat masuk:', e);
  }
}

export function loadSuratKeluar(): SuratKeluar[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.SURAT_KELUAR);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return filterOutDummy(parsed);
      }
    }
  } catch (e) {
    console.error('Failed to read surat keluar from storage:', e);
  }
  return [];
}

export function saveSuratKeluar(data: SuratKeluar[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SURAT_KELUAR, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save surat keluar:', e);
  }
}

export function loadTelegram(): WartaTelegram[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.TELEGRAM);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return filterOutDummy(parsed);
      }
    }
  } catch (e) {
    console.error('Failed to read telegram from storage:', e);
  }
  return [];
}

export function saveTelegram(data: WartaTelegram[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.TELEGRAM, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save telegram:', e);
  }
}

/**
 * Kosongkan seluruh data lokal untuk memastikan siap digunakan untuk input data riil
 */
export function resetAllDataToDefault() {
  localStorage.setItem(LOCAL_STORAGE_KEYS.SURAT_MASUK, JSON.stringify([]));
  localStorage.setItem(LOCAL_STORAGE_KEYS.SURAT_KELUAR, JSON.stringify([]));
  localStorage.setItem(LOCAL_STORAGE_KEYS.TELEGRAM, JSON.stringify([]));
  // Also clean old v1 keys if any
  localStorage.removeItem('simonas_surat_masuk_v1');
  localStorage.removeItem('simonas_surat_keluar_v1');
  localStorage.removeItem('simonas_telegram_v1');
}
