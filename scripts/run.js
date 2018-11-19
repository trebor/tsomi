const { spawn } = require('child_process')
const exec = (cmd, args) => spawn(cmd, args, { shell: true, stdio: ['inherit', 'inherit', 'inherit'] })

const env = process.env.CONFIG_FILE || 'dev.js'
exec('cp', [`./configs/${env}`, './src/config.js'])

const command = process.argv[2] ||'dev'
const commands = {
  dev: { cmd: 'webpack', args: ['--watch', '--colors', '--progress'] },
  build: { cmd: 'sh', args: ['-c', '"npm run test && npm run flow && webpack"'] }
}

console.log(`running ${command} with config from ${env}...`)
const { cmd, args } = commands[command]
exec(cmd, args)
