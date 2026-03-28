Sign In

Write promptGenerate idea

## Community Projects

Discover amazing projects created by our community

Showing 40 projects

LatestMost Viewed

VR Underwater Ecosystem Explorer

## 🌊 VR Underwater Explorer

**Controls:**

• WASD / Arrow Keys: Move

• Mouse: Look around

• Click on marine life to learn more!

View Project

### Dive In: Explore the VR Reef

R
raz

144d ago2 views

Virtual reality underwater ecosystem explorer with interactive marine life using A-Frame.

Shader Visualization

View Project

### Evolving Shader Visualizer

R
raz

149d ago2 views

visualize this shader: float i,e,R,s;vec3 q,p,d=vec3(FC.xy/r\*.4+vec2(-.2,.8),1);for(q.zy--;i++<99.;){o.rgb+=.03-hsv(R-s/i,.8,min(e\*s\*e,R)/3.);s=4.,p=q+=d\*e\*R\*.1;p=vec3(log2(R=length(p))-t\*.5,exp(R-p.z/R\*.1),atan(p.y+.05,p.x)\*2.);for(e=--p.y;s<9e2;s+=s)e+=dot(sin(p.xz\*s),sin(p.xx\*s+.5))/s;}

Fractal Timer

00:00:00

StartPauseReset

View Project

### Fractal Flow: Time & Beauty

K
Kertész Domokos

174d ago5 views

make a fractal background and a timer

Fractal Timer

00:00:00

StartPauseReset

View Project

### Fractal Flow: Time & Design

K
Kertész Domokos

174d ago2 views

make a fractal background and a timer

Infinite Landscape Flight

Flying over a procedural landscape with biomes and dense forests

View Project

### Atmospheric Mountainscape Flight

R
raz

182d ago5 views

create a basic threejs animation where the camera is flying over an infinite landscape of mountains, lakes, rocky landscapes all very atmospheric

Mincraft

Left-Click: Destroy \| Right-Click: Build (Stone)

View Project

### Block Builder: Craft Your World

R
raz

182d ago6 views

create a three.js basic working version of minecraft, make your own textures, no sound. add some environment to make it more interesting, like sand, water etc.

Animated Text Noise

View Project

### Pixelated Text: An Animated Display

R
raz

186d ago11 views

this is text you cannot screenshot:
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d", { alpha: false })

const CELL\_SIZE = 2
const CIRCLE\_RADIUS = 300
const STEP\_PX = 4
const STEP\_MS = 32
const MASK\_BLOCK\_SIZE = CELL\_SIZE

