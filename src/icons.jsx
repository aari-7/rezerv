import {
  Airplane, ArrowDown, ArrowLeft, ArrowRight, Backspace, Basketball, Bell, Bicycle, Bird, BookOpen, Butterfly, Cards, Cat,
  ChatCircleDots, Check, Coins, Cookie, DeviceMobile, Dog, Drone, Eye, FilmSlate, Fish, GameController, Gift, Guitar,
  Hamburger, Headphones, Hourglass, IceCream, LockKeyOpen, LockSimple, MusicNotes, Package, PiggyBank, Pizza, Plus, Popcorn,
  Rabbit, ShieldCheck, Sneaker, SoccerBall, Sparkle, Snowflake, Ticket, Trash, UsersThree, Wallet, X,
} from '@phosphor-icons/react'

// State stores icon keys (plain strings) so it can be saved to localStorage.
const MAP = {
  cat: Cat, dog: Dog, rabbit: Rabbit, bird: Bird, fish: Fish, butterfly: Butterfly,
  food: Hamburger, fun: GameController, stuff: Package, gifts: Gift, other: Sparkle,
  cycle: Bicycle, football: SoccerBall, headphones: Headphones, game: GameController,
  icecream: IceCream, cookie: Cookie, pizza: Pizza, popcorn: Popcorn, film: FilmSlate, book: BookOpen, cards: Cards,
  music: MusicNotes, ticket: Ticket, basketball: Basketball, sneaker: Sneaker, phone: DeviceMobile, drone: Drone,
  guitar: Guitar, plane: Airplane,
  wallet: Wallet, piggy: PiggyBank, ask: ChatCircleDots, freeze: Snowflake, hourglass: Hourglass, coins: Coins,
  lock: LockSimple, unlock: LockKeyOpen, shield: ShieldCheck, eye: Eye, family: UsersThree, bell: Bell,
  check: Check, x: X, plus: Plus, trash: Trash, back: Backspace, right: ArrowRight, left: ArrowLeft, down: ArrowDown,
}

export function Icon({ name, size = 22, weight = 'bold', ...rest }) {
  const C = MAP[name] || Sparkle
  return <C size={size} weight={weight} aria-hidden="true" {...rest} />
}
