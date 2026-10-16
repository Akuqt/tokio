# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

Tokio is an Electron desktop app (Windows-first) that connects to a TikTok LIVE stream and reacts to its events with text-to-speech, music requests (Spotify/YouTube), sound alerts, and browser-source overlays served over a local HTTP/WebSocket server.

Stack: Electron 39, electron-vite, React 19, TypeScript, TanStack Router, Express 5 + `ws`, Zod 4, Yarn 1, Node >= 24.

## Commands

```sh
yarn dev           # builds the music window UI, then runs electron-vite in dev mode
yarn typecheck     # tsc for main/preload/common (node) and renderer/music/installer (web)
yarn lint          # oxlint --type-aware
yarn test          # vitest, offline unit tests for main and common (yarn test:watch to watch)
yarn format        # prettier --write .
yarn build         # typecheck + music UI + electron-vite build
yarn build:win     # build + electron-builder Windows package
yarn tts:edge:check # live check of the Edge TTS provider against Microsoft's service (needs network)
yarn build:installer # installer UI + Rust installer into installer-out/ (needs a Rust toolchain)
yarn licenses:installer # regenerate the installer's crate notices (needs cargo-about)
```

Verify changes with `yarn test`, `yarn typecheck` and `yarn lint`. For changes to the Edge TTS provider, also run `yarn tts:edge:check`. For changes to the installer, also run `yarn build:installer` and `cargo clippy --manifest-path src/installer/Cargo.toml -- -D warnings`.

### Tests

- Vitest runs in Node, without Electron or network. Tests sit next to the code as `<file>.test.ts` under `src/main` and `src/common`.
- `test/setup.ts` mocks `electron` (`safeStorage` round-trips plain text) and silences the console. Spy on `Logger` to assert logs.
- Give services a temp folder (`mkdtemp(join(tmpdir(), "tokio-test-"))`) through their setters or `initialize`, and stub `fetch` with `vi.stubGlobal`. Use fake timers for the queues.
- Fixtures live in `test/fixtures` and Prettier skips them, so saved HTML keeps its original markup.
- `it.fails` marks a known bug. Turn it into `it` when the bug is fixed.

## Agent models

- **Planning:** use **Opus 5.5 at high effort**. Before handing off or starting the implementation, be 90–95% confident in the plan. If you aren't, keep reading code or ask the user until you are.
- **Implementation:** when delegating to a subagent, use **Sonnet 5.5 at high effort** when it can do the work: well-scoped changes that follow existing patterns.
- Otherwise use **Opus 5.5**: medium effort for moderate tasks, high effort for complex or cross-cutting ones (architecture, IPC/schema changes across processes, tricky concurrency, licensing-sensitive code).

## Layout

