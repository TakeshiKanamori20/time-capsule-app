# Time Capsule — 未来の自分へ（テストネット刻印＋メール控え）

**プロダクト名**：Time Capsule — 未来の自分へ（テストネット刻印＋メール控え）

**目的**

* ユーザーが短い手紙（テキスト）を入力し、
  1. **EVM系テストネット**へ「ハッシュ＋解錠予定時刻」を刻印（改ざん不可の証跡）
  2. **全文はメールで自分に控え**を送る（将来の開封時に読める）
* 低コスト（ほぼ無料）、フロント中心（HTML/CSS/JS）、MetaMask連携。

**公開URL（例）**

* 本番：`https://yourname.vercel.app/`
* テスト：`http://127.0.0.1:5173/`（Viteの場合）または `http://127.0.0.1:5500/`（Live Server）

**対象チェーン**

* テストネット：**Sepolia**（ETH系）または **Polygon Amoy/Mumbai**（どちらでも可）
* ブロックエクスプローラ：`https://sepolia.etherscan.io/` もしくは `https://mumbai.polygonscan.com/`

**体験フロー（MVP）**

1. MetaMask接続（ネットワークチェック→なければ追加/切替）
2. 手紙本文を入力（短文〜数百文字）
3. 開封までの月数を設定（デフォルト12ヶ月）
4. 送信：ブラウザで **SHA-256** → `bytes32` にしてスマコン `save(hash, unlockTime)` を実行
5. 成功画面：Txリンク表示＋**メール送信**（本文・解錠予定・TxURLの3点）
6. 週次や月次のリマインドは後続スプリントで

**非機能要件**

* 本文は**チェーンに載せない**（ハッシュのみ）→プライバシー保護
* 依存：MetaMask（`window.ethereum`）、`ethers.js`、メールAPI（Resend/SendGrid）
* 無料枠で運用（50人規模、月200通以下想定）

**エンドポイント**

* `POST /api/sendEmail`
  * body: `{ email: string, plaintext: string, unlockAt: string|number, txUrl: string }`
  * 200/500 を返す。サーバレス（Vercel Functions想定）

**環境変数**

* `RESEND_API_KEY`（または `SENDGRID_API_KEY`）
* `APP_PUBLIC_CHAIN`（"sepolia" | "mumbai"）
* `APP_CONTRACT_ADDRESS`（デプロイ後に設定）

**スマートコントラクト仕様**

* Solidity ^0.8.x
* `save(bytes32 hash, uint256 unlockTime) returns (uint256 id)`
* `get(uint256 id) → (owner, unlockTime, hash)`
* ルール：`unlockTime > block.timestamp`
* イベント：`Saved(owner, id, unlockTime, hash)`
* 標準のみ（OpenZeppelin不要）

**UIテキスト（短く）**

* 「MetaMask接続」「ブロックチェーンに刻む（無料・テストネット）」
* 「今日のあなたから未来のあなたへ」「開封まで（月）」
* 成功：「刻印しました。メールをご確認ください」「取引を見る」
* 注意：「本文はメール控えのみ。チェーンにはハッシュと解錠予定のみを記録します。」

---

## Time Capsule — 未来の自分へ（テストネット刻印＋メール控え）

* **URL**：`https://yourname.vercel.app/`
* **目的**：短文を**テストネットに刻印（ハッシュ＋解錠予定）**し、**本文はメール控え**で残す。
* **コスト**：無料枠運用。ブロックチェーンはテストネット（無料ファーセット）。

### 使い方

1. MetaMaskをインストール（Chrome拡張）
2. サイトにアクセス → 「MetaMask接続」
3. 本文入力 → 開封まで（月）を設定 → 「刻む」
4. 取引リンクを確認＋メール控えが届きます

### 技術

* Frontend：HTML/CSS/JS（`ethers.js`）
* Contract：`TimeCapsule.sol`（`save(hash, unlockTime)`）
* Functions：`/api/sendEmail`（Resend）
* Chain：Sepolia or Mumbai（テストネット）

### 環境変数

`.env` に `RESEND_API_KEY`, `APP_PUBLIC_CHAIN`, `APP_CONTRACT_ADDRESS` を設定

### 開発

* `npm i`（必要なら）→ 静的配信（Live Server / Vite）
* Vercelにデプロイ → `/api/sendEmail` が使えます

---

# Copilot用 “マスタープロンプト”（VS Codeで新規ファイルに貼る）

> あなたはこのリポジトリのペアプロ開発者です。
> 目標：**Time Capsule**（テストネット刻印＋メール控え）を**HTML/CSS/JS + ethers.js + 1つのサーバレス関数**で完成させる。
> 前提：
>
> * MetaMask連携（Sepolia または Mumbai）
> * スマコン：`save(bytes32 hash, uint256 unlockTime)` のみ
> * フロントは **本文→SHA-256→bytes32** でハッシュ化し、`save` を呼ぶ
> * 成功後 `/api/sendEmail` に `email, plaintext, unlockAt, txUrl` をPOST
> * UIはモバイル向けに簡潔に
>   生成してほしいもの：
>
> 1. `contract/TimeCapsule.sol`（Solidity ^0.8、イベント含む最小）
> 2. `public/index.html` + `public/style.css` + `public/main.js`
>
>    * Connect / Networkチェック / 入力フォーム / 送信 / ステータス表示
>    * `window.crypto.subtle.digest("SHA-256", ...)` でhex32に
>    * ethers.js v6（CDN）でコントラクト呼び出し
> 3. `api/sendEmail.js`（Vercel Functions, Resend API）
> 4. `.env.example` と READMEの更新
> 5. ネットワークが違う時は `wallet_switchEthereumChain` → なければ `wallet_addEthereumChain` 提示
> 6. エラーハンドリングと簡易アクセシビリティ（ボタンのdisable等）
> 7. ブロックエクスプローラURLはネットワークに応じて生成
>
> 重要：本文は**オンチェーンに保存しない**。チェーンには**ハッシュと解錠予定のみ**。本文は**メール控え**でユーザーに残す。
> まずは動く版を最小で書いて。次に詳細調整をお願いする。
