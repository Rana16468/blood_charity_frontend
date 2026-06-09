// app/page.js
import { useState } from 'react';
import { GoogleGenerativeAI }  from "@google/generative-ai";




const genAI = new GoogleGenerativeAI("AIzaSyDloTf7rqokH7CWlvISzZRGYdlkPYj7R6A");
export default function Home() {
  const [image, setImage] = useState(null);
  const [plantDisease,setPlantDisease]=useState({name:"",scientificName:"",description:""});

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result;
        const base64WithoutPrefix = base64String.split(',')[1];
        resolve(base64WithoutPrefix);
      };
      reader.onerror = (error) => reject(error);
    });
  };
  

  const handleImageUpload = async (e) => {
    e.preventDefault()
    const file=e.target.files[0];
    
    setImage(file);
   

    try {


        const model=genAI.getGenerativeModel({model:"gemini-1.5-flash"});
        const imageParts=[
            {
                inlineData:{
                    data:await fileToBase64(file),
                    mimeType:file.type
                }
            }
        ]
        const result=await model.generateContent([
            "Identify the plant and provide its name, scientific name, and brief description.Return the information in JSON format with keys:name,scientific Name, and description",
            ...imageParts

        ]);

        const response=await result.response.text();
        const jsonMatch = response.match(/```json([\s\S]*?)```/);
        if (jsonMatch && jsonMatch[1]) {
          const jsonString = jsonMatch[1].trim(); // Remove any extra whitespace
          setPlantDisease(JSON.parse(jsonString));
        } else {
          console.error("JSON not found in the response");
        }
          
        
    
        setImage(null);
    
    } catch (error) {
      console.error(error);
    }
  };

  console.log(plantDisease);


  return (
   <>
    <div className="flex flex-col items-center justify-center mt-5 ">
      <h1 className="text-3xl font-serif mb-2"><span className='text-green-500'>P</span>lan<span className='text-red-500'>T</span> <span className='text-green-500'>D</span>iseas<span className='text-red-500'>E</span > <span className='text-green-500'>T</span>dentifie<span className='text-red-500'>R</span></h1>
      {!image ? (
        <div className="bg-white p-8 rounded-lg shadow-md">
          <label htmlFor="image-upload" className="cursor-pointer">
            <div className="flex items-center justify-center w-64 h-64 bg-gray-200 rounded-lg">
              <span className="text-gray-500">Upload a plant image</span>
            </div>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-md">
          <img
            src={URL.createObjectURL(image)}
            alt="Uploaded plant"
            className="w-64 h-64 object-contain mb-4"
          />
    
        </div>
      )}
    </div>

  
  <div className='flex justify-center items-center'>
  <div className='bg-white rounded-lg p-6 max-w-2xl w-full mt-8 shadow-lg'>
              <h2 className='text-3xl font-semibold text-green-600 md-4'><b>Disease Name:</b> {plantDisease.name}</h2>
                <p className='text-xl text-gray-600 italic mb-4'><b>Scientific Name: </b>{plantDisease.scientificName}</p>
              <p className='text-gray-800 mb-6'><b>Plant Info :</b>{plantDisease.description}</p>
    </div>
  </div>
   </>
  );
}