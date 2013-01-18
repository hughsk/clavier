# clavier #

Sick of pressing CTRL+C, UP, UP, ENTER? Spawn processes with a single key
press, and shave milliseconds off your day.

## Installation ##

``` bash
$ [sudo] npm install -g clavier
```

## Usage ##

```
Usage: clavier -[key] 'command'
  Runs commands on specific keypresses.

Example:
  clavier -q "echo hello" -Q "echo world"

  Will run "echo hello" when you press Q,
  and "echo world" when pressing SHIFT+Q.

Options:
  --debounce  Minimum time between spawning the same process again (seconds).
  --verbose   Verbose logging.
  --restart   Kill any processes already running, per-key.
  --timeout   Kill any processes if they're still alive after X seconds.
  --prespawn  Spawn each process on startup.
```

Each single-character flag you pass represents the key binding, and their value
the command to run. This command will restart your Node server on pressing `r`:

``` bash
$ clavier -r 'node app.js' --restart --prespawn
```
