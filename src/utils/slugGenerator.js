
export const generateSlug = (text) => {
  if (!text || typeof text !== 'string') {
    return ''
  }

  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
}

export const generateUniqueSlug = async (baseSlug, checkExistence, maxAttempts = 100) => {
  let slug = baseSlug
  let counter = 1

  const exists = await checkExistence(slug)
  if (!exists) {
    return slug
  }

  while (counter <= maxAttempts) {
    slug = `${baseSlug}-${counter}`
    const exists = await checkExistence(slug)
    if (!exists) {
      return slug
    }
    counter++
  }

  return `${baseSlug}-${Date.now()}`
}


export const generatePlanSlug = async (membershipname, checkExistence) => {
  const baseSlug = generateSlug(membershipname)
  if (!baseSlug) {
    return generateUniqueSlug('plan', checkExistence)
  }
  return generateUniqueSlug(baseSlug, checkExistence)
}
