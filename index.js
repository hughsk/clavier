#!/usr/bin/env node

var spawn = require('child_process').spawn
  , debounce = require('debounce')
  , optimist = require('optimist')
  , keypress = require('keypress')
  , shell = require('shell-quote')

var commands = {}
  , children = []
  , argv = optimist
    .usage([ ''
    , 'Usage: $0 -[key] \'command\''
    , '  Runs commands on specific keypresses.'
    , ''
    , 'Example:'
    , '  $0 -q "echo hello" -Q "echo world"'
    , ''
    , '  Will run "echo hello" when you press Q,'
    , '  and "echo world" when pressing SHIFT+Q.'
    ].join('\n'))

    .describe('prespawn', 'Spawn each process on startup.')

    .describe('debounce', 'Minimum time between spawning the same process again (seconds).')
    .default('debounce', 0.2)
    .describe('verbose', 'Verbose logging.')
    .boolean('verbose')
    .describe('restart', 'Kill any processes already running, per-key.')
    .boolean('restart')

    .describe('timeout', 'Kill any processes if they\'re still alive after X seconds.')

    .argv

argv.debounce *= 1000
argv.timeout  *= 1000

function log(string) {
  if (!argv.verbose) return
  console.log('\x1B[90m', string, '\x1B[0m')
};

function kill(child) {
  if (!child.killed) child.kill()
};

function exit() {
  children.forEach(kill)
  process.nextTick(process.exit)
};

function wrap(cmd) {
  var args = shell.parse(cmd)
    , command = args.shift()
    , currentChild

  function exec() {
    if (currentChild && argv.restart) {
      kill(currentChild)
      currentChild = false
    }

    process.nextTick(function() {
      var child = currentChild = spawn(command, args, {
        env: process.env
      })

      log('running: "' + cmd + '"')
      child.once('exit', function(code) {
        var index = children.indexOf(child)
        if (index !== -1) children.splice(index, 1)
        log('exiting: "' + cmd + '" [' + code + ']')
      })

      child.stdout.pipe(process.stdout)
      child.stderr.pipe(process.stderr)

      children.push(child)

      if (argv.timeout) {
        setTimeout(kill.bind(null, child), argv.timeout)
      }
    })
  };

  return argv.debounce ? debounce(exec, argv.debounce, true) : exec
};

Object.keys(argv).filter(function(key) {
  return key.length === 1 && key !== '_'
}).map(function(key) {
  commands[key] = wrap(argv[key])
})

if (argv.help || !Object.keys(commands).length) {
  return optimist.showHelp()
}

process.stdin.on('keypress', function(character, key) {
  var command = commands[character]

  if (!key) return
  if (key.ctrl && key.name.match(/[xc]/gi)) return exit()
  if (key.ctrl) return
  if (!command) return

  command()
})

process.stdout.setMaxListeners(100)
process.stderr.setMaxListeners(100)

process.stdin.setRawMode(true)
process.stdin.resume()

keypress(process.stdin)

if (argv.prespawn) {
  Object.keys(commands).forEach(function(key) {
    commands[key]()
  })
}
