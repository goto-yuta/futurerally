# FutureRally — テニスメディア設計仕様

**作成日:** 2026-05-12
**ステータス:** ブレインストーミング完了、実装計画策定前

---

## 1. 製品コンセプト

### サービス名(仮)
**FutureRally(フューチャーラリー)** — フューチャーズの「未来」と、テニス用語の「ラリー」を掛けた語感。後日変更可。

### 一文での製品定義
> 日本のフューチャーズ・大学テニス選手を、現役・引退プロの目線で発掘・物語化し、選手自身のスポンサー獲得を後押しするテニス専門メディア。

### 3つの中核的価値

| 価値 | 誰に | 体験 |
|---|---|---|
| 「次に来る選手」がわかる場所 | テニスファン・関係者 | 他メディアにはいない選手が載っている |
| 「自分の物語を見せられる」場所 | 若手選手 | ここに載っていれば見てもらえる |
| 「投資先候補が見つかる」場所 | スポンサー企業 | ここで判断材料が揃う |

### 差別化(模倣困難な参入障壁)

1. **プロとの密接なコネクション** — 認証バッジ・対談・推薦は他社が真似できない
2. **フューチャーズ/学生に深く張る編集方針** — tennis365.netはトッププロ中心、4years.は競技横断、ここだけが空白
3. **トップに日本人選手100名のライブ状態表示** — 「行くと何かしら動いている」サイト体験

### スコープ外(MVPでやらないこと)
- 認証・ログイン機能
- 決済・課金機能
- スポンサー企業向けダッシュボード(マッチング機能はPhase 2以降)
- 海外(英語)対応
- ネイティブアプリ(モバイルWebで対応)
- 試合スコアのリアルタイム更新(進行中/終了のステータスのみ)

### 主要オーディエンス

ローンチ時点の優先順位:
1. **フューチャーズ・大学テニス選手** (取り上げられる側、コンテンツの主役)
2. **テニスファン・関係者** (読者、SEO/SNS流入)
3. **スポンサー候補企業** (将来の収益源、Phase 2で本格化)

### 収益モデル

**ローンチ時: 収益化しない**(オーディエンス構築最優先)。

将来検討候補:
- 記事タイアップ広告
- スポンサー成約手数料(マッチング成立時)
- 企業向けSaaS(選手検索ツール)

---

## 2. ビジュアル設計

### 採用方向: B1 "Pure Data Terminal"

The Athletic / Bloomberg Terminal風。データ密度の高い、硬派でクールなダークテーマ。

### カラーパレット

| 用途 | カラー | コード |
|---|---|---|
| 背景(メイン) | Deep Navy | `#0F1117` |
| 背景(パネル) | Card Dark | `#16191f` / `#1a1d26` |
| 罫線 | Border | `#1f2230` |
| テキスト(主) | White | `#ffffff` |
| テキスト(副) | Muted | `#9ba3b4` |
| テキスト(弱) | Quiet | `#666666` |
| アクセント(主) | Signal Yellow | `#FFEA00` (推薦/フィーチャー/重要数値) |
| アクセント(警告/Live) | Alert Red | `#FF3B3B` |
| アクセント(勝利/正) | Go Green | `#1ed760` |
| アクセント(物語) | Story Orange | `#FF6B35` (記事カテゴリ等) |

### タイポグラフィ

- **メイン**: Inter (英数), Hiragino Sans / Noto Sans JP (日本語)
- **数値**: Inter (font-variant-numeric: tabular-nums) — スコア・ランキング・統計
- **見出し**: Inter, font-weight 800-900, letter-spacing -.5px ~ -1px
- **副見出し**: Inter, font-weight 700, letter-spacing 1.5px-3px, 全角大文字風の小さなラベル

### 共通UI原則

- セクション見出しは `— SECTION TITLE` 形式(letter-spacing広め、小さい)
- 重要な数値は黄色、勝利系は緑、敗退/警告は赤
- 細い罫線(`#1f2230`)で情報をブロック化
- カードには左罫線のアクセント色で意味づけ(黄=Featured, 赤=Live, 緑=Won, 灰=通常)

### レスポンシブ対応

