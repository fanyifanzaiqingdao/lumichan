import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { PUBLIC_PATHS, canonicalPath } from '../src/i18n/routes.js'
import { LOCALES } from '../src/i18n/locales.js'
import { SEO_ROUTES, DEFAULT_SEO } from '../src/i18n/seo.js'
const origin='https://lumichan.com.cn'
const journeysSeed=JSON.parse(await readFile(new URL('../public/api/data/journeys.json',import.meta.url),'utf8'))
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;')
const alternates=()=>[...LOCALES,{code:'en',html:'x-default'}]
export function sitemap(){
 return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'+PUBLIC_PATHS.flatMap(path=>LOCALES.map(locale=>{
  const links=alternates().map(other=>`    <xhtml:link rel="alternate" hreflang="${other.html}" href="${origin}${escape(canonicalPath(path,other.code))}" />`).join('\n')
  return `  <url>\n    <loc>${origin}${escape(canonicalPath(path,locale.code))}</loc>\n${links}\n  </url>`
 })).join('\n')+'\n</urlset>\n'
}
export async function writeSeoPages(root,staging){
 const template=await readFile(resolve(root,'index.html'),'utf8')
 for(const locale of LOCALES){
  const dictionary=locale.code==='en'?{}:JSON.parse(await readFile(new URL(`../src/i18n/${locale.code}.json`,import.meta.url),'utf8'))
  if(locale.code!=='en'&&Object.keys(dictionary).length<100)throw new Error('Incomplete locale catalog: '+locale.code)
  for(const path of PUBLIC_PATHS){
   const localized=canonicalPath(path,locale.code),url=origin+localized
   const journey=journeysSeed.journeys.find(j=>path==='/journeys/'+j.slug)
   const metadata=(journey?{title:journey.seoTitle,description:journey.seoDescription}:SEO_ROUTES[path])||(path.includes('/journeys/')?{title:'Private China Journey | Lumichan',description:'Discover a customizable private journey in China with Lumichan.'}:DEFAULT_SEO)
   const title=dictionary[metadata.title]||metadata.title,description=dictionary[metadata.description]||metadata.description
   let html=template.replace(/<html lang="[^"]+"/,`<html lang="${locale.html}"`).replace(/<title>[\s\S]*?<\/title>/,`<title>${escape(title)}</title>`)
   html=html.replace(/(<link rel="canonical" href=")[^"]+("\s*\/?>)/,`$1${url}$2`).replace(/(<meta\s+name="description"\s+content=")[^"]*(")/,`$1${escape(description)}$2`)
   for(const [attribute,value]of [['og:title',title],['og:description',description],['og:url',url],['twitter:title',title],['twitter:description',description]])html=html.replace(new RegExp('(<meta\\s+(?:name|property)="'+attribute+'"\\s+content=")[^"]*(")'),`$1${escape(value)}$2`)
   const links=alternates().map(other=>`<link rel="alternate" hreflang="${other.html}" href="${origin}${canonicalPath(path,other.code)}" data-lumichan-alternate="true" />`).join('\n')
   html=html.replace('</head>',`<meta property="og:locale" content="${locale.og}" />\n${links}\n</head>`)
   const directory=resolve(root,localized.replace(/^\//,''));await mkdir(directory,{recursive:true});await writeFile(resolve(directory,'index.html'),html)
  }
  // Keep old static entrances usable even before the Nginx 301 snippet is installed.
  for(const slug of ['', 'chengdu-cultural-gateway', 'cultural-gateway', 'western-sichuan-private-road-trip', 'deep-cultural-journey']) {
   const canonical='/journeys'+(slug?'/'+(slug==='chengdu-cultural-gateway'?'cultural-gateway':slug):'')
   const legacy=(locale.prefix?locale.prefix+'/':'')+'traveler/journeys'+(slug?'/'+slug:'')
   await mkdir(resolve(root,legacy),{recursive:true});await writeFile(resolve(root,legacy,'index.html'),await readFile(resolve(root,canonicalPath(canonical,locale.code).slice(1),'index.html'),'utf8'))
  }
  const oldGateway=(locale.prefix?locale.prefix+'/':'')+'journeys/chengdu-cultural-gateway'
  await mkdir(resolve(root,oldGateway),{recursive:true});await writeFile(resolve(root,oldGateway,'index.html'),await readFile(resolve(root,canonicalPath('/journeys/cultural-gateway',locale.code).slice(1),'index.html'),'utf8'))
  const home=canonicalPath('/',locale.code),legacy=locale.prefix?locale.prefix+'/traveler':'traveler'
  await mkdir(resolve(root,legacy),{recursive:true});await writeFile(resolve(root,legacy,'index.html'),await readFile(resolve(root,home.slice(1),'index.html'),'utf8'))
 }
 for(const path of ['/admin','/support']){
  let html=template.replace(/<title>[\s\S]*?<\/title>/,`<title>${SEO_ROUTES[path].title}</title>`).replace('</head>','<meta name="robots" content="noindex,nofollow" />\n</head>')
  const directory=resolve(root,path.slice(1));await mkdir(directory,{recursive:true});await writeFile(resolve(directory,'index.html'),html)
 }
 if(!staging)await writeFile(resolve(root,'sitemap.xml'),sitemap())
}
if(process.argv.includes('--sitemap'))await writeFile(new URL('../public/sitemap.xml',import.meta.url),sitemap())
