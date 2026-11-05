import {LOCALES} from '../src/i18n/locales.js'
export async function selectLanguage(page,code){
 await page.locator('.language-trigger').click()
 await page.getByRole('menuitemradio',{name:LOCALES.find(locale=>locale.code===code).name,exact:true}).click()
 await page.waitForFunction(lang=>document.documentElement.lang===lang,LOCALES.find(locale=>locale.code===code).html)
}
