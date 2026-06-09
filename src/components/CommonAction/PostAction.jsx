import toast from "react-hot-toast";

const PostAction = async (data, url) => {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result?.message || "API Error");
    }

    toast.success(result?.message || "Success");

    return result;
  } catch (error) {
    toast.error(error.message);
    return null;
  }
};

export default PostAction;