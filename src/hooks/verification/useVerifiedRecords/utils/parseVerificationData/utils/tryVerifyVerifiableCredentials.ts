// TODO: Add proper verification logic
export const tryVerifyVerifiableCredentials = async (data?: any) => {
  try {
    return !!data
  } catch (e) {
    return false
  }
}
