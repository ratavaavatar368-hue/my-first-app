import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

app.use(cors());
app.use(express.json());

// Статические файлы - для Vercel используем правильный путь
const staticPath = process.env.VERCEL ? path.join(process.cwd(), '.') : __dirname;
app.use(express.static(staticPath));

// Пути к файлам данных
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const PROPERTIES_FILE = path.join(DATA_DIR, "properties.json");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, "subscriptions.json");

// Инициализация данных
async function initData() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Проверяем и создаем файлы если их нет
    const files = [
      { path: USERS_FILE, default: [] },
      { path: PROPERTIES_FILE, default: [] },
      { path: BOOKINGS_FILE, default: [] },
      { path: SUBSCRIPTIONS_FILE, default: [] },
    ];

    for (const file of files) {
      try {
        await fs.access(file.path);
      } catch {
        await fs.writeFile(file.path, JSON.stringify(file.default, null, 2));
      }
    }
  } catch (error) {
    console.error("Ошибка инициализации данных:", error);
  }
}

// Вспомогательные функции для работы с данными
async function readData(file) {
  try {
    const data = await fs.readFile(file, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeData(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// Middleware для аутентификации
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Токен доступа отсутствует" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Недействительный токен" });
    }
    req.user = user;
    next();
  });
}

// Middleware для проверки подписки
async function checkSubscription(req, res, next) {
  try {
    const subscriptions = await readData(SUBSCRIPTIONS_FILE);
    const userSubscription = subscriptions.find(
      (sub) => sub.userId === req.user.userId && sub.status === "active"
    );

    if (!userSubscription) {
      return res.status(403).json({
        error: "Требуется активная подписка для доступа к этому функционалу",
      });
    }

    // Проверяем срок действия подписки
    const now = new Date();
    const expiryDate = new Date(userSubscription.expiresAt);
    if (expiryDate < now) {
      // Обновляем статус подписки
      userSubscription.status = "expired";
      await writeData(SUBSCRIPTIONS_FILE, subscriptions);
      return res.status(403).json({
        error: "Ваша подписка истекла. Пожалуйста, продлите подписку",
      });
    }

    req.subscription = userSubscription;
    next();
  } catch (error) {
    res.status(500).json({ error: "Ошибка проверки подписки" });
  }
}

// ========== АУТЕНТИФИКАЦИЯ ==========

// Регистрация
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Все поля обязательны" });
    }

    const users = await readData(USERS_FILE);
    if (users.find((u) => u.email === email)) {
      return res.status(400).json({ error: "Пользователь с таким email уже существует" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      role: "user",
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await writeData(USERS_FILE, users);

    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "Пользователь успешно зарегистрирован",
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка регистрации" });
  }
});

// Вход
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email и пароль обязательны" });
    }

    const users = await readData(USERS_FILE);
    const user = users.find((u) => u.email === email);

    if (!user) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Успешный вход",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка входа" });
  }
});

// Получение текущего пользователя
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const users = await readData(USERS_FILE);
    const user = users.find((u) => u.id === req.user.userId);

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка получения данных пользователя" });
  }
});

// ========== ПОДПИСКИ ==========

// Получение планов подписки
app.get("/api/subscriptions/plans", (req, res) => {
  const plans = [
    {
      id: "basic",
      name: "Базовый",
      price: 9.99,
      duration: 30, // дней
      features: [
        "Размещение до 3 объектов",
        "Базовая статистика",
        "Поддержка по email",
      ],
    },
    {
      id: "premium",
      name: "Премиум",
      price: 19.99,
      duration: 30,
      features: [
        "Неограниченное размещение объектов",
        "Расширенная статистика",
        "Приоритетная поддержка",
        "Продвижение в поиске",
      ],
    },
    {
      id: "enterprise",
      name: "Корпоративный",
      price: 49.99,
      duration: 30,
      features: [
        "Все возможности Премиум",
        "API доступ",
        "Персональный менеджер",
        "Кастомные интеграции",
      ],
    },
  ];

  res.json(plans);
});

// Получение подписки пользователя
app.get("/api/subscriptions/my", authenticateToken, async (req, res) => {
  try {
    const subscriptions = await readData(SUBSCRIPTIONS_FILE);
    const userSubscription = subscriptions.find((sub) => sub.userId === req.user.userId);

    if (!userSubscription) {
      return res.json({ subscription: null });
    }

    res.json({ subscription: userSubscription });
  } catch (error) {
    res.status(500).json({ error: "Ошибка получения подписки" });
  }
});

