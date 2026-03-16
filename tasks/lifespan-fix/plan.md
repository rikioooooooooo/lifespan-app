# Lifespan App 修正計画

## 問題
1. Application error: client-side exception（Background.tsx resize handler leak）
2. 選択肢が7個→Yes/No(2個)に退行
3. ボタン配置・UI設計が悪い
4. こすくまくんSVGがない
5. 継続する気になれないUX

## 修正内容

### 1. KosukumaSvg.tsx 新規作成
- こすくまくん（クリーム色のくま）のインラインSVG
- body color: #fcfad2
- シンプルだけど愛着が湧くデザイン
- IntroScreenとResultScreenで使用

### 2. questions.ts — 全問題を7段階スケールに変更
- type: "yesno" → "scale" に変更（sleepは維持）
- 7段階ラベル: まったく / ほぼ / あまり / どちらとも / まあまあ / かなり / とても
- 値: 0〜6（calculatorで0〜1に正規化）

### 3. QuestionScreen.tsx — 7段階UI実装
- 7つの丸ボタンを横並び
- 両端にラベル（例: まったく ↔ とても）
- 選択時にハプティックフィードバック的アニメーション
- カテゴリ切替時に演出追加

### 4. calculator.ts — スケール対応
- scale: answer(0-6) / 6 で0-1に正規化

### 5. IntroScreen.tsx — エンゲージメント向上
- こすくまくんSVGを配置
- 「始める」ボタンの配置改善

### 6. BasicInfoScreen.tsx — 改善
- レイアウト改善
- 年齢入力のUX改善

### 7. Background.tsx — バグ修正
- resize listener のクリーンアップ修正
- SSR guard追加

### 8. ResultScreen.tsx — こすくまくん追加
- 結果画面にこすくまくんのリアクション

## Todoリスト
- [ ] KosukumaSvg.tsx 作成
- [ ] questions.ts 全問scale化
- [ ] QuestionScreen.tsx 7段階UI
- [ ] calculator.ts scale正規化
- [ ] IntroScreen.tsx こすくま + UX
- [ ] BasicInfoScreen.tsx レイアウト改善
- [ ] Background.tsx バグ修正
- [ ] ResultScreen.tsx こすくま追加
- [ ] スクショ確認 + レビューループ
