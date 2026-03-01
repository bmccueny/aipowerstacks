export const PIXEL_AVATARS = [
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=Felix',
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=Aneka',
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=Boo',
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=Jasper',
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=Lucky',
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=Milo',
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=Oliver',
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=Oscar',
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=Simba',
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=Toby',
]

export const getRandomPixelAvatar = () => {
  return PIXEL_AVATARS[Math.floor(Math.random() * PIXEL_AVATARS.length)]
}