// Создание/обновление подписки
app.post("/api/subscriptions/subscribe", authenticateToken, async (req, res) => {
  try {
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: "Необходимо указать план подписки" });
    }

    const plans = [
      { id: "basic", price: 9.99, duration: 30 },
      { id: "premium", price: 19.99, duration: 30 },
      { id: "enterprise", price: 49.99, duration: 30 },
    ];

    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      return res.status(400).json({ error: "Неверный план подписки" });
    }

    const subscriptions = await readData(SUBSCRIPTIONS_FILE);
    const existingSubscription = subscriptions.find(
      (sub) => sub.userId === req.user.userId && sub.status === "active"
    );

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + plan.duration);

    if (existingSubscription) {
      // Продление существующей подписки
      existingSubscription.planId = planId;
      existingSubscription.price = plan.price;
      existingSubscription.expiresAt = expiresAt.toISOString();
      existingSubscription.updatedAt = now.toISOString();
    } else {
      // Создание новой подписки
      const newSubscription = {
        id: uuidv4(),
        userId: req.user.userId,
        planId,
        price: plan.price,
        status: "active",
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        updatedAt: now.toISOString(),
      };
      subscriptions.push(newSubscription);
    }

    await writeData(SUBSCRIPTIONS_FILE, subscriptions);

    res.json({
      message: "Подписка успешно активирована",
      subscription: existingSubscription || subscriptions[subscriptions.length - 1],
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка создания подписки" });
  }
});

// ========== НЕДВИЖИМОСТЬ ==========

// Получение всех объектов (публичный доступ)
app.get("/api/properties", async (req, res) => {
  try {
    const properties = await readData(PROPERTIES_FILE);
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: "Ошибка получения объектов" });
  }
});

// Получение объекта по ID
app.get("/api/properties/:id", async (req, res) => {
  try {
    const properties = await readData(PROPERTIES_FILE);
    const property = properties.find((p) => p.id === req.params.id);

    if (!property) {
      return res.status(404).json({ error: "Объект не найден" });
    }

    res.json(property);
  } catch (error) {
    res.status(500).json({ error: "Ошибка получения объекта" });
  }
});

// Создание объекта (требует подписку)
app.post("/api/properties", authenticateToken, checkSubscription, async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      price,
      type,
      bedrooms,
      bathrooms,
      guests,
      amenities,
      images,
    } = req.body;

    if (!title || !location || !price) {
      return res.status(400).json({ error: "Название, местоположение и цена обязательны" });
    }

    // Проверка лимита объектов для базового плана
    if (req.subscription.planId === "basic") {
      const properties = await readData(PROPERTIES_FILE);
      const userProperties = properties.filter((p) => p.ownerId === req.user.userId);
      if (userProperties.length >= 3) {
        return res.status(403).json({
          error: "Достигнут лимит объектов для базового плана. Обновите подписку",
        });
      }
    }

    const properties = await readData(PROPERTIES_FILE);
    const newProperty = {
      id: uuidv4(),
      ownerId: req.user.userId,
      title,
      description: description || "",
      location,
      price: parseFloat(price),
      type: type || "apartment",
      bedrooms: parseInt(bedrooms) || 1,
      bathrooms: parseInt(bathrooms) || 1,
      guests: parseInt(guests) || 2,
      amenities: amenities || [],
      images: images || [],
      rating: 0,
      reviews: 0,
      instant: false,
      premium: req.subscription.planId !== "basic",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    properties.push(newProperty);
    await writeData(PROPERTIES_FILE, properties);

    res.status(201).json({
      message: "Объект успешно создан",
      property: newProperty,
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка создания объекта" });
  }
});

