# dsh-screen-memory — память экрана для DeepSeek Harness

![Platform](https://img.shields.io/badge/platform-Windows-0078d4)
![License](https://img.shields.io/badge/license-MIT-green)

Короткий кольцевой буфер кадров экрана: агент включает съёмку по команде, а потом
может посмотреть, что было на экране минуту назад.

Фоном ничего не снимается — только пока включено, поэтому диск не забивается.

## Инструменты

- screen_memory_start(interval, keep) — начать съёмку (по умолчанию раз в секунду,
  хранить 60 кадров).
- screen_memory_stop — остановить.
- screen_memory_latest(count) — вернуть пути последних кадров, новые первыми.

## Установка

Нужен Python с pillow и скрипт захвата экрана (screen_roll.py, лежит в
репозитории [dsh-eyes-ru](https://github.com/Nikolors/dsh-eyes-ru) — можно взять
оттуда или написать свой).

Плагин ставится через **Plugins → Add plugin**; пути к Python и к скрипту задаются
в его строке в cordis.patch.yml.

**Ключевые слова:** DeepSeek Harness, DSH плагин, память экрана, скриншоты,
наблюдение за экраном, Windows, agent tools.
