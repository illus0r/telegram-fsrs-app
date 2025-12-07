# Настройка Telegram Mini App

## 1. Создание бота

1. Откройте Telegram и найдите [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/newbot`
3. Введите имя бота (например: "Anki FSRS Bot")
4. Введите username бота (например: "anki_fsrs_bot")
5. Сохраните полученный токен бота

## 2. Настройка Mini App

1. Отправьте боту [@BotFather](https://t.me/BotFather) команду `/setminiapp`
2. Выберите вашего бота из списка
3. Введите URL приложения: `https://fsrs.dianov.org/`
4. Введите название Mini App (например: "Anki FSRS")

## 3. Дополнительные настройки

### Описание бота
```
/setdescription
Интервальное повторение карточек с алгоритмом FSRS. Изучайте языки и любые другие предметы эффективно!
```

### Короткое описание
```
/setabouttext
Умные карточки с алгоритмом FSRS для эффективного обучения
```

### Команды бота (опционально)
```
/setcommands

start - Запустить приложение
help - Помощь
```

## 4. Кастомизация

### Изменить иконку бота
```
/setuserpic
```
Загрузите квадратную картинку размером 512x512 пикселей

### Настроить меню бота
```
/setmenubuttondefault
```
Выберите "Launch Mini App" для отображения кнопки запуска

## 5. Тестирование

1. Найдите вашего бота в Telegram по username
2. Нажмите `/start`
3. Используйте кнопку меню или команду для запуска Mini App
4. Проверьте работу приложения на мобильном устройстве и десктопе

## 6. Публикация

### Проверка перед публикацией
- ✅ Приложение загружается без ошибок
- ✅ Telegram WebApp API работает
- ✅ CloudStorage сохраняет данные
- ✅ Кнопки MainButton и BackButton работают
- ✅ Адаптивный дизайн на разных устройствах

### Отправка на проверку (для публичных ботов)
```
/setprivacy
```
Выберите "Disable" чтобы бот мог быть найден в поиске

## 7. Полезные команды BotFather

- `/mybots` - список ваших ботов
- `/deletebot` - удалить бота
- `/setname` - изменить имя бота
- `/setdescription` - изменить описание
- `/setuserpic` - изменить аватар
- `/setinline` - настройки inline режима
- `/setjoingroups` - разрешить добавление в группы

## Troubleshooting

### Приложение не загружается
1. Проверьте URL в настройках Mini App
2. Убедитесь что HTTPS включен
3. Проверьте CNAME записи для домена

### CloudStorage не работает
- Проверьте версию Telegram (нужна 6.1+)
- В браузере будет использоваться localStorage как fallback

### Кнопки не работают
- Проверьте что скрипт `telegram-web-app.js` загружается
- Откройте DevTools для диагностики ошибок

## Примеры ботов для вдохновения

- [@DurgerKingBot](https://t.me/DurgerKingBot) - игра
- [@wallet](https://t.me/wallet) - криптокошелек  
- [@gmgn_sol_bot](https://t.me/gmgn_sol_bot) - аналитика

## Дополнительные ресурсы

- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Mini Apps Examples](https://github.com/telegram-mini-apps)