let circleTile = null
let lastStepTime = 0
let offsetY = 0
let maskCanvas = null
let circleBuffer = null
let compositeCanvas = null
let textString = \`HELLO\`

function getTextFromQuery() {
const params = new URLSearchParams(window.location.search)
const t = params.get("text")
return t
}

// No setters needed; URL is source of truth

function createNoiseCanvas(width, height) {
const off = document.createElement("canvas")
off.width = width
off.height = height
const octx = off.getContext("2d", { alpha: false })
octx.imageSmoothingEnabled = false

const cols = Math.ceil(width / CELL\_SIZE)
const rows = Math.ceil(height / CELL\_SIZE)
for (let y = 0; y < rows; y++) {
for (let x = 0; x < cols; x++) {
const r = Math.random()
octx.fillStyle = r < 1 / 2 ? "#000" : "#fff"
octx.fillRect(x \* CELL\_SIZE, y \* CELL\_SIZE, CELL\_SIZE, CELL\_SIZE)
}
}
return off
}

function createPixelatedTextMask(text, blockSize, viewportWidth, viewportHeight) {
const lines = String(text).split("\\n")
const scratch = document.createElement("canvas")
scratch.width = viewportWidth
scratch.height = viewportHeight
const sctx = scratch.getContext("2d")
sctx.imageSmoothingEnabled = false

const targetWidth = Math.max(1, Math.floor(viewportWidth \* 0.85))
const targetHeight = Math.max(1, Math.floor(viewportHeight \* 0.6))
const lineHeightFactor = 1.2

let fontSize = Math.max(8, Math.floor(targetHeight / Math.max(1, lines.length)))
for (let i = 0; i < 3; i++) {
sctx.font = \`900 ${fontSize}px sans-serif\`
let maxLineWidth = 1
for (const line of lines) {
const w = Math.max(1, sctx.measureText(line).width)
if (w > maxLineWidth) maxLineWidth = w
}
const totalHeight = Math.max(1, Math.ceil(lines.length \* fontSize \* lineHeightFactor))
const scaleX = targetWidth / maxLineWidth
const scaleY = targetHeight / totalHeight
const scale = Math.min(scaleX, scaleY, 1)
fontSize = Math.max(8, Math.floor(fontSize \* scale))
}

sctx.clearRect(0, 0, scratch.width, scratch.height)
sctx.font = \`900 ${fontSize}px sans-serif\`
sctx.textAlign = "center"
sctx.textBaseline = "middle"
sctx.fillStyle = "#000"
const centerX = Math.floor(viewportWidth / 2)
const centerY = Math.floor(viewportHeight / 2)
const spacing = Math.ceil(fontSize \* lineHeightFactor)
const startY = Math.floor(centerY - ((lines.length - 1) \* spacing) / 2)
for (let i = 0; i < lines.length; i++) {
sctx.fillText(lines\[i\], centerX, startY + i \* spacing)
}

const img = sctx.getImageData(0, 0, scratch.width, scratch.height)
const data = img.data
const w = img.width
const h = img.height
let minX = w,
minY = h,
maxX = 0,
maxY = 0
for (let y = 0; y < h; y++) {
for (let x = 0; x < w; x++) {
const a = data\[(y \* w + x) \* 4 + 3\]
if (a > 0) {
if (x < minX) minX = x
if (y < minY) minY = y
if (x > maxX) maxX = x
if (y > maxY) maxY = y
}
}
}
if (maxX < minX \|\| maxY < minY) {
const empty = document.createElement("canvas")
empty.width = blockSize
empty.height = blockSize
return empty
}

// Align bounds to the pixel grid defined by blockSize
const alignedMinX = Math.floor(minX / blockSize) \* blockSize
const alignedMinY = Math.floor(minY / blockSize) \* blockSize
const rawWidth = maxX - alignedMinX + 1
const rawHeight = maxY - alignedMinY + 1
const alignedWidth = Math.ceil(rawWidth / blockSize) \* blockSize
const alignedHeight = Math.ceil(rawHeight / blockSize) \* blockSize

const mask = document.createElement("canvas")
mask.width = alignedWidth
mask.height = alignedHeight
const mctx = mask.getContext("2d")
mctx.imageSmoothingEnabled = false
mctx.clearRect(0, 0, alignedWidth, alignedHeight)
mctx.fillStyle = "#000"

for (let y = 0; y < alignedHeight; y += blockSize) {
for (let x = 0; x < alignedWidth; x += blockSize) {
const sx = alignedMinX + x + Math.floor(blockSize / 2)
const sy = alignedMinY + y + Math.floor(blockSize / 2)
if (sx >= 0 && sy >= 0 && sx < w && sy < h) {
const a = data\[(sy \* w + sx) \* 4 + 3\]
if (a > 0) {
mctx.fillRect(x, y, blockSize, blockSize)
}
}
}
}

return mask
}

function renderNoise() {
const width = canvas.clientWidth
const height = canvas.clientHeight
const cols = Math.ceil(width / CELL\_SIZE)
const rows = Math.ceil(height / CELL\_SIZE)

for (let y = 0; y < rows; y++) {
for (let x = 0; x < cols; x++) {
const r = Math.random()
ctx.fillStyle = r < 1 / 2 ? "#000" : "#fff"
ctx.fillRect(x \* CELL\_SIZE, y \* CELL\_SIZE, CELL\_SIZE, CELL\_SIZE)
}
}
}

function resizeCanvasToViewport() {
const dpr = window.devicePixelRatio \|\| 1
const width = Math.ceil(window.innerWidth)
const height = Math.ceil(window.innerHeight)

canvas.style.width = width + "px"
canvas.style.height = height + "px"
canvas.width = Math.ceil(width \* dpr)
canvas.height = Math.ceil(height \* dpr)
ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
ctx.imageSmoothingEnabled = false

renderNoise()
// Create text mask and matching noise tile/buffers
maskCanvas = createPixelatedTextMask(textString, MASK\_BLOCK\_SIZE, canvas.clientWidth, canvas.clientHeight)
circleTile = createNoiseCanvas(maskCanvas.width, maskCanvas.height)
circleBuffer = document.createElement("canvas")
circleBuffer.width = maskCanvas.width
circleBuffer.height = maskCanvas.height
compositeCanvas = document.createElement("canvas")
compositeCanvas.width = maskCanvas.width
compositeCanvas.height = maskCanvas.height
// Draw an initial frame of the moving text
drawMovingCircle()
}

window.addEventListener("resize", resizeCanvasToViewport)
resizeCanvasToViewport()

function drawMovingCircle() {
const width = canvas.clientWidth
const height = canvas.clientHeight
const cx = Math.floor(width / 2)
const cy = Math.floor(height / 2)
if (!maskCanvas) {
maskCanvas = createPixelatedTextMask(textString, MASK\_BLOCK\_SIZE, width, height)
}
if (!circleTile \|\| circleTile.width !== maskCanvas.width \|\| circleTile.height !== maskCanvas.height) {
circleTile = createNoiseCanvas(maskCanvas.width, maskCanvas.height)
}
if (!circleBuffer \|\| circleBuffer.width !== maskCanvas.width \|\| circleBuffer.height !== maskCanvas.height) {
circleBuffer = document.createElement("canvas")
circleBuffer.width = maskCanvas.width
circleBuffer.height = maskCanvas.height
}
if (
!compositeCanvas \|\|
compositeCanvas.width !== maskCanvas.width \|\|
compositeCanvas.height !== maskCanvas.height
) {
compositeCanvas = document.createElement("canvas")
compositeCanvas.width = maskCanvas.width
compositeCanvas.height = maskCanvas.height
}

// Align the text to the grid
const left = Math.round((cx - maskCanvas.width / 2) / MASK\_BLOCK\_SIZE) \* MASK\_BLOCK\_SIZE
const top = Math.round((cy - maskCanvas.height / 2) / MASK\_BLOCK\_SIZE) \* MASK\_BLOCK\_SIZE

// Render the moving noise into the circle buffer
const bufCtx = circleBuffer.getContext("2d")
bufCtx.imageSmoothingEnabled = false
bufCtx.clearRect(0, 0, circleBuffer.width, circleBuffer.height)
const tileH = circleTile.height
const startY = -tileH + (offsetY % tileH)
for (let y = startY; y < circleBuffer.height; y += tileH) {
bufCtx.drawImage(circleTile, 0, y)
}

// Apply the pixelated circular mask in a separate composite canvas
const compCtx = compositeCanvas.getContext("2d")
compCtx.imageSmoothingEnabled = false
compCtx.globalCompositeOperation = "copy"
compCtx.drawImage(circleBuffer, 0, 0)
compCtx.globalCompositeOperation = "destination-in"
compCtx.drawImage(maskCanvas, 0, 0)
compCtx.globalCompositeOperation = "source-over"

// Draw the composited result onto the main canvas
ctx.drawImage(compositeCanvas, left, top)
}

function animate(ts) {
if (lastStepTime === 0) lastStepTime = ts
if (ts - lastStepTime >= STEP\_MS) {
offsetY = (offsetY + STEP\_PX) >>> 0
lastStepTime = ts
}
drawMovingCircle()
requestAnimationFrame(animate)
}

requestAnimationFrame(animate)

// Initialize from URL query if present
const initialFromQuery = getTextFromQuery()
if (initialFromQuery !== null) {
textString = initialFromQuery
rebuildTextResources()
}

// Keep in sync with browser navigation
window.addEventListener("popstate", () => {
const t = getTextFromQuery()
textString = t \|\| ""
rebuildTextResources()
})

function rebuildTextResources() {
maskCanvas = createPixelatedTextMask(textString, MASK\_BLOCK\_SIZE, canvas.clientWidth, canvas.clientHeight)
circleTile = createNoiseCanvas(maskCanvas.width, maskCanvas.height)
circleBuffer = document.createElement("canvas")
circleBuffer.width = maskCanvas.width
circleBuffer.height = maskCanvas.height
compositeCanvas = document.createElement("canvas")
compositeCanvas.width = maskCanvas.width
compositeCanvas.height = maskCanvas.height
}

// Removed textarea input; update text via URL ?text=


Black Hole 3D Physics Simulator

Mouse drag: orbit • Wheel: zoom • Space: pause/resume

View Project

### Black Hole Explorer: 3D Simulation

R
raz

187d ago13 views

build a black hole physics simulator in 3d

Asteroids Game

Score: 0

Lives: 1

Level: 1

RL Training Status

Mode: Training

Episode: 0

Reward: 5.4

Avg Reward: 0.0

Training Progress:

Press 'T' to toggle training

Neural Network State

Current State: SAFE\_8\_10\_6\_1\_1

Action: thrust

Epsilon: 0.388

Q-Table Size: 18

State Vector:

--

Action Values:

thrust: -0.01

turn\_left: 0.00

turn\_right: 0.00

shoot: 0.00

none: 0.00

thrust\_left: 0.00

thrust\_right: 0.00

turn\_left\_shoot: 0.00

turn\_right\_shoot: 0.00

Top 5 Q-Values:

SAFE\_8\_0\_0\_1:thrust = 0.072

SAFE\_8\_3\_2\_1:thrust = 0.072

SAFE\_8\_6\_4\_1:thrust = 0.072

SAFE\_8\_6\_4\_1:shoot = 0.072

SAFE\_8\_8\_6\_1:thrust = 0.054

View Project

### Cosmic Dodger

R
raz

187d ago9 views

create a highly visual asteroids game

←123...5→

Checking your Browser…

Verifying...

Stuck? [Troubleshoot](https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/g/turnstile/f/ov2/av0/rch/zmgwj/0x4AAAAAAAM8ceq5KhP1uJBt/auto/fbE/new/normal?lang=auto#refresh)

Success!

Verification failed

[Troubleshoot](https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/g/turnstile/f/ov2/av0/rch/zmgwj/0x4AAAAAAAM8ceq5KhP1uJBt/auto/fbE/new/normal?lang=auto#refresh)

Verification expired

[Refresh](https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/g/turnstile/f/ov2/av0/rch/zmgwj/0x4AAAAAAAM8ceq5KhP1uJBt/auto/fbE/new/normal?lang=auto#refresh)

Verification expired

[Refresh](https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/g/turnstile/f/ov2/av0/rch/zmgwj/0x4AAAAAAAM8ceq5KhP1uJBt/auto/fbE/new/normal?lang=auto#refresh)

[Troubleshoot](https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/g/turnstile/f/ov2/av0/rch/zmgwj/0x4AAAAAAAM8ceq5KhP1uJBt/auto/fbE/new/normal?lang=auto#refresh)

[Privacy](https://www.cloudflare.com/privacypolicy/) • [Help](https://challenges.cloudflare.com/cdn-cgi/challenge-platform/help)

Wallet · Privy