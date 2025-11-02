import { driver } from 'driver.js'
import type { Driver, DriveStep, Config } from 'driver.js'
import 'driver.js/dist/driver.css'

const TUTORIAL_STORAGE_KEY_EXPLORER = 'mortality-watch-tutorial-explorer-completed'
const TUTORIAL_STORAGE_KEY_RANKING = 'mortality-watch-tutorial-ranking-completed'

/**
 * Composable for managing the interactive onboarding tutorial
 * Uses driver.js to guide new users through the explorer and ranking pages
 */
export function useTutorial() {
  const { isAuthenticated } = useAuth()

  /**
   * Get the storage key for a specific page type
   */
  const getStorageKey = (pageType: 'explorer' | 'ranking' = 'explorer'): string => {
    return pageType === 'ranking' ? TUTORIAL_STORAGE_KEY_RANKING : TUTORIAL_STORAGE_KEY_EXPLORER
  }

  /**
   * Check if user has completed the tutorial for a specific page
   */
  const hasCompletedTutorial = (pageType: 'explorer' | 'ranking' = 'explorer'): boolean => {
    if (import.meta.server) return true
    return localStorage.getItem(getStorageKey(pageType)) === 'true'
  }

  /**
   * Mark tutorial as completed for a specific page
   */
  const markTutorialCompleted = (pageType: 'explorer' | 'ranking' = 'explorer'): void => {
    if (import.meta.client) {
      localStorage.setItem(getStorageKey(pageType), 'true')
    }
  }

  /**
   * Reset tutorial completion status (for testing or user request)
   */
  const resetTutorial = (pageType?: 'explorer' | 'ranking'): void => {
    if (import.meta.client) {
      if (pageType) {
        localStorage.removeItem(getStorageKey(pageType))
      } else {
        // Reset both if no specific page type provided
        localStorage.removeItem(TUTORIAL_STORAGE_KEY_EXPLORER)
        localStorage.removeItem(TUTORIAL_STORAGE_KEY_RANKING)
      }
    }
  }

  /**
   * Define the tutorial steps for the ranking page
   */
  const getRankingSteps = (): DriveStep[] => {
    const steps: DriveStep[] = [
      {
        popover: {
          title: 'Welcome to the Ranking Tool',
          description: 'This interactive tour will guide you through ranking countries by excess mortality. Compare multiple jurisdictions at once and sort by different metrics. Let\'s get started!',
          side: 'over'
        }
      },
      {
        element: '[data-tour="ranking-table"]',
        popover: {
          title: '1. Ranking Table',
          description: 'This table shows countries ranked by excess mortality. Click column headers to sort by different metrics. The table updates in real-time as you change settings.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: () => {
          // Try desktop first, fallback to mobile
          const desktop = document.querySelector('[data-tour="ranking-data-selection"]')
          const mobile = document.querySelector('[data-tour="ranking-data-selection-mobile"]')
          return (desktop && getComputedStyle(desktop).display !== 'none' ? desktop : mobile) as HTMLElement
        },
        popover: {
          title: '2. Data Selection',
          description: 'Choose your time period (yearly, flu season, etc.), jurisdiction type, and date range for comparison. All these settings determine what data appears in the ranking table.',
          side: 'left',
          align: 'start'
        }
      },
      {
        element: '[data-tour="ranking-settings"]',
        popover: {
          title: '3. Calculation Settings',
          description: 'Customize how excess mortality is calculated. Choose between crude or age-standardized rates, adjust baselines, enable cumulative calculations, and configure display options.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '[data-tour="ranking-actions"]',
        popover: {
          title: '4. Actions',
          description: 'Copy a shareable link to preserve this ranking configuration, or export to Explorer for detailed chart visualization.',
          side: 'left',
          align: 'start'
        }
      }
    ]

    // Only add save button step if user is authenticated
    if (isAuthenticated.value) {
      steps.push({
        element: '[data-tour="ranking-save-button"]',
        popover: {
          title: '5. Save Rankings',
          description: 'Click here to save your ranking configuration to your account for quick access later. Find all your saved rankings in "My Charts".',
          side: 'left',
          align: 'start'
        }
      })
    }

    // Add final step
    steps.push({
      popover: {
        title: 'You\'re All Set!',
        description: 'You can restart this tutorial anytime by clicking the help icon (?) in the header. Now explore the rankings!',
        side: 'over'
      }
    })

    return steps
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
        element: '[data-tour="chart-visualization"]',
        popover: {
          title: '1. Your Chart',
          description: 'This is your interactive chart where mortality data is visualized. The chart updates in real-time as you change settings, select countries, or adjust time periods.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '[data-tour="country-selection"]',
        popover: {
          title: '2. Select Jurisdictions',
          description: 'Choose one or more countries or regions to compare. You can select multiple jurisdictions to see them side-by-side in the chart.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '[data-tour="date-range"]',
        popover: {
          title: '3. Choose Time Period',
          description: 'Drag the slider handles to select your date range. You can focus on specific periods or compare long-term trends across years.',
          side: 'top',
          align: 'start'
        }
      },
      {
        element: '[data-tour="chart-controls"]',
        popover: {
          title: '4. Configure Your Chart',
          description: 'Select the metric you want to visualize (deaths, mortality rates, or life expectancy) and customize how the data is displayed. Try different chart types, enable excess mortality calculations, adjust baselines, and more.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '[data-tour="share-button"]',
        popover: {
          title: '5. Share & Export',
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
          title: '6. Save Your Charts',
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
  const createDriver = (pageType: 'explorer' | 'ranking' = 'explorer'): Driver => {
    const steps = pageType === 'ranking' ? getRankingSteps() : getExplorerSteps()

    const driverConfig: Config = {
      showProgress: true,
      steps,
      onDestroyed: () => {
        markTutorialCompleted(pageType)
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
      overlayOpacity: 0.75,
      // Allow moving to next step even if element is not found
      onHighlightStarted: () => {
        // This prevents the tour from breaking if an element is hidden
      }
    }

    return driver(driverConfig)
  }

  /**
   * Start the tutorial
   */
  const startTutorial = (pageType: 'explorer' | 'ranking' = 'explorer'): void => {
    if (import.meta.client) {
      const driverInstance = createDriver(pageType)
      driverInstance.drive()
    }
  }

  /**
   * Auto-start tutorial on first visit (call this in onMounted)
   */
  const autoStartTutorial = (pageType: 'explorer' | 'ranking' = 'explorer'): void => {
    if (import.meta.client && !hasCompletedTutorial(pageType)) {
      // Add a delay to ensure DOM is ready and elements are visible
      // Ranking page needs more time since data needs to load first (v-if="hasLoaded")
      const delay = pageType === 'ranking' ? 2000 : 1000
      setTimeout(() => {
        startTutorial(pageType)
      }, delay)
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
