export const getServerApiUrl = () => {
  return process.env.NEXT_INTERNAL_API_URL || 'http://pocketbase:8080';
};