// Обновление объекта
app.put("/api/properties/:id", authenticateToken, checkSubscription, async (req, res) => {
  try {
    const properties = await readData(PROPERTIES_FILE);
    const propertyIndex = properties.findIndex((p) => p.id === req.params.id);

    if (propertyIndex === -1) {
      return res.status(404).json({ error: "Объект не найден" });
    }

    const property = properties[propertyIndex];
    if (property.ownerId !== req.user.userId) {
      return res.status(403).json({ error: "Нет доступа к этому объекту" });
    }

    const updatedProperty = {
      ...property,
      ...req.body,
      id: property.id,
      ownerId: property.ownerId,
      updatedAt: new Date().toISOString(),
    };

    properties[propertyIndex] = updatedProperty;
    await writeData(PROPERTIES_FILE, properties);

    res.json({
      message: "Объект успешно обновлен",
      property: updatedProperty,
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка обновления объекта" });
  }
});

// Удаление объекта
app.delete("/api/properties/:id", authenticateToken, checkSubscription, async (req, res) => {
  try {
    const properties = await readData(PROPERTIES_FILE);
    const propertyIndex = properties.findIndex((p) => p.id === req.params.id);

    if (propertyIndex === -1) {
      return res.status(404).json({ error: "Объект не найден" });
    }

    const property = properties[propertyIndex];
    if (property.ownerId !== req.user.userId) {
      return res.status(403).json({ error: "Нет доступа к этому объекту" });
    }

    properties.splice(propertyIndex, 1);
    await writeData(PROPERTIES_FILE, properties);

    res.json({ message: "Объект успешно удален" });
  } catch (error) {
    res.status(500).json({ error: "Ошибка удаления объекта" });
  }
});

// Получение объектов пользователя
app.get("/api/properties/my/listings", authenticateToken, checkSubscription, async (req, res) => {
  try {
    const properties = await readData(PROPERTIES_FILE);
    const userProperties = properties.filter((p) => p.ownerId === req.user.userId);
    res.json(userProperties);
  } catch (error) {
    res.status(500).json({ error: "Ошибка получения объектов" });
  }
});

// ========== БРОНИРОВАНИЯ ==========

// Создание бронирования
app.post("/api/bookings", authenticateToken, async (req, res) => {
  try {
    const { propertyId, checkIn, checkOut, guests: bookingGuests } = req.body;

    if (!propertyId || !checkIn || !checkOut) {
      return res.status(400).json({ error: "Все поля обязательны" });
    }

    const properties = await readData(PROPERTIES_FILE);
    const property = properties.find((p) => p.id === propertyId);

    if (!property) {
      return res.status(404).json({ error: "Объект не найден" });
    }

    // Проверка доступности дат
    const bookings = await readData(BOOKINGS_FILE);
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const conflictingBooking = bookings.find((b) => {
      if (b.propertyId !== propertyId || b.status !== "confirmed") return false;
      const bCheckIn = new Date(b.checkIn);
      const bCheckOut = new Date(b.checkOut);
      return (
        (checkInDate >= bCheckIn && checkInDate < bCheckOut) ||
        (checkOutDate > bCheckIn && checkOutDate <= bCheckOut) ||
        (checkInDate <= bCheckIn && checkOutDate >= bCheckOut)
      );
    });

    if (conflictingBooking) {
      return res.status(400).json({ error: "Выбранные даты недоступны" });
    }

    // Расчет стоимости
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = property.price * nights;

    const newBooking = {
      id: uuidv4(),
      propertyId,
      userId: req.user.userId,
      checkIn: checkInDate.toISOString(),
      checkOut: checkOutDate.toISOString(),
      guests: parseInt(bookingGuests) || property.guests,
      totalPrice,
      status: property.instant ? "confirmed" : "pending",
      createdAt: new Date().toISOString(),
    };

    bookings.push(newBooking);
    await writeData(BOOKINGS_FILE, bookings);

    res.status(201).json({
      message: "Бронирование создано",
      booking: newBooking,
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка создания бронирования" });
  }
});

// Получение бронирований пользователя
app.get("/api/bookings/my", authenticateToken, async (req, res) => {
  try {
    const bookings = await readData(BOOKINGS_FILE);
    const userBookings = bookings.filter((b) => b.userId === req.user.userId);
    res.json(userBookings);
  } catch (error) {
    res.status(500).json({ error: "Ошибка получения бронирований" });
  }
});

// Получение бронирований для объектов пользователя
app.get("/api/bookings/my/properties", authenticateToken, checkSubscription, async (req, res) => {
  try {
    const properties = await readData(PROPERTIES_FILE);
    const userPropertyIds = properties
      .filter((p) => p.ownerId === req.user.userId)
      .map((p) => p.id);

    const bookings = await readData(BOOKINGS_FILE);
    const propertyBookings = bookings.filter((b) => userPropertyIds.includes(b.propertyId));

    res.json(propertyBookings);
  } catch (error) {
    res.status(500).json({ error: "Ошибка получения бронирований" });
  }
});

// Обновление статуса бронирования
app.put("/api/bookings/:id/status", authenticateToken, checkSubscription, async (req, res) => {
  try {
    const { status } = req.body;
    const bookings = await readData(BOOKINGS_FILE);
    const bookingIndex = bookings.findIndex((b) => b.id === req.params.id);

    if (bookingIndex === -1) {
      return res.status(404).json({ error: "Бронирование не найдено" });
    }

    const booking = bookings[bookingIndex];
    const properties = await readData(PROPERTIES_FILE);
    const property = properties.find((p) => p.id === booking.propertyId);

    if (!property || property.ownerId !== req.user.userId) {
      return res.status(403).json({ error: "Нет доступа к этому бронированию" });
    }

    bookings[bookingIndex].status = status;
    await writeData(BOOKINGS_FILE, bookings);

    res.json({
      message: "Статус бронирования обновлен",
      booking: bookings[bookingIndex],
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка обновления статуса" });
  }
});

// Обработка всех маршрутов для SPA (должно быть после всех API маршрутов)
app.get('*', (req, res, next) => {
  // Если это API запрос, пропускаем дальше
  if (req.path.startsWith('/api/')) {
    return next();
  }
  // Иначе отдаем index.html для SPA
  const staticPath = process.env.VERCEL ? path.join(process.cwd(), '.') : __dirname;
  res.sendFile(path.join(staticPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('File not found');
    }
  });
});

// Для Vercel: экспортируем app как serverless function
export default app;

// Для локального запуска: запускаем сервер
if (!process.env.VERCEL) {
  initData().then(() => {
    app.listen(PORT, () => {
      console.log(`Сервер запущен на http://localhost:${PORT}`);
    });
  });
} else {
  // Для Vercel: инициализируем данные при первом запросе
  initData().catch(console.error);
}
