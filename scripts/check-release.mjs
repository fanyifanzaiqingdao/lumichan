import { access, readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

const root = process.argv[2] ? resolve(process.argv[2]) : new URL('../dist/', import.meta.url).pathname
const forbidden = /\[PRICE\]|\[GROUP SIZE\]|TEST PLACEHOLDER|CONTENT PLACEHOLDER|RMB\s*[—-]\s*\/\s*person|Based on a private group of \[N\]/i
const failures = []
const staging = process.argv.includes('--staging')

async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name)
    if (entry.isDirectory()) await inspect(file)
    else if (/\.(?:js|html|json)$/i.test(entry.name) && (forbidden.test(await readFile(file, 'utf8')) || (!staging && /PHOTO PLACEHOLDER|Review slot 0/.test(await readFile(file, 'utf8'))))) {
      failures.push(relative(root, file))
    }
  }
}

await inspect(root)
for (const privatePath of ['api/config.php', 'api/config.example copy.php', 'api/data/guides.json', 'api/data/homepage.live.json', 'uploads']) {
  if (await access(join(root, privatePath)).then(() => true).catch(() => false)) failures.push(privatePath)
}
if (failures.length) {
  console.error('Production placeholders found in:', failures.join(', '))
  process.exitCode = 1
} else {
  console.log('Release check passed: no production placeholders.')
}
