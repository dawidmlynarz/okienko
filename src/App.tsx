import { AnimatePresence, motion } from 'motion/react'
import { AppFrame } from './apps/AppFrame'
import { appById } from './apps/registry'
import { TopBar } from './components/TopBar'
import { Wallpaper } from './components/Wallpaper'
import { Home } from './screens/Home'
import { Login, ParentButton } from './screens/Login'
import { ParentDialog } from './screens/Parent'
import { Setup } from './screens/Setup'
import { UpgradeOverlay } from './screens/Upgrade'
import { useOkienko } from './store/useOkienko'

export default function App() {
  const screen = useOkienko((s) => s.screen)
  const openApp = useOkienko((s) => s.openApp)
  const wallpaper = useOkienko((s) => s.settings.wallpaper)
  const version = useOkienko((s) => s.os.version)
  const app = appById(openApp)
  const signedIn = screen === 'home' || screen === 'app'

  return (
    <div data-app="system" className="relative flex h-full flex-col overflow-hidden">
      <Wallpaper kind={version === '1.0' ? 'day' : wallpaper} />
      <AnimatePresence mode="wait">
        <motion.main
          key={signedIn ? 'desk' : screen}
          className="relative flex min-h-0 flex-1 flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {screen === 'setup' && <Setup />}
          {screen === 'login' && (
            <>
              <Login />
              <ParentButton />
            </>
          )}
          {signedIn && (
            <>
              <TopBar />
              <Home />
            </>
          )}
        </motion.main>
      </AnimatePresence>
      <AnimatePresence>{screen === 'app' && app && <AppFrame key={app.id} app={app} />}</AnimatePresence>
      <UpgradeOverlay />
      <ParentDialog />
    </div>
  )
}
