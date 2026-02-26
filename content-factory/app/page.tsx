export default function Page() {
  return (
    <div className="page">
      <div className="hdr">
        <div className="hdr-tag">Финальная Архитектура v1.0</div>
        <h1>
          Instagram Content Factory
          <br />
          на базе Reels + AI
        </h1>
        <div className="hdr-meta">
          <span className="badge hi">2–3 аккаунта</span>
          <span className="badge hi">Ежедневный постинг</span>
          <span className="badge hi">Мультиязычный</span>
          <span className="badge hi">SaaS воронка</span>
          <span className="badge">n8n Cloud · Orchestrator</span>
        </div>
      </div>

      <div className="multi-box">
        <div className="multi-label">
          ⚡ Параллельные потоки — каждый аккаунт независим
        </div>
        <div className="multi-row">
          <div className="acc-pill">
            📱 Аккаунт 1 <span className="lang">RU</span>
          </div>
          <div className="acc-pill">
            📱 Аккаунт 2 <span className="lang">EN</span>
          </div>
          <div className="acc-pill">
            📱 Аккаунт 3 <span className="lang">+ язык</span>
          </div>
        </div>
      </div>

      {/* PHASE 1 */}
      <div className="phase">
        <span className="phase-dot" style={{ background: "#6366f1" }} />
        01 — Стратегия
      </div>
      <div className="cols c1">
        <div
          className="node"
          style={{
            ["--nc" as any]: "#6366f1",
            ["--ng" as any]: "rgba(99,102,241,.07)",
          }}
        >
          <div className="nh">
            <div className="ni">🧠</div>
            <div>
              <div className="ntitle">Исследование трендов и генерация брифа</div>
              <div className="ntool">Perplexity AI · sonar-pro</div>
            </div>
          </div>
          <div className="ndesc">
            n8n запускает по расписанию (каждый день, свой cron на каждый аккаунт).
            Perplexity исследует актуальные тренды в нише, анализирует топ-контент
            конкурентов и генерирует бриф: главный инсайт, хук, структуру сценария,
            CTA, хэштеги — на языке аккаунта.
          </div>
          <div className="tags">
            <span className="tag">cron per account</span>
            <span className="tag">trend research</span>
            <span className="tag">brief JSON output</span>
            <span className="tag">multilingual</span>
          </div>
        </div>
      </div>

      <div className="arrow">↓</div>

      {/* PHASE 2 */}
      <div className="phase">
        <span className="phase-dot" style={{ background: "#ec4899" }} />
        02 — Производство контента
      </div>
      <div className="cols">
        <div
          className="node"
          style={{
            ["--nc" as any]: "#ec4899",
            ["--ng" as any]: "rgba(236,72,153,.07)",
          }}
        >
          <div className="nh">
            <div className="ni">✍️</div>
            <div>
              <div className="ntitle">Сценарий + описание поста</div>
              <div className="ntool">Claude · claude-opus-4</div>
            </div>
          </div>
          <div className="ndesc">
            На основе брифа пишет сценарий ролика: хук (5с) → тело (45с) → CTA
            (10с). Плюс caption с хэштегами и первый комментарий. Возвращает
            строгий JSON: script, caption, hook, first_comment.
          </div>
          <div className="tags">
            <span className="tag">script</span>
            <span className="tag">caption</span>
            <span className="tag">hook</span>
            <span className="tag">JSON output</span>
          </div>
        </div>

        <div
          className="node"
          style={{
            ["--nc" as any]: "#ec4899",
            ["--ng" as any]: "rgba(236,72,153,.07)",
          }}
        >
          <div className="nh">
            <div className="ni">🎬</div>
            <div>
              <div className="ntitle">Генерация Reels-ролика</div>
              <div className="ntool">HeyGen · v2 API</div>
            </div>
          </div>
          <div className="ndesc">
            n8n передаёт script в HeyGen. Рендерится вертикальное видео
            1080×1920 с AI-аватаром. n8n поллингует статус каждые 30с до
            video_status = &quot;completed&quot;, затем забирает video_url.
          </div>
          <div className="tags">
            <span className="tag">avatar_id set</span>
            <span className="tag">9:16 format</span>
            <span className="tag">polling loop</span>
          </div>
        </div>
      </div>

      <div className="arrow">↓</div>

      {/* PHASE 3 */}
      <div className="phase">
        <span className="phase-dot" style={{ background: "#3b82f6" }} />
        03 — Публикация
      </div>
      <div className="cols">
        <div
          className="node"
          style={{
            ["--nc" as any]: "#3b82f6",
            ["--ng" as any]: "rgba(59,130,246,.07)",
          }}
        >
          <div className="nh">
            <div className="ni">📲</div>
            <div>
              <div className="ntitle">Автопостинг Reels + Stories</div>
              <div className="ntool">Ayrshare API</div>
            </div>
          </div>
          <div className="ndesc">
            n8n отправляет video_url + caption в Ayrshare. Публикуется Reels и
            Stories на нужный аккаунт. Время публикации — оптимальное под
            аудиторию каждого аккаунта. Первый комментарий добавляется
            автоматически.
          </div>
          <div className="tags">
            <span className="tag">reels: true</span>
            <span className="tag">stories</span>
            <span className="tag">per-account</span>
            <span className="tag">auto first comment</span>
          </div>
        </div>

        <div
          className="node"
          style={{
            ["--nc" as any]: "#3b82f6",
            ["--ng" as any]: "rgba(59,130,246,.07)",
          }}
        >
          <div className="nh">
            <div className="ni">🗄️</div>
            <div>
              <div className="ntitle">Запись поста в БД</div>
              <div className="ntool">Supabase · content_posts</div>
            </div>
          </div>
          <div className="ndesc">
            Сразу после публикации n8n пишет запись: video_url, script, caption,
            hook, account_id, language, published_at. Статус = published.
            Метрики views/comments/likes пишутся отдельным daily cron.
          </div>
          <div className="tags">
            <span className="tag">content_posts table</span>
            <span className="tag">account_id</span>
            <span className="tag">lang</span>
          </div>
        </div>
      </div>

      <div className="arrow">↓</div>

      {/* PHASE 4 */}
      <div className="phase">
        <span className="phase-dot" style={{ background: "#8b5cf6" }} />
        04 — Engagement Loop
      </div>
      <div className="cols c3">
        <div
          className="node"
          style={{
            ["--nc" as any]: "#8b5cf6",
            ["--ng" as any]: "rgba(139,92,246,.07)",
          }}
        >
          <div className="nh">
            <div className="ni">💬</div>
            <div>
              <div className="ntitle">Триггер по комментарию</div>
              <div className="ntool">ManyChat</div>
            </div>
          </div>
          <div className="ndesc">
            Пользователь пишет ключевое слово в комментарии (напр. &quot;хочу&quot;).
            ManyChat мгновенно отвечает публично + открывает DM. n8n получает
            webhook с данными пользователя.
          </div>
          <div className="tags">
            <span className="tag">keyword trigger</span>
            <span className="tag">auto-reply</span>
            <span className="tag">webhook → n8n</span>
          </div>
        </div>

        <div
          className="node"
          style={{
            ["--nc" as any]: "#8b5cf6",
            ["--ng" as any]: "rgba(139,92,246,.07)",
          }}
        >
          <div className="nh">
            <div className="ni">🤖</div>
            <div>
              <div className="ntitle">Бот-сценарий в DM</div>
              <div className="ntool">ManyChat Flow</div>
            </div>
          </div>
          <div className="ndesc">
            Бот задаёт 2-3 квалифицирующих вопроса, определяет боль/интерес и
            отправляет ссылку на Telegram-канал. Все шаги прохождения → Supabase
            через n8n webhook.
          </div>
          <div className="tags">
            <span className="tag">qualify</span>
            <span className="tag">channel link</span>
            <span className="tag">steps tracked</span>
          </div>
        </div>

        <div
          className="node"
          style={{
            ["--nc" as any]: "#8b5cf6",
            ["--ng" as any]: "rgba(139,92,246,.07)",
          }}
        >
          <div className="nh">
            <div className="ni">📡</div>
            <div>
              <div className="ntitle">Прогрев в Telegram</div>
              <div className="ntool">Telegram Bot</div>
            </div>
          </div>
          <div className="ndesc">
            Пользователь читает контент в канале. Бот фиксирует join и активность
            (реакции, переходы). Через N дней прогрева автоматически отправляет
            оффер с ссылкой на лендинг.
          </div>
          <div className="tags">
            <span className="tag">warming sequence</span>
            <span className="tag">activity track</span>
            <span className="tag">timed offer</span>
          </div>
        </div>
      </div>

      <div className="arrow">↓</div>

      {/* PHASE 5 */}
      <div className="phase">
        <span className="phase-dot" style={{ background: "#10b981" }} />
        05 — Конверсия и данные
      </div>
      <div className="cols">
        <div
          className="node"
          style={{
            ["--nc" as any]: "#10b981",
            ["--ng" as any]: "rgba(16,185,129,.07)",
          }}
        >
          <div className="nh">
            <div className="ni">🚀</div>
            <div>
              <div className="ntitle">Лендинг → SaaS подписка</div>
              <div className="ntool">Cursor → Vercel + GitHub</div>
            </div>
          </div>
          <div className="ndesc">
            Лендинг собран в Cursor, задеплоен на Vercel, код на GitHub. CI/CD
            автообновление. UTM-метки на входе позволяют Supabase знать с какого
            аккаунта/ролика пришёл лид. Форма → Stripe/платёжка.
          </div>
          <div className="tags">
            <span className="tag">UTM tracking</span>
            <span className="tag">CI/CD</span>
            <span className="tag">SaaS conversion</span>
          </div>
        </div>

        <div
          className="node"
          style={{
            ["--nc" as any]: "#10b981",
            ["--ng" as any]: "rgba(16,185,129,.07)",
          }}
        >
          <div className="nh">
            <div className="ni">📊</div>
            <div>
              <div className="ntitle">Единая база данных + скоринг</div>
              <div className="ntool">Supabase</div>
            </div>
          </div>
          <div className="ndesc">
            Supabase — единый источник правды. Каждое действие пользователя пишется
            в таблицу user_events. n8n агрегирует в user_scores. Система понимает
            на каком этапе воронки каждый лид.
          </div>
          <div className="tags">
            <span className="tag">user_events</span>
            <span className="tag">user_scores</span>
            <span className="tag">content_posts</span>
            <span className="tag">funnel_analytics</span>
          </div>
        </div>
      </div>

      <div className="scoring">
        <div className="scoring-title">🎯 Модель скоринга пользователя</div>
        <div className="scoring-grid">
          <div className="score-item">
            reel_view <span className="score-pt">+1</span>
          </div>
          <div className="score-item">
            comment_trigger <span className="score-pt">+5</span>
          </div>
          <div className="score-item">
            dm_open <span className="score-pt">+8</span>
          </div>
          <div className="score-item">
            bot_step_pass <span className="score-pt">+4</span>
          </div>
          <div className="score-item">
            channel_join <span className="score-pt">+15</span>
          </div>
          <div className="score-item">
            channel_activity <span className="score-pt">+3</span>
          </div>
          <div className="score-item">
            landing_visit <span className="score-pt">+20</span>
          </div>
          <div className="score-item">
            time_on_page_30s <span className="score-pt">+10</span>
          </div>
          <div className="score-item">
            conversion <span className="score-pt">+100</span>
          </div>
        </div>
      </div>

      <div className="loop">
        <div className="loop-title">♻️ Feedback Loop — система самообучения</div>
        <div className="loop-chain">
          <div className="loop-node">
            <span className="lt">📊 Supabase</span>
            <span className="ls">weekly analytics</span>
          </div>
          <span className="loop-sep">→</span>
          <div className="loop-node">
            <span className="lt">🔍 Анализ</span>
            <span className="ls">топ ролики по трафику</span>
          </div>
          <span className="loop-sep">→</span>
          <div className="loop-node">
            <span className="lt">🧠 Perplexity</span>
            <span className="ls">обновить стратегию</span>
          </div>
          <span className="loop-sep">→</span>
          <div className="loop-node">
            <span className="lt">✍️ Claude</span>
            <span className="ls">новые сценарии</span>
          </div>
          <span className="loop-sep">→</span>
          <div className="loop-node">
            <span className="lt">🎬 HeyGen</span>
            <span className="ls">новые ролики</span>
          </div>
          <span className="loop-sep">→</span>
          <div className="loop-node">
            <span className="lt">📲 Instagram</span>
            <span className="ls">публикация</span>
          </div>
        </div>
      </div>

      <div className="phase" style={{ marginTop: 32 }}>
        <span className="phase-dot" style={{ background: "#f59e0b" }} />
        Технологический стек
      </div>
      <div className="stack">
        <div className="stack-item">
          <span className="si">⚙️</span>
          <div>
            <div className="sname">n8n Cloud</div>
            <div className="srole">Оркестратор всех флоу</div>
          </div>
        </div>
        <div className="stack-item">
          <span className="si">🧠</span>
          <div>
            <div className="sname">Perplexity AI</div>
            <div className="srole">Стратегия и тренды</div>
          </div>
        </div>
        <div className="stack-item">
          <span className="si">✍️</span>
          <div>
            <div className="sname">Claude (Anthropic)</div>
            <div className="srole">Сценарии и тексты</div>
          </div>
        </div>
        <div className="stack-item">
          <span className="si">🎬</span>
          <div>
            <div className="sname">HeyGen</div>
            <div className="srole">Генерация видео</div>
          </div>
        </div>
        <div className="stack-item">
          <span className="si">📤</span>
          <div>
            <div className="sname">Ayrshare</div>
            <div className="srole">Публикация Reels + Stories</div>
          </div>
        </div>
        <div className="stack-item">
          <span className="si">💬</span>
          <div>
            <div className="sname">ManyChat</div>
            <div className="srole">Engagement + DM бот</div>
          </div>
        </div>
        <div className="stack-item">
          <span className="si">📡</span>
          <div>
            <div className="sname">Telegram Bot</div>
            <div className="srole">Прогрев + оффер</div>
          </div>
        </div>
        <div className="stack-item">
          <span className="si">🗄️</span>
          <div>
            <div className="sname">Supabase</div>
            <div className="srole">БД + скоринг + аналитика</div>
          </div>
        </div>
        <div className="stack-item">
          <span className="si">🚀</span>
          <div>
            <div className="sname">Vercel + GitHub</div>
            <div className="srole">Лендинг + CI/CD</div>
          </div>
        </div>
        <div className="stack-item">
          <span className="si">🖥️</span>
          <div>
            <div className="sname">Cursor</div>
            <div className="srole">Разработка лендинга</div>
          </div>
        </div>
      </div>
    </div>
  );
}

