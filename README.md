# Tokio

Tiktok live integrator app.

## Build

Requires Node.js 24+, Yarn 1 and Windows.

```sh
yarn install
yarn dev        # run in development
yarn build:win  # build the Windows installer into dist/
```

## License

Tokio's source code is licensed under the [MIT License](LICENSE). One file is an exception: `src/main/services/tts/providers/edge/common/drm-v2.ts` is derived from [edge-tts](https://github.com/rany2/edge-tts) and is licensed under the [GNU LGPL v3.0](LICENSES/LGPL-3.0.txt), which builds on the [GNU GPL v3.0](LICENSES/GPL-3.0.txt).

The **distributed application** includes [tiktok-live-connector](https://github.com/zerodytrash/TikTok-Live-Connector) and its protocol package, which are licensed under the [GNU AGPL v3.0](LICENSES/AGPL-3.0.txt). So the application as a whole is distributed under the AGPL-3.0-only.

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for details.
