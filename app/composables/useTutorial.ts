import { driver } from 'driver.js'
import type { Driver, DriveStep, Config } from 'driver.js'
import 'driver.js/dist/driver.css'

const TUTORIAL_STORAGE_KEY = 'mortality-watch-tutorial-completed'

/**
 * Composable for managing the interactive onboarding tutorial
 * Uses driver.js to guide new users through the explorer page
 */
export function useTutorial() {
  const { isAuthenticated } = useAuth()

  /**
   * Check if user has completed the tutorial
   */
  const hasCompletedTutorial = (): boolean => {
    if (import.meta.server) return true
    return localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true'
  }

  /**
   * Mark tutorial as completed
   */
  const markTutorialCompleted = (): void => {
    if (import.meta.client) {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true')
    }
  }

  /**
   * Reset tutorial completion status (for testing or user request)
   */
  const resetTutorial = (): void => {
    if (import.meta.client) {
      localStorage.removeItem(TUTORIAL_STORAGE_KEY)
    }
  }

  /**
   * Define the tutorial steps for the explorer page
   */
  const getExplorerSteps = (): DriveStep[] => {
    const steps: DriveStep[] = [
      {
        popover: {
          title: 'Welcome to Mortality Watch Explorer',
          description: 'This interactive tour will guide you through the key features of the explorer. You can visualize and compare mortality data across different countries and time periods. Let\'s get started!',
          side: 'over'
        }
      },
      {
        element: '[data-tour="country-selection"]',
        popover: {
          title: '1. Select Jurisdictions',
          description: 'Choose one or more countries or regions to compare. You can select multiple jurisdictions to see them side-by-side in the chart.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '[data-tour="date-range"]',
        popover: {
          title: '2. Choose Time Period',
          description: 'Drag the slider handles to select your date range. You can focus on specific periods or compare long-term trends across years.',
          side: 'top',
          align: 'start'
        }
      },
      {
        element: '[data-tour="chart-controls"]',
        popover: {
          title: '3. Configure Your Chart',
          description: 'Select the metric you want to visualize (deaths, mortality rates, or life expectancy) and customize how the data is displayed. Try different chart types, enable excess mortality calculations, adjust baselines, and more.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '[data-tour="share-button"]',
        popover: {
          title: '4. Share & Export',
          description: 'Copy a shareable link that preserves your exact chart configuration, download the chart as an image, take a screenshot, or export the data as CSV/JSON.',
          side: 'left',
          align: 'start'
        }
      }
    ]

    // Only add save button step if user is authenticated
    if (isAuthenticated.value) {
      steps.push({
        element: '[data-tour="save-button"]',
        popover: {
          title: '5. Save Your Charts',
          description: 'Bookmark charts to your account for quick access later. All your saved charts can be found in the "My Charts" section.',
          side: 'left',
          align: 'start'
        }
      })
    }

    // Add final step
    steps.push({
      popover: {
        title: 'You\'re All Set!',
        description: 'You can restart this tutorial anytime by clicking the help icon (?) in the header. Now go ahead and explore the data!',
        side: 'over'
      }
    })

    return steps
  }

  /**
   * Create and configure the driver instance
   */
  const createDriver = (): Driver => {
    const driverConfig: Config = {
      showProgress: true,
      steps: getExplorerSteps(),
      onDestroyed: () => {
        markTutorialCompleted()
      },
      nextBtnText: 'Next',
      prevBtnText: 'Previous',
      doneBtnText: 'Done',
      progressText: '{{current}} of {{total}}',
      showButtons: ['next', 'previous', 'close'],
      // Styling to match the app theme
      popoverClass: 'driver-popover-custom',
      // Allow users to click outside to close
      allowClose: true,
      // Smooth animations
      animate: true,
      // Overlay opacity
      overlayOpacity: 0.75
    }

    return driver(driverConfig)
  }

  /**
   * Start the tutorial
   */
  const startTutorial = (): void => {
    if (import.meta.client) {
      const driverInstance = createDriver()
      driverInstance.drive()
    }
  }

  /**
   * Auto-start tutorial on first visit (call this in onMounted)
   */
  const autoStartTutorial = (): void => {
    if (import.meta.client && !hasCompletedTutorial()) {
      // Add a small delay to ensure DOM is ready and elements are visible
      setTimeout(() => {
        startTutorial()
      }, 1000)
    }
  }

  return {
    hasCompletedTutorial,
    startTutorial,
    autoStartTutorial,
    resetTutorial,
    markTutorialCompleted
  }
}