| Path                                  | Role                                                                                                              |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/main/`                           | Electron main process: services, IPC event handlers, window setup                                                 |
| `src/preload/`                        | Exposes the typed `window.api.emit` / `window.api.on` bridge                                                      |
| `src/renderer/`                       | Main React UI (pages, components, contexts, router)                                                               |
| `src/music/`                          | Separate music window UI, built as a single file into `music-out/`                                                |
| `src/common/`                         | Code shared by both processes: Zod schemas, event types, constants, utils                                         |
| `src/ui/`                             | Web-only code shared by the main and music windows: design tokens, base CSS, `TitleBar`                           |
| `src/installer/`                      | Cross-platform installer (Rust, wry + tao) with a React UI. Leave it alone unless the task is about the installer |
| `scripts/`                            | Repo maintenance scripts (`clean`, `todos`, `edge-tts`, `installer`)                                              |
| `LICENSES/`, `THIRD_PARTY_NOTICES.md` | Third-party license texts and notices, shipped to the app's `resources/licenses`. See Licensing below             |

`out/`, `music-out/`, `installer-out/`, `build/` output, `src/installer/dist/`, `src/installer/target/` and `src/installer/licenses/` are generated. Don't edit them.

## Path aliases

- Main process: `@/*` → `src/main/*`, `@/common/*` → `src/common/*`
- Renderer: `@/*` and `@renderer/*` → `src/renderer/src/*`, `@/common/*` → `src/common/*`, `@/ui/*` → `src/ui/*`. Prefer `@/` over `@renderer/`.
- Music window: `@/common/*` and `@/ui/*` only.

`@/` means a different directory on each side of the process boundary. Code in `src/common/` must not import from `src/main` or `src/renderer`, and must stay free of Node/Electron-only APIs if the renderer uses it.

## Architecture

### Services (main process)

- Each service lives in `src/main/services/<name>/index.ts` and extends `Service` (or `ProviderService<T>`) from `src/main/services/shared`.
- Services are instantiated once in `src/main/index.ts`, added to the `AppServices` type in `src/main/types`, and injected into `AppHandler` (`src/main/handler/app.ts`).
- Services that have swappable backends (connector, TTS, music) use the provider pattern: `addProvider(name, provider, start?)` / `setProvider(name, key?)`. Providers live in `services/<name>/providers/<provider>/` with `common/` and `config/` subfolders.
- Log through `Logger` from `@/logger` with the service's `_logFile` and a `<ServiceName>` prefix, e.g. `Logger.error(\`<Connector> ...\`, this._logFile)`. Use `formatError`from`@/common/util` for errors.
- Fallible operations return a `{ success, error?, data? }` result object rather than throwing across the IPC boundary.

### TTS providers

- A provider extends `TTSProvider` (`src/main/services/tts/common`) and implements `getVoices` (may be async), `getDefaultVoice`, `generateBuffer` and `setKey`. Override `dispose` if it holds resources such as child processes; it runs on `will-quit`.
- When the user switches provider, the active profile's voice is reset to the new provider's `getDefaultVoice()`. `generateBuffer` must still fall back to a default when it gets a voice name from another provider.
- Registered providers appear in Settings automatically: `StoreManagerService.getSettings` merges them with the saved ones.
- `windows` drives SAPI and OneCore voices through a long-lived 32-bit PowerShell helper. It's 32-bit so 32-bit-only voices such as Loquendo are visible. The script is embedded in `common/script.ts` and must not contain backticks.
- `edge` uses Microsoft's unofficial Read Aloud protocol. Read `providers/edge/README.md` before changing it. All volatile values live in its `config/index.ts`.

### Alerts

- Alerts are saved per profile in `Profile.alerts`: `simultaneous`, `queue_length` and the `items` list. Uploaded sounds form a library shared by all profiles, in `settings.sounds` of the store.
- Any live event (`AppEvents`) can trigger an alert. `AlertTriggerSchema` in `src/common/schemas/profile.ts` derives the triggers from `TOKIO_EVENTS`. `ALERT_TRIGGER_LABELS` in `src/common/types/connector.ts` must have a label for each trigger, so typecheck fails until a new live event gets one. A new internal event must be added to the schema's `exclude` list.
- `registerConnectorEvents` in `src/main/events/init.ts` passes every trigger to `AlertsService.handle` while `activeFeatures.alerts` is on. `MUSIC_CHANGE` comes from `MusicService`, all other triggers from the connector. Gift alerts fire once per combo, on `repeatEnd`.
- Sound files live in the `sounds` folder. Files are named by a hash of their content (uploads) or of their URL (MyInstants), so the same audio is written once and shared. Alerts and the library store only the file's basename; read it through `AlertsService.readSound`, which keeps paths inside the folder and caches recent sounds in memory. Check `StoreManagerService.isSoundInUse` before deleting a file.
- MyInstants has no API. `AlertsService` scrapes it with cheerio, and its URL and selectors live there. Only fetch `www.myinstants.com` URLs.
- Main sends each sound with `ALERT_AUDIO` and a queue name (`channel`):
  - `simultaneous` off: everything plays on one `alerts` queue.
  - `simultaneous` on: each trigger gets its own `alerts:<trigger>` queue.
  - `ALERT_CLEAR` stops every `alerts*` queue. It's sent on disconnect and when the feature is turned off.
  - Play buttons and previews go through the `useAlertTest` hook on the `alert-test` queue, so clearing never cuts them. Starting a test cancels the one playing.

### IPC events

All renderer ↔ main communication is typed. To add an event:

1. Add the request enum value to `APP_EVENTS` and its payload to `AppEventsMap` in `src/common/types/events/req.ts`. Names follow `app:<area>:<action>`.
2. If it replies, add the response to `APP_EVENTS_RESPONSE` and `AppEventsResponseMap` in `src/common/types/events/res.ts`.
3. Register the handler in the matching page stack in `src/main/events/pages/<page>.ts` with `events.push(APP_EVENTS.X, async (services, e, data) => { ... e.reply(...) }, options)`. Don't wrap it in try/catch; throw on failure and let `options` handle it (see Feedback below). A new page stack must be added to `mergeStacks` in `src/main/events/index.ts`.
4. In the renderer, call `window.api.emit(APP_EVENTS.X, data)` and subscribe with `window.api.on(APP_EVENTS_RESPONSE.Y, cb)`. `on` returns an unsubscribe function, so call it in the `useEffect` cleanup.

To push from main without a request, use `win.webContents.send(APP_EVENTS_RESPONSE.Y, data)`. It's typed, so a `void` response still needs `undefined` as its payload.

Live stream events (`TOKIO_EVENTS` / `TokioEventMap`) come from the connector service. `ServerService` forwards them to overlays over WebSocket, and they also drive TTS, music requests and alerts.

### Feedback

Main tells the renderer what failed and why, so the UI can show notifications. Types live in `src/common/types/feedback.ts`, helpers in `src/main/helper/feedback.ts` and `src/main/helper/events.ts`.

- Responses that report success use `Reply<{ ... }>`, which adds `error?: AppError` (`{ code: FEEDBACK_CODES, message }`). The message is plain English for the user; details only go to the logs.
- `createStack(source)` sets the `FeedbackSource` of a page's handlers. It's also the log file their failures go to.
- `push` options:
  - `failure`: the `AppError` reported when the handler throws anything other than an `AppFailure`.
  - `onError(e, error, data, services)`: sends the page's failure reply. Use `replyFailure(APP_EVENTS_RESPONSE.X)` when the reply is just `{ success: false, error }`.
  - `notify: false`: when the page already shows the failure, or for status probes.
  - `source`: overrides the stack's source.
- Throw `new AppFailure(code, message, { level: "warning", cause })` for an expected failure that needs its own message or level. Plain errors get the `failure` message. A canceled dialog is not a failure: just `return`.
- Failures are logged once. When a service already logged the error (for example `AlertsService` results or the connector), throw `new LoggedError(res.error)`, or pass `{ logged: true }` to `AppFailure`. It's reported to the user without a second log line.
- `notifier` (in the services passed to handlers) pushes `APP_EVENTS_RESPONSE.NOTIFY` (`AppNotification`) to the main window.
  - Use `notifier.report({ source, error, fallback })` to log and notify in one call.
  - Use `notifier.error/warn/info/success(source, code, message, { key, windowMs })` for notices.
  - Repeats of a warning or error are dropped within the window (5s by default). Pass a longer `windowMs` for failures that can repeat on every live event. Success and info notices aren't deduped unless a `windowMs` is given.
- User actions that change something send a success or info notice once they finish. Call `notifier.success(...)` right where the handler succeeds, after its reply, so canceled dialogs and early returns stay silent. Keep notices quiet: reads, status checks, tests, autosaves (alerts) and controls whose new state the UI already shows (the feature switches on Home) send none. Codes for these are past tense (`PROFILE_SAVED`); failures end in `_FAILED`.
- Background failures (TTS generation, music playback, missing alert sounds, gifts, the server port, the LIVE ending) are reported from `src/main/events/init.ts`, through callbacks on the services. Services don't know about the notifier.
- The renderer shows them with `NotificationsProvider` (`context/notifications`), mounted above `AppProvider` because load-time notices arrive before the splash closes. It renders the `Toasts` (bottom right, above modals; errors stay until closed), and `NotificationBell` in the title bar lists the session's history through `useNotifications`. Pages don't show notices themselves.

### Renderer

- Each page is a folder in `src/renderer/src/pages/<Page>/` containing `index.tsx`, `<page>.module.css`, an optional `helper.ts`, and `sections/*Section.tsx`. Pages are exported from `pages/index.tsx` and routed in `src/renderer/src/router/index.tsx` (hash history). Sidebar links are the `NAV_ITEMS` list in `router/Layout`.
- Build pages from `components/Page`: `<Page>` (adds the dividers between sections), `<Section title description icon actions>`, `<Field label hint>`, `<FormGrid>` and `<EmptyState>`. A page module only holds layout specific to that page.
- Reusable UI is in `src/renderer/src/components/`. Each component is a folder with `index.tsx` and `<name>.module.css`, re-exported from `components/index.tsx`. Use the primitives in `components/Elements` before creating new ones: `Btn` (`variant` default/accent/icon, `loading`, `active`), `Input`, `Textarea`, `ListTextarea` (comma separated lists), `Check`, `Toggle`, `RadioGroup`, `Slider`, `Select`/`MultiSelect` (searchable, grouped options), `Color`, `Tabs`, `Spinner`. Primitives take their colors from the tokens; they don't take color props.
- `Modal` is the only modal shell (default Cancel/confirm footer, or a custom `footer`). `PlayButton` plays sound tests; `PermissionsSection` and `ProtectionSection` are shared by TTS and Music.
- Styling uses CSS Modules only. Use the tokens in `src/ui/styles/tokens.css` (colors, `--space-*`, `--font-*`, `--radius-*`, `--z-*`) instead of raw values.
- Global state lives in `src/renderer/src/context` (`app`, `audio`, `notifications`, `unsaved`), and shared hooks live in `src/renderer/src/hooks`:
  - `useIpcRequest(event, data?)` sends a request once on mount, and `useIpcListener(event, cb)` subscribes for the component's lifetime. Use them instead of `window.api.on` in a `useEffect`.
  - `useImmerState` returns an `Updater` that takes an immer recipe; `scopeUpdater(update, key)` hands a section one field of it.
  - `useEditableSettings(section, label)` loads a profile section as a draft and saves it by hand. It registers with `UnsavedProvider`, so switching profile or leaving the page asks to save or discard. Call `confirmDiscard()` from `useUnsavedChanges` before anything else that reloads the profile.
  - `useClickOutside` and `usePopover` back dropdowns and popovers; also `useAudio`, `useAlertTest` and `useNotifications` (notice history for the bell).
- Audio plays through `AudioQueue` (`src/renderer/src/helper/audio.ts`). Get a named queue with `useAudio().getQueue(name)`.
  - `enqueue(input, autoplay, { gain, key, onEnded })` sets an item's own volume and an end callback. `onEnded` doesn't run when the queue is stopped.
  - `setItemGain(key, gain)` changes the volume of matching items while they wait or play.
  - `maxQueueLength` counts both waiting and playing items.
  - `stop()` resets the queue and drops audio that is still decoding.

### Persistence

User settings and profiles are validated with the Zod schemas in `src/common/schemas` and persisted by `StoreManagerService`. When you change a schema, update its defaults in `src/common/util/constants` too. Give every new field of saved data a `.default(...)` in the schema, so files saved by older versions still load.

## Licensing

Tokio's source is MIT. The project is open source, so treat license compliance as part of every change.

- **LGPL code stays isolated.** `src/main/services/tts/providers/edge/common/drm-v2.ts` is LGPL-3.0-only (derived from edge-tts). Code ported from edge-tts goes only into its own LGPL file, with the same header (SPDX line, upstream commit, authors, dated modification notice). Never copy upstream code into MIT files; use upstream only as a protocol reference.
- **The distributed app is AGPL-3.0-only** as a whole, because `tiktok-live-connector` and `tiktok-live-proto` are AGPL. Don't patch them in place.
- **Check licenses when adding or upgrading a dependency**, including minor bumps: tiktok-live-connector switched from MIT to AGPL in 2.4.1. Ask before adding anything copyleft (GPL, AGPL, LGPL, MPL, CC BY-SA).
- **react-icons sets keep their own licenses.** Only use the sets listed under Icons in `THIRD_PARTY_NOTICES.md`, and add a row there for any new set.
- **Keep the notices in sync** when licensed components change:
  - `THIRD_PARTY_NOTICES.md` and `LICENSES/` (shipped via `extraResources` in `electron-builder.yml`)
  - the license banner in `electron.vite.config.ts`, because the bundler strips file header comments
  - `src/installer/THIRD_PARTY_NOTICES.txt` when the installer's dependencies change (Rust crates, React, icon sets); it's embedded by `src/installer/src/notices.rs`. After changing `Cargo.toml` or `Cargo.lock`, run `yarn licenses:installer` and check the crate licenses against `src/installer/about.toml`
  - the Services list in `THIRD_PARTY_NOTICES.md` when the app starts talking to a new online service
  - `COMPONENTS` and `SERVICES` in `src/renderer/src/pages/About/helper.ts`, which mirror the parts of `THIRD_PARTY_NOTICES.md` that aren't npm packages (the LGPL file, icon sets, Electron, online services)
- The About page (`/about`, last sidebar item) shows the AGPL's "Appropriate Legal Notices": copyright, no warranty, the license and where to get the source. Keep it reachable from the sidebar. Its package list comes from `LicensesService` (`src/main/services/licenses`), which walks the production dependency tree in `node_modules` (inside `app.asar` when packaged), so new dependencies appear without changes.
- Keep `"license": "MIT"` in `package.json`. It describes the repository's own code.

## CI and releases

Workflows live in `.github/workflows/`:

- `ci.yml` runs on every PR and on `main`: Prettier check, lint, typecheck and tests on Linux and Windows. Non-draft PRs, pushes to `main`, and draft PRs whose latest commit message contains `[ci]` also package the app for all three systems through `build-app.yml` and upload the packages as artifacts. Release commits (`chore(release): ...`) skip that, because their tag's `release.yml` run packages the same commit.
- `installer.yml` builds the installer for each system when `src/installer` or `scripts/installer` change.
- `release.yml` runs when a `v<version>` tag is pushed. The tag must match `package.json`'s version. It packages the app and the installers and attaches them, with the `latest*.yml` update files and blockmaps, to a draft GitHub release.

To release: bump `version` in `package.json`, commit, push a `v<version>` tag, then review and publish the draft. Only published releases count as the latest, which the installer and auto-updates read. Keep the `artifactName` patterns in `electron-builder.yml`, the upload paths in `build-app.yml` and `release_lookup` in `src/installer/build.rs` in sync.

## Conventions

- Prettier: 2-space indent, double quotes, semicolons, trailing commas. Run `yarn format` on files you touch.
- oxlint runs on staged files at commit. Fix warnings in the code you touch.
- Commits must follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `feat!:` for breaking changes). commitlint enforces this in a husky hook, so don't bypass hooks.
- Keep the shared server port (`37891`) and existing event names stable. Overlays and saved user data depend on them.
- Respect inline `NOTE: DO NOT CHANGE` markers.
- Inside a folder that has a barrel `index` (`common/types`, `common/schemas`, `components`, `context`, `hooks`), import sibling files directly, never through the folder's own barrel. Barrel self-imports create import cycles.
- `npx fallow -c .\.fallowrc.json health` (and `dead-code`, `dupes`) reports import cycles, dead code and duplication. The music window and installer UIs are listed as entry points in `.fallowrc.json`.