- モバイル(〜768px): トップは縦並び(Hero Story → Today's Status → Featured → 記事)、選手プロフィールも左右カラム→縦並びへ
- タブレット(〜1024px): 基本デスクトップレイアウト、Featured Playersは2列
- デスクトップ(1024px〜): 設計図通りの3列+横並び
- 数値・データテーブルはモバイルでも tabular-nums を維持、横スクロール許容

### アクセシビリティ

- WCAG AA準拠を目標(コントラスト比 4.5:1 以上)
- ダークテーマでも本文は白(`#fff`)で十分なコントラスト
- 黄色アクセントは大文字+太字の時のみ前景色として使用、本文には使わない
- 全インタラクティブ要素にキーボードフォーカス可視化
- 画像はalt必須、選手写真は「{選手名}」、記事ヒーローは内容を簡潔に

---

## 3. 主要画面とレイアウト

### 3.1 トップページ(Layout 3 "Mixed Hero" 軽量版)

```
┌────────────────────────────────────────────────────────────┐
│ FUTURERALLY               HOME 選手 大会 記事 プロ対談     │
├────────────────────────────────────────────────────────────┤
│ ┌─Hero Story (2/3) ─────────────┐ ┌─Today's Status (1/3) ─┐│
│ │ ★ TODAY'S STORY · PRO×FUTURES │ │ ● TODAY · 大会出場中  ││
│ │                                │ │ [選手A · 大会名 · QF] ││
│ │ 「俺もここで泣いた」           │ │ [選手B · 大会名 · R16]││
│ │  西岡が、F級で戦う後輩へ。      │ │ [選手C · 大会名 · R32]││
│ │                                │ │                       ││
│ │ 西岡良仁 × 山田翔 / 6,200字   │ │ — 昨日の結果          ││
│ │ [READ STORY →]                 │ │ [選手D ✓ Won · 1R突破]││
│ │                                │ │ [選手E ✗ Lost · 1R敗]││
│ └────────────────────────────────┘ └───────────────────────┘│
│ ★ FEATURED PLAYERS / 編集部の今月の注目選手     [全12人 ＞]│
│ ┌─Player Card──┐ ┌─Player Card──┐ ┌─Player Card──┐         │
│ │ ★ 西岡推薦    │ │ ★ 添田推薦    │ │ ★ 杉田推薦    │         │
│ │ 山田 翔       │ │ 佐藤 葵       │ │ 中村 拓       │         │
│ │ 慶大3 #12     │ │ F級 21歳      │ │ 早大4 #28     │         │
│ │ ATP— IG 4.2k  │ │ ATP812 IG1.8k │ │ 先週F級優勝   │         │
│ └───────────────┘ └───────────────┘ └───────────────┘         │
│ — 最新記事                                       [一覧 ＞]   │
│ [PRO INTERVIEW] [TOURNAMENT] [PROFILE]                       │
│ — PLAYER INDEX · 全102名                       [選手一覧 ＞] │
│ [JR ATPランカー 18人] [大学生 32人] [フューチャーズ 52人]    │
└────────────────────────────────────────────────────────────┘
```

**配置の意図:**
- 左の大型ストーリーで「物語メディアであること」を最初に伝える
- 右サイドの「TODAY」で常にライブ感を確保(スコアではなく状態のみ)
- Featured Playersでプロ推薦バッジを大きく見せる(スポンサー企業の目に留まる)
- Player Indexで「全選手にアクセスできるDB」であることをほのめかす

### 3.2 選手プロフィールページ

```
┌────────────────────────────────────────────────────────────┐
│ ヘッダ / パンくず: 選手 / 大学生 / 山田 翔                  │
├────────────────────────────────────────────────────────────┤
│ ┌─Photo─┐  山田 翔 (YAMADA SHO)            ★ PRO ENDORSED  │
│ │ 120px │  慶大3年 / 右利き両手BH / 21歳   [★ 西岡良仁]    │
│ │       │                                  [★ 添田豪]      │
│ └───────┘                                                   │
│ [● 大会出場中] 広島F4 · 残R32 · 本日プレー予定 14:00 vs ◯◯│
├──────────────────────────────────┬─────────────────────────┤
│ LEFT (1.4fr): 競技データ          │ RIGHT (1fr): スコアカード│
│                                  │ ★ SPONSORSHIP SCORECARD │
│ — RANKING & 直近成績              │ — SNS REACH             │
│  JTA #12  ATP —  W-L 28-12       │  IG 4,200 (ER 6.8%)     │
│  [12ヶ月推移バーチャート]         │  X 1,850 (ER 3.2%)      │
│                                  │  TikTok 980             │
│ — 出場予定                        │ — PERSONAL              │
│  [● 出場中: 広島F4 5/10-15]      │  語学・興味・発信スタイル│
│  [予定: 福岡F5 5/19-25]          │ — CURRENT SPONSORS      │
│  [予定: 関東リーグ春 5/28-6/8]   │  [YONEX] [○○薬局]      │
│                                  │ — SPONSORSHIP ASK       │
│ — 関連記事                        │  ▸ 海外遠征費支援       │
│  ・西岡 × 山田翔 対談 (5/12)     │  ▸ ストリングス契約     │
│  ・山田翔、慶大からの挑戦         │  ▸ ウェア提供           │
│  ・広島F4 1日目総括               │ [▸ スポンサー候補問合せ]│
│                                  │ ★ プロのコメント        │
│                                  │ 「フォアの威力は同世代…」│
│                                  │ — 西岡良仁              │
└──────────────────────────────────┴─────────────────────────┘
```

**ポイント:**
- 右側「SPONSORSHIP SCORECARD」が他メディアにない最大の差別化
- 企業の意思決定に必要な指標が1ページで揃う
- 問い合わせは編集部経由(選手アカウント機能なし)

### 3.3 記事ページ

MDXで書かれた本文をB1テーマでレンダリング。サイドに著者情報・関連選手プロフィールカード。

### 3.4 大会一覧ページ

シーズン中の主要大会(ITF Futures, Challenger, JTA, 大学リーグ)を時系列で。日本人選手の出場予定にフラグ。

### 3.5 選手インデックス

カテゴリでフィルタ可能:
- Pro / Jr ATPランカー
- 大学生(関東/関西等のリーグ別)
- フューチャーズ専業

ソート: 名前 / ランキング / 編集部スコア

---

## 4. データモデル

### 4.1 主要エンティティ

```text
Player(選手)
  id, name_ja, name_en, slug
  birth_year, hand, height
  category: 'pro' | 'college' | 'futures'
  university (nullable), club (nullable)
  current_jta_rank (nullable), current_atp_rank (nullable)
  bio (markdown)
  photo_url
  sns: { ig, x, tiktok, youtube }  -- JSONB
  featured (bool)                  -- 編集部フラグ
  scorecard (JSONB)                -- 後述
  itf_id (nullable), itf_slug (nullable)
  created_at, updated_at

ProEndorsement(プロ推薦)
  id
  player_id → Player
  pro_name (string, e.g. "西岡良仁")
  pro_status: 'active' | 'retired'
  quote (markdown, nullable)
  endorsed_at
  display_order

Tournament(大会)
  id, name_ja, name_en, slug
  level: 'atp' | 'challenger' | 'futures_25' | 'futures_15' | 'jta' | 'college'
  start_date, end_date
  location, surface
  external_url (公式サイトURL)
  created_at, updated_at

TournamentEntry(選手の大会出場)
  id
  player_id → Player
  tournament_id → Tournament
  status: 'scheduled' | 'alive' | 'won' | 'lost' | 'champion'
  current_round (nullable, e.g. 'R32', 'QF')
  last_match_summary (nullable, e.g. "1R突破")
  next_match_at (nullable, datetime)
  next_opponent (nullable, text)
  last_updated_at

Article(記事)
  id, slug, title, excerpt
  body (markdown, MDX)
  category: 'interview' | 'profile' | 'tournament' | 'column'
  hero_image_url
  authors (text)
  published_at
  tagged_players[] → Player (JOIN table)
  tagged_pros[] (text array)
  tagged_tournaments[] → Tournament (JOIN table)
  created_at, updated_at

SponsorshipInquiry(問い合わせ)
  id
  player_id → Player
  company_name, contact_name, contact_email
  message (text)
  created_at
  status: 'new' | 'forwarded' | 'closed'
  handled_at (nullable)
```

### 4.2 Scorecard JSONフィールド

```json
{
  "sns_reach": {
    "ig": 4200,
    "ig_er": 6.8,
    "x": 1850,
    "x_er": 3.2,
    "tiktok": 980,
    "tiktok_er": null,
    "youtube": null,
    "youtube_subs": null
  },
  "personal": {
    "languages": ["英語(中級)"],
    "interests": ["ファッション", "音楽(HIPHOP)", "ゲーム"],
    "posting_style": "試合前後のVlog投稿 · 週2回"
  },
  "current_sponsors": ["YONEX(ラケット)", "○○薬局(ローカル)"],
  "asks": [
    "海外遠征費の支援(ATPポイント獲得のため)",
    "ストリングス契約",
    "ウェア提供"
  ]
}
```

JSONにしているのは、フィールドの追加・削除が初期は揺らぐ前提のため。

### 4.3 派生クエリ(主要なもの)

- **「今出場中の選手」**: `TournamentEntry WHERE status = 'alive'`
- **「昨日の結果」**: `TournamentEntry WHERE last_updated_at > now() - 24h AND status IN ('won', 'lost')`
- **「Featured選手」**: `Player WHERE featured = true ORDER BY display_order`
- **「ある選手の関連記事」**: `Article JOIN article_players WHERE player_id = ?`

---

## 5. データ取得パイプライン

### 5.1 取得アーキテクチャ

```text
┌─ Scraper Layer (個別の取得モジュール) ──────────┐
│  ITFScraper      → fetch_player_status()       │
│  ATPScraper      → fetch_player_status()       │
│  JTAScraper      → fetch_ranking()             │
│  CollegeScraper  → fetch_league_results()      │
│                                                │
│  共通インターフェース:                          │
│    fetch_player_status(player) → PlayerStatus  │
└────────────────────────────────────────────────┘
                    │
                    ▼
┌─ Data Source Adapter (抽象化層) ────────────────┐
│  Playerのカテゴリで適切なScraperに振り分け       │
│  将来 SportradarAdapter等に差し替え可能         │
└────────────────────────────────────────────────┘
                    │
                    ▼
┌─ GitHub Actions cron (6:00 JST / 21:00 JST) ───┐
│  全選手をループ → Scraper呼出 → DB更新          │
│  失敗時 Sentry通知、その選手だけスキップ        │
└────────────────────────────────────────────────┘
```

### 5.2 ソース別対応

| ソース | 対象データ | 取得方式 | 頻度 |
|---|---|---|---|
| **ITF選手ページ** (`itftennis.com/en/players/{slug}/{id}/`) | フューチャーズ・チャレンジャー出場状況 | HTMLパース(requests + BeautifulSoup) | 1日2回 |
| **ITFライブセンター** | 検証用、矛盾検知 | Playwright + JSON抽出 | 1日1回 |
| **ATP公式** (`atptour.com/en/players/{slug}`) | チャレンジャー以上のランキング・スケジュール | HTMLパース | 週1回 |
| **JTAランキング** | 国内ランキング | 手動更新(Supabase Studio) | 月1回 |
| **大学連盟HP**(関東/関西等) | 大学リーグ結果 | 手動更新 | 週1回 |

### 5.3 規約リスクの緩和策

1. **アクセス頻度の制限**: 1選手1リクエスト/日、リクエスト間に5-10秒の遅延
2. **User-Agent明示**: `FutureRally Bot / contact: <email>` と正直に
3. **robots.txtの尊重**: Disallow指定があれば守る
4. **取得データのキャッシュ**: 一度取ったら再取得しない(DB保存)
5. **公式RSS/JSONを優先**: ATPは一部RSS提供あり、見つけ次第そちらに切替
6. **移行パス**: 規約変更や警告時に Sportradar / Stats Perform 等の有料API契約に切替(月数万円〜)

### 5.4 「今動いてる試合」の更新ロジック

1日2回スクレイピング後:
- 各 `TournamentEntry.status` を更新
  - 大会期間内 かつ 敗退記録なし → `alive`
  - 敗退記録あり → `lost`
  - 大会終了 かつ 優勝 → `champion` (記録上は `won`)
- トップページは `status = 'alive'` のEntryを直近24h内の `won/lost` と並べて表示

リアルタイム更新なしのため、サーバー負荷は1日2回のcronジョブだけ。実質ほぼ無料運用が可能。

---

## 6. 技術スタック

| レイヤ | 採用 | 理由 |
|---|---|---|
| 言語/FW | Next.js 15 (App Router) + TypeScript | SSG/ISRで記事ページ高速・SEO強い |
| UI | Tailwind CSS + shadcn/ui | B1ダークテーマと相性◎、コンポーネント揃う |
| DB | PostgreSQL (Supabase または Neon) | フリーティアで十分、JSON型でScorecard対応 |
| ORM | Drizzle ORM | 軽量、TypeScript型推論強い |
| 記事編集 | MDX (Contentlayer or `next-mdx-remote`) | 認証付きCMS不要、Git管理で版数管理 |
| スクレイピング | Python (requests + BeautifulSoup + Playwright予備) | テキスト処理が楽、保守しやすい |
| バッチ実行 | GitHub Actions cron (1日2回) | サーバー不要、ログがGit上、無料枠で収まる |
| Webホスティング | Vercel | Next.js最適化、無料枠で開始可 |
| 画像 | Cloudinary 無料枠 or Vercel Image Optimization | リサイズ・配信 |
| エラー監視 | Sentry 無料枠 | スクレイピング失敗を監視 |
| アナリティクス | Plausible または GA4 | 読者の動き把握 |
| 問い合わせ | Resend + Cloudflare Turnstile | スポンサー問い合わせをメール転送 |

### 月額コスト(立ち上げ期)

- Vercel無料 / Supabase無料 / Cloudinary無料 / Sentry無料 / GitHub Actions無料
- ドメイン年1,500円程度
- **= ほぼ0円〜数千円/月** で運用可能

---

## 7. 編集ワークフロー

認証付きCMSを作らず、**Supabase Studio + Git** の併用で最小コスト運用。

> **前提**: MVP時点での「編集部」は実質1名(プロジェクトオーナー本人)。複数編集者の権限管理は Phase 2 で検討。

### 選手写真の調達

- **プロ・トップ選手**: 公式戦のメディアパス取材 or 本人提供 or プレスリリース許諾画像
- **大学・フューチャーズ選手**: 本人から提供(SNS公開写真の許諾を取って使用 or 取材時に撮影)
- **ライセンス**: 初期は本人/関係者から得た「FutureRally内での使用許諾」のみで運用、ストックフォトは原則使わない
- **保存**: Cloudinaryにアップロード → URLを `players.photo_url` に格納

### 7.1 記事の追加・更新

1. ローカルで `content/articles/{slug}.mdx` を作成
   - frontmatter: title, excerpt, category, hero_image, authors, tagged_players, tagged_pros, tagged_tournaments
   - 本文: Markdown
2. `git push` → Vercelが自動デプロイ
3. ISRで30分以内に反映

### 7.2 選手の追加

1. Supabase Studio で `players` テーブルにレコードを追加
2. `featured = true` フラグでFeatured枠に出現
3. Webアプリは next revalidate で30分以内に反映

### 7.3 プロ推薦の追加

1. Supabase Studio で `pro_endorsements` テーブルに `player_id` + `pro_name` + `quote` を追加
2. その選手のプロフィールページに即時反映

### 7.4 スポンサー問い合わせ

1. 選手プロフィールページの「問い合わせる」ボタン押下
2. フォームPOST → `sponsorship_inquiries` テーブルにINSERT
3. Resend経由で編集部メールに通知
4. 編集部が選手本人に手動でつなぐ(電話 or メール)
5. 処理後、Supabase Studio で `status` を `forwarded` / `closed` に更新

### 7.5 スコアカードの更新

1. 選手本人 or 編集部が必要事項を編集部に連絡
2. 編集部がSupabase Studio で `players.scorecard` JSONを編集
3. 即時反映

### 7.6 試合データの更新

- 自動: 1日2回 GitHub Actions が `TournamentEntry` を更新
- 手動補正: 自動取得できない大学リーグ等は編集部が Supabase Studio で直接編集

---

## 8. MVPスコープ

### 8.1 IN(ローンチに含める)

- [x] Top ページ (Mixed Hero レイアウト, 軽量運用版)
- [x] 選手プロフィールページ (Sponsorship Scorecard付き)
- [x] 記事ページ (MDX レンダリング)
- [x] 大会一覧ページ (シンプル)
- [x] 選手インデックスページ (カテゴリフィルタ)
- [x] スポンサー問い合わせフォーム (Resend → メール通知)
- [x] ITFスクレイパー (初期30-50選手)
- [x] 手動更新ワークフロー (Supabase Studio)
- [x] 基本SEO (OGタグ, sitemap.xml, robots.txt)
- [x] アナリティクス (Plausible or GA4)

### 8.2 OUT(MVPに含めない)

**Phase 2 で検討:**
- 選手本人によるプロフィール自己編集機能(認証必要)
- スポンサー企業向けログイン + 保存検索
- 英語対応
- ニュースレター登録
- マッチング推奨機能

**Phase 3 以降:**
- AI推薦アルゴリズム(スポンサー × 選手)
- モバイルアプリ
- 動画ホスティング

### 8.3 ローンチ前提

- **選手データ**: 初期30名(プロ5名 + 大学生15名 + フューチャーズ10名)を編集部で手動登録
- **記事**: 初期5本(プロインタビュー2本 + 選手プロフィール2本 + 大会総括1本)
- **プロ推薦**: 初期3名のプロから10件程度の推薦を取得
- **ローンチ目標**: コンセプト確定から3ヶ月以内

### 8.4 開発順序(推奨)

1. **基盤セットアップ**(1週)
   - Next.js 15 + TypeScript + Tailwind + shadcn/ui
   - Supabase プロジェクト作成、Drizzle スキーマ定義・マイグレーション
   - Vercel デプロイ設定、ドメイン設定
2. **共通UIコンポーネント**(1週)
   - B1テーマ Tokens を Tailwind config に
   - Card, PlayerCard, ArticleCard, LivePill, EndorsementBadge 等
3. **トップページ**(1週)
   - サンプルデータでLayout 3 を実装
   - ISR 30分
4. **選手プロフィールページ**(1.5週)
   - Sponsorship Scorecard コンポーネント(差別化の核)
   - 問い合わせフォーム(Resend連携)
5. **記事ページ + MDX**(1週)
   - `next-mdx-remote` or Contentlayer
   - タグ付き選手の自動表示
6. **選手インデックス・大会一覧**(0.5週)
7. **ITFスクレイパー + GitHub Actions cron**(1.5週)
   - Python リポジトリを別ディレクトリで管理
   - PostgreSQL接続、UPSERT実装
   - Sentry通知
8. **初期データ投入 + コンテンツ準備**(1週、並行)
9. **ソフトローンチ → 関係者フィードバック**(1週)
10. **本ローンチ**

**総開発期間目安: 約2-3ヶ月**(1名フルタイム想定)。週末稼働なら3-6ヶ月。

---

## 9. リスクと緩和策

| リスク | 影響 | 緩和策 |
|---|---|---|
| スクレイピング規約違反 | データ取得停止 | UA明示、頻度制限、有料API契約への移行パス確保 |
| プロ推薦が集まらない | 差別化要素の弱体化 | コネクションを活かして最低3名のプロから初期推薦を取得済みの状態でローンチ |
| 記事が継続して書けない | コンテンツ枯渇 | 学生記者ネットワーク構築をPhase 2で検討、初期は週1記事の現実的ペースで設計 |
| スポンサー問い合わせが来ない | プロダクトの価値証明できず | 初期はスポンサー側より「メディアとしての存在感」を優先、PV/SNS反応を見ながら判断 |
| 個人情報の取り扱い | 法的リスク | 問い合わせフォームには利用目的を明記、最小限のフィールドに留める |
| 試合データの精度ミス | 信頼性低下 | 編集部での手動補正フロー確保、間違いの修正フィードバック導線を提供 |

---

## 10. オープン論点(実装計画前に決める)

- [ ] サービス名「FutureRally」の最終確定 / 別案検討
- [ ] ドメイン取得候補(.com / .jp / .tennis)
- [ ] 初期取り上げる30選手のリスト確定
- [ ] 初期に協力してもらうプロ3名の同意取得
- [ ] 編集体制(自分のみ / 外部ライター起用)
- [ ] スポンサー問い合わせの受け手メールアドレス
- [ ] Supabase or Neon の最終選択

---

## 付録: 参考にした既存サービス

- **tennis365.net** — 年間1,000万UU、25-64歳が80%、2025年6月ALBA買収。トッププロ中心(=本サービスの空白を補完)
- **4years.**(朝日新聞) — 学生スポーツ横断、学生記者ネットワーク。スタイル参考だが本サービスは競技特化で深さ勝負
- **The Athletic / The Players' Tribune** — Story-driven sports media、見出しのトーン参考
- **OpenSponsorship** — グローバル選手スポンサーマッチング、Phase 2のマッチング機能設計の参考
- **The Athletic / Bloomberg Terminal** — B1ビジュアル方向の参照点
- **Number(文藝春秋)** — 日本のスポーツ取材ジャーナリズムの権威性
- **Find-FC Funding / Spportunity** — 国内アスリート向けクラファン、補完的に活用可
