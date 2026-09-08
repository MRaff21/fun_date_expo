import type { ImageSourcePropType } from 'react-native'

export type DateKind = 'activity' | 'food' | 'event' | 'outdoors'

export type DateIdea = {
  id: string
  title: string
  eyebrow: string
  description: string
  kind: DateKind
  location: string
  area: string
  price: string
  duration: string
  image: ImageSourcePropType
  tags: string[]
  active: boolean
  eventDate?: string
}

export type AppTab = 'discover' | 'plan' | 'manage' | 'profile'

export type IdeaDraft = {
  title: string
  description: string
  kind: DateKind
  location: string
  area: string
  price: string
  duration: string
  eventDate: string
}
