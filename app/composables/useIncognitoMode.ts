export const useIncognitoMode = () => {
  const config = useRuntimeConfig()
  const isIncognito = Boolean(Number(config.public.incognitoMode))

  return {
    isIncognito
  }
}
