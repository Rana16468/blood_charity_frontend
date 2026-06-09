const GenerateImage = async (image) => {
  try {
    const base64 = image.split(",")[1]; // ✅ remove "data:image/png;base64,"

    const formData = new FormData();
    formData.append("image", base64);

    const url = `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMAGEBB}`;

    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const imgData = await res.json();

    return imgData?.data?.url;
  } catch (err) {
    console.error("Image upload error:", err);
    return null;
  }
};

export default GenerateImage