import enCommon from './en/common.json';
import enNav from './en/nav.json';
import enInventory from './en/inventory.json';
import enProcurement from './en/procurement.json';
import enAuth from './en/auth.json';
import enSales from './en/sales.json';
import enAdmin from './en/admin.json';

import skCommon from './sk/common.json';
import skNav from './sk/nav.json';
import skInventory from './sk/inventory.json';
import skProcurement from './sk/procurement.json';
import skAuth from './sk/auth.json';
import skSales from './sk/sales.json';
import skAdmin from './sk/admin.json';

export const locales = {
  en: {
    common: enCommon,
    nav: enNav,
    inventory: enInventory,
    procurement: enProcurement,
    auth: enAuth,
    sales: enSales,
    admin: enAdmin,
  },
  sk: {
    common: skCommon,
    nav: skNav,
    inventory: skInventory,
    procurement: skProcurement,
    auth: skAuth,
    sales: skSales,
    admin: skAdmin,
  },
} as const;

export type Locale = keyof typeof locales;
export type Namespace = keyof (typeof locales)['en'];
export type TranslationMessages = typeof locales;
