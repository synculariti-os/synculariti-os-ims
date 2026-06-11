import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale } from '@ims/translations';
import { routing } from './routing';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;

  let locale: string = cookieLocale ?? routing.defaultLocale;
  if (!routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: locales[locale as Locale],
  };
});
