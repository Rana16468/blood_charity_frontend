
export const url = `${import.meta.env.VITE_SOCKET_URL}` || 'http://localhost:3052';
export const getBaseUrl = () => {
  return url;
};

// Function to get the image base URL
export const getImageBaseUrl = () => {
  return url;
};


export const getImageUrl = (imagePath) => {
  if (imagePath.includes("https")) {
    return imagePath;
  }
  return `${url}${imagePath}`;
}