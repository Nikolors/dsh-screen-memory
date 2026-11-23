import { spawn } from 'node:child_process'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

export const inject = ['tools']

const TEXT_OUTPUT = {
  schema: { type: 'string' },
  render: (_args, value) => [{ type: 'text', text: value }],
}

/**
 * Память экрана: короткий кольцевой буфер кадров.
 * Включается по требованию, чтобы не снимать фоном без нужды.
 */
export function apply(ctx, config = {}) {
  const python = config.pythonPath ?? 'python'
  const script = config.script ?? 'screen_roll.py'
  const framesDir = config.framesDir ?? 'frames'

  let child = null
  let interval = 1
  let keep = 60

  const listFrames = (count) => {
    let entries = []
    try {
      entries = readdirSync(framesDir)
    } catch {
      return []
    }
    const files = entries
      .filter((name) => name.endsWith('.jpg'))
      .map((name) => {
        const path = join(framesDir, name)
        let mtime = 0
        try {
          mtime = statSync(path).mtimeMs
        } catch {
          /* кадр могли удалить */
        }
        return { path, mtime }
      })
      .sort((a, b) => b.mtime - a.mtime)
    return files.slice(0, Math.max(1, count)).map((item) => item.path)
  }

  const stop = () => {
    if (!child) return
    try {
      child.kill()
    } catch {
      /* уже остановлен */
    }
    child = null
    ctx.logger?.info?.('screen memory stopped')
  }

  ctx.tools.register({
    name: 'screen_memory_start',
    description:
      'Start capturing the screen continuously into a short rolling buffer. Use when the user asks to watch the screen, a game or a video for a while. Stop it afterwards.',
    parameters: {
      interval: { type: 'number', description: 'Seconds between frames, default 1.' },
      keep: { type: 'integer', description: 'How many recent frames to keep, default 60.' },
    },
    output: TEXT_OUTPUT,
    execute: (args) => {
      interval = Number(args.interval ?? 1)
      keep = Number(args.keep ?? 60)
      if (child) return `съёмка уже идёт: кадр раз в ${interval} с, храним ${keep}`
      child = spawn(python, [script, String(interval), String(keep)], {
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
        stdio: 'ignore',
        windowsHide: true,
        detached: false,
      })
      child.once('exit', () => {
        child = null
      })
      return `съёмка началась: кадр раз в ${interval} с, храним ${keep}, папка ${framesDir}`
    },
  })

  ctx.tools.register({
    name: 'screen_memory_stop',
    description: 'Stop the rolling screen capture started by screen_memory_start.',
    parameters: {},
    output: TEXT_OUTPUT,
    execute: () => {
      if (!child) return 'съёмка уже остановлена'
      stop()
      return 'съёмка остановлена'
    },
  })

  ctx.tools.register({
    name: 'screen_memory_latest',
    description:
      'Return paths of the most recent frames from the rolling buffer, newest first. Read them with the image reader to see what happened on screen.',
    parameters: {
      count: { type: 'integer', description: 'How many frames to return, default 5.' },
    },
    output: TEXT_OUTPUT,
    execute: (args) => {
      const frames = listFrames(Number(args.count ?? 5))
      if (frames.length === 0) return 'буфер пуст — съёмка не запускалась'
      return frames.join('\n')
    },
  })

  ctx.on('dispose', stop)
}
