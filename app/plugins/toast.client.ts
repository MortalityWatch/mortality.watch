export default defineNuxtPlugin(() => {
  const toast = useToast()

  return {
    provide: {
      toast
    }
  }
})
