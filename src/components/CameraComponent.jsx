import  { useRef, useEffect,  } from 'react';
import * as faceapi from 'face-api.js';



// eslint-disable-next-line react/prop-types
const CameraComponent = ({ onFacesDetected }) => {

      async function loadModels() {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      }
    const videoRef = useRef(null);
    useEffect(() => {
        async function startCamera() {
          await loadModels();
          navigator.mediaDevices.getUserMedia({ video: {} }).then(stream => {
            videoRef.current.srcObject = stream;
          });
        }
        startCamera();
      }, []);
      const handlePlay = async () => {
        const detections = await faceapi.detectAllFaces(videoRef.current)
          .withFaceLandmarks()
          .withFaceDescriptors();
    
        onFacesDetected(detections);
      };
    return (
        <>
             <div className="card w-full bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Face Detection</h2>
        <video ref={videoRef} autoPlay onPlay={handlePlay} />
      </div>
    </div>
        </>
    );
};

export default CameraComponent;