export default defineEventHandler(async () => {
  throw createError({
    statusCode: 410,
    message: 'Subscriptions are disabled'
  })
})
