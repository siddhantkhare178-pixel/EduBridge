"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function ManualInstall() {
  const handleInstallClick = () => {
    const isChrome = /Chrome/.test(navigator.userAgent)
    const isEdge = /Edg/.test(navigator.userAgent)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

    let message = "To install EduBridge as an app:\n\n"

    if (isMobile) {
      if (isSafari) {
        message += "1. Tap the Share button (⬆️) at the bottom\n2. Scroll down and tap 'Add to Home Screen'\n3. Tap 'Add' to confirm"
      } else {
        message += "1. Tap the three dots menu (⋮) in the top right\n2. Select 'Add to Home screen' or 'Install app'\n3. Tap 'Add' or 'Install' to confirm"
      }
    } else {
      if (isChrome || isEdge) {
        message += "1. Look for the install icon (⊕) in the address bar\n2. Or click the three dots menu\n3. Select 'Install EduBridge' or 'Apps' → 'Install this site as an app'\n4. Click 'Install' to confirm"
      } else {
        message += "1. Use Chrome or Edge for best PWA support\n2. Look for install prompts in the address bar\n3. Or bookmark this page for quick access"
      }
    }

    message += "\n\nBenefits:\n• Works offline\n• Faster loading\n• Native app experience\n• Easy access from home screen"

    alert(message)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleInstallClick} className="gap-2">
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Install App</span>
      <span className="sm:hidden">Install</span>
    </Button>
  )
}