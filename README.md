# Dodobot Site

Простая информационная страница о боте Dodobot.

## Структура
- `public/index.html` — главная страница
- `public/style.css` — стили
- `.github/workflows/deploy.yml` — автодеплой на сервер

## Запуск

Запуск локального сервера:

```
node server.js
```

Маршруты:
- `/home` — главная страница
- `/login` — редирект на Dodo IS с сохранением state
- `/callback` — прием `code` и `state` и передача боту
