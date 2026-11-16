# Сахна типтері

Барлығы `template/src/scenes/lib.tsx`-те. Props-тағы мәндер — `phrases.json` кілттері (айтылған сөзге байланған мәтін) не сандар. Түстер: `gold`, `red`, `green`, `blue`, `violet`, `pink`, `white`, `grey` не hex.
Бір сахна ұзын видеода (1920×1080), рилстің төменгі жартысында (1080×960) және толық экранда (1080×1920) жұмыс істейді: орналасу `useBox()` бойынша өзі ауысады.

`plan.json` сахнасы: `{"id", "type", "from", "to", "kind"?, "chapter"?, "props"}`
- `kind`: `full` (әдепкі, графит фон), `paper` (ақ қағаз фон, дәйексөзге), `panel` (спикер көрінеді, оң жақта мәтін — `props.keys`).
- `chapter`: тарау нөмірі; `plan.progress = {"total": 11, "keys": {"1": "l1_n", …}}` болса, төменде прогресс сызығы.

| type | не үшін | props |
|---|---|---|
| `title` | дәйексөз, басты ой | `keys[]`, `sizes[]?`, `color?`, `accent?` |
| `chapter` | тарау/заң ашылуы | `n`, `total`, `numKey` («Бірінші»), `keys[]` |
| `counter` | сан өседі | `at` (кілт), `word` (сан тұрған сөз индексі), `from`, `to`, `prefix`, `suffix`, `decimals`, `color`, `head`, `foot[]` |
| `cards` | тізім, есімдер, бірнеше нәрсе | `items: [{key, color?, num?, size?}]`, `cols?`, `head?`, `foot?[]`, `stamp?` (соңғы мөр), `strike?` (сызылатын жол) |
| `compare` | А мен Б, «екеуі де дұрыс» | `left: {key, sub?, color?}`, `right: {…}`, `verdict?`, `mark: "check"\|"cross"\|null` |
| `chain` | эмоция → сөз → әрекет → … | `keys[]`, `colors?[]`, `head?` |
| `gauge` | көрсеткіш мәнге бұрылады | `at`, `word`, `to`, `prefix`, `suffix`, `end?`, `head?`, `foot?[]` |
| `timeline` | өмір жолы, кезеңдер | `items: [{key, label}]`, `head?` |
| `curves` | біреу өседі, біреу тұрады | `high[]` (өсетін жақ кілттері), `low[]`, `foot?` |
| `ring` | «бес адамның алтыншысы — сен» | `count`, `at`, `me`, `head?`, `foot?[]` |
| `network` | ықпал тарайды | `at`, `head?`, `foot?[]` |
| `orbit` | адам айналасындағы әдеттер | `items[]`, `head?` |
| `ceiling` | өз төбесіне тірелу | `items[]`, `line` (төбе пайда болатын кілт), `head?` |
| `loop` | тұйық шеңбер және одан шығу | `label`, `escape`, `foot?[]` |
| `steps` | баспалдақ, біртіндеп өсу | `items[]` (төменнен жоғары), `climb?`, `foot?[]` |

## Өз сахнаңды жазу
Мазмұнға дәл сурет керек болса (кемелер, таразы, пицца) — `scenes/custom/Ship.tsx` жаз:
```tsx
import {useCurrentFrame} from 'remotion';
import {Frame, useW, W} from '../../kit/core';
import {C, clamp} from '../../kit/tokens';
export const Ship: React.FC<{a: string}> = ({a}) => {
  const f = useCurrentFrame(); const w = useW();
  const go = clamp(f, w(a, 0), w(a, -1) + 30);          // сөзге байланған қозғалыс
  return <Frame head={<W k={a} size={80} />}>{/* svg viewBox 1000×520 */}</Frame>;
};
```
`index.ts`-ке `ship: Ship` қос. Ереже: кез келген көрінетін нәрсе `w(кілт, сөз)` кадрынан ерте пайда болмайды.
